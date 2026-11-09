import type { Metadata } from "next";
import Signup from "../../features/auth/Signup";
export const metadata: Metadata = { title: "Create Account - AUC Atlas" };
export default function Page() { return <Signup />; }
