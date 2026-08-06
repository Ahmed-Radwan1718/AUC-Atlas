const crypto = require("crypto");
const admin = require("../_lib/firebaseAdmin");

const {
  getSiteSessionUser,
  signInWithPassword,
  requireSecurityPanelAccess,
  clearSiteSessionCookie
} = require("../_lib/securityHelpers");
const {
  consumeSecurityRateLimit,
  clearSecurityRateLimit
} = require("../_lib/securityRateLimits");

const DELETE_ACCOUNT_ATTEMPT_WINDOW_MS =
  15 * 60 * 1000;
const DELETE_ACCOUNT_MAX_ATTEMPTS = 5;

function cleanString(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function createDeleteAccountError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getRequestBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch (error) {
      return {};
    }
  }

  return req.body || {};
}

function getImageKitAuthorizationHeader() {
  const privateKey = cleanString(
    process.env.IMAGEKIT_PRIVATE_KEY,
    500
  );

  return privateKey
    ? "Basic " +
        Buffer.from(privateKey + ":").toString("base64")
    : "";
}

async function deleteImageKitFile(fileId) {
  const authorization =
    getImageKitAuthorizationHeader();
  const safeFileId = cleanString(fileId, 160);

  if (
    !authorization ||
    !/^[A-Za-z0-9_-]{6,160}$/.test(safeFileId)
  ) {
    return;
  }

  const response = await fetch(
    "https://api.imagekit.io/v1/files/" +
      encodeURIComponent(safeFileId),
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: authorization
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    throw createDeleteAccountError(
      "Could not delete an uploaded course file.",
      502
    );
  }
}

function getCloudinaryConfig() {
  let cloudName = cleanString(
    process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_NAME,
    160
  );
  let apiKey = cleanString(
    process.env.CLOUDINARY_API_KEY,
    160
  );
  let apiSecret = cleanString(
    process.env.CLOUDINARY_API_SECRET,
    500
  );

  if (
    (!cloudName || !apiKey || !apiSecret) &&
    process.env.CLOUDINARY_URL
  ) {
    try {
      const cloudinaryUrl = new URL(
        process.env.CLOUDINARY_URL
      );

      cloudName =
        cloudName || cloudinaryUrl.hostname;
      apiKey =
        apiKey ||
        decodeURIComponent(
          cloudinaryUrl.username || ""
        );
      apiSecret =
        apiSecret ||
        decodeURIComponent(
          cloudinaryUrl.password || ""
        );
    } catch (error) {}
  }

  return cloudName && apiKey && apiSecret
    ? {
        cloudName,
        apiKey,
        apiSecret
      }
    : null;
}

function signCloudinaryParams(params, apiSecret) {
  const signatureBase = Object.keys(params)
    .sort()
    .map(function (key) {
      return key + "=" + params[key];
    })
    .join("&");

  return crypto
    .createHash("sha1")
    .update(signatureBase + apiSecret)
    .digest("hex");
}

async function deleteCloudinaryProfilePhoto(publicId) {
  const safePublicId = cleanString(publicId, 500);
  const config = getCloudinaryConfig();

  if (
    !config ||
    !/^auc-atlas\/profile-photos\/[A-Za-z0-9_-]+\//.test(
      safePublicId
    )
  ) {
    return;
  }

  const timestamp = String(
    Math.floor(Date.now() / 1000)
  );
  const signedParams = {
    invalidate: "true",
    public_id: safePublicId,
    timestamp
  };
  const signature = signCloudinaryParams(
    signedParams,
    config.apiSecret
  );
  const body = new URLSearchParams(
    Object.assign({}, signedParams, {
      api_key: config.apiKey,
      signature
    })
  );

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/" +
      encodeURIComponent(config.cloudName) +
      "/image/destroy",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body: body.toString()
    }
  );

  if (!response.ok) {
    throw createDeleteAccountError(
      "Could not delete the profile photo.",
      502
    );
  }
}

async function deleteDocumentReferences(db, docs) {
  const safeDocs = Array.isArray(docs)
    ? docs
    : [];

  for (
    let start = 0;
    start < safeDocs.length;
    start += 400
  ) {
    const batch = db.batch();

    safeDocs
      .slice(start, start + 400)
      .forEach(function (doc) {
        batch.delete(doc.ref);
      });

    await batch.commit();
  }
}

async function deleteQueryDocuments(db, query) {
  while (true) {
    const snapshot = await query.limit(200).get();

    if (snapshot.empty) {
      return;
    }

    await deleteDocumentReferences(
      db,
      snapshot.docs
    );
  }
}

async function deleteUserMaterials(db, uid) {
  const query = db
    .collection("courseMaterials")
    .where("uploaderUid", "==", uid);

  while (true) {
    const snapshot = await query.limit(50).get();

    if (snapshot.empty) {
      return;
    }

    await Promise.all(
      snapshot.docs.map(function (doc) {
        const data = doc.data() || {};

        return deleteImageKitFile(
          data.fileId
        ).catch(function () {});
      })
    );

    await deleteDocumentReferences(
      db,
      snapshot.docs
    );
  }
}

async function deleteCollectionTree(collectionRef) {
  while (true) {
    const snapshot =
      await collectionRef.limit(100).get();

    if (snapshot.empty) {
      return;
    }

    for (const doc of snapshot.docs) {
      await deleteDocumentTree(doc.ref);
    }
  }
}

async function deleteDocumentTree(documentRef) {
  const childCollections =
    await documentRef.listCollections();

  for (const childCollection of childCollections) {
    await deleteCollectionTree(childCollection);
  }

  await documentRef.delete();
}

async function deleteOwnedReservation(
  db,
  collectionName,
  documentId,
  uid
) {
  const safeDocumentId = cleanString(
    documentId,
    160
  );

  if (!safeDocumentId) {
    return;
  }

  const ref = db
    .collection(collectionName)
    .doc(safeDocumentId);
  const doc = await ref.get();
  const data = doc.exists
    ? doc.data() || {}
    : {};

  if (
    doc.exists &&
    String(data.uid || "") === uid
  ) {
    await ref.delete();
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "DELETE") {
      res.setHeader("Allow", "DELETE");

      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    res.setHeader("Cache-Control", "no-store");

    const decodedUser = await getSiteSessionUser(
      req,
      {
        checkRevoked: true
      }
    );

    await requireSecurityPanelAccess(
      req,
      decodedUser
    );

    const body = getRequestBody(req);
    const currentPassword = String(
      body.currentPassword || ""
    );
    const confirmation = cleanString(
      body.confirmation,
      20
    );

    if (
      !currentPassword ||
      currentPassword.length > 1024
    ) {
      throw createDeleteAccountError(
        "Enter your current password.",
        400
      );
    }

    if (confirmation !== "DELETE") {
      throw createDeleteAccountError(
        "Type DELETE exactly to confirm account deletion.",
        400
      );
    }

    const userRecord =
      await admin.auth().getUser(
        decodedUser.uid
      );
    const email = String(
      userRecord.email ||
        decodedUser.email ||
        ""
    ).trim();

    if (!email) {
      throw createDeleteAccountError(
        "No email address was found on this account.",
        400
      );
    }

    await consumeSecurityRateLimit({
      scope: "delete-account-password",
      identifier: decodedUser.uid,
      maxAttempts:
        DELETE_ACCOUNT_MAX_ATTEMPTS,
      windowMs:
        DELETE_ACCOUNT_ATTEMPT_WINDOW_MS,
      message:
        "Too many account-deletion attempts. Please try again later."
    });

    try {
      await signInWithPassword(
        email,
        currentPassword
      );
    } catch (error) {
      throw createDeleteAccountError(
        "Current password is incorrect.",
        401
      );
    }

    await clearSecurityRateLimit(
      "delete-account-password",
      decodedUser.uid
    );

    const db = admin.firestore();
    const userRef = db
      .collection("users")
      .doc(decodedUser.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.exists
      ? userDoc.data() || {}
      : {};
    const phoneLookupKey = String(
      userData.phoneLookupKey ||
        userData.phone ||
        ""
    ).replace(/\D/g, "");
    const aucIdLookupKey = String(
      userData.aucIdLookupKey ||
        userData.aucId ||
        ""
    ).replace(/\D/g, "");

    await deleteCloudinaryProfilePhoto(
      userData.photoPublicId
    ).catch(function () {});

    await deleteUserMaterials(
      db,
      decodedUser.uid
    );

    await deleteQueryDocuments(
      db,
      db
        .collection("professorReviews")
        .where(
          "authorUid",
          "==",
          decodedUser.uid
        )
    );

    await deleteQueryDocuments(
      db,
      db
        .collection("professorReviews")
        .where(
          "authorUserId",
          "==",
          decodedUser.uid
        )
    );

    await deleteQueryDocuments(
      db,
      db
        .collection(
          "materialUploadAuthorizations"
        )
        .where(
          "uploaderUid",
          "==",
          decodedUser.uid
        )
    );

    await deleteQueryDocuments(
      db,
      db
        .collection("loginChallenges")
        .where(
          "uid",
          "==",
          decodedUser.uid
        )
    );

    await Promise.all([
      deleteOwnedReservation(
        db,
        "accountPhoneNumbers",
        phoneLookupKey,
        decodedUser.uid
      ),
      deleteOwnedReservation(
        db,
        "accountAucIds",
        aucIdLookupKey,
        decodedUser.uid
      ),
      db
        .collection("twoFactorSecrets")
        .doc(decodedUser.uid)
        .delete()
        .catch(function () {}),
      db
        .collection("materialUploadLimits")
        .doc(decodedUser.uid)
        .delete()
        .catch(function () {}),
      db
        .collection(
          "profilePhotoUploadLimits"
        )
        .doc(decodedUser.uid)
        .delete()
        .catch(function () {})
    ]);

    await deleteDocumentTree(userRef);
    await admin.auth().deleteUser(
      decodedUser.uid
    );

    clearSiteSessionCookie(res);

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(error.retryAfterSeconds)
      );
    }

    return res
      .status(error.statusCode || 500)
      .json({
        error:
          error.message ||
          "Could not delete the account."
      });
  }
};
