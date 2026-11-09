// @ts-nocheck
import { submitContentReport, appendMaterialQueryParameter, isMaterialPreviewable } from "./materialHelpers";
function setupCourseMaterialPreview() {
    const list = document.getElementById("course-materials-list");
    const modal = document.getElementById("course-material-preview-modal");
    const frame = document.getElementById("course-material-preview-frame");
    const image = document.getElementById("course-material-preview-image");
    const loading = document.getElementById("course-material-preview-loading");
    const fallback = document.getElementById("course-material-preview-fallback");
    const title = document.getElementById("course-material-preview-title");
    const meta = document.getElementById("course-material-preview-meta");
    const download = document.getElementById("course-material-preview-download");
    const closeButton = document.getElementById("course-material-preview-close");

    if (
      !list ||
      !modal ||
      !frame ||
      !image ||
      !loading ||
      !fallback ||
      !title ||
      !meta ||
      !download ||
      modal.dataset.ready === "true"
    ) {
      return;
    }

    modal.dataset.ready = "true";

    let lastTrigger = null;

    function resetPreview() {
      frame.hidden = true;
      frame.removeAttribute("src");
      image.hidden = true;
      image.removeAttribute("src");
      fallback.hidden = true;
      fallback.textContent = "";
      loading.hidden = false;
    }

    function showPreviewFallback(message) {
      frame.hidden = true;
      frame.removeAttribute("src");
      image.hidden = true;
      image.removeAttribute("src");
      loading.hidden = true;
      fallback.textContent = message;
      fallback.hidden = false;
    }

    function closePreview() {
      modal.hidden = true;
      document.body.classList.remove("material-preview-open");
      resetPreview();

      if (lastTrigger) {
        lastTrigger.focus();
      }
    }

    function openPreview(button) {
      const downloadUrl = button.dataset.downloadUrl || "";
      const extension = String(button.dataset.fileExtension || "").toLowerCase();
      let fileUrl;

      try {
        fileUrl = new URL(downloadUrl, window.location.origin);
        if (
          fileUrl.origin !== window.location.origin ||
          fileUrl.pathname !== "/api/course-material-download" ||
          !fileUrl.searchParams.get("id")
        ) {
          return;
        }
      } catch (error) {
        return;
      }

      // PDFs and images already have accurate native browser viewers.
      if (!["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(extension)) {
        fileUrl.searchParams.set("disposition", "inline");
        window.open(fileUrl.href, "_blank", "noopener");
        return;
      }

      // Open synchronously from the click so popup blockers don't interfere.
      const previewTab = window.open("about:blank", "_blank");
      if (previewTab) {
        previewTab.document.title = "Opening Office document";
        previewTab.document.body.textContent =
          "Opening in Microsoft Office viewer…";
        previewTab.opener = null;
      }

      fileUrl.searchParams.set("disposition", "office-url");
      fetch(fileUrl.href, {
        credentials: "same-origin",
        cache: "no-store"
      })
        .then(async function (response) {
          if (!response.ok) {
            throw new Error(
              response.status === 401 || response.status === 403
                ? "Sign in with a verified AUC account to preview this file."
                : "The document could not be opened."
            );
          }
          return response.json();
        })
        .then(function (data) {
          const signedUrl = new URL(String(data.url || ""));
          if (signedUrl.protocol !== "https:") {
            throw new Error("The document preview link is invalid.");
          }

          const officeUrl =
            "https://view.officeapps.live.com/op/view.aspx?src=" +
            encodeURIComponent(signedUrl.href);

          if (previewTab && !previewTab.closed) {
            previewTab.location.replace(officeUrl);
          } else {
            window.location.assign(officeUrl);
          }
        })
        .catch(function (error) {
          const message = error.message || "The document could not be opened.";
          if (previewTab && !previewTab.closed) {
            previewTab.document.body.textContent = message;
          } else {
            window.alert(message);
          }
        });
    }

    frame.addEventListener("load", function () {
      loading.hidden = true;
    });

    image.addEventListener("load", function () {
      loading.hidden = true;
    });

    image.addEventListener("error", function () {
      showPreviewFallback(
        "The image preview could not be displayed. You can still download the original file."
      );
    });

    list.addEventListener("click", function (event) {
      const reportButton =
        event.target.closest(
          "[data-report-material]"
        );

      if (
        reportButton &&
        list.contains(reportButton)
      ) {
        submitContentReport(
          reportButton,
          "material",
          reportButton.dataset
            .reportMaterial,
          reportButton.dataset
            .reportLabel
        );

        return;
      }

      const button = event.target.closest(
        ".course-material-preview-trigger"
      );

      if (!button || !list.contains(button)) {
        return;
      }

      openPreview(button);
    });

    modal
      .querySelectorAll("[data-close-material-preview]")
      .forEach(function (button) {
        button.addEventListener("click", closePreview);
      });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.hidden) {
        closePreview();
      }
    });
  }

  
export { setupCourseMaterialPreview };
