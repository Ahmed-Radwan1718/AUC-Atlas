import type { Metadata } from "next";
import ForgotPassword from "../../features/auth/ForgotPassword";
export const metadata: Metadata = { title: "Forgot Password - AUC Atlas" };
export default function Page() { return <ForgotPassword />; }
