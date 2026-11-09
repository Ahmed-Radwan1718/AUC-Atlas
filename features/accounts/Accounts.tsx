"use client";

import { useEffect } from "react";
import { markup } from "./accountsMarkup";
import { initializeAccounts } from "./accountRuntime";
import "./accounts-1.css";
import "./accounts-2.css";
import "./accounts-3.css";

export default function Accounts() {
  useEffect(() => { initializeAccounts(); }, []);
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
