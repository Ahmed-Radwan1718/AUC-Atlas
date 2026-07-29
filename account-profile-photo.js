(function () {
  const MAX_FILE_SIZE = 4 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const photoPreview = document.getElementById("account-photo-preview");
  const photoInput = document.getElementById("account-photo-input");
  const photoChooseButton = document.getElementById("account-photo-choose-button");
  const photoRemoveButton = document.getElementById("account-photo-remove-button");
  const photoNote = document.getElementById("account-photo-note");
  const detailsMessage = document.getElementById("account-details-message");
  const cropModal = document.getElementById("account-photo-crop-modal");
  const cropBackdrop = document.getElementById("account-photo-crop-backdrop");
  const cropClose = document.getElementById("account-photo-crop-close");
  const cropCancel = document.getElementById("account-photo-crop-cancel");
  const cropUse = document.getElementById("account-photo-crop-use");
  const cropStage = document.getElementById("account-photo-crop-stage");
  const cropFrame = cropStage ? cropStage.querySelector(".account-photo-crop-frame") : null;
  const cropImage = document.getElementById("account-photo-crop-image");
  const cropPreviewImage = document.getElementById("account-photo-crop-preview-image");
  const cropMessage = document.getElementById("account-photo-crop-message");

  let currentUser = {};
  let pendingProfilePhotoDataUrl = "";
  let removeProfilePhotoOnSave = false;
  let cropObjectUrl = "";
  let cropRenderFrame = 0;
  let cropInteractionEndTimer = 0;
  let cropActivePointers = new Map();
  let cropPinchStartDistance = 0;
  let cropPinchStartZoom = 1;
  let cropState = createCropState();

  function createCropState() {
    return {
      dragging: false,
      interacting: false,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      x: 0,
      y: 0,
      zoom: 1,
      minZoom: 1,
      maxZoom: 3,
      baseScale: 1,
      naturalWidth: 0,
      naturalHeight: 0,
      stageWidth: 0,
      stageHeight: 0,
      stageLeft: 0,
      stageTop: 0,
      frameLeft: 0,
      frameTop: 0,
      frameSize: 0,
      previewSize: 0
    };
  }

  function setMessage(element, message, type) {
    if (!element) return;

    element.textContent = message || "";
    element.className = "auth-message";

    if (type) {
      element.classList.add(type);
    }
  }

  function updatePhotoPreview(user) {
    const savedPhotoURL = String(user && user.photoURL ? user.photoURL : "").trim();
    const photoURL = pendingProfilePhotoDataUrl || (removeProfilePhotoOnSave ? "" : savedPhotoURL);

    if (photoURL) {
      photoPreview.src = photoURL;
      photoPreview.classList.add("has-profile-photo");

      if (photoRemoveButton) {
        photoRemoveButton.hidden = false;
      }

      if (photoNote) {
        photoNote.textContent = pendingProfilePhotoDataUrl
          ? "Photo selected. Save changes to sync it."
          : "Choose an image up to 4MB.";
      }

      return;
    }

    photoPreview.src = "user.png";
    photoPreview.classList.remove("has-profile-photo");

    if (photoRemoveButton) {
      photoRemoveButton.hidden = true;
    }

    if (photoNote) {
      photoNote.textContent = removeProfilePhotoOnSave
        ? "Profile photo will be removed when you save."
        : "Choose an image up to 4MB.";
    }
  }

  function getProfilePhotoFileType(file) {
    const fileType = String(file && file.type ? file.type : "").toLowerCase();

    if (fileType) {
      return fileType === "image/jpg" ? "image/jpeg" : fileType;
    }

    const fileName = String(file && file.name ? file.name : "").toLowerCase();

    if (/\.jpe?g$/.test(fileName)) return "image/jpeg";
    if (/\.png$/.test(fileName)) return "image/png";
    if (/\.webp$/.test(fileName)) return "image/webp";

    return "";
  }

  function validateProfilePhotoFile(file) {
    const fileType = getProfilePhotoFileType(file);

    if (!file || ALLOWED_TYPES.indexOf(fileType) === -1) {
      throw new Error("Please upload a JPG, PNG, or WEBP image.");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Profile photo must be 4MB or smaller.");
    }
  }

  function resetCropState() {
    cropActivePointers.clear();
    cropPinchStartDistance = 0;
    cropPinchStartZoom = 1;
    cropState = createCropState();
  }

  function clearCropObjectUrl() {
    if (cropObjectUrl) {
      URL.revokeObjectURL(cropObjectUrl);
      cropObjectUrl = "";
    }
  }

  function setCropInteracting(isInteracting) {
    cropState.interacting = Boolean(isInteracting);

    if (cropStage) {
      cropStage.classList.toggle("is-interacting", cropState.interacting);
    }

    if (cropPreviewImage) {
      const preview = cropPreviewImage.closest(".account-photo-crop-preview");

      if (preview) {
        preview.classList.toggle("is-interacting", cropState.interacting);
      }
    }
  }

  function closeCropModal() {
    if (cropModal) {
      cropModal.hidden = true;
    }

    if (cropRenderFrame) {
      window.cancelAnimationFrame(cropRenderFrame);
      cropRenderFrame = 0;
    }

    if (cropInteractionEndTimer) {
      window.clearTimeout(cropInteractionEndTimer);
      cropInteractionEndTimer = 0;
    }

    setCropInteracting(false);
    document.body.classList.remove("account-photo-crop-modal-open");
    clearCropObjectUrl();

    if (cropImage) {
      cropImage.removeAttribute("src");
      cropImage.style.transform = "";
    }

    if (cropPreviewImage) {
      cropPreviewImage.removeAttribute("src");
      cropPreviewImage.style.transform = "";
    }

    if (photoInput) {
      photoInput.value = "";
    }

    setMessage(cropMessage, "", "");
    resetCropState();
  }

  function cacheCropMetrics() {
    if (!cropStage || !cropFrame) {
      return false;
    }

    const stageRect = cropStage.getBoundingClientRect();
    const frameRect = cropFrame.getBoundingClientRect();
    const preview = cropPreviewImage ? cropPreviewImage.closest(".account-photo-crop-preview") : null;
    const previewRect = preview ? preview.getBoundingClientRect() : null;

    cropState.stageWidth = stageRect.width;
    cropState.stageHeight = stageRect.height;
    cropState.stageLeft = stageRect.left;
    cropState.stageTop = stageRect.top;
    cropState.frameLeft = frameRect.left - stageRect.left;
    cropState.frameTop = frameRect.top - stageRect.top;
    cropState.frameSize = Math.min(frameRect.width, frameRect.height);
    cropState.previewSize = previewRect ? Math.min(previewRect.width, previewRect.height) : cropState.frameSize;

    return Boolean(cropState.stageWidth && cropState.stageHeight && cropState.frameSize);
  }

  function getCropScale() {
    return cropState.baseScale * cropState.zoom;
  }

  function getCropImageCenter() {
    return {
      x: cropState.stageWidth / 2 + cropState.x,
      y: cropState.stageHeight / 2 + cropState.y
    };
  }

  function getCropImageBounds(scale) {
    const center = getCropImageCenter();

    return {
      left: center.x - cropState.naturalWidth * scale / 2,
      top: center.y - cropState.naturalHeight * scale / 2
    };
  }

  function clampCropPosition(x, y) {
    if (!cropState.stageWidth || !cropState.frameSize) {
      cacheCropMetrics();
    }

    if (!cropState.stageWidth || !cropState.naturalWidth || !cropState.naturalHeight) {
      return { x: 0, y: 0 };
    }

    const scale = getCropScale();
    const displayWidth = cropState.naturalWidth * scale;
    const displayHeight = cropState.naturalHeight * scale;
    const frameRight = cropState.frameLeft + cropState.frameSize;
    const frameBottom = cropState.frameTop + cropState.frameSize;
    const minX = frameRight - displayWidth / 2 - cropState.stageWidth / 2;
    const maxX = cropState.frameLeft + displayWidth / 2 - cropState.stageWidth / 2;
    const minY = frameBottom - displayHeight / 2 - cropState.stageHeight / 2;
    const maxY = cropState.frameTop + displayHeight / 2 - cropState.stageHeight / 2;

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY)
    };
  }

  function renderCrop() {
    if (cropRenderFrame) return;

    cropRenderFrame = window.requestAnimationFrame(function () {
      cropRenderFrame = 0;

      if (!cropState.naturalWidth || !cropState.naturalHeight) {
        return;
      }

      const scale = getCropScale();
      const center = getCropImageCenter();
      const translateX = center.x - cropState.naturalWidth / 2;
      const translateY = center.y - cropState.naturalHeight / 2;

      cropImage.style.transform = "translate3d(" + translateX + "px, " + translateY + "px, 0) scale(" + scale + ")";

      if (cropPreviewImage && cropState.previewSize && cropState.frameSize) {
        const previewRatio = cropState.previewSize / cropState.frameSize;
        const previewScale = scale * previewRatio;
        const previewTranslateX = (center.x - cropState.frameLeft) * previewRatio - cropState.naturalWidth / 2;
        const previewTranslateY = (center.y - cropState.frameTop) * previewRatio - cropState.naturalHeight / 2;

        cropPreviewImage.style.transform = "translate3d(" + previewTranslateX + "px, " + previewTranslateY + "px, 0) scale(" + previewScale + ")";
      }
    });
  }

  function setCropPosition(x, y) {
    const nextPosition = clampCropPosition(x, y);

    cropState.x = nextPosition.x;
    cropState.y = nextPosition.y;
    renderCrop();
  }

  function initializeCropImage() {
    if (!cropImage || !cacheCropMetrics()) return;

    cropState.naturalWidth = cropImage.naturalWidth;
    cropState.naturalHeight = cropImage.naturalHeight;
    cropState.baseScale = Math.max(
      cropState.frameSize / cropState.naturalWidth,
      cropState.frameSize / cropState.naturalHeight
    );
    cropState.zoom = 1;

    cropImage.draggable = false;
    cropImage.style.width = cropState.naturalWidth + "px";
    cropImage.style.height = cropState.naturalHeight + "px";
    cropImage.style.transform = "";

    if (cropPreviewImage) {
      cropPreviewImage.draggable = false;
      cropPreviewImage.src = cropObjectUrl;
      cropPreviewImage.style.width = cropState.naturalWidth + "px";
      cropPreviewImage.style.height = cropState.naturalHeight + "px";
      cropPreviewImage.style.transform = "";
    }

    if (cropUse) {
      cropUse.disabled = false;
    }

    setCropInteracting(false);
    setCropPosition(0, 0);
  }

  function createCropSourceUrl(file) {
    return new Promise(function (resolve, reject) {
      const originalUrl = URL.createObjectURL(file);
      const image = new Image();

      image.addEventListener("load", function () {
        const maxDimension = 1200;
        const largestDimension = Math.max(image.naturalWidth, image.naturalHeight);

        if (!largestDimension || largestDimension <= maxDimension) {
          resolve(originalUrl);
          return;
        }

        const scale = maxDimension / largestDimension;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          URL.revokeObjectURL(originalUrl);
          reject(new Error("Could not prepare this photo. Please try another image."));
          return;
        }

        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(function (blob) {
          URL.revokeObjectURL(originalUrl);

          if (!blob) {
            reject(new Error("Could not prepare this photo. Please try another image."));
            return;
          }

          resolve(URL.createObjectURL(blob));
        }, "image/jpeg", 0.86);
      });

      image.addEventListener("error", function () {
        URL.revokeObjectURL(originalUrl);
        reject(new Error("Could not read this image. Please choose another photo."));
      });

      image.decoding = "async";
      image.src = originalUrl;
    });
  }

  async function openCropModal(file) {
    if (!cropModal || !cropImage || !cropStage || !cropFrame || !cropPreviewImage) {
      throw new Error("Photo cropper is not ready.");
    }

    closeCropModal();

    cropModal.hidden = false;
    document.body.classList.add("account-photo-crop-modal-open");
    setMessage(cropMessage, "Preparing photo...", "");

    if (cropUse) {
      cropUse.disabled = true;
    }

    try {
      validateProfilePhotoFile(file);
      cropObjectUrl = await createCropSourceUrl(file);
    } catch (error) {
      setMessage(cropMessage, error.message || "Could not prepare this photo. Please try another image.", "error");
      throw error;
    }

    setMessage(cropMessage, "", "");

    cropImage.onload = initializeCropImage;
    cropImage.onerror = function () {
      setMessage(cropMessage, "Could not read this image. Please choose another photo.", "error");
    };
    cropImage.src = cropObjectUrl;
  }

  function getPointerDistance() {
    const pointers = Array.from(cropActivePointers.values());

    if (pointers.length < 2) {
      return 0;
    }

    return Math.hypot(
      pointers[0].clientX - pointers[1].clientX,
      pointers[0].clientY - pointers[1].clientY
    );
  }

  function getPointerCenter() {
    const pointers = Array.from(cropActivePointers.values());

    if (!pointers.length) {
      return { clientX: 0, clientY: 0 };
    }

    return {
      clientX: pointers.reduce(function (total, pointer) {
        return total + pointer.clientX;
      }, 0) / pointers.length,
      clientY: pointers.reduce(function (total, pointer) {
        return total + pointer.clientY;
      }, 0) / pointers.length
    };
  }

  function getStagePoint(clientX, clientY) {
    if (!cropState.stageWidth) {
      cacheCropMetrics();
    }

    return {
      x: clientX - cropState.stageLeft,
      y: clientY - cropState.stageTop
    };
  }

  function setCropZoom(nextZoom, focalPoint) {
    if (!cropState.naturalWidth || !cropState.stageWidth) return;

    const zoom = Math.min(
      cropState.maxZoom,
      Math.max(cropState.minZoom, Number(nextZoom) || cropState.minZoom)
    );

    if (zoom === cropState.zoom) return;

    const oldScale = getCropScale();
    const oldCenter = getCropImageCenter();
    const stagePoint = focalPoint || {
      x: cropState.frameLeft + cropState.frameSize / 2,
      y: cropState.frameTop + cropState.frameSize / 2
    };
    const imagePointX = (stagePoint.x - oldCenter.x) / oldScale;
    const imagePointY = (stagePoint.y - oldCenter.y) / oldScale;

    cropState.zoom = zoom;

    const nextScale = getCropScale();

    setCropPosition(
      stagePoint.x - imagePointX * nextScale - cropState.stageWidth / 2,
      stagePoint.y - imagePointY * nextScale - cropState.stageHeight / 2
    );
  }

  function endCropInteractionSoon() {
    if (cropInteractionEndTimer) {
      window.clearTimeout(cropInteractionEndTimer);
    }

    cropInteractionEndTimer = window.setTimeout(function () {
      cropInteractionEndTimer = 0;
      setCropInteracting(false);
    }, 120);
  }

  function handlePointerDown(event) {
    if (!cropState.naturalWidth) return;

    cacheCropMetrics();
    setCropInteracting(true);

    if (cropInteractionEndTimer) {
      window.clearTimeout(cropInteractionEndTimer);
      cropInteractionEndTimer = 0;
    }

    cropActivePointers.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY
    });

    if (cropActivePointers.size === 1) {
      cropState.dragging = true;
      cropState.startX = event.clientX;
      cropState.startY = event.clientY;
      cropState.originX = cropState.x;
      cropState.originY = cropState.y;
    }

    if (cropActivePointers.size >= 2) {
      cropState.dragging = false;
      cropPinchStartDistance = getPointerDistance();
      cropPinchStartZoom = cropState.zoom;
    }

    if (cropStage && typeof cropStage.setPointerCapture === "function") {
      try {
        cropStage.setPointerCapture(event.pointerId);
      } catch (error) {}
    }

    event.preventDefault();
  }

  function handlePointerMove(event) {
    if (!cropState.naturalWidth || !cropActivePointers.has(event.pointerId)) {
      return;
    }

    cropActivePointers.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY
    });

    if (cropActivePointers.size >= 2) {
      const pinchDistance = getPointerDistance();

      if (pinchDistance && cropPinchStartDistance) {
        const pinchCenter = getPointerCenter();

        setCropZoom(
          cropPinchStartZoom * (pinchDistance / cropPinchStartDistance),
          getStagePoint(pinchCenter.clientX, pinchCenter.clientY)
        );
      }

      event.preventDefault();
      return;
    }

    if (cropState.dragging) {
      setCropPosition(
        cropState.originX + event.clientX - cropState.startX,
        cropState.originY + event.clientY - cropState.startY
      );
    }

    event.preventDefault();
  }

  function handlePointerUp(event) {
    if (event && cropStage && typeof cropStage.releasePointerCapture === "function") {
      try {
        cropStage.releasePointerCapture(event.pointerId);
      } catch (error) {}
    }

    if (event && cropActivePointers.has(event.pointerId)) {
      cropActivePointers.delete(event.pointerId);
    }

    if (cropActivePointers.size === 1) {
      const remainingPointer = Array.from(cropActivePointers.values())[0];

      cropState.dragging = true;
      cropState.startX = remainingPointer.clientX;
      cropState.startY = remainingPointer.clientY;
      cropState.originX = cropState.x;
      cropState.originY = cropState.y;
    } else {
      cropState.dragging = false;
      endCropInteractionSoon();
    }

    cropPinchStartDistance = 0;
    cropPinchStartZoom = cropState.zoom;
  }

  function handleWheel(event) {
    if (!cropState.naturalWidth) return;

    event.preventDefault();
    setCropInteracting(true);

    const deltaY = event.deltaMode === 1
      ? event.deltaY * 16
      : event.deltaMode === 2
        ? event.deltaY * cropState.stageHeight
        : event.deltaY;
    const nextZoom = cropState.zoom * Math.exp(-deltaY * 0.0016);

    setCropZoom(nextZoom, getStagePoint(event.clientX, event.clientY));
    endCropInteractionSoon();
  }

  function getCroppedDataUrl(size, quality) {
    if (!cropState.stageWidth || !cropState.frameSize) {
      cacheCropMetrics();
    }

    if (!cropImage || !cropState.stageWidth || !cropState.naturalWidth || !cropState.naturalHeight) {
      throw new Error("Could not prepare this photo. Please try another image.");
    }

    const scale = getCropScale();
    const imageBounds = getCropImageBounds(scale);
    const sourceSize = cropState.frameSize / scale;
    const sourceX = Math.max(0, Math.min((cropState.frameLeft - imageBounds.left) / scale, cropState.naturalWidth - sourceSize));
    const sourceY = Math.max(0, Math.min((cropState.frameTop - imageBounds.top) / scale, cropState.naturalHeight - sourceSize));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not prepare this photo. Please try another image.");
    }

    canvas.width = size;
    canvas.height = size;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(cropImage, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

    return canvas.toDataURL("image/jpeg", quality);
  }

  function applyCrop() {
    try {
      pendingProfilePhotoDataUrl = getCroppedDataUrl(512, 0.86);
      removeProfilePhotoOnSave = false;
      updatePhotoPreview(currentUser);
      closeCropModal();
      setMessage(detailsMessage, "Profile photo selected. Save changes to sync it to your account.", "success");
    } catch (error) {
      setMessage(cropMessage, error.message || "Could not prepare this photo. Please try another image.", "error");
    }
  }

  if (cropBackdrop) cropBackdrop.addEventListener("click", closeCropModal);
  if (cropClose) cropClose.addEventListener("click", closeCropModal);
  if (cropCancel) cropCancel.addEventListener("click", closeCropModal);
  if (cropUse) cropUse.addEventListener("click", applyCrop);

  if (cropStage) {
    cropStage.addEventListener("pointerdown", handlePointerDown, { passive: false });
    cropStage.addEventListener("pointermove", handlePointerMove, { passive: false });
    cropStage.addEventListener("pointerup", handlePointerUp, { passive: true });
    cropStage.addEventListener("pointercancel", handlePointerUp, { passive: true });
    cropStage.addEventListener("lostpointercapture", handlePointerUp, { passive: true });
    cropStage.addEventListener("wheel", handleWheel, { passive: false });
  }

  window.addEventListener("resize", function () {
    if (cropModal && !cropModal.hidden && cropState.naturalWidth) {
      cacheCropMetrics();
      setCropPosition(cropState.x, cropState.y);
    }
  });

  if (photoChooseButton && photoInput) {
    photoChooseButton.addEventListener("click", function () {
      photoInput.click();
    });

    photoInput.addEventListener("change", async function () {
      const file = photoInput.files && photoInput.files[0];

      if (!file) return;

      photoChooseButton.disabled = true;
      setMessage(detailsMessage, "", "");

      try {
        await openCropModal(file);
      } catch (error) {
        photoInput.value = "";
        setMessage(detailsMessage, error.message || "Could not prepare this photo. Please try another image.", "error");
      } finally {
        photoChooseButton.disabled = false;
      }
    });
  }

  if (photoRemoveButton) {
    photoRemoveButton.addEventListener("click", function () {
      const hasSavedPhoto = Boolean(currentUser && currentUser.photoURL);
      const hasPendingPhoto = Boolean(pendingProfilePhotoDataUrl);

      if (!hasSavedPhoto && !hasPendingPhoto) return;

      if (!window.confirm("Remove your profile photo? This will delete it from your account when you save changes.")) {
        return;
      }

      pendingProfilePhotoDataUrl = "";
      removeProfilePhotoOnSave = hasSavedPhoto;

      if (photoInput) {
        photoInput.value = "";
      }

      updatePhotoPreview(currentUser);
      setMessage(detailsMessage, "Profile photo will be removed. Save changes to confirm.", "success");
    });
  }

  window.aucAtlasAccountPhoto = {
    resetFromUser: function (user) {
      currentUser = user || {};
      pendingProfilePhotoDataUrl = "";
      removeProfilePhotoOnSave = false;
      updatePhotoPreview(currentUser);
    },
    getSavePayload: function () {
      if (pendingProfilePhotoDataUrl) {
        return { profilePhotoDataUrl: pendingProfilePhotoDataUrl };
      }

      if (removeProfilePhotoOnSave) {
        return { removeProfilePhoto: true };
      }

      return {};
    }
  };
})();
