const crypto = require("crypto");
const admin = require(
  "../server/_lib/firebaseAdmin"
);

const {
  getOptionalSiteSessionUser,
  getSiteSessionUser
} = require(
  "../server/_lib/securityHelpers"
);
const {
  isAdminUid
} = require(
  "../server/_lib/adminHelpers"
);
const {
  consumeSecurityRateLimit
} = require(
  "../server/_lib/securityRateLimits"
);

const FORUM_CATEGORIES = [
  "Academics & Courses",
  "Registration & Professors",
  "Campus Life",
  "Clubs & Events",
  "Opportunities",
  "Buy, Sell & Exchange",
  "Housing & Transportation",
  "Technology & Gaming",
  "General Discussion"
];

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function cleanForumString(
  value,
  maxLength
) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function createForumError(
  message,
  statusCode
) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function moderateForumContent(parts) {
  const apiKey = String(
    process.env.OPENAI_API_KEY || ""
  ).trim();

  if (!apiKey) {
    console.error(
      "Forum moderation configuration error: OPENAI_API_KEY is unavailable in this deployment."
    );

    throw createForumError(
      "Forum moderation is missing its API key on this deployment.",
      503
    );
  }

  const input = (
    Array.isArray(parts)
      ? parts
      : [parts]
  )
    .map(function (part) {
      return String(part || "").trim();
    })
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 7000);

  if (!input) {
    return;
  }

  const controller =
    new AbortController();

  const timeoutId = setTimeout(
    function () {
      controller.abort();
    },
    10000
  );

  let response;

  try {
    response = await fetch(
      "https://api.openai.com/v1/moderations",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bearer " + apiKey,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          model:
            "omni-moderation-latest",
          input
        }),
        signal: controller.signal
      }
    );
  } catch (error) {
    console.error(
      "Forum moderation network error:",
      error && error.name
        ? error.name
        : "unknown-error"
    );

    throw createForumError(
      "Forum moderation could not reach OpenAI.",
      503
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    console.error(
      "Forum moderation returned invalid JSON:",
      response.status
    );

    throw createForumError(
      "OpenAI moderation returned an invalid response.",
      503
    );
  }

  if (!response.ok) {
    const apiError =
      data && data.error
        ? data.error
        : {};

    console.error(
      "Forum moderation request failed:",
      response.status,
      apiError.type || "api-error",
      apiError.code || "no-code"
    );

    let publicMessage =
      "OpenAI moderation returned HTTP " +
      response.status +
      ".";

    if (response.status === 401) {
      publicMessage =
        "OpenAI rejected the moderation API key.";
    } else if (response.status === 403) {
      publicMessage =
        "The OpenAI API key does not have moderation permission.";
    } else if (response.status === 429) {
      publicMessage =
        "The OpenAI moderation rate limit was reached.";
    }

    throw createForumError(
      publicMessage,
      503
    );
  }

  const result =
    data &&
    Array.isArray(data.results)
      ? data.results[0]
      : null;

  if (
    !result ||
    typeof result.flagged !== "boolean"
  ) {
    console.error(
      "Forum moderation response did not contain results[0].flagged."
    );

    throw createForumError(
      "OpenAI moderation returned an incomplete response.",
      503
    );
  }

  if (result.flagged) {
    throw createForumError(
      "This content cannot be published because it may violate the community rules.",
      422
    );
  }
}

function getTimestampMillis(value) {
  if (!value) return 0;

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  if (
    typeof value._seconds === "number"
  ) {
    return value._seconds * 1000;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? 0
    : parsed.getTime();
}

function getStoredDate(value, fallback) {
  const millis =
    getTimestampMillis(value);

  if (millis) {
    return new Date(millis)
      .toISOString();
  }

  if (!fallback) {
    return "";
  }

  const fallbackDate =
    new Date(fallback);

  return Number.isNaN(
    fallbackDate.getTime()
  )
    ? ""
    : fallbackDate.toISOString();
}

function getForumBody(req) {
  if (
    req.body &&
    typeof req.body === "object"
  ) {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw createForumError(
        "The request body is invalid.",
        400
      );
    }
  }

  return {};
}

function cleanForumId(value) {
  const id = cleanForumString(
    value,
    160
  );

  if (
    !id ||
    !/^[A-Za-z0-9_-]+$/.test(id)
  ) {
    throw createForumError(
      "Discussion not found.",
      404
    );
  }

  return id;
}

function getVoteKey(
  targetType,
  postId,
  replyId
) {
  return [
    targetType,
    postId,
    replyId || ""
  ].join(":");
}

function getVoteDocumentId(
  uid,
  targetType,
  postId,
  replyId
) {
  return crypto
    .createHash("sha256")
    .update(
      [
        uid,
        targetType,
        postId,
        replyId || ""
      ].join(":")
    )
    .digest("hex");
}

async function getForumActor(
  req,
  required
) {
  const decodedUser = required
    ? await getSiteSessionUser(req, {
        checkRevoked: true
      })
    : await getOptionalSiteSessionUser(
        req,
        {
          checkRevoked: true
        }
      );

  if (!decodedUser) {
    return null;
  }

  const userRef = admin.firestore()
    .collection("users")
    .doc(decodedUser.uid);

  const results = await Promise.all([
    admin.auth().getUser(
      decodedUser.uid
    ),
    userRef.get(),
    isAdminUid(decodedUser.uid)
  ]);

  const userRecord = results[0];
  const userDoc = results[1];
  const userData = userDoc.exists
    ? userDoc.data() || {}
    : {};

  const displayName =
    cleanForumString(
      userData.fullName ||
        userRecord.displayName ||
        userRecord.email ||
        decodedUser.email ||
        "AUC student",
      80
    );

  return {
    uid: decodedUser.uid,
    displayName,
    isAdmin: Boolean(results[2])
  };
}

async function consumeForumLimit(
  actor,
  action,
  maxAttempts,
  windowMs
) {
  await consumeSecurityRateLimit({
    scope: "forum-" + action,
    identifier: actor.uid,
    maxAttempts,
    windowMs,
    message:
      "Too many forum actions. Please try again later."
  });
}

async function getForumVoteMap(actor) {
  const voteMap = new Map();

  if (!actor) {
    return voteMap;
  }

  const snapshot = await admin.firestore()
    .collection("forumVotes")
    .where(
      "userUid",
      "==",
      actor.uid
    )
    .limit(1000)
    .get();

  snapshot.forEach(function (doc) {
    const data = doc.data() || {};
    const value =
      Number(data.value || 0);

    if (value !== 1 && value !== -1) {
      return;
    }

    voteMap.set(
      getVoteKey(
        cleanForumString(
          data.targetType,
          20
        ),
        cleanForumString(
          data.postId,
          160
        ),
        cleanForumString(
          data.replyId,
          160
        )
      ),
      value
    );
  });

  return voteMap;
}

async function getForumPosts(
  actor,
  requestedPostIdValue
) {
  const db = admin.firestore();
  let requestedPostId = "";

  if (requestedPostIdValue) {
    try {
      requestedPostId = cleanForumId(
        requestedPostIdValue
      );
    } catch (error) {}
  }

  const results = await Promise.all([
    db.collection("forumPosts")
      .orderBy("createdAt", "desc")
      .limit(75)
      .get(),
    getForumVoteMap(actor),
    requestedPostId
      ? db.collection("forumPosts")
          .doc(requestedPostId)
          .get()
      : Promise.resolve(null)
  ]);

  const postSnapshot = results[0];
  const voteMap = results[1];
  const requestedPostDoc = results[2];
  const postDocs =
    postSnapshot.docs.slice();

  if (
    requestedPostDoc &&
    requestedPostDoc.exists &&
    !postDocs.some(function (postDoc) {
      return (
        postDoc.id ===
        requestedPostDoc.id
      );
    })
  ) {
    postDocs.push(requestedPostDoc);
  }

  return Promise.all(
    postDocs.map(
      async function (postDoc) {
        const postData =
          postDoc.data() || {};

        const replySnapshot =
          await postDoc.ref
            .collection("replies")
            .orderBy(
              "createdAt",
              "asc"
            )
            .limit(300)
            .get();

        const canManage = Boolean(
          actor &&
          (
            actor.isAdmin ||
            actor.uid ===
              cleanForumString(
                postData.authorUid,
                160
              )
          )
        );

        const replies =
          replySnapshot.docs.map(
            function (replyDoc) {
              const replyData =
                replyDoc.data() || {};

              const replyVote =
                voteMap.get(
                  getVoteKey(
                    "reply",
                    postDoc.id,
                    replyDoc.id
                  )
                ) || 0;

              return {
                id: replyDoc.id,
                parentId:
                  cleanForumString(
                    replyData.parentId,
                    160
                  ),
                author:
                  cleanForumString(
                    replyData.authorName ||
                      "AUC student",
                    80
                  ),
                body:
                  cleanForumString(
                    replyData.body,
                    2000
                  ),
                createdAt:
                  getStoredDate(
                    replyData.createdAt,
                    replyData.createdAtIso
                  ),
                likes: Number(
                  replyData.score || 0
                ),
                liked:
                  replyVote === 1,
                userVote: replyVote
              };
            }
          );

        const postVote =
          voteMap.get(
            getVoteKey(
              "post",
              postDoc.id,
              ""
            )
          ) || 0;

        return {
          id: postDoc.id,
          category:
            cleanForumString(
              postData.category,
              80
            ),
          tag: cleanForumString(
            postData.tag,
            28
          ),
          title: cleanForumString(
            postData.title,
            120
          ),
          body: cleanForumString(
            postData.body,
            4000
          ),
          author:
            cleanForumString(
              postData.authorName ||
                "AUC student",
              80
            ),
          createdAt:
            getStoredDate(
              postData.createdAt,
              postData.createdAtIso
            ),
          likes: Number(
            postData.score || 0
          ),
          liked: postVote === 1,
          userVote: postVote,
          views: Number(
            postData.viewCount || 0
          ),
          pinned:
            Boolean(postData.pinned),
          solved:
            Boolean(postData.solved),
          canManage,
          replies
        };
      }
    )
  );
}

async function createForumPost(
  actor,
  body
) {
  await consumeForumLimit(
    actor,
    "create-post",
    10,
    60 * 60 * 1000
  );

  const category =
    cleanForumString(
      body.category,
      80
    );
  const title = cleanForumString(
    body.title,
    120
  );
  const postBody =
    cleanForumString(
      body.body,
      4000
    );
  const tag = cleanForumString(
    body.tag,
    28
  );
  const anonymous =
    body.anonymous === true;

  if (
    !FORUM_CATEGORIES.includes(
      category
    )
  ) {
    throw createForumError(
      "Choose a valid forum category.",
      400
    );
  }

  if (!title || !postBody) {
    throw createForumError(
      "Enter a title and post body.",
      400
    );
  }

  await moderateForumContent([
    "Forum post title:\n" + title,
    tag
      ? "Forum post tag:\n" + tag
      : "",
    "Forum post body:\n" + postBody
  ]);

  const postRef = admin.firestore()
    .collection("forumPosts")
    .doc();

  const createdAtIso =
    new Date().toISOString();

  await postRef.set({
    category,
    tag,
    title,
    body: postBody,
    authorUid: actor.uid,
    authorName: anonymous
      ? "Anonymous"
      : actor.displayName,
    anonymous,
    createdAt:
      admin.firestore.FieldValue
        .serverTimestamp(),
    createdAtIso,
    score: 0,
    replyCount: 0,
    viewCount: 0,
    pinned: false,
    solved: false
  });

  return postRef.id;
}

async function createForumReply(
  actor,
  body
) {
  await consumeForumLimit(
    actor,
    "create-reply",
    60,
    60 * 60 * 1000
  );

  const postId = cleanForumId(
    body.postId
  );
  const parentId =
    cleanForumString(
      body.parentId,
      160
    );
  const replyBody =
    cleanForumString(
      body.body,
      2000
    );

  if (!replyBody) {
    throw createForumError(
      "Enter a reply.",
      400
    );
  }

  await moderateForumContent([
    "Forum reply:\n" + replyBody
  ]);

  const db = admin.firestore();

  const postRef = db
    .collection("forumPosts")
    .doc(postId);

  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    throw createForumError(
      "Discussion not found.",
      404
    );
  }

  if (parentId) {
    const parentDoc = await postRef
      .collection("replies")
      .doc(cleanForumId(parentId))
      .get();

    if (!parentDoc.exists) {
      throw createForumError(
        "The comment you are replying to no longer exists.",
        404
      );
    }
  }

  const replyRef = postRef
    .collection("replies")
    .doc();

  const batch = db.batch();

  batch.set(replyRef, {
    parentId,
    body: replyBody,
    authorUid: actor.uid,
    authorName: actor.displayName,
    createdAt:
      admin.firestore.FieldValue
        .serverTimestamp(),
    createdAtIso:
      new Date().toISOString(),
    score: 0
  });

  batch.update(postRef, {
    replyCount:
      admin.firestore.FieldValue
        .increment(1)
  });

  await batch.commit();

  return replyRef.id;
}

async function voteForumTarget(
  actor,
  body,
  targetType
) {
  await consumeForumLimit(
    actor,
    "vote",
    300,
    60 * 60 * 1000
  );

  const postId = cleanForumId(
    body.postId
  );

  const replyId =
    targetType === "reply"
      ? cleanForumId(body.replyId)
      : "";

  const requestedVote =
    Number(body.direction) === -1
      ? -1
      : 1;

  const db = admin.firestore();

  const postRef = db
    .collection("forumPosts")
    .doc(postId);

  const targetRef =
    targetType === "reply"
      ? postRef
          .collection("replies")
          .doc(replyId)
      : postRef;

  const voteRef = db
    .collection("forumVotes")
    .doc(
      getVoteDocumentId(
        actor.uid,
        targetType,
        postId,
        replyId
      )
    );

  return db.runTransaction(
    async function (transaction) {
      const targetDoc =
        await transaction.get(
          targetRef
        );

      const voteDoc =
        await transaction.get(
          voteRef
        );

      if (!targetDoc.exists) {
        throw createForumError(
          targetType === "reply"
            ? "Comment not found."
            : "Discussion not found.",
          404
        );
      }

      const currentVote =
        voteDoc.exists
          ? Number(
              (
                voteDoc.data() || {}
              ).value || 0
            )
          : 0;

      const nextVote =
        currentVote ===
          requestedVote
          ? 0
          : requestedVote;

      const difference =
        nextVote - currentVote;

      if (nextVote) {
        transaction.set(
          voteRef,
          {
            userUid: actor.uid,
            targetType,
            postId,
            replyId,
            value: nextVote,
            updatedAt:
              admin.firestore
                .FieldValue
                .serverTimestamp()
          }
        );
      } else {
        transaction.delete(voteRef);
      }

      transaction.update(
        targetRef,
        {
          score:
            admin.firestore
              .FieldValue
              .increment(difference)
        }
      );

      return nextVote;
    }
  );
}

async function getManageablePost(
  actor,
  postIdValue
) {
  const postId = cleanForumId(
    postIdValue
  );

  const postRef = admin.firestore()
    .collection("forumPosts")
    .doc(postId);

  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    throw createForumError(
      "Discussion not found.",
      404
    );
  }

  const postData =
    postDoc.data() || {};

  if (
    !actor.isAdmin &&
    cleanForumString(
      postData.authorUid,
      160
    ) !== actor.uid
  ) {
    throw createForumError(
      "You cannot change this discussion.",
      403
    );
  }

  return {
    id: postId,
    ref: postRef,
    data: postData
  };
}

async function toggleForumSolved(
  actor,
  body
) {
  const post =
    await getManageablePost(
      actor,
      body.postId
    );

  const solved = !Boolean(
    post.data.solved
  );

  await post.ref.update({ solved });

  return solved;
}

async function deleteForumPost(
  actor,
  body
) {
  const post =
    await getManageablePost(
      actor,
      body.postId
    );

  const db = admin.firestore();

  const voteSnapshot = await db
    .collection("forumVotes")
    .where(
      "postId",
      "==",
      post.id
    )
    .limit(1000)
    .get();

  const batch = db.batch();

  voteSnapshot.docs.forEach(
    function (voteDoc) {
      batch.delete(voteDoc.ref);
    }
  );

  if (!voteSnapshot.empty) {
    await batch.commit();
  }

  await db.recursiveDelete(post.ref);
}

async function incrementForumView(
  postIdValue
) {
  if (!postIdValue) return;

  let postId;

  try {
    postId = cleanForumId(
      postIdValue
    );
  } catch (error) {
    return;
  }

  await admin.firestore()
    .collection("forumPosts")
    .doc(postId)
    .update({
      viewCount:
        admin.firestore.FieldValue
          .increment(1)
    })
    .catch(function () {});
}

function renderForumPage(actor) {
  const forumUser = safeJson({
    uid: actor ? actor.uid : "",
    displayName: actor
      ? actor.displayName
      : "",
    isAdmin: Boolean(
      actor && actor.isAdmin
    )
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
  <title>Community Forum | AUC Atlas</title>
  <link
    rel="icon"
    type="image/svg+xml"
    href="/favicon.svg"
  >

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      background: #f7f4ee;
      color: #171717;
    }

    body.modal-open {
      overflow: hidden;
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    [hidden] {
      display: none !important;
    }

    .forum-page {
      min-height: 100vh;
      padding: 132px 0 92px;
      background:
        linear-gradient(
          180deg,
          rgba(192, 154, 92, 0.14),
          rgba(247, 244, 238, 0) 380px
        ),
        #f7f4ee;
    }

    .forum-inner {
      width: min(1360px, calc(100% - 32px));
      margin: 0 auto;
    }

    .forum-hero {
      margin: 0 auto 28px;
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        minmax(310px, 440px);
      gap: 34px;
      align-items: end;
    }

    .forum-kicker,
    .panel-kicker {
      margin-bottom: 12px;
      color: rgba(192, 154, 92, 0.94);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      line-height: 1.4;
      text-transform: uppercase;
    }

    .forum-hero h1 {
      max-width: 760px;
      color: #171717;
      font-size: clamp(36px, 5vw, 66px);
      font-weight: 600;
      line-height: 1.03;
      text-transform: uppercase;
    }

    .forum-hero-side {
      display: grid;
      justify-items: end;
      gap: 18px;
    }

    .forum-hero-copy {
      color: rgba(23, 23, 23, 0.66);
      font-size: 16px;
      line-height: 1.65;
      text-align: right;
    }

    .primary-button,
    .secondary-button,
    .text-button {
      min-height: 48px;
      padding: 0 20px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition:
        transform 0.18s ease,
        background 0.18s ease,
        border-color 0.18s ease;
    }

    .primary-button {
      border: 1px solid
        rgba(192, 154, 92, 0.9);
      background: rgba(192, 154, 92, 0.9);
      color: #fff;
    }

    .primary-button:hover,
    .primary-button:focus-visible {
      border-color: #171717;
      background: #171717;
      transform: translateY(-1px);
    }

    .secondary-button,
    .text-button {
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.74);
      color: rgba(23, 23, 23, 0.68);
    }

    .secondary-button:hover,
    .text-button:hover {
      border-color: rgba(192, 154, 92, 0.34);
      color: #171717;
    }

    .forum-demo-notice {
      min-height: 62px;
      margin-bottom: 20px;
      padding: 10px 12px 10px 22px;
      border: 1px solid
        rgba(192, 154, 92, 0.28);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.72);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }

    .forum-demo-notice p {
      color: rgba(23, 23, 23, 0.62);
      font-size: 13px;
      line-height: 1.5;
    }

    .forum-demo-notice strong {
      color: #171717;
    }

    .admin-preview-badge,
    .post-badge,
    .post-stat,
    .detail-author-badge {
      padding: 7px 10px;
      border: 1px solid
        rgba(23, 23, 23, 0.08);
      border-radius: 999px;
      background: rgba(247, 244, 238, 0.82);
      color: rgba(23, 23, 23, 0.62);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .admin-preview-badge,
    .post-badge.is-gold,
    .detail-author-badge {
      border-color: rgba(192, 154, 92, 0.28);
      background: rgba(192, 154, 92, 0.13);
      color: rgba(126, 86, 26, 0.96);
    }

    .forum-layout {
      display: grid;
      grid-template-columns:
        236px
        minmax(0, 1fr)
        270px;
      gap: 20px;
      align-items: start;
    }

    .forum-panel,
    .forum-toolbar,
    .post-card,
    .forum-empty {
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.76);
      box-shadow:
        0 22px 60px
        rgba(42, 32, 20, 0.09);
    }

    .forum-panel {
      padding: 14px;
      border-radius: 26px;
    }

    .forum-panel.is-sticky {
      position: sticky;
      top: 112px;
    }

    .forum-panel h2 {
      padding: 10px 12px 12px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .category-list {
      display: grid;
      gap: 5px;
    }

    .category-button {
      width: 100%;
      min-height: 44px;
      padding: 0 12px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: rgba(23, 23, 23, 0.62);
      font-size: 11px;
      font-weight: 700;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .category-button:hover,
    .category-button.active {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .category-count {
      min-width: 24px;
      color: rgba(23, 23, 23, 0.46);
      font-size: 10px;
      text-align: right;
    }

    .forum-feed {
      min-width: 0;
    }

    .forum-toolbar {
      margin-bottom: 14px;
      padding: 10px;
      border-radius: 26px;
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        180px;
      gap: 10px;
    }

    .forum-toolbar input,
    .forum-toolbar select,
    .form-field input,
    .form-field select,
    .form-field textarea,
    .reply-form textarea {
      width: 100%;
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      border-radius: 18px;
      background: rgba(247, 244, 238, 0.72);
      color: #171717;
      outline: none;
    }

    .forum-toolbar input,
    .forum-toolbar select,
    .form-field input,
    .form-field select {
      min-height: 48px;
      padding: 0 16px;
    }

    .forum-toolbar input:focus,
    .forum-toolbar select:focus,
    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus,
    .reply-form textarea:focus {
      border-color:
        rgba(192, 154, 92, 0.58);
      box-shadow:
        0 0 0 4px
        rgba(192, 154, 92, 0.12);
    }

    .feed-summary {
      margin: 0 0 12px;
      padding: 0 4px;
      color: rgba(23, 23, 23, 0.52);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .post-list {
      display: grid;
      gap: 14px;
    }

    .post-card {
      padding: 0;
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.82);
      box-shadow:
        0 12px 34px
        rgba(42, 32, 20, 0.07);
      overflow: hidden;
      transition:
        transform 0.18s ease,
        background 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease;
    }

    .post-card:hover {
      border-color:
        rgba(192, 154, 92, 0.3);
      background: rgba(255, 255, 255, 0.96);
      box-shadow:
        0 16px 40px
        rgba(42, 32, 20, 0.1);
      transform: translateY(-2px);
    }

    .post-card-link {
      min-width: 0;
      padding: 22px 24px 20px;
      color: inherit;
      text-decoration: none;
      display: block;
    }

    .post-card-link:focus-visible {
      outline: 2px solid
        rgba(192, 154, 92, 0.82);
      outline-offset: -2px;
    }

    .post-card-meta {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .post-avatar {
      width: 24px;
      height: 24px;
      border: 1px solid
        rgba(192, 154, 92, 0.22);
      border-radius: 50%;
      background:
        linear-gradient(
          135deg,
          #fff,
          rgba(192, 154, 92, 0.16)
        );
      color: rgba(192, 154, 92, 0.98);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: -0.02em;
      flex: 0 0 auto;
      display: grid;
      place-items: center;
    }

    .post-card-community,
    .post-card-time {
      font-size: 11px;
      line-height: 1;
    }

    .post-card-community {
      color: #171717;
      font-weight: 700;
    }

    .post-card-time {
      color: rgba(23, 23, 23, 0.52);
      font-weight: 500;
    }

    .post-card-title {
      margin: 10px 0 7px;
      color: #171717;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .post-preview {
      margin: 0;
      color: rgba(23, 23, 23, 0.78);
      font-size: 13px;
      line-height: 1.45;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .post-card-counts {
      margin-top: 10px;
      color: rgba(23, 23, 23, 0.52);
      font-size: 11px;
      line-height: 1.2;
    }

    .post-meta,
    .post-badges,
    .post-actions,
    .detail-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .post-author,
    .post-time {
      color: rgba(23, 23, 23, 0.5);
      font-size: 11px;
      font-weight: 700;
    }

    .like-button {
      min-height: 36px;
      padding: 0 12px;
      border: 1px solid
        rgba(23, 23, 23, 0.08);
      border-radius: 999px;
      background: rgba(247, 244, 238, 0.76);
      color: rgba(23, 23, 23, 0.6);
      font-size: 10px;
      font-weight: 800;
    }

    .like-button.active {
      border-color: rgba(192, 154, 92, 0.32);
      background: rgba(192, 154, 92, 0.14);
      color: rgba(126, 86, 26, 0.98);
    }

    .forum-empty {
      padding: 34px;
      border-radius: 24px;
      text-align: center;
    }

    .forum-empty h3 {
      margin-bottom: 8px;
      font-size: 20px;
    }

    .forum-empty p,
    .side-copy,
    .rule-list,
    .trend-item p {
      color: rgba(23, 23, 23, 0.62);
      font-size: 13px;
      line-height: 1.65;
    }

    .side-section + .side-section {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid
        rgba(23, 23, 23, 0.08);
    }

    .side-section h3 {
      margin-bottom: 10px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .rule-list {
      padding-left: 18px;
      display: grid;
      gap: 7px;
    }

    .trending-list {
      display: grid;
      gap: 9px;
    }

    .trend-item {
      width: 100%;
      padding: 12px;
      border: 0;
      border-radius: 16px;
      background: rgba(247, 244, 238, 0.72);
      text-align: left;
    }

    .trend-item strong {
      font-size: 12px;
      line-height: 1.4;
      display: block;
    }

    .text-button {
      margin-top: 12px;
    }

    .forum-page-view[hidden] {
      display: none !important;
    }

    .forum-page-inner,
    .discussion-shell {
      width: min(1080px, calc(100% - 32px));
      margin: 0 auto;
    }

    .forum-back-link {
      min-height: 42px;
      margin-bottom: 16px;
      padding: 0 14px;
      border-radius: 999px;
      color: rgba(23, 23, 23, 0.62);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-decoration: none;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .forum-back-link:hover {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .forum-page-card,
    .discussion-main {
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      border-radius: 26px;
      background: rgba(255, 255, 255, 0.78);
      box-shadow:
        0 24px 70px
        rgba(42, 32, 20, 0.1);
    }

    .forum-page-card {
      padding: 30px;
    }

    .forum-page-header {
      margin-bottom: 24px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
    }

    .forum-page-header h1 {
      font-size: clamp(30px, 4vw, 46px);
      line-height: 1.06;
      text-transform: uppercase;
    }

    .discussion-layout {
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        286px;
      gap: 20px;
      align-items: start;
    }

    .discussion-main {
      min-width: 0;
      padding: 28px;
    }

    .discussion-sidebar {
      position: sticky;
      top: 112px;
    }

    .discussion-sidebar .forum-panel {
      box-shadow:
        0 22px 60px
        rgba(42, 32, 20, 0.09);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-field {
      display: grid;
      gap: 8px;
    }

    .form-field.is-full {
      grid-column: 1 / -1;
    }

    .form-field label,
    .reply-form label {
      color: rgba(23, 23, 23, 0.62);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .form-field textarea,
    .reply-form textarea {
      min-height: 170px;
      padding: 15px 16px;
      resize: vertical;
      line-height: 1.55;
    }

    .checkbox-row {
      min-height: 46px;
      padding: 0 4px;
      color: rgba(23, 23, 23, 0.66);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .checkbox-row input {
      width: 18px;
      height: 18px;
      accent-color: rgba(192, 154, 92, 0.94);
    }

    .form-note {
      margin-top: 14px;
      padding: 14px 16px;
      border-radius: 18px;
      background: rgba(192, 154, 92, 0.11);
      color: rgba(23, 23, 23, 0.64);
      font-size: 12px;
      line-height: 1.6;
    }

    .form-actions {
      margin-top: 18px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
    }

    .detail-heading {
      margin: 14px 0 12px;
      font-size: clamp(26px, 4vw, 40px);
      line-height: 1.12;
    }

    .detail-copy {
      margin: 20px 0;
      color: rgba(23, 23, 23, 0.72);
      font-size: 15px;
      line-height: 1.75;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .reply-section {
      margin-top: 26px;
      padding-top: 22px;
      border-top: 1px solid
        rgba(23, 23, 23, 0.1);
    }

    .reply-section-heading {
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .reply-section-heading h3 {
      margin: 0;
      font-size: 18px;
    }

    .reply-list {
      display: grid;
      gap: 10px;
    }

    .reply-card {
      position: relative;
      padding: 14px 14px 14px 18px;
      border-left: 2px solid
        rgba(192, 154, 92, 0.28);
      border-radius: 0 16px 16px 0;
      background: rgba(255, 255, 255, 0.56);
    }

    .reply-card.is-collapsed {
      padding: 8px 12px;
      border-left-color:
        rgba(23, 23, 23, 0.16);
    }

    .reply-card-header {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .reply-collapse-button {
      width: 24px;
      height: 24px;
      border: 0;
      border-radius: 7px;
      background: rgba(247, 244, 238, 0.88);
      color: rgba(23, 23, 23, 0.52);
      font-size: 12px;
      font-weight: 900;
      display: grid;
      place-items: center;
    }

    .reply-card strong {
      font-size: 12px;
    }

    .reply-card time {
      color: rgba(23, 23, 23, 0.46);
      font-size: 10px;
    }

    .reply-card-body {
      color: rgba(23, 23, 23, 0.68);
      font-size: 13px;
      line-height: 1.65;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .reply-card-actions {
      margin-top: 9px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .reply-action-button,
    .reply-children-toggle {
      min-height: 32px;
      padding: 0 10px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: rgba(23, 23, 23, 0.52);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .reply-action-button:hover,
    .reply-action-button.active,
    .reply-children-toggle:hover {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .reply-children-toggle {
      margin-top: 8px;
      color: rgba(126, 86, 26, 0.96);
    }

    .reply-children {
      margin-top: 10px;
      margin-left: 10px;
      padding-left: 10px;
      border-left: 1px solid
        rgba(23, 23, 23, 0.1);
      display: grid;
      gap: 8px;
    }

    .nested-reply-form {
      margin-top: 10px;
      padding: 12px;
      border-radius: 14px;
      background: rgba(247, 244, 238, 0.72);
      display: grid;
      gap: 8px;
    }

    .nested-reply-form textarea {
      width: 100%;
      min-height: 86px;
      padding: 12px;
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.82);
      color: #171717;
      line-height: 1.55;
      resize: vertical;
      outline: none;
    }

    .reply-form {
      margin-top: 16px;
      display: grid;
      gap: 10px;
    }

    .reply-form textarea {
      min-height: 110px;
    }

    .danger-button {
      color: #ad2525;
    }

    .toast {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 3000;
      max-width: min(380px, calc(100% - 48px));
      padding: 15px 18px;
      border: 1px solid
        rgba(23, 23, 23, 0.1);
      border-radius: 18px;
      background: #171717;
      box-shadow:
        0 24px 60px
        rgba(23, 23, 23, 0.26);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
    }

    @media (max-width: 1080px) {
      .forum-layout {
        grid-template-columns:
          220px
          minmax(0, 1fr);
      }

      .forum-right {
        grid-column: 1 / -1;
      }

      .forum-right .forum-panel {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .forum-right
      .side-section + .side-section {
        margin: 0;
        padding: 0;
        border: 0;
      }
    }

    @media (max-width: 760px) {
      .forum-page {
        padding-top: 112px;
      }

      .forum-hero,
      .forum-layout,
      .forum-toolbar,
      .form-grid,
      .forum-right .forum-panel {
        grid-template-columns: 1fr;
      }

      .forum-hero-side {
        justify-items: start;
      }

      .forum-hero-copy {
        text-align: left;
      }

      .forum-demo-notice {
        padding: 16px;
        border-radius: 22px;
        align-items: flex-start;
        flex-direction: column;
      }

      .forum-panel.is-sticky {
        position: static;
      }

      .category-list {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

      .category-button {
        border-radius: 16px;
      }

      .form-field.is-full {
        grid-column: auto;
      }

      .discussion-layout {
        grid-template-columns: 1fr;
      }

      .discussion-sidebar {
        position: static;
      }

      .forum-page-card,
      .discussion-main {
        padding: 22px;
        border-radius: 22px;
      }
    }

    @media (max-width: 470px) {
      .category-list {
        grid-template-columns: 1fr;
      }

      .post-card-footer {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div id="site-header-root"></div>

  <main
    class="forum-page"
    id="forum-feed-view"
  >
    <div class="forum-inner">
      <section class="forum-hero">
        <div>
          <p class="forum-kicker">
            Student community
          </p>
          <h1>AUC Atlas Community</h1>
        </div>

        <div class="forum-hero-side">
          <p class="forum-hero-copy">
            Ask questions, share experiences,
            discuss campus life, and connect
            with the AUC community.
          </p>

          <a
            class="primary-button"
            href="/forum?compose=1"
          >
            Create Post
          </a>
        </div>
      </section>

      <div class="forum-layout">
        <aside>
          <section class="forum-panel is-sticky">
            <h2>Categories</h2>
            <div
              class="category-list"
              id="category-list"
            ></div>
          </section>
        </aside>

        <section
          class="forum-feed"
          aria-label="Community posts"
        >
          <div class="forum-toolbar">
            <input
              id="forum-search"
              type="search"
              placeholder="Search discussions"
              aria-label="Search discussions"
            >

            <select
              id="forum-sort"
              aria-label="Sort discussions"
            >
              <option value="latest">
                Latest
              </option>
              <option value="popular">
                Popular
              </option>
              <option value="unanswered">
                Unanswered
              </option>
            </select>
          </div>

          <p
            class="feed-summary"
            id="feed-summary"
          ></p>

          <div
            class="post-list"
            id="post-list"
          ></div>
        </section>

        <aside class="forum-right">
          <section class="forum-panel is-sticky">
            <div class="side-section">
              <h3>Community rules</h3>
              <ol class="rule-list">
                <li>
                  Be respectful and helpful.
                </li>
                <li>
                  Do not expose private
                  information.
                </li>
                <li>
                  No cheating, scams,
                  harassment, or spam.
                </li>
                <li>
                  Use the closest matching
                  category.
                </li>
              </ol>
            </div>

            <div class="side-section">
              <h3>Trending now</h3>

              <div
                class="trending-list"
                id="trending-list"
              ></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </main>

  <main
    class="forum-page forum-page-view"
    id="composer-page"
    hidden
  >
    <div class="forum-page-inner">
      <a
        class="forum-back-link"
        href="/forum"
      >
        &larr; Back to Community
      </a>

      <section
        class="forum-page-card"
        aria-labelledby="composer-title"
      >
        <header class="forum-page-header">
          <div>
            <p class="panel-kicker">
              New discussion
            </p>
            <h1 id="composer-title">
              Create a post
            </h1>
          </div>
        </header>

        <form id="composer-form">
          <div class="form-grid">
            <div class="form-field">
              <label for="post-category">
                Category
              </label>
              <select
                id="post-category"
                required
              ></select>
            </div>

            <div class="form-field">
              <label for="post-tag">
                Optional tag
              </label>
              <input
                id="post-tag"
                maxlength="28"
                placeholder="Example: CSCE 1101"
              >
            </div>

            <div class="form-field is-full">
              <label for="post-title">
                Title
              </label>
              <input
                id="post-title"
                maxlength="120"
                required
                placeholder="What would you like to discuss?"
              >
            </div>

            <div class="form-field is-full">
              <label for="post-body">
                Post
              </label>
              <textarea
                id="post-body"
                maxlength="4000"
                required
                placeholder="Share enough context for other students to respond."
              ></textarea>
            </div>

            <label class="checkbox-row is-full">
              <input
                id="post-anonymous"
                type="checkbox"
              >
              Post anonymously
            </label>
          </div>

          <p class="form-note">
            Anonymous posts hide your name from
            the community but remain linked to
            your account for moderation.
          </p>

          <div class="form-actions">
            <a
              class="secondary-button"
              href="/forum"
            >
              Cancel
            </a>

            <button
              class="primary-button"
              type="submit"
            >
              Publish Post
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>

  <main
    class="forum-page forum-page-view"
    id="discussion-page"
    hidden
  >
    <div class="discussion-shell">
      <a
        class="forum-back-link"
        href="/forum"
      >
        &larr; Back to Community
      </a>

      <div class="discussion-layout">
        <section
          class="discussion-main"
          aria-label="Discussion"
        >
          <div id="detail-content"></div>
        </section>

        <aside class="discussion-sidebar">
          <section class="forum-panel">
            <div class="side-section">
              <p class="panel-kicker">
                AUC Atlas Community
              </p>
              <h3>About this discussion</h3>
              <p class="side-copy">
                Read the full post, join the
                conversation, and reply directly
                to other comments.
              </p>
            </div>

            <div class="side-section">
              <h3>Community rules</h3>
              <ol class="rule-list">
                <li>
                  Be respectful and helpful.
                </li>
                <li>
                  Protect private information.
                </li>
                <li>
                  No cheating, scams,
                  harassment, or spam.
                </li>
              </ol>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </main>

  <div
    class="toast"
    id="forum-toast"
    hidden
  ></div>

  <script src="/site-header.js"></script>

  <script>
    window.aucAtlasForumUser =
      ${forumUser};

    (function () {
      var categories =
        ${safeJson(FORUM_CATEGORIES)};

      var user =
        window.aucAtlasForumUser || {};

      var state = {
        posts: [],
        category: "All Discussions",
        search: "",
        sort: "latest",
        activePostId: "",
        collapsedReplyIds: {},
        openReplyBranches: {},
        replyingToId: ""
      };

      var toastTimer = 0;

      var categoryList =
        document.getElementById(
          "category-list"
        );

      var postList =
        document.getElementById(
          "post-list"
        );

      var feedSummary =
        document.getElementById(
          "feed-summary"
        );

      var searchInput =
        document.getElementById(
          "forum-search"
        );

      var sortInput =
        document.getElementById(
          "forum-sort"
        );

      var feedView =
        document.getElementById(
          "forum-feed-view"
        );

      var composerView =
        document.getElementById(
          "composer-page"
        );

      var discussionView =
        document.getElementById(
          "discussion-page"
        );

      var composerForm =
        document.getElementById(
          "composer-form"
        );

      var postCategory =
        document.getElementById(
          "post-category"
        );

      var detailContent =
        document.getElementById(
          "detail-content"
        );

      var trendingList =
        document.getElementById(
          "trending-list"
        );

      var toast =
        document.getElementById(
          "forum-toast"
        );

      function sendToLogin() {
        try {
          localStorage.setItem(
            "auc-atlas-login-redirect",
            window.location.pathname +
              window.location.search
          );
        } catch (error) {}

        window.location.href = "/login";
      }

      function requireForumUser() {
        if (user.uid) {
          return true;
        }

        showToast(
          "Sign in with your AUC account to continue."
        );

        window.setTimeout(
          sendToLogin,
          500
        );

        return false;
      }

      async function readForumResponse(
        response
      ) {
        var data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (!response.ok) {
          var error = new Error(
            data.error ||
              "Could not update the forum."
          );

          error.status = response.status;
          throw error;
        }

        return data;
      }

      async function forumRequest(
        action,
        payload
      ) {
        if (!requireForumUser()) {
          return null;
        }

        try {
          var response = await fetch(
            "/api/forum",
            {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify(
                Object.assign(
                  { action: action },
                  payload || {}
                )
              )
            }
          );

          return await readForumResponse(
            response
          );
        } catch (error) {
          if (error.status === 401) {
            sendToLogin();
            return null;
          }

          showToast(
            error.message ||
              "Could not update the forum."
          );

          return null;
        }
      }

      async function loadPosts(
        countView
      ) {
        var parameters =
          new URLSearchParams();

        parameters.set("data", "1");

        if (countView) {
          var currentParameters =
            new URLSearchParams(
              window.location.search
            );

          var viewedPostId =
            currentParameters.get("post");

          if (viewedPostId) {
            parameters.set(
              "viewPost",
              viewedPostId
            );
          }
        }

        var response = await fetch(
          "/api/forum?" +
            parameters.toString(),
          {
            credentials: "same-origin",
            cache: "no-store"
          }
        );

        var data =
          await readForumResponse(
            response
          );

        return Array.isArray(data.posts)
          ? data.posts
          : [];
      }

      async function refreshPosts() {
        try {
          state.posts =
            await loadPosts(false);

          renderFeed();

          if (state.activePostId) {
            var activePost = findPost(
              state.activePostId
            );

            if (activePost) {
              renderDetail(activePost);
            }
          }
        } catch (error) {
          showToast(
            error.message ||
              "Could not refresh discussions."
          );
        }
      }

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function formatRelative(value) {
        var time =
          new Date(value).getTime();

        var difference = Math.max(
          0,
          Date.now() - time
        );

        var minutes = Math.floor(
          difference / 60000
        );

        if (minutes < 1) {
          return "Just now";
        }

        if (minutes < 60) {
          return minutes + "m ago";
        }

        var hours = Math.floor(
          minutes / 60
        );

        if (hours < 24) {
          return hours + "h ago";
        }

        var days = Math.floor(
          hours / 24
        );

        if (days < 7) {
          return days + "d ago";
        }

        return new Date(value)
          .toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric"
            }
          );
      }

      function showToast(message) {
        window.clearTimeout(
          toastTimer
        );

        toast.textContent = message;
        toast.hidden = false;

        toastTimer =
          window.setTimeout(
            function () {
              toast.hidden = true;
            },
            2800
          );
      }

      function showForumView(
        viewName
      ) {
        feedView.hidden =
          viewName !== "feed";
        composerView.hidden =
          viewName !== "compose";
        discussionView.hidden =
          viewName !== "discussion";

        window.scrollTo(0, 0);
      }

      function getFilteredPosts() {
        var search =
          state.search.toLowerCase();

        var posts =
          state.posts.filter(
            function (post) {
              var matchesCategory =
                state.category ===
                  "All Discussions" ||
                post.category ===
                  state.category;

              var searchable = [
                post.title,
                post.body,
                post.category,
                post.tag,
                post.author
              ]
                .join(" ")
                .toLowerCase();

              return (
                matchesCategory &&
                (
                  !search ||
                  searchable.includes(
                    search
                  )
                )
              );
            }
          );

        if (
          state.sort === "popular"
        ) {
          posts.sort(
            function (a, b) {
              return (
                b.likes +
                b.replies.length * 3 +
                b.views / 10
              ) - (
                a.likes +
                a.replies.length * 3 +
                a.views / 10
              );
            }
          );
        } else if (
          state.sort === "unanswered"
        ) {
          posts = posts.filter(
            function (post) {
              return !post.replies.length;
            }
          );

          posts.sort(
            function (a, b) {
              return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
              );
            }
          );
        } else {
          posts.sort(
            function (a, b) {
              return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
              );
            }
          );
        }

        return posts;
      }

      function renderCategories() {
        var allCategories = [
          "All Discussions"
        ].concat(categories);

        categoryList.innerHTML =
          allCategories
            .map(function (category) {
              var count =
                category ===
                  "All Discussions"
                  ? state.posts.length
                  : state.posts.filter(
                      function (post) {
                        return (
                          post.category ===
                          category
                        );
                      }
                    ).length;

              return [
                '<button class="category-button',
                category === state.category
                  ? ' active'
                  : '',
                '" type="button" data-category="',
                escapeHtml(category),
                '">',
                  '<span>',
                    escapeHtml(category),
                  '</span>',
                  '<span class="category-count">',
                    count,
                  '</span>',
                '</button>'
              ].join("");
            })
            .join("");
      }

      function renderPostCard(post) {
        var preview =
          String(post.body || "").trim();
        var voteCount =
          Number(post.likes || 0);
        var commentCount =
          post.replies.length;

        return [
          '<article class="post-card">',
            '<a class="post-card-link" data-open-post="',
              escapeHtml(
                String(post.id)
              ),
            '" href="/forum?post=',
              encodeURIComponent(
                String(post.id)
              ),
            '">',
              '<div class="post-card-meta">',
                '<span class="post-avatar" aria-hidden="true">AUC</span>',
                '<span class="post-card-community">',
                  escapeHtml(post.category),
                '</span>',
                '<span class="post-card-time" aria-hidden="true">·</span>',
                '<span class="post-card-time">',
                  escapeHtml(
                    formatRelative(
                      post.createdAt
                    )
                  ),
                '</span>',
              '</div>',

              '<h2 class="post-card-title">',
                escapeHtml(post.title),
              '</h2>',

              '<p class="post-preview">',
                escapeHtml(preview),
              '</p>',

              '<p class="post-card-counts">',
                voteCount,
                voteCount === 1
                  ? ' vote'
                  : ' votes',
                ' · ',
                commentCount,
                commentCount === 1
                  ? ' comment'
                  : ' comments',
              '</p>',
            '</a>',
          '</article>'
        ].join("");
      }

      function renderTrending() {
        var trending =
          state.posts
            .slice()
            .sort(function (a, b) {
              return (
                b.likes +
                b.replies.length * 3
              ) - (
                a.likes +
                a.replies.length * 3
              );
            })
            .slice(0, 3);

        trendingList.innerHTML =
          trending
            .map(function (post) {
              return [
                '<button class="trend-item" type="button" data-open-post="',
                  escapeHtml(post.id),
                '">',
                  '<strong>',
                    escapeHtml(
                      post.title
                    ),
                  '</strong>',
                  '<p>',
                    post.replies.length,
                    ' replies · ',
                    post.likes,
                    ' helpful',
                  '</p>',
                '</button>'
              ].join("");
            })
            .join("");
      }

      function renderFeed() {
        var posts =
          getFilteredPosts();

        feedSummary.textContent =
          posts.length +
          (
            posts.length === 1
              ? " discussion"
              : " discussions"
          ) +
          " · " +
          state.category;

        if (!posts.length) {
          postList.innerHTML =
            '<div class="forum-empty">' +
              '<h3>No discussions found</h3>' +
              '<p>Try another category or create the first post for this topic.</p>' +
            '</div>';
        } else {
          postList.innerHTML =
            posts
              .map(renderPostCard)
              .join("");
        }

        renderCategories();
        renderTrending();
      }

      function findPost(postId) {
        return state.posts.find(
          function (post) {
            return post.id === postId;
          }
        );
      }

      async function toggleLike(
        postId,
        direction
      ) {
        if (!findPost(postId)) {
          return;
        }

        var result =
          await forumRequest(
            "vote-post",
            {
              postId: postId,
              direction: direction
            }
          );

        if (!result) {
          return;
        }

        await refreshPosts();
      }

      function findReply(
        post,
        replyId
      ) {
        return post.replies.find(
          function (reply) {
            return (
              reply.id === replyId
            );
          }
        );
      }

      async function voteReply(
        post,
        replyId,
        direction
      ) {
        if (
          !findReply(post, replyId)
        ) {
          return;
        }

        var result =
          await forumRequest(
            "vote-reply",
            {
              postId: post.id,
              replyId: replyId,
              direction: direction
            }
          );

        if (!result) {
          return;
        }

        await refreshPosts();
      }

      function getReplyChildren(
        post,
        parentId
      ) {
        return post.replies.filter(
          function (reply) {
            return (
              String(
                reply.parentId || ""
              ) === parentId
            );
          }
        );
      }

      function renderReplyNode(
        post,
        reply,
        depth
      ) {
        if (depth > 8) {
          return "";
        }

        var replyId =
          String(reply.id || "");
        var collapsed =
          Boolean(
            state.collapsedReplyIds[
              replyId
            ]
          );
        var children =
          getReplyChildren(
            post,
            replyId
          );
        var branchOpen =
          Boolean(
            state.openReplyBranches[
              replyId
            ]
          );
        var userVote =
          Number(reply.userVote || 0);

        if (
          !userVote &&
          reply.liked
        ) {
          userVote = 1;
        }

        if (collapsed) {
          return [
            '<article class="reply-card is-collapsed">',
              '<button class="reply-action-button" type="button" data-collapse-reply="',
                escapeHtml(replyId),
              '">',
                '+ ',
                escapeHtml(
                  reply.author ||
                  "AUC student"
                ),
                ' · ',
                children.length,
                children.length === 1
                  ? ' child hidden'
                  : ' children hidden',
              '</button>',
            '</article>'
          ].join("");
        }

        var childMarkup = "";

        if (children.length) {
          childMarkup = [
            '<button class="reply-children-toggle" type="button" data-toggle-reply-branch="',
              escapeHtml(replyId),
            '" aria-expanded="',
              branchOpen
                ? 'true'
                : 'false',
            '">',
              branchOpen
                ? 'Hide '
                : 'Show ',
              children.length,
              children.length === 1
                ? ' reply'
                : ' replies',
            '</button>',
            branchOpen
              ? [
                  '<div class="reply-children">',
                    children
                      .map(
                        function (
                          childReply
                        ) {
                          return renderReplyNode(
                            post,
                            childReply,
                            depth + 1
                          );
                        }
                      )
                      .join(""),
                  '</div>'
                ].join("")
              : ''
          ].join("");
        }

        var nestedReplyForm =
          state.replyingToId ===
            replyId
            ? [
                '<div class="nested-reply-form">',
                  '<textarea maxlength="2000" data-nested-reply-body="',
                    escapeHtml(replyId),
                  '" placeholder="Reply to ',
                    escapeHtml(
                      reply.author ||
                      "this comment"
                    ),
                  '"></textarea>',
                  '<div class="post-actions">',
                    '<button class="primary-button" type="button" data-submit-nested-reply="',
                      escapeHtml(replyId),
                    '">Post Reply</button>',
                    '<button class="secondary-button" type="button" data-cancel-nested-reply>Cancel</button>',
                  '</div>',
                '</div>'
              ].join("")
            : "";

        return [
          '<article class="reply-card">',
            '<header class="reply-card-header">',
              '<button class="reply-collapse-button" type="button" data-collapse-reply="',
                escapeHtml(replyId),
                '" aria-label="Collapse comment">−</button>',
              '<strong>',
                escapeHtml(
                  reply.author ||
                  "AUC student"
                ),
              '</strong>',
              '<time>',
                escapeHtml(
                  formatRelative(
                    reply.createdAt
                  )
                ),
              '</time>',
            '</header>',

            '<p class="reply-card-body">',
              escapeHtml(reply.body),
            '</p>',

            '<div class="reply-card-actions">',
              '<button class="reply-action-button',
                userVote === 1
                  ? ' active'
                  : '',
                '" type="button" data-like-reply="',
                escapeHtml(replyId),
              '">▲ ',
                Number(reply.likes || 0),
              '</button>',

              '<button class="reply-action-button',
                userVote === -1
                  ? ' active'
                  : '',
                '" type="button" data-downvote-reply="',
                escapeHtml(replyId),
              '">▼</button>',

              '<button class="reply-action-button" type="button" data-reply-to="',
                escapeHtml(replyId),
              '">Reply</button>',
            '</div>',

            nestedReplyForm,
            childMarkup,
          '</article>'
        ].join("");
      }

      function renderReplyTree(post) {
        if (!post.replies.length) {
          return (
            '<div class="forum-empty">' +
              '<h3>No comments yet</h3>' +
              '<p>Start the conversation with a helpful response.</p>' +
            '</div>'
          );
        }

        var knownReplyIds =
          new Set(
            post.replies.map(
              function (reply) {
                return String(
                  reply.id || ""
                );
              }
            )
          );

        var rootReplies =
          post.replies.filter(
            function (reply) {
              var parentId =
                String(
                  reply.parentId || ""
                );

              return (
                !parentId ||
                !knownReplyIds.has(
                  parentId
                )
              );
            }
          );

        return rootReplies
          .map(function (reply) {
            return renderReplyNode(
              post,
              reply,
              0
            );
          })
          .join("");
      }

      function renderDetail(post) {
        var userVote =
          Number(post.userVote || 0);

        if (
          !userVote &&
          post.liked
        ) {
          userVote = 1;
        }

        detailContent.innerHTML = [
          '<div class="post-badges">',
            '<span class="post-badge is-gold">',
              escapeHtml(post.category),
            '</span>',
            post.tag
              ? '<span class="post-badge">' +
                escapeHtml(post.tag) +
                '</span>'
              : '',
            post.pinned
              ? '<span class="post-badge">Pinned</span>'
              : '',
            post.solved
              ? '<span class="post-badge">Solved</span>'
              : '',
          '</div>',

          '<h2 class="detail-heading" id="detail-title">',
            escapeHtml(post.title),
          '</h2>',

          '<div class="post-meta">',
            '<span class="post-author">Posted by ',
              escapeHtml(post.author),
            '</span>',
            '<span class="post-time">',
              escapeHtml(
                formatRelative(
                  post.createdAt
                )
              ),
            '</span>',
            '<span class="post-time">',
              post.views,
              ' views',
            '</span>',
          '</div>',

          '<p class="detail-copy">',
            escapeHtml(post.body),
          '</p>',

          '<div class="detail-actions">',
            '<button class="like-button',
              userVote === 1
                ? ' active'
                : '',
              '" type="button" data-like-post="',
              escapeHtml(post.id),
            '">▲ ',
              Number(post.likes || 0),
            '</button>',

            '<button class="like-button',
              userVote === -1
                ? ' active'
                : '',
              '" type="button" data-downvote-post="',
              escapeHtml(post.id),
            '">▼</button>',

            post.canManage
              ? [
                  '<button class="secondary-button" type="button" data-toggle-solved="',
                    escapeHtml(post.id),
                  '">',
                    post.solved
                      ? 'Remove Solved Status'
                      : 'Mark as Solved',
                  '</button>',

                  '<button class="secondary-button danger-button" type="button" data-delete-post="',
                    escapeHtml(post.id),
                  '">Delete Post</button>'
                ].join("")
              : '',
          '</div>',

          '<section class="reply-section">',
            '<div class="reply-section-heading">',
              '<h3>',
                post.replies.length,
                post.replies.length === 1
                  ? ' Comment'
                  : ' Comments',
              '</h3>',
              '<span class="post-stat">Nested replies are collapsed by default</span>',
            '</div>',

            '<div class="reply-list">',
              renderReplyTree(post),
            '</div>',

            '<form class="reply-form" id="reply-form">',
              '<label for="reply-body">',
                'Comment on this post',
              '</label>',

              '<textarea id="reply-body" maxlength="2000" required placeholder="Join the discussion."></textarea>',

              '<div class="form-actions">',
                '<button class="primary-button" type="submit">',
                  'Post Comment',
                '</button>',
              '</div>',
            '</form>',
          '</section>'
        ].join("");

        document
          .getElementById("reply-form")
          .addEventListener(
            "submit",
            async function (event) {
              event.preventDefault();

              var replyBody =
                document
                  .getElementById(
                    "reply-body"
                  )
                  .value
                  .trim();

              if (!replyBody) {
                return;
              }

              var result =
                await forumRequest(
                  "create-reply",
                  {
                    postId: post.id,
                    parentId: "",
                    body: replyBody
                  }
                );

              if (!result) {
                return;
              }

              await refreshPosts();

              showToast(
                "Comment posted."
              );
            }
          );
      }

      function openPost(postId) {
        if (!findPost(postId)) {
          return;
        }

        window.location.href =
          "/forum?post=" +
          encodeURIComponent(postId);
      }

      categoryList.addEventListener(
        "click",
        function (event) {
          var button =
            event.target.closest(
              "[data-category]"
            );

          if (!button) {
            return;
          }

          state.category =
            button.dataset.category;

          renderFeed();
        }
      );

      async function handlePostAction(
        event
      ) {
        var activePost =
          findPost(
            state.activePostId
          );

        var collapseReplyButton =
          event.target.closest(
            "[data-collapse-reply]"
          );

        if (
          collapseReplyButton &&
          activePost
        ) {
          var collapseReplyId =
            collapseReplyButton.dataset
              .collapseReply;

          state.collapsedReplyIds[
            collapseReplyId
          ] =
            !state.collapsedReplyIds[
              collapseReplyId
            ];

          renderDetail(activePost);
          return;
        }

        var branchButton =
          event.target.closest(
            "[data-toggle-reply-branch]"
          );

        if (
          branchButton &&
          activePost
        ) {
          var branchReplyId =
            branchButton.dataset
              .toggleReplyBranch;

          state.openReplyBranches[
            branchReplyId
          ] =
            !state.openReplyBranches[
              branchReplyId
            ];

          renderDetail(activePost);
          return;
        }

        var replyToButton =
          event.target.closest(
            "[data-reply-to]"
          );

        if (
          replyToButton &&
          activePost
        ) {
          state.replyingToId =
            replyToButton.dataset.replyTo;

          renderDetail(activePost);

          var nestedTextarea =
            Array.from(
              detailContent.querySelectorAll(
                "[data-nested-reply-body]"
              )
            ).find(
              function (textarea) {
                return (
                  textarea.dataset
                    .nestedReplyBody ===
                  state.replyingToId
                );
              }
            );

          if (nestedTextarea) {
            nestedTextarea.focus();
          }

          return;
        }

        var cancelNestedReply =
          event.target.closest(
            "[data-cancel-nested-reply]"
          );

        if (
          cancelNestedReply &&
          activePost
        ) {
          state.replyingToId = "";
          renderDetail(activePost);
          return;
        }

        var submitNestedReply =
          event.target.closest(
            "[data-submit-nested-reply]"
          );

        if (
          submitNestedReply &&
          activePost
        ) {
          var parentReplyId =
            submitNestedReply.dataset
              .submitNestedReply;

          var replyTextarea =
            Array.from(
              detailContent.querySelectorAll(
                "[data-nested-reply-body]"
              )
            ).find(
              function (textarea) {
                return (
                  textarea.dataset
                    .nestedReplyBody ===
                  parentReplyId
                );
              }
            );

          var nestedReplyBody =
            replyTextarea
              ? replyTextarea.value.trim()
              : "";

          if (!nestedReplyBody) {
            if (replyTextarea) {
              replyTextarea.focus();
            }
            return;
          }

          var nestedResult =
            await forumRequest(
              "create-reply",
              {
                postId: activePost.id,
                parentId:
                  parentReplyId,
                body: nestedReplyBody
              }
            );

          if (!nestedResult) {
            return;
          }

          state.openReplyBranches[
            parentReplyId
          ] = true;
          state.replyingToId = "";

          await refreshPosts();

          showToast(
            "Reply posted."
          );

          return;
        }

        var likeReplyButton =
          event.target.closest(
            "[data-like-reply]"
          );

        if (
          likeReplyButton &&
          activePost
        ) {
          voteReply(
            activePost,
            likeReplyButton.dataset
              .likeReply,
            1
          );
          return;
        }

        var downvoteReplyButton =
          event.target.closest(
            "[data-downvote-reply]"
          );

        if (
          downvoteReplyButton &&
          activePost
        ) {
          voteReply(
            activePost,
            downvoteReplyButton.dataset
              .downvoteReply,
            -1
          );
          return;
        }

        var openButton =
          event.target.closest(
            "[data-open-post]"
          );

        if (openButton) {
          event.preventDefault();

          openPost(
            openButton.dataset.openPost
          );
          return;
        }

        var likeButton =
          event.target.closest(
            "[data-like-post]"
          );

        if (likeButton) {
          toggleLike(
            likeButton.dataset.likePost,
            1
          );
          return;
        }

        var downvoteButton =
          event.target.closest(
            "[data-downvote-post]"
          );

        if (downvoteButton) {
          toggleLike(
            downvoteButton.dataset
              .downvotePost,
            -1
          );
          return;
        }

        var solvedButton =
          event.target.closest(
            "[data-toggle-solved]"
          );

        if (solvedButton) {
          var solvedResult =
            await forumRequest(
              "toggle-solved",
              {
                postId:
                  solvedButton.dataset
                    .toggleSolved
              }
            );

          if (!solvedResult) {
            return;
          }

          await refreshPosts();

          showToast(
            solvedResult.solved
              ? "Discussion marked as solved."
              : "Solved status removed."
          );

          return;
        }

        var deleteButton =
          event.target.closest(
            "[data-delete-post]"
          );

        if (deleteButton) {
          if (
            !window.confirm(
              "Permanently delete this post and all of its replies?"
            )
          ) {
            return;
          }

          var deleteResult =
            await forumRequest(
              "delete-post",
              {
                postId:
                  deleteButton.dataset
                    .deletePost
              }
            );

          if (!deleteResult) {
            return;
          }

          window.location.href =
            "/forum";

          return;
        }
      }

      postList.addEventListener(
        "click",
        handlePostAction
      );

      trendingList.addEventListener(
        "click",
        handlePostAction
      );

      detailContent.addEventListener(
        "click",
        handlePostAction
      );

      searchInput.addEventListener(
        "input",
        function () {
          state.search =
            searchInput.value.trim();

          renderFeed();
        }
      );

      sortInput.addEventListener(
        "change",
        function () {
          state.sort =
            sortInput.value;

          renderFeed();
        }
      );

      composerForm.addEventListener(
        "submit",
        async function (event) {
          event.preventDefault();

          var title =
            document
              .getElementById(
                "post-title"
              )
              .value
              .trim();

          var body =
            document
              .getElementById(
                "post-body"
              )
              .value
              .trim();

          var category =
            postCategory.value;

          var tag =
            document
              .getElementById(
                "post-tag"
              )
              .value
              .trim();

          var anonymous =
            document
              .getElementById(
                "post-anonymous"
              )
              .checked;

          if (
            !title ||
            !body ||
            !categories.includes(
              category
            )
          ) {
            return;
          }

          var result =
            await forumRequest(
              "create-post",
              {
                category: category,
                tag: tag,
                title: title,
                body: body,
                anonymous: anonymous
              }
            );

          if (!result) {
            return;
          }

          window.location.href =
            "/forum?post=" +
            encodeURIComponent(
              result.postId
            );
        }
      );

      function renderCurrentPage() {
        var parameters =
          new URLSearchParams(
            window.location.search
          );
        var requestedPostId =
          String(
            parameters.get("post") ||
            ""
          );

        if (
          parameters.get("compose") ===
          "1"
        ) {
          if (!user.uid) {
            requireForumUser();
            return;
          }

          composerForm.reset();
          showForumView("compose");

          document.title =
            "Create Post | AUC Atlas";

          window.setTimeout(
            function () {
              document
                .getElementById(
                  "post-title"
                )
                .focus();
            },
            40
          );

          return;
        }

        if (requestedPostId) {
          var requestedPost =
            findPost(
              requestedPostId
            );

          if (requestedPost) {
            state.activePostId =
              requestedPostId;

            showForumView(
              "discussion"
            );
            renderDetail(
              requestedPost
            );

            document.title =
              requestedPost.title +
              " | AUC Atlas";

            return;
          }

          window.history.replaceState(
            {},
            "",
            "/forum"
          );
        }

        state.activePostId = "";
        showForumView("feed");
        renderFeed();

        document.title =
          "AUC Atlas Community";
      }

      postCategory.innerHTML =
        categories
          .map(function (category) {
            return (
              '<option value="' +
              escapeHtml(category) +
              '">' +
              escapeHtml(category) +
              '</option>'
            );
          })
          .join("");

      postList.innerHTML =
        '<div class="forum-empty">' +
          '<h3>Loading discussions</h3>' +
          '<p>Please wait while the community loads.</p>' +
        '</div>';

      loadPosts(true)
        .then(function (posts) {
          state.posts = posts;
          renderCurrentPage();
        })
        .catch(function (error) {
          state.posts = [];
          renderCurrentPage();

          showToast(
            error.message ||
              "Could not load discussions."
          );
        });
    })();
  </script>
</body>
</html>`;
}

module.exports = async function handler(
  req,
  res
) {
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  const query = req.query || {};

  const isDataRequest =
    req.method === "GET" &&
    String(query.data || "") === "1";

  try {
    if (isDataRequest) {
      const actor =
        await getForumActor(
          req,
          false
        );

      await incrementForumView(
        query.viewPost
      );

      const posts =
        await getForumPosts(
          actor,
          query.viewPost
        );

      return res.status(200).json({
        posts,
        user: actor
          ? {
              uid: actor.uid,
              displayName:
                actor.displayName,
              isAdmin: actor.isAdmin
            }
          : null
      });
    }

    if (req.method === "GET") {
      const actor =
        await getForumActor(
          req,
          false
        );

      res.setHeader(
        "Content-Type",
        "text/html; charset=utf-8"
      );

      return res
        .status(200)
        .send(
          renderForumPage(actor)
        );
    }

    if (req.method !== "POST") {
      res.setHeader(
        "Allow",
        "GET, POST"
      );

      return res.status(405).json({
        error: "Method not allowed."
      });
    }

    const actor =
      await getForumActor(
        req,
        true
      );

    const body = getForumBody(req);

    const action =
      cleanForumString(
        body.action,
        40
      );

    if (action === "create-post") {
      const postId =
        await createForumPost(
          actor,
          body
        );

      return res.status(201).json({
        success: true,
        postId
      });
    }

    if (action === "create-reply") {
      const replyId =
        await createForumReply(
          actor,
          body
        );

      return res.status(201).json({
        success: true,
        replyId
      });
    }

    if (action === "vote-post") {
      const userVote =
        await voteForumTarget(
          actor,
          body,
          "post"
        );

      return res.status(200).json({
        success: true,
        userVote
      });
    }

    if (action === "vote-reply") {
      const userVote =
        await voteForumTarget(
          actor,
          body,
          "reply"
        );

      return res.status(200).json({
        success: true,
        userVote
      });
    }

    if (
      action === "toggle-solved"
    ) {
      const solved =
        await toggleForumSolved(
          actor,
          body
        );

      return res.status(200).json({
        success: true,
        solved
      });
    }

    if (action === "delete-post") {
      await deleteForumPost(
        actor,
        body
      );

      return res.status(200).json({
        success: true
      });
    }

    throw createForumError(
      "Forum action not found.",
      404
    );
  } catch (error) {
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
          "Could not update the forum."
      });
  }
};
