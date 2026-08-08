import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  serverExternalPackages: ["firebase-admin"]
};

export default nextConfig;
