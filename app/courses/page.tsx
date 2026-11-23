import { redirect } from "next/navigation";

// Keep old /courses bookmarks working without showing the retired course browser.
// Individual course pages remain available at /courses/[slug].
export default function Page() {
  redirect("/homepagenew");
}
