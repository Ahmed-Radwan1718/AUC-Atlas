function getCatalogDepartment(code) {
  const subject = code.split(" ")[0];

  return {
    BADM: "Business",
    CHEM: "Chemistry",
    CSCE: "Computer Science",
    ENGR: "Engineering",
    ENTR: "Entrepreneurship",
    MACT: "Mathematics",
    MENG: "Mechanical Engineering",
    PHYS: "Physics"
  }[subject] || "General";
}

function getCatalogLevel(code) {
  const match = code.match(/\d/);
  return match ? `${match[0]}000` : "1000";
}

function createCatalogCourse(code, title) {
  const department = getCatalogDepartment(code);

  return {
    code,
    title,
    department,
    level: getCatalogLevel(code),
    summary: `${title} in the ${department} catalog, ready for professor notes, materials, and student reviews.`,
    professors: [
      {
        id: `${code.toLowerCase().replace(/\s+/g, "-")}-staff`,
        name: "Course Staff",
        note: "Professor information, materials, and reviews can be added as students contribute.",
        rating: null,
        materials: [],
        reviews: []
      }
    ]
  };
}

function parseCatalogCourses(courseText) {
  return courseText
    .trim()
    .split("\n")
    .map((line) => line.split("|"))
    .map(([code, title]) => createCatalogCourse(code.trim(), title.trim()));
}

const courses = [
  {
    code: "CSCE 1101",
    title: "Introduction to Computer Science",
    department: "Computer Science",
    level: "1000",
    summary: "Programming fundamentals, problem solving, and the first serious step into computing at AUC.",
    professors: [
      {
        id: "leila-hassan",
        name: "Dr. Leila Hassan",
        note: "Known for structured lectures, clear examples, and steady weekly practice.",
        rating: 4.7,
        materials: [
          { title: "Python midterm review notes", type: "Notes", uploader: "Student upload", term: "Fall 2025" },
          { title: "Practice problems set", type: "Practice", uploader: "Student upload", term: "Spring 2026" }
        ],
        reviews: [
          { rating: 5, author: "Anonymous student", term: "Fall 2025", text: "Very clear explanations and exams that match the practice style." },
          { rating: 4, author: "Anonymous student", term: "Spring 2026", text: "Assignments take time, but the course feels organized." }
        ]
      },
      {
        id: "omar-nassar",
        name: "Dr. Omar Nassar",
        note: "Fast-paced lectures with useful office hours and practical coding examples.",
        rating: 4.2,
        materials: [
          { title: "Lecture slides collection", type: "Slides", uploader: "Student upload", term: "Fall 2025" }
        ],
        reviews: [
          { rating: 4, author: "Anonymous student", term: "Fall 2025", text: "Good if you keep up every week. Office hours helped a lot." }
        ]
      }
    ]
  },
  {
    code: "RHET 1020",
    title: "Research Writing",
    department: "Rhetoric",
    level: "1000",
    summary: "Academic writing, source evaluation, argument building, and research paper structure.",
    professors: [
      {
        id: "mariam-fahmy",
        name: "Dr. Mariam Fahmy",
        note: "Detailed feedback, organized milestones, and a calm writing workshop style.",
        rating: 4.8,
        materials: [
          { title: "Research paper checklist", type: "Guide", uploader: "Student upload", term: "Spring 2026" },
          { title: "Annotated bibliography template", type: "Template", uploader: "Student upload", term: "Fall 2025" }
        ],
        reviews: [
          { rating: 5, author: "Anonymous student", term: "Spring 2026", text: "Feedback was specific and made the final paper much stronger." }
        ]
      }
    ]
  },
  {
    code: "ECON 2011",
    title: "Introduction to Macroeconomics",
    department: "Economics",
    level: "2000",
    summary: "GDP, inflation, monetary policy, fiscal policy, and the logic behind economic indicators.",
    professors: [
      {
        id: "karim-adel",
        name: "Dr. Karim Adel",
        note: "Concept-heavy lectures with exams that reward practice and clean definitions.",
        rating: 4.1,
        materials: [
          { title: "Final formula sheet", type: "Notes", uploader: "Student upload", term: "Fall 2025" }
        ],
        reviews: [
          { rating: 4, author: "Anonymous student", term: "Fall 2025", text: "Exams were fair if you understood the graphs and practiced problems." }
        ]
      }
    ]
  },
  {
    code: "MATH 1110",
    title: "Calculus I",
    department: "Mathematics",
    level: "1000",
    summary: "Limits, derivatives, applications, and the mathematical foundation for science and engineering tracks.",
    professors: [
      {
        id: "nadine-salem",
        name: "Dr. Nadine Salem",
        note: "Precise explanations, tough quizzes, and very useful review sessions.",
        rating: 4.4,
        materials: [
          { title: "Derivative rules sheet", type: "Notes", uploader: "Student upload", term: "Spring 2026" },
          { title: "Quiz review packet", type: "Practice", uploader: "Student upload", term: "Spring 2026" }
        ],
        reviews: [
          { rating: 4, author: "Anonymous student", term: "Spring 2026", text: "The course is demanding, but the review sessions make a difference." },
          { rating: 5, author: "Anonymous student", term: "Fall 2025", text: "Very fair grading and strong explanations." }
        ]
      }
    ]
  },
  ...parseCatalogCourses(`
CHEM 1006|General Chemistry II
CHEM 1016|General Chemistry II-Laboratory
CHEM 2003|Organic Chemistry I
CHEM 2006|Analytical Chemistry I
CHEM 2013|Organic Chemistry I Laboratory
CHEM 2016|Volumetric and Gravimetric Analysis
CHEM 3003|Thermodynamics
CHEM 3004|Physical Chemistry I
CHEM 3005|Principles of Chemical Modeling
CHEM 3006|Organic Chemistry II
CHEM 3009|Inorganic Chemistry I
CHEM 3011|Analytical Chemistry II
CHEM 3012|Analytical Chemistry II Laboratory
CHEM 3013|Thermodynamics Laboratory
CHEM 3014|Physical Chemistry I Laboratory
CHEM 3015|Biochemistry
CHEM 3016|Organic Chemistry II Laboratory
CHEM 3018|Inorganic Chemistry Laboratory
CHEM 3940|Seminar in Science and Technology
CHEM 4003|Physical Chemistry II
CHEM 4004|Physical Chemistry III
CHEM 4006|Organic Chemistry III
CHEM 4008|Inorganic Chemistry II
CHEM 4013|Physical Chemistry II Laboratory
CHEM 4016|Organic Syntheses
CHEM 4980|Senior Thesis I
CHEM 4981|Senior Thesis II
BADM 2001|Introduction to Business
CSCE 1001|Fundamentals of Computing I
ENTR 3102|Entrepreneurship and Innovation
MACT 1121|Calculus I
CHEM 3522|Production Basics for Chemical Industries
CHEM 3523|Chemistry of Petrochemical Processes
CHEM 4524|Polymer Chemistry and Technology
CHEM 2020|Introduction to Food Science and Technology
CHEM 3020|Food Chemistry
CHEM 4007|Food Processing and Preservation
CHEM 3002|Archaeological Chemistry I
CHEM 3910|Guided Studies in Environmental Sciences
CHEM 4910|Independent Study
CHEM 4930|Selected Topics in Chemistry
CHEM 4005|Industrial Chemistry
CHEM 4900|Chemistry Practical Internship
CHEM 1005|General Chemistry I
CHEM 1015|General Chemistry I-Laboratory
ENGR 1005|Descriptive Geometry and Engineering Drawing
ENGR 2102|Engineering Mechanics I (Statics)
ENGR 2104|Engineering Mechanics II (Dynamics)
ENGR 3202|Engineering Analysis and Computation I
ENGR 3212|General Electrical Engineering
ENGR 3222|Engineering Economy
MACT 1122|Calculus II
MACT 2123|Calculus III
MACT 2141|Differential Equations
MACT 3224|Probability and Statistics
MENG 2112|Strength of Materials
MENG 2202|Introduction to Computational Thinking and Programming for Engineers Lab
MENG 2505|Mechanical Engineering Drawing
MENG 2601|Fluid Mechanics Fundamentals
MENG 3207|Engineering Materials
MENG 3209|Fundamentals of Manufacturing Processes
MENG 3217|Mechanical and Structural Behavior of Engineering Materials Lab
MENG 3402|Quality and Process Control
MENG 3446|Engineering and Project Management
MENG 3502|Mechanical Systems
MENG 3505|Mechanics of Materials
MENG 3506|Mechanical Design I
MENG 3601|Fundamentals of Thermodynamics
MENG 3602|Applied Fluid Mechanics
MENG 3605|Applied Thermodynamics
MENG 3705|System Dynamics
MENG 4208|Selection of Materials and Processes for Design
MENG 4221|Composites: Design, Materials, and Manufacturing
MENG 4226|Metals, Alloys and Composites
MENG 4227|Failure of Mechanical Components
MENG 4229|Nanostructured Materials
MENG 4232|Materials, Processing, and Design
MENG 4239|Advanced Manufacturing Processes
MENG 4440|Engineering Operations Research
MENG 4441|Decision Support in Engineering Systems
MENG 4442|Reliability Engineering and Risk Analysis
MENG 4443|Systems Simulation
MENG 4444|Work Analysis and Design
MENG 4445|Production and Inventory Control
MENG 4448|Facilities Planning
MENG 4449|Maintenance Management Systems
MENG 4477|Manufacturing System Automation
MENG 4507|Mechanical Design II
MENG 4551|Design for Additive Manufacturing
MENG 4553|Finite Element Method and Applications in Design
MENG 4555|Applied Vibration Measurements, Analysis and Control
MENG 4558|Integrated Design
MENG 4565|Design of Engineering Systems
MENG 4606|Heat Transfer
MENG 4661|Turbo-Machinery
MENG 4662|Power Plant Technology
MENG 4663|Design of Renewable Energy Systems
MENG 4665|Internal Combustion Engines
MENG 4666|Design of Heating, Ventilation, and Air Conditioning Systems
MENG 4667|Refrigeration and Air-conditioning
MENG 4756|Automatic Control Systems
MENG 4757|Robotics: Design, Analysis and Control
MENG 4778|Microcontrollers and Mechatronics Systems
MENG 4779|Integrated Design of Electromechanical Systems
MENG 4930|Selected Topics in Industrial Engineering
MENG 4931|Selected Topics in Design
MENG 4932|Selected Topics in Materials and Manufacturing
MENG 4936|Selected Topics in Power Engineering
MENG 4937|Selected Topics in Mechatronics
MENG 4950|Industrial Training
MENG 4980|Senior Project I
MENG 4981|Senior Project II
MENG 5168|Nuclear Power Plant Engineering
PHYS 1011|Physics 1: Classical Mechanics, Sound and Heat
PHYS 1012|General Physics Laboratory I
PHYS 1021|Physics 2: Electricity and Magnetism
PHYS 1022|General Physics Laboratory II
PHYS 2216|Fundamentals of Circuits and Electronics
PHYS 2217|Fundamentals of Circuits and Electronics Lab
`)
];

const state = {
  query: "",
  department: "All",
  selectedCourseCode: courses[0].code,
  selectedProfessorId: courses[0].professors[0].id
};

const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const departmentFilter = document.getElementById("departmentFilter");
const courseList = document.getElementById("courseList");
const courseCount = document.getElementById("courseCount");
const courseDetails = document.getElementById("courseDetails");

const previewDepartment = document.getElementById("previewDepartment");
const previewCode = document.getElementById("previewCode");
const previewTitle = document.getElementById("previewTitle");
const previewMeta = document.getElementById("previewMeta");

function getCourseStats(course) {
  const materialCount = course.professors.reduce((total, professor) => total + professor.materials.length, 0);
  const reviewCount = course.professors.reduce((total, professor) => total + professor.reviews.length, 0);

  return {
    professorCount: course.professors.length,
    materialCount,
    reviewCount
  };
}

function getDepartments() {
  return ["All", ...new Set(courses.map((course) => course.department))];
}

function courseMatchesSearch(course) {
  const query = state.query.trim().toLowerCase();

  if (!query) {
    return true;
  }

  const professorNames = course.professors.map((professor) => professor.name).join(" ");
  const materialTitles = course.professors
    .flatMap((professor) => professor.materials)
    .map((material) => material.title)
    .join(" ");

  return `${course.code} ${course.title} ${course.department} ${professorNames} ${materialTitles}`
    .toLowerCase()
    .includes(query);
}

function getFilteredCourses() {
  return courses.filter((course) => {
    const matchesDepartment = state.department === "All" || course.department === state.department;
    return matchesDepartment && courseMatchesSearch(course);
  });
}

function renderDepartmentFilters() {
  departmentFilter.innerHTML = getDepartments()
    .map((department) => `
      <button class="filter-button ${department === state.department ? "active" : ""}" type="button" data-department="${department}">
        ${department}
      </button>
    `)
    .join("");

  departmentFilter.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.department = button.dataset.department;
      render();
    });
  });
}

function renderCourses(filteredCourses) {
  courseCount.textContent = `${filteredCourses.length} course${filteredCourses.length === 1 ? "" : "s"}`;

  if (!filteredCourses.length) {
    courseList.innerHTML = '<p class="no-results">No courses match this search yet.</p>';
    courseDetails.innerHTML = '<p class="empty-state">Try a different course, department, professor, or material keyword.</p>';
    return;
  }

  if (!filteredCourses.some((course) => course.code === state.selectedCourseCode)) {
    state.selectedCourseCode = filteredCourses[0].code;
    state.selectedProfessorId = filteredCourses[0].professors[0].id;
  }

  courseList.innerHTML = filteredCourses
    .map((course) => {
      const stats = getCourseStats(course);

      return `
        <button class="course-card ${course.code === state.selectedCourseCode ? "active" : ""}" type="button" data-course-code="${course.code}">
          <div class="course-card-top">
            <div>
              <p class="course-code">${course.code}</p>
              <h3 class="course-title">${course.title}</h3>
            </div>
            <span class="course-department">${course.level}</span>
          </div>

          <p class="course-summary">${course.summary}</p>

          <div class="course-meta">
            <span>${stats.professorCount} professor${stats.professorCount === 1 ? "" : "s"}</span>
            <span>${stats.materialCount} material${stats.materialCount === 1 ? "" : "s"}</span>
            <span>${stats.reviewCount} review${stats.reviewCount === 1 ? "" : "s"}</span>
          </div>
        </button>
      `;
    })
    .join("");

  courseList.querySelectorAll(".course-card").forEach((card) => {
    card.addEventListener("click", () => {
      const course = courses.find((item) => item.code === card.dataset.courseCode);

      state.selectedCourseCode = course.code;
      state.selectedProfessorId = course.professors[0].id;
      render();
    });
  });
}

function renderCourseDetails() {
  const course = courses.find((item) => item.code === state.selectedCourseCode);

  if (!course) {
    courseDetails.innerHTML = '<p class="empty-state">Select a course to view professors, materials, and reviews.</p>';
    return;
  }

  if (!course.professors.some((professor) => professor.id === state.selectedProfessorId)) {
    state.selectedProfessorId = course.professors[0].id;
  }

  const professor = course.professors.find((item) => item.id === state.selectedProfessorId);
  const stats = getCourseStats(course);

  previewDepartment.textContent = course.department;
  previewCode.textContent = course.code;
  previewTitle.textContent = course.title;
  previewMeta.textContent = `${stats.professorCount} professors - ${stats.materialCount} materials - ${stats.reviewCount} reviews`;

  courseDetails.innerHTML = `
    <article class="course-details">
      <div class="details-header">
        <div class="details-header-row">
          <div>
            <p class="details-label">${course.code}</p>
            <h2>${course.title}</h2>
          </div>
          <span class="course-department">${course.department}</span>
        </div>
        <p class="details-summary">${course.summary}</p>
      </div>

      <div class="professor-picker" aria-label="Professors for ${course.code}">
        ${course.professors.map((item) => `
          <button class="professor-tab ${item.id === professor.id ? "active" : ""}" type="button" data-professor-id="${item.id}">
            ${item.name}
          </button>
        `).join("")}
      </div>

      <section class="professor-sheet">
        <div class="professor-sheet-top">
          <div>
            <h3>${professor.name}</h3>
            <p>${professor.note}</p>
          </div>
          <div class="rating-badge">
            <strong>${typeof professor.rating === "number" ? professor.rating.toFixed(1) : "N/A"}</strong>
            <span>In ${course.code}</span>
          </div>
        </div>

        <div class="detail-columns">
          <div class="detail-column">
            <h4>Student materials</h4>
            <ul class="material-list">
              ${professor.materials.map((material) => `
                <li>
                  <strong>${material.title}</strong>
                  <span>${material.type} - ${material.uploader} - ${material.term}</span>
                </li>
              `).join("")}
            </ul>
          </div>

          <div class="detail-column">
            <h4>Course-specific reviews</h4>
            <ul class="review-list">
              ${professor.reviews.map((review) => `
                <li>
                  <strong>${review.rating}/5 - ${review.term}</strong>
                  <span>${review.text}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        </div>
      </section>
    </article>
  `;

  courseDetails.querySelectorAll(".professor-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedProfessorId = button.dataset.professorId;
      renderCourseDetails();
    });
  });
}

function render() {
  clearSearch.hidden = state.query.length === 0;
  renderDepartmentFilters();

  const filteredCourses = getFilteredCourses();
  renderCourses(filteredCourses);
  renderCourseDetails();
}

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  render();
});

clearSearch.addEventListener("click", () => {
  state.query = "";
  searchInput.value = "";
  searchInput.focus();
  render();
});

render();
