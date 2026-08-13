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

    if (response.status === 429) {
      console.warn(
        "Forum moderation skipped because OpenAI returned 429:",
        apiError.code || "no-code"
      );
      return;
    }

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
    requestedPostId
      ? Promise.resolve(null)
      : db.collection("forumPosts")
          .orderBy(
            "createdAt",
            "desc"
          )
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
    requestedPostId
      ? (
          requestedPostDoc &&
          requestedPostDoc.exists
            ? [requestedPostDoc]
            : []
        )
      : postSnapshot.docs.slice();

  const authorProfiles = new Map();
  const authorUids = Array.from(
    new Set(
      postDocs
        .map(function (postDoc) {
          const postData =
            postDoc.data() || {};
          const isAnonymous =
            postData.anonymous === true ||
            cleanForumString(
              postData.authorName,
              80
            ).toLowerCase() ===
              "anonymous";

          return isAnonymous
            ? ""
            : cleanForumString(
                postData.authorUid,
                160
              );
        })
        .filter(Boolean)
    )
  );

  if (authorUids.length) {
    const authorDocs =
      await db.getAll(
        ...authorUids.map(
          function (authorUid) {
            return db.collection("users")
              .doc(authorUid);
          }
        )
      );

    authorDocs.forEach(
      function (authorDoc) {
        if (!authorDoc.exists) {
          return;
        }

        const authorData =
          authorDoc.data() || {};

        authorProfiles.set(
          authorDoc.id,
          {
            displayName:
              cleanForumString(
                authorData.fullName ||
                  authorData.displayName,
                80
              ),
            photoURL:
              cleanForumString(
                authorData.photoURL,
                2000
              )
          }
        );
      }
    );
  }

  return Promise.all(
    postDocs.map(
      async function (postDoc) {
        const postData =
          postDoc.data() || {};
        const isAnonymous =
          postData.anonymous === true ||
          cleanForumString(
            postData.authorName,
            80
          ).toLowerCase() ===
            "anonymous";
        const authorProfile =
          isAnonymous
            ? null
            : authorProfiles.get(
                cleanForumString(
                  postData.authorUid,
                  160
                )
              ) || null;

        const shouldLoadReplies =
          Boolean(requestedPostId) &&
          postDoc.id ===
            requestedPostId;

        const replySnapshot =
          shouldLoadReplies
            ? await postDoc.ref
                .collection("replies")
                .orderBy(
                  "createdAt",
                  "asc"
                )
                .limit(300)
                .get()
            : null;

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
          replySnapshot
            ? replySnapshot.docs.map(
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
              )
            : [];

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
            isAnonymous
              ? "Anonymous"
              : cleanForumString(
                  (
                    authorProfile &&
                    authorProfile.displayName
                  ) ||
                    postData.authorName ||
                    "AUC student",
                  80
                ),
          authorPhotoURL:
            isAnonymous
              ? ""
              : cleanForumString(
                  (
                    authorProfile &&
                    authorProfile.photoURL
                  ) ||
                    "",
                  2000
                ),
          anonymous: isAnonymous,
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
          replyCount: Math.max(
            Number(
              postData.replyCount || 0
            ),
            replies.length
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
      const requestResults =
        await Promise.all([
          getForumActor(
            req,
            false
          ),
          incrementForumView(
            query.viewPost
          )
        ]);
      const actor =
        requestResults[0];

      const requestedPostId =
        query.viewPost ||
        query.post ||
        "";

      const posts =
        await getForumPosts(
          actor,
          requestedPostId
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

