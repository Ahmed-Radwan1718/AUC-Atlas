import { permanentRedirect } from "next/navigation";

// Preserve existing bookmarks without serving a duplicate homepage.
export default function Page() {
  permanentRedirect("/");
}
