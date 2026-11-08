// The legacy Cloudinary course-material upload endpoint is retired.
// Profile photos continue to use their separate Cloudinary integration.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  return res.status(410).json({
    error: "The course-material uploader has moved to ImageKit. Refresh this page and try again."
  });
};
