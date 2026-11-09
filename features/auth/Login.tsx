"use client";

import { useEffect } from "react";
import { markup } from "./loginMarkup";
import { initializeLogin } from "./loginRuntime";
import "./login.css";

export default function Login() {
  useEffect(() => { initializeLogin(); }, []);
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
