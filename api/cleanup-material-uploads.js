const crypto = require("crypto");
const admin = require(
  "../server/_lib/firebaseAdmin"
);

const CLEANUP_GRACE_MS =
  15 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 100;
const CLEANUP_CONCURRENCY = 5;

function cleanString(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function getTimestampMillis(value) {
  if (!value) return 0;

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  if (typeof value._seconds === "number") {
    return value._seconds * 1000;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime())
    ? 0
    : parsedDate.getTime();
}

function getRequestHeader(req, name) {
  const headers =
    req && req.headers ? req.headers : {};
  const value =
    headers[name] ||
    headers[String(name || "").toLowerCase()];

  return Array.isArray(value)
    ? String(value[0] || "")
    : String(value || "");
}

function hasValidCronAuthorization(req) {
  const secret = String(
    process.env.CRON_SECRET || ""
  ).trim();
  const submitted = getRequestHeader(
    req,
    "authorization"
  );
  const expected = "Bearer " + secret;
  const submittedBuffer =
    Buffer.from(submitted);
  const expectedBuffer =
    Buffer.from(expected);

  return Boolean(
    secret.length >= 16 &&
      submittedBuffer.length ===
        expectedBuffer.length &&
      crypto.timingSafeEqual(
        submittedBuffer,
        expectedBuffer
      )
  );
}

function getStorageConfig() {
  const url = cleanString(
    process.env.COURSE_MATERIAL_STORAGE_URL,
    1000
  ).replace(/\/+$/, "");
  const secret = cleanString(
    process.env.COURSE_MATERIAL_STORAGE_SECRET,
    500
  ).toLowerCase();

  let parsedUrl = null;

  try {
    parsedUrl = new URL(url);
  } catch (error) {
    parsedUrl = null;
  }

  if (
    !parsedUrl ||
    parsedUrl.protocol !== "https:" ||
    parsedUrl.username ||
    parsedUrl.password ||
    !/^[a-f0-9]{64}$/.test(secret)
  ) {
    throw new Error(
      "Course-material storage is not configured."
    );
  }

  return {
    url: parsedUrl.origin,
    secret
  };
}

function createStorageSignature(secret, parts) {
  return crypto
    .createHmac("sha256", secret)
    .update(parts.join("\n"))
    .digest("hex");
}

async function deleteStorageMaterial(storageKey) {
  const safeStorageKey = cleanString(
    storageKey,
    80
  );

  if (!/^[a-f0-9]{36}$/i.test(safeStorageKey)) {
    return;
  }

  const config = getStorageConfig();
  const expires =
    Math.floor(Date.now() / 1000) + 5 * 60;
  const query = new URLSearchParams({
    key: safeStorageKey,
    expires: String(expires)
  });

  query.set(
    "signature",
    createStorageSignature(
      config.secret,
      [
        "delete",
        safeStorageKey,
        String(expires)
      ]
    )
  );

  const response = await fetch(
    config.url +
      "/file?" +
      query.toString(),
    {
      method: "DELETE",
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(
      "Storage cleanup request failed."
    );
  }
}

function clearActiveAuthorization(
  transaction,
  limitRef
) {
  transaction.set(
    limitRef,
    {
      activeAuthorizationId: "",
      activeAuthorizationExpiresAt: null,
      updatedAt:
        admin.firestore.FieldValue
          .serverTimestamp()
    },
    { merge: true }
  );
}

async function claimAuthorizationCleanup(
  authorizationRef,
  cutoffMs
) {
  const db = admin.firestore();

  return await db.runTransaction(
    async function (transaction) {
      const authorizationDoc =
        await transaction.get(
          authorizationRef
        );

      if (!authorizationDoc.exists) {
        return { status: "missing" };
      }

      const data =
        authorizationDoc.data() || {};
      const expiresAtMs =
        getTimestampMillis(data.expiresAt);

      if (
        !expiresAtMs ||
        expiresAtMs > cutoffMs
      ) {
        return { status: "skipped" };
      }

      const authorizationId =
        authorizationRef.id;
      const uploaderUid = cleanString(
        data.uploaderUid,
        160
      );
      const limitRef = uploaderUid
        ? db
            .collection("materialUploadLimits")
            .doc(uploaderUid)
        : null;
      const limitDoc = limitRef
        ? await transaction.get(limitRef)
        : null;
      const limitData =
        limitDoc && limitDoc.exists
          ? limitDoc.data() || {}
          : {};

      if (data.consumedAt) {
        transaction.delete(authorizationRef);

        if (
          limitRef &&
          cleanString(
            limitData.activeAuthorizationId,
            80
          ) === authorizationId
        ) {
          clearActiveAuthorization(
            transaction,
            limitRef
          );
        }

        return { status: "metadata" };
      }

      transaction.set(
        authorizationRef,
        {
          cleanupStartedAt:
            admin.firestore.FieldValue
              .serverTimestamp()
        },
        { merge: true }
      );

      return {
        status: "claimed",
        authorizationId,
        uploaderUid,
        storageKey: cleanString(
          data.storageKey ||
            authorizationId,
          80
        )
      };
    }
  );
}

async function finalizeAuthorizationCleanup(
  cleanup
) {
  const db = admin.firestore();
  const authorizationRef = db
    .collection("materialUploadAuthorizations")
    .doc(cleanup.authorizationId);
  const limitRef = cleanup.uploaderUid
    ? db
        .collection("materialUploadLimits")
        .doc(cleanup.uploaderUid)
    : null;

  await db.runTransaction(
    async function (transaction) {
      const authorizationDoc =
        await transaction.get(
          authorizationRef
        );
      const limitDoc = limitRef
        ? await transaction.get(limitRef)
        : null;
      const limitData =
        limitDoc && limitDoc.exists
          ? limitDoc.data() || {}
          : {};

      if (authorizationDoc.exists) {
        transaction.delete(authorizationRef);
      }

      if (
        limitRef &&
        cleanString(
          limitData.activeAuthorizationId,
          80
        ) === cleanup.authorizationId
      ) {
        clearActiveAuthorization(
          transaction,
          limitRef
        );
      }
    }
  );
}

async function cleanupAuthorizationDocument(
  authorizationRef,
  cutoffMs
) {
  const cleanup =
    await claimAuthorizationCleanup(
      authorizationRef,
      cutoffMs
    );

  if (cleanup.status !== "claimed") {
    return cleanup.status;
  }

  await deleteStorageMaterial(
    cleanup.storageKey
  );

  await finalizeAuthorizationCleanup(
    cleanup
  );

  return "file";
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!hasValidCronAuthorization(req)) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  try {
    const cutoffMs =
      Date.now() - CLEANUP_GRACE_MS;
    const cutoff =
      admin.firestore.Timestamp.fromDate(
        new Date(cutoffMs)
      );
    const snapshot =
      await admin.firestore()
        .collection(
          "materialUploadAuthorizations"
        )
        .where("expiresAt", "<=", cutoff)
        .orderBy("expiresAt", "asc")
        .limit(CLEANUP_BATCH_SIZE)
        .get();
    const documents = snapshot.docs;
    const state = {
      nextIndex: 0,
      filesDeleted: 0,
      metadataRemoved: 0,
      skipped: 0,
      failed: 0
    };

    async function runWorker() {
      while (state.nextIndex < documents.length) {
        const index = state.nextIndex;

        state.nextIndex += 1;

        try {
          const result =
            await cleanupAuthorizationDocument(
              documents[index].ref,
              cutoffMs
            );

          if (result === "file") {
            state.filesDeleted += 1;
          } else if (result === "metadata") {
            state.metadataRemoved += 1;
          } else {
            state.skipped += 1;
          }
        } catch (error) {
          state.failed += 1;
        }
      }
    }

    const workerCount = Math.min(
      CLEANUP_CONCURRENCY,
      documents.length
    );
    const workers = [];

    for (
      let index = 0;
      index < workerCount;
      index += 1
    ) {
      workers.push(runWorker());
    }

    await Promise.all(workers);

    return res.status(200).json({
      success: true,
      scanned: documents.length,
      filesDeleted: state.filesDeleted,
      metadataRemoved:
        state.metadataRemoved,
      skipped: state.skipped,
      failed: state.failed
    });
  } catch (error) {
    return res.status(500).json({
      error: "Material cleanup failed."
    });
  }
};
