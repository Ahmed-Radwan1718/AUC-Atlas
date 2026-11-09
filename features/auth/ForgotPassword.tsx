"use client";

import { useEffect } from "react";
import { markup } from "./forgot-passwordMarkup";
import { initializeForgotPassword } from "./forgot-passwordRuntime";
import "./forgot-password.css";

export default function ForgotPassword() {
  useEffect(() => { initializeForgotPassword(); }, []);
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
