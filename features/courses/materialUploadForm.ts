// @ts-nocheck
import { professors } from "../../data/professors";
import { courses } from "../../data/courses";
import { loadCourseMaterials } from "./courseMaterialsUI";
import { syncMaterialChoiceMenus, setMaterialFileSelection, setupMaterialChoiceMenus, setupMaterialFilePicker, setMaterialFileUploadState } from "./materialUploadChoices";
if (typeof window !== "undefined") window.aucAtlasProfessors = professors;
function slugifyMaterialValue(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown";
  }

  function getFileExtension(fileName) {
    const parts = String(fileName || "").split(".");
    return parts.length > 1 ? "." + parts.pop().toLowerCase() : "";
  }

  function buildMaterialFileName(title, originalName) {
    const extension = getFileExtension(originalName);
    return slugifyMaterialValue(title) + extension;
  }

  function getMaterialFormControl(
    form,
    role,
    fallbackId
  ) {
    const selectors = [];

    if (role) {
      selectors.push(
        '[data-material-role="' + role + '"]'
      );
    }

    if (fallbackId) {
      selectors.push("#" + fallbackId);
    }

    if (form && selectors.length) {
      const control = form.querySelector(
        selectors.join(", ")
      );

      if (control) {
        return control;
      }
    }

    return fallbackId
      ? document.getElementById(fallbackId)
      : null;
  }

  function setMaterialUploadStatus(
    message,
    type,
    form
  ) {
    const status = getMaterialFormControl(
      form,
      "status",
      "material-upload-status"
    );

    if (!status) {
      return;
    }

    status.className =
      "material-upload-status" +
      (type ? " " + type : "");
    status.textContent = message;
  }

  function getMaterialProfessorOptions() {
    const source = Array.isArray(
      window.aucAtlasProfessors
    )
      ? window.aucAtlasProfessors
      : [];
    const seen = {};
    const names = [];

    source.forEach(function (professor) {
      const name = String(
        professor && professor.name
          ? professor.name
          : ""
      ).trim();
      const key = name
        .toLowerCase()
        .replace(/\s+/g, " ");

      if (name && !seen[key]) {
        seen[key] = true;
        names.push(name);
      }
    });

    return names.sort(
      function (firstName, secondName) {
        return firstName.localeCompare(
          secondName
        );
      }
    );
  }

  function populateMaterialProfessorSelect(form) {
    const select = getMaterialFormControl(
      form,
      "professor",
      "material-professor"
    );

    if (
      !select ||
      select.dataset.professorOptionsReady ===
        "true"
    ) {
      return;
    }

    const currentValue = select.value;
    const professorNames =
      getMaterialProfessorOptions();
    const placeholder =
      document.createElement("option");

    select.dataset.professorOptionsReady = "true";
    select.innerHTML = "";
    placeholder.value = "";
    placeholder.textContent = "Choose professor";
    select.appendChild(placeholder);

    professorNames.forEach(function (name) {
      const option =
        document.createElement("option");

      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    if (
      currentValue &&
      professorNames.includes(currentValue)
    ) {
      select.value = currentValue;
    }
  }

  function populateQuickMaterialCourseSelect(form) {
    const select = getMaterialFormControl(
      form,
      "course",
      "quick-material-course"
    );

    if (
      !select ||
      select.dataset.courseOptionsReady ===
        "true"
    ) {
      return;
    }

    const placeholder =
      document.createElement("option");

    select.dataset.courseOptionsReady = "true";
    select.innerHTML = "";
    placeholder.value = "";
    placeholder.textContent = "Choose course";
    select.appendChild(placeholder);

    courses.forEach(function (course) {
      const option =
        document.createElement("option");

      option.value = course.code;
      option.textContent =
        course.code + " — " + course.title;
      select.appendChild(option);
    });
  }

  function setMaterialUploadProgress(
    percent,
    label,
    isVisible,
    form
  ) {
    const progress = getMaterialFormControl(
      form,
      "progress",
      "material-upload-progress"
    );
    const progressTrack = getMaterialFormControl(
      form,
      "progress-track",
      "material-upload-progress-track"
    );
    const progressFill = getMaterialFormControl(
      form,
      "progress-fill",
      "material-upload-progress-fill"
    );
    const progressValue = getMaterialFormControl(
      form,
      "progress-value",
      "material-upload-progress-value"
    );
    const progressLabel = getMaterialFormControl(
      form,
      "progress-label",
      "material-upload-progress-label"
    );
    const safePercent = Math.max(
      0,
      Math.min(
        100,
        Math.round(Number(percent) || 0)
      )
    );

    setMaterialFileUploadState(
      form,
      Boolean(isVisible && label !== "Upload complete")
    );

    if (progress) {
      progress.hidden = !isVisible;
    }

    if (progressTrack) {
      progressTrack.setAttribute(
        "aria-valuenow",
        String(safePercent)
      );
    }

    if (progressFill) {
      progressFill.style.width =
        safePercent + "%";
    }

    if (progressValue) {
      progressValue.textContent =
        safePercent + "%";
    }

    if (progressLabel && label) {
      progressLabel.textContent = label;
    }
  }

  function uploadMaterialFile(
    uploadUrl,
    file,
    authorization,
    onProgress
  ) {
    const formData = new FormData();
    const uploadParameters =
      authorization &&
      authorization.uploadParameters &&
      typeof authorization.uploadParameters ===
        "object"
        ? authorization.uploadParameters
        : {};

    formData.append("file", file);

    Object.keys(uploadParameters).forEach(
      function (key) {
        formData.append(
          key,
          String(uploadParameters[key])
        );
      }
    );

    formData.append(
      "publicKey",
      String(authorization && authorization.publicKey || "")
    );
    formData.append(
      "token",
      String(authorization && authorization.token || "")
    );
    formData.append(
      "expire",
      String(authorization && authorization.expire || "")
    );
    formData.append(
      "signature",
      String(
        authorization &&
        authorization.signature
          ? authorization.signature
          : ""
      )
    );

    return new Promise(function (resolve, reject) {
      const request = new XMLHttpRequest();

      request.upload.addEventListener(
        "progress",
        function (event) {
          if (
            event.lengthComputable &&
            event.total > 0 &&
            typeof onProgress === "function"
          ) {
            onProgress(
              Math.max(
                0,
                Math.min(1, event.loaded / event.total)
              )
            );
          }
        }
      );

      request.addEventListener(
        "load",
        function () {
          let imageKitResponse = {};

          try {
            imageKitResponse = JSON.parse(
              request.responseText || "{}"
            );
          } catch (error) {
            imageKitResponse = {};
          }

          if (request.status >= 200 && request.status < 300) {
            if (typeof onProgress === "function") {
              onProgress(1);
            }

            resolve(imageKitResponse);
            return;
          }

          reject(
            new Error(
              (
                imageKitResponse.error &&
                imageKitResponse.error.message
              ) ||
                imageKitResponse.message ||
                imageKitResponse.error ||
                "ImageKit rejected the upload."
            )
          );
        }
      );

      request.addEventListener(
        "error",
        function () {
          reject(
            new Error(
              "The ImageKit upload connection failed. Check your network and try again."
            )
          );
        }
      );

      request.addEventListener(
        "abort",
        function () {
          reject(new Error("The upload was cancelled."));
        }
      );

      request.addEventListener(
        "timeout",
        function () {
          reject(new Error("The ImageKit upload timed out. Try again."));
        }
      );

      // Avoid manually setting Content-Type: the browser must supply
      // the multipart boundary for ImageKit's upload endpoint.
      request.open("POST", uploadUrl);
      request.send(formData);
    });
  }

  function setupMaterialUploadForm(
    course,
    options
  ) {
    const settings = options || {};
    const form =
      settings.form ||
      document.getElementById(
        "material-upload-form"
      );
    const button = getMaterialFormControl(
      form,
      "submit",
      "material-upload-button"
    );

    if (
      !form ||
      form.dataset.ready === "true"
    ) {
      return;
    }

    const defaultButtonLabel =
      settings.buttonLabel ||
      (
        button
          ? button.textContent.trim()
          : "Upload material"
      );

    form.dataset.ready = "true";
    form.noValidate = true;
    populateMaterialProfessorSelect(form);
    setupMaterialChoiceMenus(form);
    setupMaterialFilePicker(form);

    form.addEventListener(
      "submit",
      async function (event) {
        event.preventDefault();

        const activeCourse =
          typeof settings.getCourse === "function"
            ? settings.getCourse()
            : course;
        const professorInput =
          getMaterialFormControl(
            form,
            "professor",
            "material-professor"
          );
        const materialTypeInput =
          getMaterialFormControl(
            form,
            "type",
            "material-type"
          );
        const semesterInput =
          getMaterialFormControl(
            form,
            "semester",
            "material-semester"
          );
        const titleInput =
          getMaterialFormControl(
            form,
            "title",
            "material-title"
          );
        const fileInput =
          getMaterialFormControl(
            form,
            "file",
            "material-file"
          );
        const anonymousInput =
          getMaterialFormControl(
            form,
            "anonymous",
            "material-anonymous"
          );
        const files =
          fileInput && fileInput.files
            ? Array.from(fileInput.files)
            : [];
        const professor = professorInput
          ? professorInput.value.trim()
          : "";
        const materialType = materialTypeInput
          ? materialTypeInput.value.trim()
          : "";
        const semester = semesterInput
          ? semesterInput.value.trim()
          : "";
        const title = titleInput
          ? titleInput.value.trim()
          : "";
        const isAnonymous = Boolean(
          anonymousInput &&
          anonymousInput.checked
        );

        if (
          !activeCourse ||
          !activeCourse.code
        ) {
          setMaterialUploadStatus(
            "Choose a course before uploading material.",
            "error",
            form
          );
          return;
        }

        if (
          !professor ||
          !materialType ||
          !semester ||
          !title ||
          !files.length
        ) {
          setMaterialUploadStatus(
            "Fill in the professor, material type, semester, title, and choose at least one file.",
            "error",
            form
          );
          return;
        }

        const oversizedFile = files.find(
          function (file) {
            return (
              file.size >
              25 * 1024 * 1024
            );
          }
        );

        if (oversizedFile) {
          setMaterialUploadStatus(
            oversizedFile.name +
              " is above the 25MB upload limit.",
            "error",
            form
          );
          return;
        }

        if (button) {
          button.disabled = true;
        }

        const totalBytes = files.reduce(
          function (total, file) {
            return total + file.size;
          },
          0
        );

        let uploadedCount = 0;
        let completedBytes = 0;
        let activeAuthorizationId = "";

        const uploadGroupId =
          window.crypto &&
          typeof window.crypto.randomUUID === "function"
            ? window.crypto.randomUUID()
            : [
                Date.now().toString(36),
                Math.random().toString(36).slice(2, 12)
              ].join("-");

        setMaterialUploadProgress(
          0,
          "Preparing upload",
          true,
          form
        );

        try {
          for (
            let index = 0;
            index < files.length;
            index += 1
          ) {
            const file = files[index];
            const progressLabel =
              files.length > 1
                ? "Uploading file " +
                  (index + 1) +
                  " of " +
                  files.length
                : "Uploading file";

            if (button) {
              button.textContent =
                files.length > 1
                  ? "Uploading " +
                    (index + 1) +
                    " of " +
                    files.length +
                    "..."
                  : "Uploading...";
            }

            const authResponse = await fetch(
              "/api/imagekit-auth",
              {
                method: "POST",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json",
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                  action: "authorize",
                  courseCode:
                    activeCourse.code,
                  courseTitle:
                    activeCourse.title || "",
                  professor: professor,
                  semester: semester,
                  materialType:
                    materialType,
                  isAnonymous:
                    isAnonymous,
                  title: title,
                  fileName: file.name,
                  fileSize: file.size
                })
              }
            );

            const auth =
              await authResponse
                .json()
                .catch(function () {
                  return {};
                });

            if (!authResponse.ok) {
              throw new Error(
                auth.error ||
                  "Could not prepare the next file upload."
              );
            }

            const uploadUrl =
              String(auth.uploadUrl || "").trim();
            const imagekitFilePath =
              String(auth.imagekitFilePath || "").trim();

            activeAuthorizationId =
              String(auth.authorizationId || "").trim();

            if (
              !activeAuthorizationId ||
              !/^\/auc-atlas\/materials\/[a-f0-9]{36}\.(?:pdf|docx?|pptx?|xlsx?|jpe?g|png)$/i.test(
                imagekitFilePath
              ) ||
              uploadUrl !==
                "https://upload.imagekit.io/api/v1/files/upload" ||
              !auth.publicKey ||
              !auth.signature ||
              !auth.token ||
              !Number.isSafeInteger(Number(auth.expire)) ||
              Number(auth.expire) <= Date.now() / 1000 ||
              !auth.uploadParameters ||
              auth.uploadParameters.fileName !==
                imagekitFilePath.split("/").pop() ||
              auth.uploadParameters.folder !==
                "/auc-atlas/materials" ||
              auth.uploadParameters.isPrivateFile !== "true" ||
              auth.uploadParameters.useUniqueFileName !== "false" ||
              auth.uploadParameters.overwriteFile !== "false"
            ) {
              throw new Error(
                "The secure ImageKit upload authorization is incomplete."
              );
            }

            const uploadedFile =
              await uploadMaterialFile(
                uploadUrl,
                file,
                auth,
                function (
                  fileProgress
                ) {
                  const uploadedBytes =
                    completedBytes +
                    file.size *
                      fileProgress;
                  const overallProgress =
                    totalBytes > 0
                      ? (
                          uploadedBytes /
                          totalBytes
                        ) * 100
                      : 0;

                  setMaterialUploadProgress(
                    overallProgress,
                    progressLabel,
                    true,
                    form
                  );
                }
              );
            const imagekitFileId =
              String(uploadedFile.fileId || "").trim();

            if (
              !/^[a-f0-9]{24}$/i.test(imagekitFileId) ||
              uploadedFile.filePath !== imagekitFilePath ||
              Number(uploadedFile.size) !== file.size
            ) {
              throw new Error(
                "ImageKit returned an unexpected upload result."
              );
            }

            // Transfer progress can reach 100% before the file is
            // registered; keep the form busy during server verification.
            setMaterialUploadProgress(
              totalBytes > 0
                ? ((completedBytes + file.size) / totalBytes) * 100
                : 100,
              files.length > 1
                ? "Saving file " + (index + 1) + " of " + files.length
                : "Saving uploaded file",
              true,
              form
            );

            const saveResponse =
              await fetch(
                "/api/course-materials",
                {
                  method: "POST",
                  credentials:
                    "same-origin",
                  headers: {
                    "Content-Type":
                      "application/json"
                  },
                  body: JSON.stringify({
                    uploadAuthorizationId:
                      activeAuthorizationId,
                    uploadGroupId:
                      uploadGroupId,
                    imagekitFilePath:
                      imagekitFilePath,
                    imagekitFileId:
                      imagekitFileId
                  })
                }
              );

            let saveData = {};

            try {
              saveData =
                await saveResponse.json();
            } catch (error) {
              saveData = {};
            }

            if (!saveResponse.ok) {
              throw new Error(
                saveData.error ||
                  "The file uploaded, but its course-material record could not be saved."
              );
            }

            activeAuthorizationId = "";
            completedBytes += file.size;
            uploadedCount += 1;

            setMaterialUploadProgress(
              totalBytes > 0
                ? (
                    completedBytes /
                    totalBytes
                  ) * 100
                : 100,
              progressLabel,
              true,
              form
            );
          }

          form.reset();
          syncMaterialChoiceMenus(form);
          setMaterialFileSelection(
            form,
            []
          );

          if (
            typeof settings.onSuccess ===
            "function"
          ) {
            await settings.onSuccess(
              activeCourse
            );
          } else {
            await loadCourseMaterials(
              activeCourse
            );
          }

          setMaterialUploadProgress(
            100,
            "Upload complete",
            true,
            form
          );

          setMaterialUploadStatus(
            files.length === 1
              ? "File upload successful!"
              : files.length +
                  " files uploaded successfully and added to the course materials library.",
            "success",
            form
          );

          window.setTimeout(
            function () {
              setMaterialUploadProgress(
                0,
                "Uploading files",
                false,
                form
              );
            },
            900
          );
        } catch (error) {
          if (activeAuthorizationId) {
            await fetch(
              "/api/imagekit-auth",
              {
                method: "POST",
                credentials:
                  "same-origin",
                cache: "no-store",
                headers: {
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                  action: "cancel",
                  authorizationId:
                    activeAuthorizationId
                })
              }
            ).catch(function () {});
          }

          const progressMessage =
            uploadedCount
              ? uploadedCount +
                " of " +
                files.length +
                " files uploaded. "
              : "";

          setMaterialUploadProgress(
            0,
            "Uploading files",
            false,
            form
          );

          setMaterialUploadStatus(
            progressMessage +
              (
                error.message ||
                "Upload failed. Try again."
              ),
            "error",
            form
          );
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent =
              defaultButtonLabel;
          }
        }
      }
    );
  }

  
export { getMaterialFormControl, setMaterialUploadStatus, populateMaterialProfessorSelect,
  populateQuickMaterialCourseSelect, setMaterialUploadProgress, setupMaterialUploadForm };
