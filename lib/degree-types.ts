export type DegreeRequirementSubgroup = {
  title: string;
  items: string[];
  creditGroup?: string;
  creditCap?: number;
};

export type DegreeRequirementGroup = {
  scope: string;
  title: string;
  description?: string;
  items: string[];
  subgroups?: DegreeRequirementSubgroup[];
  creditGroup?: string;
  creditCap?: number;
};

export type DegreePlan = {
  note: string;
  groups: DegreeRequirementGroup[];
};

export type DegreeRequirements = Record<string, DegreePlan>;
