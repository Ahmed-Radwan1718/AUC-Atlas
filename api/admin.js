const admin = require("../server/_lib/firebaseAdmin");
const {
  createAdminError,
  ensureAdminUser,
  isAdminUid,
  getAdminAuthenticationRequirements,
  authenticateAdminUser,
  requireFreshAdminAccess
} = require("../server/_lib/adminHelpers");

function cleanString(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanMultiline(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
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

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value._seconds === "number") return value._seconds * 1000;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function getTimestampIso(value) {
  const millis = getTimestampMillis(value);
  return millis ? new Date(millis).toISOString() : "";
}

function cleanAmount(value, fallbackValue) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0
    ? Math.round(amount * 100) / 100
    : fallbackValue;
}

function getDonationData(data) {
  const source = data || {};

  return {
    currentAmount: cleanAmount(source.currentAmount, 0),
    goalAmount: cleanAmount(source.goalAmount, 100),
    currency: source.currency === "EGP" ? "EGP" : "USD",
    updatedAt: getTimestampIso(source.updatedAt || source.updatedAtIso)
  };
}

function serializeReview(doc) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    professorId: data.professorId || "",
    professorName: data.professorName || "",
    courseCode: data.courseCode || data.courseTaken || "",
    semesterTaken: data.semesterTaken || "",
    rating: Number(data.rating || 0),
    studentNote: data.studentNote || "",
    authorUid: data.authorUid || data.authorUserId || "",
    authorName: data.authorName || "AUC student",
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso)
  };
}

function serializeMaterial(doc) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    source: "firestore",
    courseCode: data.courseCode || "",
    courseTitle: data.courseTitle || "",
    professor: data.professor || "",
    semester: data.semester || "",
    materialType: data.materialType || data.type || data.category || "Material",
    title: data.title || data.fileName || "Course material",
    fileName: data.fileName || "",
    fileId: data.fileId || "",
    status: data.status || "pending",
    uploaderUid: data.uploaderUid || "",
    uploaderDisplayName: data.uploaderDisplayName || "AUC student",
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso)
  };
}

function serializeAudit(doc) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    action: data.action || "admin_action",
    targetType: data.targetType || "",
    targetId: data.targetId || "",
    targetLabel: data.targetLabel || "",
    reason: data.reason || "",
    actorUid: data.actorUid || "",
    actorEmail: data.actorEmail || "",
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso)
  };
}

function getImageKitAuthorizationHeader() {
  const privateKey = cleanString(process.env.IMAGEKIT_PRIVATE_KEY, 500);

  return privateKey
    ? "Basic " + Buffer.from(privateKey + ":").toString("base64")
    : "";
}

function getImageKitDescriptionParts(file) {
  return String(file && file.description ? file.description : "")
    .split(" | ")
    .map(function (part) {
      return cleanString(part, 500);
    });
}

async function getImageKitMaterials() {
  const authorization = getImageKitAuthorizationHeader();

  if (!authorization) {
    return [];
  }

  const query = new URLSearchParams({
    tags: "auc-atlas-material",
    type: "file",
    limit: "1000",
    sort: "DESC_CREATED"
  });
  const response = await fetch(
    "https://api.imagekit.io/v1/files?" + query.toString(),
    {
      headers: {
        Accept: "application/json",
        Authorization: authorization
      }
    }
  );

  if (!response.ok) {
    return [];
  }

  const files = await response.json().catch(function () {
    return [];
  });

  if (!Array.isArray(files)) {
    return [];
  }

  return files.map(function (file) {
    const parts = getImageKitDescriptionParts(file);
    const fileId = cleanString(file && file.fileId, 160);
    const fileName = cleanString(parts[8] || (file && file.name), 240);

    return {
      id: "imagekit:" + fileId,
      source: "imagekit",
      courseCode: parts[1] || "",
      courseTitle: "",
      professor: parts[2] || "",
      semester: parts[3] || "",
      materialType: parts[4] || "Material",
      title: parts[0] || fileName || "Course material",
      fileName,
      fileId,
      status: "pending",
      uploaderUid: parts[7] || "",
      uploaderDisplayName: parts[5] || "AUC student",
      createdAt: cleanString(file && file.createdAt, 80)
    };
  });
}

async function deleteImageKitFile(fileId) {
  const authorization = getImageKitAuthorizationHeader();
  const safeFileId = cleanString(fileId, 160);

  if (!authorization || !safeFileId) {
    return;
  }

  const response = await fetch(
    "https://api.imagekit.io/v1/files/" + encodeURIComponent(safeFileId),
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: authorization
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    throw createAdminError("Could not delete the stored ImageKit file.", 502);
  }
}

async function writeAuditLog(actor, details) {
  const data = details || {};
  const createdAtIso = new Date().toISOString();

  await admin.firestore().collection("adminAuditLogs").add({
    action: cleanString(data.action, 80),
    targetType: cleanString(data.targetType, 80),
    targetId: cleanString(data.targetId, 180),
    targetLabel: cleanString(data.targetLabel, 240),
    reason: cleanMultiline(data.reason, 500),
    actorUid: actor.uid,
    actorEmail: actor.email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAtIso
  });
}

async function revokeStoredSessions(uid, reason) {
  const sessionsSnapshot = await admin.firestore()
    .collection("users")
    .doc(uid)
    .collection("sessions")
    .limit(400)
    .get();

  if (sessionsSnapshot.empty) {
    return;
  }

  const batch = admin.firestore().batch();

  sessionsSnapshot.forEach(function (sessionDoc) {
    batch.set(sessionDoc.ref, {
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedReason: reason || "admin_action"
    }, { merge: true });
  });

  await batch.commit();
}

async function getDashboardData(actor) {
  const db = admin.firestore();
  const results = await Promise.all([
    db.collection("users").count().get(),
    db.collection("users").where("moderation.banned", "==", true).count().get(),
    db.collection("professorReviews").limit(500).get(),
    db.collection("courseMaterials").limit(500).get(),
    db.collection("adminAuditLogs").orderBy("createdAt", "desc").limit(30).get(),
    db.collection("siteSettings").doc("donationCounter").get(),
    getImageKitMaterials()
  ]);

  const userCountSnapshot = results[0];
  const bannedUserCountSnapshot = results[1];
  const reviewsSnapshot = results[2];
  const materialsSnapshot = results[3];
  const auditSnapshot = results[4];
  const donationDoc = results[5];
  const imageKitMaterials = results[6];
  const reviews = [];
  const firestoreMaterials = [];
  const audits = [];
  const knownImageKitFileIds = new Set();

  reviewsSnapshot.forEach(function (doc) {
    reviews.push(serializeReview(doc));
  });

  materialsSnapshot.forEach(function (doc) {
    const material = serializeMaterial(doc);
    firestoreMaterials.push(material);

    if (material.fileId) {
      knownImageKitFileIds.add(material.fileId);
    }
  });

  auditSnapshot.forEach(function (doc) {
    audits.push(serializeAudit(doc));
  });

  const materials = firestoreMaterials
    .filter(function (material) {
      return material.status !== "rejected";
    })
    .concat(
      imageKitMaterials.filter(function (material) {
        return material.fileId && !knownImageKitFileIds.has(material.fileId);
      })
    );

  reviews.sort(function (a, b) {
    return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
  });

  materials.sort(function (a, b) {
    return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
  });

  return {
    success: true,
    admin: {
      uid: actor.uid,
      email: actor.email,
      displayName: actor.displayName
    },
    stats: {
      users: Number(userCountSnapshot.data().count || 0),
      reviews: reviews.length,
      materials: materials.length,
      bannedUsers: Number(bannedUserCountSnapshot.data().count || 0)
    },
    reviews: reviews.slice(0, 250),
    materials: materials.slice(0, 250),
    auditLogs: audits,
    donation: getDonationData(
      donationDoc.exists ? donationDoc.data() || {} : {}
    )
  };
}

async function lookupUser(uid) {
  const safeUid = cleanString(uid, 160);

  if (!safeUid) {
    throw createAdminError("Enter a Firebase UID.", 400);
  }

  let userRecord;

  try {
    userRecord = await admin.auth().getUser(safeUid);
  } catch (error) {
    if (error && error.code === "auth/user-not-found") {
      throw createAdminError("No Firebase user was found with that UID.", 404);
    }

    throw error;
  }

  const userDoc = await admin.firestore().collection("users").doc(safeUid).get();
  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const moderation = userData.moderation && typeof userData.moderation === "object"
    ? userData.moderation
    : {};
  const sessionsSnapshot = await admin.firestore()
    .collection("users")
    .doc(safeUid)
    .collection("sessions")
    .get();

  return {
    uid: userRecord.uid,
    email: userRecord.email || userData.email || "",
    displayName: userData.fullName || userRecord.displayName || "AUC student",
    photoURL: userData.photoURL || userRecord.photoURL || "",
    disabled: Boolean(userRecord.disabled),
    emailVerified: Boolean(userRecord.emailVerified),
    isAdmin: await isAdminUid(safeUid),
    activeSessionRecords: sessionsSnapshot.size,
    banReason: moderation.reason || "",
    banUpdatedAt: getTimestampIso(moderation.updatedAt),
    createdAt: userRecord.metadata && userRecord.metadata.creationTime
      ? new Date(userRecord.metadata.creationTime).toISOString()
      : "",
    lastSignInAt: userRecord.metadata && userRecord.metadata.lastSignInTime
      ? new Date(userRecord.metadata.lastSignInTime).toISOString()
      : ""
  };
}

async function handleDeleteReview(actor, body) {
  const reviewId = cleanString(body.reviewId, 160);
  const reason = cleanMultiline(body.reason, 500);

  if (!reviewId || !/^[A-Za-z0-9_-]+$/.test(reviewId)) {
    throw createAdminError("Review not found.", 400);
  }

  const reviewRef = admin.firestore().collection("professorReviews").doc(reviewId);
  const reviewDoc = await reviewRef.get();

  if (!reviewDoc.exists) {
    throw createAdminError("Review not found.", 404);
  }

  const reviewData = reviewDoc.data() || {};
  await reviewRef.delete();
  await writeAuditLog(actor, {
    action: "delete_review",
    targetType: "review",
    targetId: reviewId,
    targetLabel: cleanString(
      (reviewData.professorName || "Professor") + " · " +
      (reviewData.courseCode || reviewData.courseTaken || "Course"),
      240
    ),
    reason
  });

  return { success: true };
}

async function handleDeleteMaterial(actor, body) {
  const source = body.source === "imagekit" ? "imagekit" : "firestore";
  const materialId = cleanString(body.materialId, 180);
  const reason = cleanMultiline(body.reason, 500);

  if (!materialId) {
    throw createAdminError("Course material not found.", 400);
  }

  if (source === "imagekit") {
    const fileId = cleanString(body.fileId || materialId.replace(/^imagekit:/, ""), 160);
    await deleteImageKitFile(fileId);
    await writeAuditLog(actor, {
      action: "delete_material",
      targetType: "course_material",
      targetId: fileId,
      targetLabel: cleanString(body.title || body.fileName || "ImageKit material", 240),
      reason
    });

    return { success: true };
  }

  const materialRef = admin.firestore().collection("courseMaterials").doc(materialId);
  const materialDoc = await materialRef.get();

  if (!materialDoc.exists) {
    throw createAdminError("Course material not found.", 404);
  }

  const materialData = materialDoc.data() || {};
  await deleteImageKitFile(materialData.fileId).catch(function () {});

  const deletedAtIso = new Date().toISOString();
  await materialRef.set({
    status: "rejected",
    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    deletedAtIso,
    deletedByAdminUid: actor.uid,
    adminDeletionReason: reason
  }, { merge: true });

  await writeAuditLog(actor, {
    action: "delete_material",
    targetType: "course_material",
    targetId: materialId,
    targetLabel: cleanString(materialData.title || materialData.fileName || "Course material", 240),
    reason
  });

  return { success: true };
}

async function handleSetUserBan(actor, body) {
  const uid = cleanString(body.uid, 160);
  const banned = body.banned === true;
  const reason = cleanMultiline(body.reason, 500);

  if (!uid) {
    throw createAdminError("Enter a Firebase UID.", 400);
  }

  if (uid === actor.uid) {
    throw createAdminError("You cannot ban your own administrator account.", 400);
  }

  if (await isAdminUid(uid)) {
    throw createAdminError("Administrator accounts cannot be banned here.", 403);
  }

  let userRecord;

  try {
    userRecord = await admin.auth().getUser(uid);
  } catch (error) {
    if (error && error.code === "auth/user-not-found") {
      throw createAdminError("No Firebase user was found with that UID.", 404);
    }

    throw error;
  }

  await admin.auth().updateUser(uid, {
    disabled: banned
  });

  if (banned) {
    await Promise.all([
      admin.auth().revokeRefreshTokens(uid),
      revokeStoredSessions(uid, "admin_ban")
    ]);
  }

  const updatedAtIso = new Date().toISOString();
  await admin.firestore().collection("users").doc(uid).set({
    moderation: {
      banned,
      reason: banned ? reason : "",
      updatedByUid: actor.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAtIso
    }
  }, { merge: true });

  await writeAuditLog(actor, {
    action: banned ? "ban_user" : "unban_user",
    targetType: "user",
    targetId: uid,
    targetLabel: userRecord.email || userRecord.displayName || uid,
    reason
  });

  return {
    success: true,
    user: await lookupUser(uid)
  };
}

async function handleRevokeUserSessions(actor, body) {
  const uid = cleanString(body.uid, 160);
  const reason = cleanMultiline(body.reason, 500);

  if (!uid) {
    throw createAdminError("Enter a Firebase UID.", 400);
  }

  if (uid === actor.uid || await isAdminUid(uid)) {
    throw createAdminError("Administrator sessions cannot be revoked here.", 403);
  }

  let userRecord;

  try {
    userRecord = await admin.auth().getUser(uid);
  } catch (error) {
    if (error && error.code === "auth/user-not-found") {
      throw createAdminError("No Firebase user was found with that UID.", 404);
    }

    throw error;
  }

  await Promise.all([
    admin.auth().revokeRefreshTokens(uid),
    revokeStoredSessions(uid, "admin_revoke_sessions")
  ]);

  await writeAuditLog(actor, {
    action: "revoke_user_sessions",
    targetType: "user",
    targetId: uid,
    targetLabel: userRecord.email || userRecord.displayName || uid,
    reason
  });

  return {
    success: true,
    user: await lookupUser(uid)
  };
}

async function handleUpdateDonation(actor, body) {
  const currentAmount = cleanAmount(body.currentAmount, -1);
  const goalAmount = cleanAmount(body.goalAmount, -1);
  const currency = body.currency === "EGP" ? "EGP" : "USD";

  if (currentAmount < 0 || goalAmount <= 0) {
    throw createAdminError("Enter valid donation and goal amounts.", 400);
  }

  const updatedAtIso = new Date().toISOString();
  const counterData = {
    currentAmount,
    goalAmount,
    currency,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAtIso,
    updatedByUid: actor.uid
  };

  await admin.firestore()
    .collection("siteSettings")
    .doc("donationCounter")
    .set(counterData, { merge: true });

  await writeAuditLog(actor, {
    action: "update_donation_counter",
    targetType: "site_setting",
    targetId: "donationCounter",
    targetLabel: currency + " " + currentAmount + " / " + goalAmount,
    reason: cleanMultiline(body.reason, 500)
  });

  return {
    success: true,
    donation: getDonationData(counterData)
  };
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    if (
      req.method !== "GET" &&
      req.method !== "POST"
    ) {
      res.setHeader(
        "Allow",
        "GET, POST"
      );

      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const actor =
      await ensureAdminUser(req);
    const body =
      req.method === "POST"
        ? getRequestBody(req)
        : {};
    const action = cleanString(
      body.action,
      80
    );

    if (
      req.method === "POST" &&
      action ===
        "getAuthenticationRequirements"
    ) {
      return res.status(200).json(
        Object.assign(
          {
            success: true
          },
          await getAdminAuthenticationRequirements(
            actor
          )
        )
      );
    }

    if (
      req.method === "POST" &&
      action === "authenticateAdmin"
    ) {
      return res.status(200).json(
        await authenticateAdminUser(
          actor,
          body.password,
          body.authenticatorCode
        )
      );
    }

    await requireFreshAdminAccess(
      req,
      actor
    );

    if (req.method === "GET") {
      return res.status(200).json(
        await getDashboardData(actor)
      );
    }

    let result;

    if (action === "lookupUser") {
      result = {
        success: true,
        user: await lookupUser(body.uid)
      };
    } else if (
      action === "setUserBan"
    ) {
      result =
        await handleSetUserBan(
          actor,
          body
        );
    } else if (
      action === "revokeUserSessions"
    ) {
      result =
        await handleRevokeUserSessions(
          actor,
          body
        );
    } else if (
      action === "deleteReview"
    ) {
      result =
        await handleDeleteReview(
          actor,
          body
        );
    } else if (
      action === "deleteMaterial"
    ) {
      result =
        await handleDeleteMaterial(
          actor,
          body
        );
    } else if (
      action === "updateDonation"
    ) {
      result =
        await handleUpdateDonation(
          actor,
          body
        );
    } else {
      throw createAdminError(
        "Unknown administrator action.",
        400
      );
    }

    return res
      .status(200)
      .json(result);
  } catch (error) {
    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    if (error.retryAfterSeconds) {
      res.setHeader(
        "Retry-After",
        String(
          error.retryAfterSeconds
        )
      );
    }

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        error:
          error.message ||
          "Could not complete the administrator action.",
        code: error.code || "",
        requiresTwoFactor: Boolean(
          error.requiresTwoFactor
        )
      });
  }
};
