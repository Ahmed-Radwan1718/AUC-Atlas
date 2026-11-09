import type { LegacyRequest, LegacyReply } from "../legacyTypes";

const crypto = require("crypto");
const admin = require("../_lib/firebaseAdmin").default;

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
const {
  deleteStoredCourseMaterial,
  deletePendingCourseMaterial
} = require("../_lib/courseMaterialStorage");

const DELETE_ACCOUNT_ATTEMPT_WINDOW_MS =
  15 * 60 * 1000;
const DELETE_ACCOUNT_MAX_ATTEMPTS = 5;

function cleanString(value: any, maxLength: any) {
  return String(value || "").trim().slice(0, maxLength);
}

function createDeleteAccountError(message: any, statusCode: any) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getRequestBody(req: any) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch (error: any) {
      return {};
    }
  }

  return req.body || {};
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
    } catch (error: any) {}
  }

  return cloudName && apiKey && apiSecret
    ? {
        cloudName,
        apiKey,
        apiSecret
      }
    : null;
}

function signCloudinaryParams(params: any, apiSecret: any) {
  const signatureBase = Object.keys(params)
    .sort()
    .map(function (key: any) {
      return key + "=" + params[key];
    })
    .join("&");

  return crypto
    .createHash("sha1")
    .update(signatureBase + apiSecret)
    .digest("hex");
}

async function deleteCloudinaryProfilePhoto(publicId: any) {
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

async function deleteDocumentReferences(db: any, docs: any) {
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
      .forEach(function (doc: any) {
        batch.delete(doc.ref);
      });

    await batch.commit();
  }
}

async function deleteQueryDocuments(db: any, query: any) {
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

async function deleteUserMaterials(db: any, uid: any) {
  const query = db
    .collection("courseMaterials")
    .where("uploaderUid", "==", uid);

  while (true) {
    const snapshot = await query.limit(50).get();

    if (snapshot.empty) {
      return;
    }

    await Promise.all(
      snapshot.docs.map(function (doc: any) {
        const data = doc.data() || {};

        return deleteStoredCourseMaterial(
          data
        ).catch(function () {});
      })
    );

    await deleteDocumentReferences(
      db,
      snapshot.docs
    );
  }
}

async function deleteCollectionTree(collectionRef: any) {
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

async function deleteDocumentTree(documentRef: any) {
  const childCollections =
    await documentRef.listCollections();

  for (const childCollection of childCollections) {
    await deleteCollectionTree(childCollection);
  }

  await documentRef.delete();
}

async function deleteOwnedReservation(
  db: any,
  collectionName: any,
  documentId: any,
  uid: any
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

export default async function handler(req: LegacyRequest, res: LegacyReply) {
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
    } catch (error: any) {
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

    const pendingMaterialsSnapshot = await db
      .collection("materialUploadAuthorizations")
      .where("uploaderUid", "==", decodedUser.uid)
      .get();

    await Promise.all(
      pendingMaterialsSnapshot.docs.map(async function (doc: any) {
        const authorization = doc.data() || {};
        if (!authorization.consumedAt) {
          await deletePendingCourseMaterial(authorization).catch(function () {});
        }
      })
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
  } catch (error: any) {
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
