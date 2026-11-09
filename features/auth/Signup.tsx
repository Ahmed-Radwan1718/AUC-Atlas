"use client";

import { useEffect } from "react";
import { markup } from "./signupMarkup";
import { initializeSignup } from "./signupRuntime";
import "./signup.css";

export default function Signup() {
  useEffect(() => { initializeSignup(); }, []);
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
