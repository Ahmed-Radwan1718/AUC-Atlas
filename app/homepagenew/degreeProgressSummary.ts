// Use the same requirement keys and credit-cap rules as the existing degree tracker.
// This is a read-only summary of the student's saved degree progress.
export type DegreeRequirementGroup = {
  items?: string[];
  creditGroup?: string;
  creditCap?: number;
  subgroups?: Array<{
    items?: string[];
    creditGroup?: string;
    creditCap?: number;
  }>;
};

export type DegreeProgressSummary = {
  totalCredits: number;
  completedCredits: number;
  remainingCredits: number;
  percent: number;
};

function creditsForItem(item: string): number {
  const match = String(item || "").match(/\(([^()]*(?:cr\.?)[^()]*)\)\s*$/i);
  if (!match) return 0;
  const creditText = match[1];
  const range = creditText.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) return Number(range[2]);
  return (creditText.match(/\d+(?:\.\d+)?/g) || [])
    .reduce((sum, value) => sum + Number(value), 0);
}

export function calculateDegreeProgress(
  groups: DegreeRequirementGroup[],
  savedCompletedKeys: readonly string[]
): DegreeProgressSummary {
  const completedKeys = new Set(savedCompletedKeys);
  const creditGroups = new Map<string, { cap: number; courses: Map<string, number> }>();
  let totalCredits = 0;
  let completedCredits = 0;

  function addItems(items: string[] | undefined, keyPrefix: string, creditGroup?: string, creditCap?: number) {
    if (!Array.isArray(items)) return;
    items.forEach((item, index) => {
      const credits = creditsForItem(item);
      const isCompleted = completedKeys.has(`${keyPrefix}-${index}`);

      if (!creditGroup) {
        totalCredits += credits;
        if (isCompleted) completedCredits += credits;
        return;
      }

      if (!creditGroups.has(creditGroup)) {
        creditGroups.set(creditGroup, {
          cap: Math.max(0, Number(creditCap || 0)),
          courses: new Map()
        });
      }

      if (isCompleted) {
        // A single course may appear in multiple elective groups but only counts once.
        const code = String(item || "").split(" - ")[0].trim().toUpperCase();
        const selected = creditGroups.get(creditGroup)!.courses;
        if (!selected.has(code)) selected.set(code, credits);
      }
    });
  }

  groups.forEach((group, groupIndex) => {
    addItems(group.items, String(groupIndex), group.creditGroup, group.creditCap);
    group.subgroups?.forEach((subgroup, subgroupIndex) => {
      addItems(
        subgroup.items,
        `${groupIndex}-${subgroupIndex}`,
        subgroup.creditGroup || group.creditGroup,
        subgroup.creditCap || group.creditCap
      );
    });
  });

  for (const { cap, courses } of creditGroups.values()) {
    totalCredits += cap;
    const selectedCredits = [...courses.values()].reduce((sum, credits) => sum + credits, 0);
    completedCredits += Math.min(selectedCredits, cap);
  }

  const remainingCredits = Math.max(totalCredits - completedCredits, 0);
  return {
    totalCredits,
    completedCredits,
    remainingCredits,
    percent: totalCredits ? Math.round((completedCredits / totalCredits) * 100) : 0
  };
}

export function formatDegreeCredits(credits: number): string {
  return Number.isInteger(credits) ? String(credits) : credits.toFixed(1).replace(/\.0$/, "");
}
