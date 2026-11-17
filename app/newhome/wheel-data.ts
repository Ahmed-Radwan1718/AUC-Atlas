export type SchoolId = "library" | "business" | "engineering" | "sciences" | "humanities";
export type WheelItem = { name: string; short: string; href?: string };

// The school assignments use names already present in AUC Atlas's degree-plan
// catalog. Compact wedge labels only shorten the visible display name.
export const SCHOOL_NAMES: Record<SchoolId, string> = {
  business: "School of Business",
  engineering: "Engineering",
  sciences: "Sciences",
  humanities: "Humanities & Social Sciences",
  library: "AUC Library",
};
export const SCHOOL_ITEMS: Record<SchoolId, WheelItem[]> = {
  business: [
    { name: "Business and Entrepreneurship", short: "Entrepreneurship" },
    { name: "Business in Finance", short: "Finance" },
    { name: "Business in Marketing", short: "Marketing" },
    { name: "Accounting", short: "Accounting" },
    { name: "Management of Information and Communication Technology", short: "ICT Mgmt." },
  ],
  // These are navigation groupings within AUC's School of Sciences and Engineering.
  // Each group fits on one wheel page (eight majors maximum).
  engineering: [
    { name: "Mechanical Engineering", short: "Mechanical Engineering" },
    { name: "Computer Engineering", short: "Computer Engineering" },
    { name: "Electronics and Communications Engineering", short: "Electronics and Communications Engineering" },
    { name: "Construction Engineering", short: "Construction Engineering" },
    { name: "Petroleum Engineering", short: "Petroleum Engineering" },
    { name: "Architecture", short: "Architecture" },
  ],
  sciences: [
    { name: "Computer Science", short: "Computer Science" },
    { name: "Data Science", short: "Data Science" },
    { name: "Mathematics", short: "Mathematics" },
    { name: "Physics", short: "Physics" },
    { name: "Chemistry", short: "Chemistry" },
    { name: "Biology", short: "Biology" },
    { name: "Actuarial Science", short: "Actuarial Science" },
  ],
  humanities: [
    { name: "Political Science", short: "Political Science" },
    { name: "Psychology", short: "Psychology" },
    { name: "Economics", short: "Economics" },
    { name: "Sociology", short: "Sociology" },
    { name: "Anthropology", short: "Anthropology" },
    { name: "History", short: "History" },
    { name: "Philosophy", short: "Philosophy" },
    { name: "Middle East Studies", short: "Middle East Studies" },
    { name: "Egyptology", short: "Egyptology" },
    { name: "Arabic Studies", short: "Arabic Studies" },
    { name: "English and Comparative Literature", short: "English Lit." },
    { name: "Visual Arts", short: "Visual Arts" },
    { name: "Graphic Design", short: "Graphic Design" },
    { name: "Film", short: "Film" },
    { name: "Theatre", short: "Theatre" },
    { name: "Music", short: "Music" },
    { name: "Multimedia Communication and Journalism", short: "Journalism" },
    { name: "Integrated Marketing Communication", short: "Integrated Mktg." },
  ],
  library: [
    { name: "Browse all courses", short: "All Courses", href: "/courses" },
    { name: "Student materials", short: "Materials", href: "/courses" },
    { name: "Professors", short: "Professors", href: "/professors" },
  ],
};
