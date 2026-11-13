"use client";

import { useEffect } from "react";
import { markup } from "./accountsMarkup";
import { initializeAccounts } from "./accountRuntime";
import "./accounts-1.css";
import "./accounts-2.css";
import "./accounts-3.css";
import "./account-activity.css";
import "./account-skeletons.css";
import "../professors/professors-ui-1.css";
import "../professors/professors-ui-2.css";
import "../professors/professors-ui-3.css";
import "./account-review-drawer.css";

export default function Accounts() {
  useEffect(() => { initializeAccounts(); }, []);
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
