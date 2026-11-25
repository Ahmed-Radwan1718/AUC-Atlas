import type { Metadata } from "next";
import PlazaMap from "./PlazaMap";
export const metadata: Metadata = {
  title: "Campus map | AUC Atlas",
  description: "Explore a preliminary 3D model of Bartlett Plaza.",
  robots: { index: false, follow: false },
};
export default function Page() { return <PlazaMap />; }
