"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DegreePlan,
  DegreeRequirementGroup,
  DegreeRequirementSubgroup,
  DegreeRequirements,
} from "@/lib/degree-types";

const ACCOUNTS_ROUTE = "/accounts";

type MessageType = "" | "success" | "error";

type MeResponse = {
  signedIn?: boolean;
  user?: { major?: string };
  error?: string;
};

type DegreeRequirementsResponse = {
  success?: boolean;
  requirements?: DegreeRequirements;
  error?: string;
};

type AcademicProgressResponse = {
  degreeProgress?: {
    major?: string;
    completedKeys?: unknown;
  } | null;
  error?: string;
};

type RequirementEntry = {
  key: string;
  item: string;
  credits: number;
  courseCode: string;
  creditGroup: string;
  creditCap: number;
};

function getDegreeItemCredits(item: string) {
  const creditSection = String(item || "").match(/\(([^()]*(?:cr\.?)[^()]*)\)\s*$/i);
  if (!creditSection) return 0;

  const creditText = creditSection[1];
  const rangeMatch = creditText.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) return Number(rangeMatch[2]);

  const values = creditText.match(/\d+(?:\.\d+)?/g) || [];
  return values.reduce((total, value) => total + Number(value), 0);
}

function formatCreditCount(value: number) {
  const credits = Number(value) || 0;
  return Number.isInteger(credits) ? String(credits) : credits.toFixed(1).replace(/\.0$/, "");
}

function makeEntry(
  item: string,
  key: string,
  creditGroup?: string,
  creditCap?: number,
): RequirementEntry {
  return {
    key,
    item,
    credits: getDegreeItemCredits(item),
    courseCode: String(item || "").split(" - ")[0].trim().toUpperCase(),
    creditGroup: creditGroup || "",
    creditCap: Number(creditCap) || 0,
  };
}

function flattenPlan(plan: DegreePlan | null) {
  if (!plan) return [];
  const entries: RequirementEntry[] = [];

  plan.groups.forEach((group, groupIndex) => {
    group.items.forEach((item, itemIndex) => {
      entries.push(makeEntry(item, `${groupIndex}-${itemIndex}`, group.creditGroup, group.creditCap));
    });

    (group.subgroups || []).forEach((subgroup, subgroupIndex) => {
      subgroup.items.forEach((item, itemIndex) => {
        entries.push(
          makeEntry(
            item,
            `${groupIndex}-${subgroupIndex}-${itemIndex}`,
            subgroup.creditGroup || group.creditGroup,
            subgroup.creditCap || group.creditCap,
          ),
        );
      });
    });
  });

  return entries;
}

function calculateProgress(plan: DegreePlan | null, completedKeys: Set<string>) {
  const entries = flattenPlan(plan);
  const creditGroups = new Map<
    string,
    { cap: number; completedCourses: Map<string, number> }
  >();
  let totalCredits = 0;
  let completedCredits = 0;

  entries.forEach((entry) => {
    if (!entry.creditGroup) {
      totalCredits += entry.credits;
      if (completedKeys.has(entry.key)) completedCredits += entry.credits;
      return;
    }

    if (!creditGroups.has(entry.creditGroup)) {
      creditGroups.set(entry.creditGroup, {
        cap: entry.creditCap,
        completedCourses: new Map<string, number>(),
      });
    }

    const group = creditGroups.get(entry.creditGroup);
    if (group && completedKeys.has(entry.key) && !group.completedCourses.has(entry.courseCode)) {
      group.completedCourses.set(entry.courseCode, entry.credits);
    }
  });

  creditGroups.forEach((group) => {
    const selectedCredits = Array.from(group.completedCourses.values()).reduce(
      (total, credits) => total + Number(credits || 0),
      0,
    );
    const cap = Math.max(0, Number(group.cap || 0));
    totalCredits += cap;
    completedCredits += Math.min(selectedCredits, cap);
  });

  const remainingCredits = Math.max(totalCredits - completedCredits, 0);
  const percent = totalCredits ? Math.round((completedCredits / totalCredits) * 100) : 0;

  return { completedCredits, remainingCredits, percent };
}

function RequirementItem({
  entry,
  checked,
  onToggle,
}: {
  entry: RequirementEntry;
  checked: boolean;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <label className={`degree-requirement-item${checked ? " is-complete" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggle(entry.key, event.target.checked)}
      />
      <span className="degree-requirement-text">{entry.item}</span>
    </label>
  );
}

function RequirementList({
  items,
  keyPrefix,
  creditGroup,
  creditCap,
  completedKeys,
  onToggle,
}: {
  items: string[];
  keyPrefix: string;
  creditGroup?: string;
  creditCap?: number;
  completedKeys: Set<string>;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="degree-requirement-list">
      {items.map((item, itemIndex) => {
        const entry = makeEntry(item, `${keyPrefix}-${itemIndex}`, creditGroup, creditCap);
        return (
          <RequirementItem
            entry={entry}
            checked={completedKeys.has(entry.key)}
            onToggle={onToggle}
            key={entry.key}
          />
        );
      })}
    </div>
  );
}

function RequirementSubgroup({
  subgroup,
  group,
  groupIndex,
  subgroupIndex,
  completedKeys,
  onToggle,
}: {
  subgroup: DegreeRequirementSubgroup;
  group: DegreeRequirementGroup;
  groupIndex: number;
  subgroupIndex: number;
  completedKeys: Set<string>;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <section className="degree-requirement-subgroup">
      <h4>{subgroup.title}</h4>
      <RequirementList
        items={subgroup.items}
        keyPrefix={`${groupIndex}-${subgroupIndex}`}
        creditGroup={subgroup.creditGroup || group.creditGroup}
        creditCap={subgroup.creditCap || group.creditCap}
        completedKeys={completedKeys}
        onToggle={onToggle}
      />
    </section>
  );
}

export function DegreeProgression() {
  const [major, setMajor] = useState("");
  const [plan, setPlan] = useState<DegreePlan | null>(null);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [requirementsError, setRequirementsError] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("");
  const [saving, setSaving] = useState(false);
  const [loadingSavedProgress, setLoadingSavedProgress] = useState(false);

  const progress = useMemo(
    () => calculateProgress(plan, completedKeys),
    [plan, completedKeys],
  );

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const meResponse = await fetch("/api/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const me = (await meResponse.json().catch(() => ({}))) as MeResponse;

        if (!meResponse.ok || !me.signedIn || !me.user) {
          throw new Error("Please log in to view degree progression.");
        }

        const savedMajor = String(me.user.major || "").trim();
        if (!active) return;
        setMajor(savedMajor);

        const requirementsResponse = await fetch("/api/degree-requirements", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const requirementsData = (await requirementsResponse
          .json()
          .catch(() => ({}))) as DegreeRequirementsResponse;

        if (!requirementsResponse.ok || !requirementsData.requirements) {
          throw new Error(requirementsData.error || "Could not load degree requirements.");
        }

        if (!active) return;
        const nextPlan = savedMajor ? requirementsData.requirements[savedMajor] || null : null;
        setPlan(nextPlan);
        setRequirementsError(false);
        setLoading(false);

        if (!savedMajor || !nextPlan) return;

        setLoadingSavedProgress(true);
        try {
          const progressResponse = await fetch("/api/academic-progress", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: { Accept: "application/json" },
          });
          const progressData = (await progressResponse
            .json()
            .catch(() => ({}))) as AcademicProgressResponse;

          if (!progressResponse.ok) {
            throw new Error(progressData.error || "Could not load saved progress.");
          }

          if (!active) return;
          const savedProgress = progressData.degreeProgress;
          if (savedProgress && savedProgress.major === savedMajor) {
            const keys = Array.isArray(savedProgress.completedKeys)
              ? savedProgress.completedKeys.filter(
                  (key): key is string => typeof key === "string",
                )
              : [];
            setCompletedKeys(new Set(keys));
          }
        } catch (error) {
          if (active) {
            setSaveMessage(
              error instanceof Error ? error.message : "Could not load saved progress.",
            );
            setMessageType("error");
          }
        } finally {
          if (active) setLoadingSavedProgress(false);
        }
      } catch (error) {
        if (!active) return;

        if (error instanceof Error && error.message === "Please log in to view degree progression.") {
          try {
            localStorage.setItem("auc-atlas-login-redirect", "/degree-progression");
          } catch {}
          window.location.href = "/login";
          return;
        }

        setRequirementsError(true);
        setSaveMessage(
          error instanceof Error ? error.message : "Could not load degree requirements.",
        );
        setMessageType("error");
        setLoading(false);
      }
    }

    void loadPage();
    return () => {
      active = false;
    };
  }, []);

  function toggleRequirement(key: string, checked: boolean) {
    setCompletedKeys((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
    setSaveMessage("You have unsaved changes.");
    setMessageType("");
  }

  async function saveDegreeProgress() {
    if (!major || !plan) return;
    setSaving(true);
    setSaveMessage("");
    setMessageType("");

    try {
      const response = await fetch("/api/academic-progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "degree",
          progress: {
            major,
            completedKeys: Array.from(completedKeys),
          },
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save degree progress.");

      setSaveMessage("Degree progress saved.");
      setMessageType("success");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not save degree progress.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});

    try {
      localStorage.removeItem("auc-atlas-signed-in");
      localStorage.removeItem("aucAtlasSignedIn");
      sessionStorage.removeItem("auc-atlas-signed-in");
      sessionStorage.removeItem("aucAtlasSignedIn");
    } catch {}

    window.location.href = "/login";
  }

  const majorName = loading ? "Loading Requirements" : major || "No Major Selected";
  const majorCopy = loading
    ? "Your saved major will load here."
    : plan
      ? "Requirements loaded for your saved major."
      : "Requirements have not been added for this major yet.";
  const canSave = Boolean(major && plan && !loadingSavedProgress && !requirementsError);

  return (
    <main className="degree-page">
      <section className="degree-section">
        <div className="degree-inner">
          <div className="degree-header">
            <h1>Degree Progression</h1>
            <p>Track your academic progress and remaining requirements.</p>
          </div>

          <div className="degree-layout">
            <aside className="account-sidebar">
              <a className="account-sidebar-link" href={`${ACCOUNTS_ROUTE}#details`}>
                <span className="account-sidebar-icon account-details-icon" aria-hidden="true" />
                <span>Account Details</span>
              </a>
              <a className="account-sidebar-link" href={`${ACCOUNTS_ROUTE}#security`}>
                <span className="account-sidebar-icon account-security-icon" aria-hidden="true" />
                <span>Security</span>
              </a>
              <a className="account-sidebar-link active" href="/degree-progression">
                <span className="account-sidebar-icon account-degree-icon" aria-hidden="true" />
                <span>Degree Progression</span>
              </a>
              <a className="account-sidebar-link" href={`${ACCOUNTS_ROUTE}#reviews`}>
                <span className="account-sidebar-icon account-reviews-icon" aria-hidden="true" />
                <span>Activity History</span>
              </a>
              <button className="account-sidebar-link account-logout-link" type="button" onClick={() => void logout()}>
                <span className="account-logout-icon" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </aside>

            <section className="degree-content">
              <article className="degree-panel">
                <div className="degree-panel-header">
                  <div>
                    <h2>{majorName}</h2>
                    <p>{majorCopy}</p>
                  </div>

                  <div className="degree-panel-actions">
                    <button
                      className="degree-save-button"
                      type="button"
                      disabled={!canSave || saving}
                      onClick={() => void saveDegreeProgress()}
                    >
                      {saving ? "Saving..." : "Save Progress"}
                    </button>
                  </div>
                </div>

                <div className="degree-summary-grid" aria-label="Degree progress summary">
                  <div className="degree-stat-card">
                    <span>Completed Credits</span>
                    <strong>{formatCreditCount(progress.completedCredits)}</strong>
                  </div>
                  <div className="degree-stat-card">
                    <span>Remaining Credits</span>
                    <strong>{formatCreditCount(progress.remainingCredits)}</strong>
                  </div>
                  <div className="degree-stat-card">
                    <span>Progress</span>
                    <strong>{progress.percent}%</strong>
                  </div>
                  <div className="degree-progress-track" aria-hidden="true">
                    <div className="degree-progress-bar" style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>

                {saveMessage ? (
                  <p className={`degree-save-message${messageType ? ` ${messageType}` : ""}`} aria-live="polite">
                    {saveMessage}
                  </p>
                ) : null}

                <div className="degree-requirements-grid" aria-live="polite">
                  {loading ? (
                    <div className="degree-empty-state">
                      <h3>Loading requirements</h3>
                      <p>Checking your saved account major.</p>
                    </div>
                  ) : !major ? (
                    <div className="degree-empty-state">
                      <h3>No major selected</h3>
                      <p>Go to Account Details, choose your major, then return to this page.</p>
                    </div>
                  ) : !plan ? (
                    <div className="degree-empty-state">
                      <h3>Requirements not found</h3>
                      <p>Requirements were not found for {major} yet.</p>
                    </div>
                  ) : (
                    plan.groups.map((group, groupIndex) => (
                      <article className="degree-requirement-group" key={`${groupIndex}-${group.title}`}>
                        <div className="degree-requirement-group-head">
                          <span>{group.scope}</span>
                          <h3>{group.title}</h3>
                          {group.description ? <p>{group.description}</p> : null}
                        </div>

                        {group.items.length ? (
                          <RequirementList
                            items={group.items}
                            keyPrefix={String(groupIndex)}
                            creditGroup={group.creditGroup}
                            creditCap={group.creditCap}
                            completedKeys={completedKeys}
                            onToggle={toggleRequirement}
                          />
                        ) : null}

                        {group.subgroups?.length ? (
                          <div className="degree-requirement-subgroups">
                            {group.subgroups.map((subgroup, subgroupIndex) => (
                              <RequirementSubgroup
                                subgroup={subgroup}
                                group={group}
                                groupIndex={groupIndex}
                                subgroupIndex={subgroupIndex}
                                completedKeys={completedKeys}
                                onToggle={toggleRequirement}
                                key={`${groupIndex}-${subgroupIndex}-${subgroup.title}`}
                              />
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>

                {plan?.note ? <p className="degree-note">{plan.note}</p> : null}
              </article>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
