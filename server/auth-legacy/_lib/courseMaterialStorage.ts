const {
  deleteCloudinaryMaterial
} = require("./cloudinaryCourseMaterials");
const {
  deleteImageKitMaterial,
  deletePendingImageKitMaterial
} = require("./imageKitCourseMaterials");

async function deleteStoredCourseMaterial(material: any) {
  const data = material || {};

  if (data.storageProvider === "imagekit") {
    return deleteImageKitMaterial(
      data.imagekitFileId || data.fileId,
      data.storageKey
    );
  }

  // Legacy Cloudinary materials remain accessible and removable.
  return deleteCloudinaryMaterial(data.storageKey);
}

async function deletePendingCourseMaterial(authorization: any) {
  const data = authorization || {};

  if (data.storageProvider === "imagekit") {
    return deletePendingImageKitMaterial(data.storageKey);
  }

  return deleteCloudinaryMaterial(data.storageKey);
}

module.exports = {
  deleteStoredCourseMaterial,
  deletePendingCourseMaterial
};

// Keep each migrated CommonJS helper scoped to its own TypeScript module.
export {};
