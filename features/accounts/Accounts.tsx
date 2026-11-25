"use client";

import { useEffect } from "react";
import { markup, activityMarkup } from "./accountsMarkup";
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
import "./account-workspace.css";

export default function Accounts({ activityOnly = false }: { activityOnly?: boolean }) {
  useEffect(() => { initializeAccounts(activityOnly); }, [activityOnly]);
  return <div className="atlas-account-workspace" dangerouslySetInnerHTML={{ __html: activityOnly ? activityMarkup : markup }} />;
}
