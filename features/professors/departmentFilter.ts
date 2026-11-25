type DepartmentRecord = { department?: string };

export const unassignedDepartment = "Department not assigned";

export function professorDepartment(professor: DepartmentRecord): string {
  return professor.department?.trim() || unassignedDepartment;
}

export function professorDepartmentChoices(professors: readonly DepartmentRecord[]): string[] {
  const assigned = new Set<string>();
  let hasUnassigned = false;
  for (const professor of professors) {
    const department = professorDepartment(professor);
    if (department === unassignedDepartment) hasUnassigned = true;
    else assigned.add(department);
  }
  const choices = [...assigned].sort((a, b) => a.localeCompare(b, "en"));
  return hasUnassigned ? [...choices, unassignedDepartment] : choices;
}

export function matchesProfessorDepartment(professor: DepartmentRecord, selected: readonly string[]): boolean {
  return selected.length === 0 || selected.includes(professorDepartment(professor));
}
