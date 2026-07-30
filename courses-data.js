(function (root) {
  const courseDetails = {
    "RHET 1020": {
      title: "Research Writing",
      summary: "Research writing, source evaluation, argument building, and long-form academic papers.",
      professors: [
        { id: "laila-el-serty", courseNote: "Linked as Rhetoric faculty context for research writing sections." },
        { id: "gretchen-mccullough", courseNote: "Linked as Rhetoric faculty context for writing-heavy sections." },
        { id: "kathleen-saville", courseNote: "Linked as Rhetoric faculty context for writing-heavy sections." },
        { id: "fikry-boutros", courseNote: "Linked as Rhetoric faculty context for writing-heavy sections." }
      ],
      materials: [],
      materialRequests: ["Research paper checklists", "Annotated bibliography examples", "Outline templates", "Final paper notes"]
    },

    "CHEM 1005": {
      title: "General Chemistry I",
      summary: "General chemistry foundations, atomic structure, bonding, reactions, and quantitative problem solving.",
      professors: [
        { id: "ehab-el-sawy", courseNote: "Linked as Chemistry faculty context." },
        { id: "tamer-shoeib", courseNote: "Linked as Chemistry faculty context." },
        { id: "hassan-azzazy", courseNote: "Linked as Chemistry faculty context." }
      ],
      materials: [],
      materialRequests: ["Lecture notes", "Lab prep notes", "Problem sets", "Past exam reviews"]
    },

    "CHEM 1006": {
      title: "General Chemistry II",
      summary: "Second general chemistry course covering equilibrium, thermodynamics, kinetics, and applied problem solving.",
      professors: [
        { id: "ehab-el-sawy", courseNote: "Linked as Chemistry faculty context." },
        { id: "tamer-shoeib", courseNote: "Linked as Chemistry faculty context." },
        { id: "hassan-azzazy", courseNote: "Linked as Chemistry faculty context." }
      ],
      materials: [],
      materialRequests: ["Formula sheets", "Recitation notes", "Past exams", "Lab summaries"]
    },

    "MACT 1121": {
      title: "Calculus I",
      summary: "Calculus I foundations, limits, derivatives, and applications for science and engineering tracks.",
      professors: [
        { id: "eslam-badr", courseNote: "Linked as Mathematics faculty context." },
        { id: "wafik-lotfallah", courseNote: "Linked as Mathematics faculty context." }
      ],
      materials: [],
      materialRequests: ["Derivative rule sheets", "Quiz review packets", "Practice problems", "Final review notes"]
    },

    "PHYS 1011": {
      title: "Physics 1: Classical Mechanics, Sound and Heat",
      summary: "Classical mechanics, sound, heat, and physics problem solving for science and engineering students.",
      professors: [
        { id: "nageh-allam", courseNote: "Linked as Physics faculty context." }
      ],
      materials: [],
      materialRequests: ["Formula sheets", "Problem walkthroughs", "Lab notes", "Past exam reviews"]
    },

    "MENG 3446": {
      title: "Engineering and Project Management",
      summary: "Engineering and project management concepts for planning, execution, risk, and delivery.",
      professors: [
        { id: "ibrahim-abotaleb", courseNote: "Linked as engineering management faculty context." },
        { id: "mohamed-badran", courseNote: "Linked as engineering systems faculty context." }
      ],
      materials: [],
      materialRequests: ["Project templates", "Case study notes", "Exam summaries", "Presentation examples"]
    },

    "CSCE 1101": {
      title: "Introduction to Computer Science",
      summary: "Introductory computing, programming fundamentals, and structured problem solving.",
      professors: [],
      materials: [],
      materialRequests: ["Python notes", "Practice problems", "Lab walkthroughs", "Midterm reviews"]
    }
  };

  if (root) {
    root.AUC_ATLAS_COURSE_DETAILS = courseDetails;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = courseDetails;
  }
})(typeof window !== "undefined" ? window : globalThis);
