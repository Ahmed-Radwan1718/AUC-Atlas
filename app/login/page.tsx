import type { Metadata } from "next";
import Login from "../../features/auth/Login";
export const metadata: Metadata = { title: "Log In - AUC Atlas" };
export default function Page() { return <Login />; }
