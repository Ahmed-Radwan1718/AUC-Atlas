const admin = require("../_lib/firebaseAdmin");

const {
  getSiteSessionUser
} = require("../_lib/securityHelpers");

const VALID_GPA_GRADES = new Set([
  "",
  "4.0",
  "3.7",
  "3.3",
  "3.0",
  "2.7",
  "2.3",
  "2.0",
  "1.7",
  "1.3",
  "1.0",
  "0"
]);

function cleanString(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function cleanDegreeProgress(value) {
  const source =
    value && typeof value === "object"
      ? value
      : {};

  const major = cleanString(
    source.major,
    100
  );

  const completedKeys = Array.isArray(
    source.completedKeys
  )
    ? Array.from(
        new Set(
          source.completedKeys
            .map(function (key) {
              return cleanString(key, 40);
            })
            .filter(function (key) {
              return /^\d{1,3}-\d{1,3}$/.test(
                key
              );
            })
        )
      ).slice(0, 500)
    : [];

  return {
    major,
    completedKeys
  };
}

function cleanGpaCredits(value) {
  const rawCredits = String(
    value == null ? "" : value
  )
    .replace(/[^0-9]/g, "")
    .slice(0, 2);

  if (!rawCredits) {
    return "";
  }

  return String(
    Math.min(
      30,
      Math.max(
        0,
        Number(rawCredits) || 0
      )
    )
  );
}

function cleanGpaCalculator(value) {
  const source =
    value && typeof value === "object"
      ? value
      : {};

  const semesters = Array.isArray(
    source.semesters
  )
    ? source.semesters.slice(0, 24)
    : [];

  return {
    semesters: semesters.map(
      function (semester, semesterIndex) {
        const safeSemester =
          semester &&
          typeof semester === "object"
            ? semester
            : {};

        const courses = Array.isArray(
          safeSemester.courses
        )
          ? safeSemester.courses
              .slice(0, 30)
              .map(function (course) {
                const safeCourse =
                  course &&
                  typeof course ===
                    "object"
                    ? course
                    : {};

                const grade = cleanString(
                  safeCourse.grade,
                  4
                );

                return {
                  name: cleanString(
                    safeCourse.name,
                    120
                  ),
                  credits: cleanGpaCredits(
                    safeCourse.credits
                  ),
                  grade:
                    VALID_GPA_GRADES.has(
                      grade
                    )
                      ? grade
                      : ""
                };
              })
          : [];

        return {
          name:
            cleanString(
              safeSemester.name,
              80
            ) ||
            "Semester " +
              (semesterIndex + 1),
          courses
        };
      }
    )
  };
}

module.exports = async function handler(
  req,
  res
) {
  try {
    const decodedUser =
      await getSiteSessionUser(req, {
        checkRevoked: true
      });

    const savedTools = admin
      .firestore()
      .collection("users")
      .doc(decodedUser.uid)
      .collection("savedTools");

    if (req.method === "GET") {
      const [
        degreeDocument,
        gpaDocument
      ] = await Promise.all([
        savedTools
          .doc("degree-progress")
          .get(),
        savedTools
          .doc("gpa-calculator")
          .get()
      ]);

      const degreeData =
        degreeDocument.exists
          ? degreeDocument.data() || {}
          : null;

      const gpaData =
        gpaDocument.exists
          ? gpaDocument.data() || {}
          : null;

      return res.status(200).json({
        success: true,
        degreeProgress: degreeData
          ? {
              major:
                degreeData.major || "",
              completedKeys:
                Array.isArray(
                  degreeData.completedKeys
                )
                  ? degreeData.completedKeys
                  : []
            }
          : null,
        gpaCalculator: gpaData
          ? {
              semesters:
                Array.isArray(
                  gpaData.semesters
                )
                  ? gpaData.semesters
                  : []
            }
          : null
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const requestBody = req.body || {};
    const type = cleanString(
      requestBody.type,
      30
    );

    if (type === "degree") {
      const progress =
        cleanDegreeProgress(
          requestBody.progress
        );

      if (!progress.major) {
        return res.status(400).json({
          error:
            "A saved major is required."
        });
      }

      await savedTools
        .doc("degree-progress")
        .set({
          major: progress.major,
          completedKeys:
            progress.completedKeys,
          updatedAt:
            admin.firestore.FieldValue
              .serverTimestamp()
        });

      return res.status(200).json({
        success: true,
        degreeProgress: progress
      });
    }

    if (type === "gpa") {
      const calculator =
        cleanGpaCalculator(
          requestBody.calculator
        );

      await savedTools
        .doc("gpa-calculator")
        .set({
          semesters:
            calculator.semesters,
          updatedAt:
            admin.firestore.FieldValue
              .serverTimestamp()
        });

      return res.status(200).json({
        success: true,
        gpaCalculator: calculator
      });
    }

    return res.status(400).json({
      error:
        "Choose which academic progress to save."
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({
        error:
          error.message ||
          "Could not save academic progress."
      });
  }
};
