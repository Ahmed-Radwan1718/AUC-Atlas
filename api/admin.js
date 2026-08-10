const admin = require("../server/_lib/firebaseAdmin");
const {
  createAdminError,
  ensureAdminUser,
  isAdminUid,
  getAdminAuthenticationRequirements,
  authenticateAdminPassword,
  verifyAdminAuthenticator,
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

function cleanNotificationType(value) {
  const type = cleanString(value, 20).toLowerCase();

  return ["info", "important", "maintenance"].includes(type)
    ? type
    : "info";
}

function cleanNotificationLink(value) {
  const link = cleanString(value, 500);

  if (!link) {
    return "";
  }

  const normalized = link.replace(/^\/+/, "");

  if (
    !normalized ||
    /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(link) ||
    /[\s\\]/.test(link) ||
    !/^[A-Za-z0-9][A-Za-z0-9._~!$&'()*+,;=:@%/?#-]*$/.test(normalized)
  ) {
    throw createAdminError(
      "Notification links must be internal site paths such as courses.html.",
      400
    );
  }

  return normalized;
}

function serializeNotification(doc) {
  const data = doc.data() || {};
  const expiresAt = getTimestampIso(data.expiresAt || data.expiresAtIso);
  const expiresAtMillis = getTimestampMillis(expiresAt);

  return {
    id: doc.id,
    title: cleanString(data.title, 120),
    message: cleanMultiline(data.message, 1600),
    type: cleanNotificationType(data.type),
    linkUrl: cleanNotificationLink(data.linkUrl),
    linkLabel: cleanString(data.linkLabel, 60),
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso),
    expiresAt,
    active: data.published !== false && (!expiresAtMillis || expiresAtMillis > Date.now())
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

function serializeReport(doc) {
  const data = doc.data() || {};
  const targetSnapshot =
    data.targetSnapshot &&
    typeof data.targetSnapshot === "object"
      ? data.targetSnapshot
      : {};

  return {
    id: doc.id,
    targetType: data.targetType || "",
    targetId: data.targetId || "",
    targetKey: data.targetKey || "",
    targetLabel: data.targetLabel || "",
    targetOwnerUid: data.targetOwnerUid || "",
    reason: data.reason || "",
    reporterUid: data.reporterUid || "",
    reporterEmail: data.reporterEmail || "",
    status: data.status || "open",
    createdAt: getTimestampIso(data.createdAt || data.createdAtIso),
    targetSnapshot: {
      professorName: targetSnapshot.professorName || "",
      courseCode: targetSnapshot.courseCode || "",
      semesterTaken: targetSnapshot.semesterTaken || "",
      rating: Number(targetSnapshot.rating || 0),
      studentNote: targetSnapshot.studentNote || "",
      authorUid: targetSnapshot.authorUid || "",
      authorName: targetSnapshot.authorName || "",
      title: targetSnapshot.title || "",
      fileName: targetSnapshot.fileName || "",
      professor: targetSnapshot.professor || "",
      semester: targetSnapshot.semester || "",
      materialType: targetSnapshot.materialType || "",
      uploaderUid: targetSnapshot.uploaderUid || "",
      uploaderDisplayName: targetSnapshot.uploaderDisplayName || "",
      fileId: targetSnapshot.fileId || ""
    }
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

async function listAllUsers(actor) {
  const userRecords = [];
  let pageToken;

  do {
    const page = await admin
      .auth()
      .listUsers(1000, pageToken);

    userRecords.push.apply(
      userRecords,
      page.users || []
    );
    pageToken = page.pageToken;
  } while (pageToken);

  const configuredAdminUids = new Set(
    String(process.env.ADMIN_UIDS || "")
      .split(/[\s,]+/)
      .map(function (uid) {
        return uid.trim();
      })
      .filter(Boolean)
  );
  const db = admin.firestore();
  const users = [];

  for (
    let index = 0;
    index < userRecords.length;
    index += 25
  ) {
    const userBatch = await Promise.all(
      userRecords
        .slice(index, index + 25)
        .map(async function (userRecord) {
          const userRef = db
            .collection("users")
            .doc(userRecord.uid);
          const details = await Promise.all([
            userRef.get(),
            userRef
              .collection("sessions")
              .count()
              .get()
          ]);
          const userDoc = details[0];
          const sessionCountSnapshot =
            details[1];
          const userData = userDoc.exists
            ? userDoc.data() || {}
            : {};
          const moderation =
            userData.moderation &&
            typeof userData.moderation ===
              "object"
              ? userData.moderation
              : {};

          return {
            uid: userRecord.uid,
            email:
              userRecord.email ||
              userData.email ||
              "",
            displayName:
              userData.fullName ||
              userData.displayName ||
              userRecord.displayName ||
              "AUC student",
            photoURL:
              userData.photoURL ||
              userRecord.photoURL ||
              "",
            major: userData.major || "",
            aucId:
              userData.aucId ||
              userData.aucIdLookupKey ||
              "",
            disabled:
              Boolean(userRecord.disabled),
            emailVerified:
              Boolean(
                userRecord.emailVerified
              ),
            isAdmin:
              userRecord.uid === actor.uid ||
              configuredAdminUids.has(
                userRecord.uid
              ) ||
              Boolean(
                userRecord.customClaims &&
                userRecord.customClaims
                  .admin === true
              ),
            activeSessionRecords:
              Number(
                sessionCountSnapshot
                  .data()
                  .count || 0
              ),
            banReason:
              moderation.reason || "",
            banUpdatedAt:
              getTimestampIso(
                moderation.updatedAt ||
                moderation.updatedAtIso
              ),
            createdAt:
              userRecord.metadata &&
              userRecord.metadata.creationTime
                ? new Date(
                    userRecord.metadata
                      .creationTime
                  ).toISOString()
                : "",
            lastSignInAt:
              userRecord.metadata &&
              userRecord.metadata
                .lastSignInTime
                ? new Date(
                    userRecord.metadata
                      .lastSignInTime
                  ).toISOString()
                : ""
          };
        })
    );

    users.push.apply(users, userBatch);
  }

  users.sort(function (a, b) {
    return (
      getTimestampMillis(b.createdAt) -
      getTimestampMillis(a.createdAt)
    );
  });

  return users;
}

async function getDashboardData(actor) {
  const db = admin.firestore();
  const results = await Promise.all([
    db.collection("users").count().get(),
    db.collection("users").where("moderation.banned", "==", true).count().get(),
    db.collection("professorReviews").limit(500).get(),
    db.collection("courseMaterials").limit(500).get(),
    db.collection("contentReports").where("status", "==", "open").limit(500).get(),
    db.collection("adminAuditLogs").orderBy("createdAt", "desc").limit(30).get(),
    db.collection("siteSettings").doc("donationCounter").get(),
    db.collection("siteNotifications").orderBy("createdAtIso", "desc").limit(100).get(),
    getImageKitMaterials(),
    listAllUsers(actor)
  ]);

  const userCountSnapshot = results[0];
  const bannedUserCountSnapshot = results[1];
  const reviewsSnapshot = results[2];
  const materialsSnapshot = results[3];
  const reportsSnapshot = results[4];
  const auditSnapshot = results[5];
  const donationDoc = results[6];
  const notificationsSnapshot = results[7];
  const imageKitMaterials = results[8];
  const users = results[9];
  const reviews = [];
  const firestoreMaterials = [];
  const reports = [];
  const audits = [];
  const notifications = [];
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

  reportsSnapshot.forEach(function (doc) {
    reports.push(serializeReport(doc));
  });

  auditSnapshot.forEach(function (doc) {
    audits.push(serializeAudit(doc));
  });

  notificationsSnapshot.forEach(function (doc) {
    notifications.push(serializeNotification(doc));
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

  reports.sort(function (a, b) {
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
      users: users.length,
      reviews: reviews.length,
      materials: materials.length,
      bannedUsers: users.filter(function (user) {
        return user.disabled;
      }).length
    },
    users,
    reports: reports.slice(0, 250),
    reviews: reviews.slice(0, 250),
    materials: materials.slice(0, 250),
    notifications,
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

async function resolveOpenReportsForTarget(
  actor,
  targetType,
  targetId,
  resolution
) {
  const safeTargetType = cleanString(
    targetType,
    20
  );
  const safeTargetId = cleanString(
    targetId,
    180
  );

  if (!safeTargetType || !safeTargetId) {
    return 0;
  }

  const db = admin.firestore();
  const targetKey =
    safeTargetType +
    ":" +
    safeTargetId;
  const reportsSnapshot = await db
    .collection("contentReports")
    .where("targetKey", "==", targetKey)
    .limit(500)
    .get();

  if (reportsSnapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  const resolvedAtIso =
    new Date().toISOString();
  let resolvedCount = 0;

  reportsSnapshot.forEach(
    function (reportDoc) {
      const reportData =
        reportDoc.data() || {};

      if (reportData.status !== "open") {
        return;
      }

      resolvedCount += 1;

      batch.set(
        reportDoc.ref,
        {
          status: "resolved",
          resolution: cleanString(
            resolution,
            80
          ),
          resolvedAt:
            admin.firestore.FieldValue
              .serverTimestamp(),
          resolvedAtIso,
          resolvedByAdminUid:
            actor.uid,
          resolvedByAdminEmail:
            actor.email,
          updatedAt:
            admin.firestore.FieldValue
              .serverTimestamp(),
          updatedAtIso:
            resolvedAtIso
        },
        {
          merge: true
        }
      );
    }
  );

  if (!resolvedCount) {
    return 0;
  }

  await batch.commit();

  return resolvedCount;
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

  await resolveOpenReportsForTarget(
    actor,
    "review",
    reviewId,
    "content_removed"
  );

  return { success: true };
}

async function handleApproveMaterial(actor, body) {
  const materialId = cleanString(
    body.materialId,
    180
  );

  if (
    !materialId ||
    !/^[A-Za-z0-9_-]{6,180}$/.test(
      materialId
    )
  ) {
    throw createAdminError(
      "Course material not found.",
      400
    );
  }

  const materialRef = admin.firestore()
    .collection("courseMaterials")
    .doc(materialId);
  const materialDoc =
    await materialRef.get();

  if (!materialDoc.exists) {
    throw createAdminError(
      "Course material not found.",
      404
    );
  }

  const materialData =
    materialDoc.data() || {};
  const status =
    cleanString(
      materialData.status || "pending",
      40
    ).toLowerCase() || "pending";
  const fileId = cleanString(
    materialData.fileId,
    160
  );

  if (status === "approved") {
    return { success: true };
  }

  if (
    status !== "pending" ||
    !/^[A-Za-z0-9_-]{6,160}$/.test(
      fileId
    )
  ) {
    throw createAdminError(
      "Only valid pending materials can be approved.",
      409
    );
  }

  const approvedAtIso =
    new Date().toISOString();

  await materialRef.set({
    status: "approved",
    approvedAt:
      admin.firestore.FieldValue.serverTimestamp(),
    approvedAtIso,
    approvedByAdminUid: actor.uid,
    approvedByAdminEmail: actor.email
  }, { merge: true });

  await writeAuditLog(actor, {
    action: "approve_material",
    targetType: "course_material",
    targetId: materialId,
    targetLabel: cleanString(
      materialData.title ||
        materialData.fileName ||
        "Course material",
      240
    ),
    reason: ""
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

  await resolveOpenReportsForTarget(
    actor,
    "material",
    materialId,
    "content_removed"
  );

  return { success: true };
}

async function handleDismissReport(
  actor,
  body
) {
  const reportId = cleanString(
    body.reportId,
    80
  );
  const reason = cleanMultiline(
    body.reason,
    500
  );

  if (
    !/^[a-f0-9]{64}$/i.test(
      reportId
    )
  ) {
    throw createAdminError(
      "Content report not found.",
      400
    );
  }

  const reportRef = admin
    .firestore()
    .collection("contentReports")
    .doc(reportId);
  const reportDoc =
    await reportRef.get();

  if (!reportDoc.exists) {
    throw createAdminError(
      "Content report not found.",
      404
    );
  }

  const reportData =
    reportDoc.data() || {};
  const targetType = cleanString(
    reportData.targetType,
    20
  );
  const targetId = cleanString(
    reportData.targetId,
    180
  );

  await resolveOpenReportsForTarget(
    actor,
    targetType,
    targetId,
    "dismissed"
  );

  await writeAuditLog(actor, {
    action: "dismiss_content_report",
    targetType: "content_report",
    targetId: reportId,
    targetLabel: cleanString(
      reportData.targetLabel ||
        targetType +
          " " +
          targetId,
      240
    ),
    reason
  });

  return {
    success: true
  };
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

async function handleCreateNotification(actor, body) {
  const title = cleanString(body.title, 120);
  const message = cleanMultiline(body.message, 1600);
  const type = cleanNotificationType(body.type);
  const linkUrl = cleanNotificationLink(body.linkUrl);
  const linkLabel = linkUrl
    ? cleanString(body.linkLabel, 60) || "View details"
    : "";
  const expiresAtInput = cleanString(body.expiresAt, 80);

  if (!title || !message) {
    throw createAdminError(
      "Enter a notification title and message.",
      400
    );
  }

  let expiresAt = null;
  let expiresAtIso = "";

  if (expiresAtInput) {
    const expiresAtDate = new Date(expiresAtInput);

    if (
      Number.isNaN(expiresAtDate.getTime()) ||
      expiresAtDate.getTime() <= Date.now()
    ) {
      throw createAdminError(
        "Choose a future expiration date and time.",
        400
      );
    }

    expiresAt = admin.firestore.Timestamp.fromDate(expiresAtDate);
    expiresAtIso = expiresAtDate.toISOString();
  }

  const createdAtIso = new Date().toISOString();
  const notificationRef = admin
    .firestore()
    .collection("siteNotifications")
    .doc();

  await notificationRef.set({
    title,
    message,
    type,
    linkUrl,
    linkLabel,
    published: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAtIso,
    expiresAt,
    expiresAtIso,
    createdByAdminUid: actor.uid,
    createdByAdminEmail: actor.email
  });

  const savedNotification = await notificationRef.get();

  await writeAuditLog(actor, {
    action: "create_notification",
    targetType: "site_notification",
    targetId: notificationRef.id,
    targetLabel: title,
    reason: ""
  });

  return {
    success: true,
    notification: serializeNotification(savedNotification)
  };
}

async function handleDeleteNotification(actor, body) {
  const notificationId = cleanString(
    body.notificationId,
    180
  );

  if (
    !/^[A-Za-z0-9_-]{6,180}$/.test(notificationId)
  ) {
    throw createAdminError(
      "Notification not found.",
      400
    );
  }

  const notificationRef = admin
    .firestore()
    .collection("siteNotifications")
    .doc(notificationId);
  const notificationDoc = await notificationRef.get();

  if (!notificationDoc.exists) {
    throw createAdminError(
      "Notification not found.",
      404
    );
  }

  const notification = serializeNotification(
    notificationDoc
  );

  await notificationRef.delete();

  await writeAuditLog(actor, {
    action: "delete_notification",
    targetType: "site_notification",
    targetId: notificationId,
    targetLabel: notification.title,
    reason: ""
  });

  return {
    success: true
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
      action ===
        "authenticateAdminPassword"
    ) {
      return res.status(200).json(
        await authenticateAdminPassword(
          actor,
          body.password
        )
      );
    }

    if (
      req.method === "POST" &&
      action ===
        "verifyAdminAuthenticator"
    ) {
      return res.status(200).json(
        await verifyAdminAuthenticator(
          actor,
          body.adminChallengeToken,
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
      action === "approveMaterial"
    ) {
      result =
        await handleApproveMaterial(
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
      action === "dismissReport"
    ) {
      result =
        await handleDismissReport(
          actor,
          body
        );
    } else if (
      action === "createNotification"
    ) {
      result =
        await handleCreateNotification(
          actor,
          body
        );
    } else if (
      action === "deleteNotification"
    ) {
      result =
        await handleDeleteNotification(
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
