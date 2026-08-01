(function () {
  const courseEntries = [
    ["CHEM 1005", "General Chemistry I"],
    ["CHEM 1015", "General Chemistry I-Laboratory"],
    ["ENGR 1005", "Descriptive Geometry and Engineering Drawing"],
    ["ENGR 2102", "Engineering Mechanics I (Statics)"],
    ["ENGR 2104", "Engineering Mechanics II (Dynamics)"],
    ["ENGR 3202", "Engineering Analysis and Computation I"],
    ["ENGR 3212", "General Electrical Engineering"],
    ["ENGR 3222", "Engineering Economy"],
    ["MACT 1122", "Calculus II"],
    ["MACT 2123", "Calculus III"],
    ["MACT 2141", "Differential Equations"],
    ["MACT 3224", "Probability and Statistics"],
    ["MENG 2112", "Strength of Materials"],
    ["MENG 2202", "Introduction to Computational Thinking and Programming for Engineers Lab"],
    ["MENG 2505", "Mechanical Engineering Drawing"],
    ["MENG 2601", "Fluid Mechanics Fundamentals"],
    ["MENG 3207", "Engineering Materials"],
    ["MENG 3209", "Fundamentals of Manufacturing Processes"],
    ["MENG 3217", "Mechanical and Structural Behavior of Engineering Materials Lab"],
    ["MENG 3402", "Quality and Process Control"],
    ["MENG 3446", "Engineering and Project Management"],
    ["MENG 3502", "Mechanical Systems"],
    ["MENG 3505", "Mechanics of Materials"],
    ["MENG 3506", "Mechanical Design I"],
    ["MENG 3601", "Fundamentals of Thermodynamics"],
    ["MENG 3602", "Applied Fluid Mechanics"],
    ["MENG 3605", "Applied Thermodynamics"],
    ["MENG 3705", "System Dynamics"],
    ["MENG 4208", "Selection of Materials and Processes for Design"],
    ["MENG 4221", "Composites: Design, Materials, and Manufacturing"],
    ["MENG 4226", "Metals, Alloys and Composites"],
    ["MENG 4227", "Failure of Mechanical Components"],
    ["MENG 4229", "Nanostructured Materials"],
    ["MENG 4232", "Materials, Processing, and Design"],
    ["MENG 4239", "Advanced Manufacturing Processes"],
    ["MENG 4440", "Engineering Operations Research"],
    ["MENG 4441", "Decision Support in Engineering Systems"],
    ["MENG 4442", "Reliability Engineering and Risk Analysis"],
    ["MENG 4443", "Systems Simulation"],
    ["MENG 4444", "Work Analysis and Design"],
    ["MENG 4445", "Production and Inventory Control"],
    ["MENG 4448", "Facilities Planning"],
    ["MENG 4449", "Maintenance Management Systems"],
    ["MENG 4477", "Manufacturing System Automation"],
    ["MENG 4507", "Mechanical Design II"],
    ["MENG 4551", "Design for Additive Manufacturing"],
    ["MENG 4553", "Finite Element Method and Applications in Design"],
    ["MENG 4555", "Applied Vibration Measurements, Analysis and Control"],
    ["MENG 4558", "Integrated Design"],
    ["MENG 4565", "Design of Engineering Systems"],
    ["MENG 4606", "Heat Transfer"],
    ["MENG 4661", "Turbo-Machinery"],
    ["MENG 4662", "Power Plant Technology"],
    ["MENG 4663", "Design of Renewable Energy Systems"],
    ["MENG 4665", "Internal Combustion Engines"],
    ["MENG 4666", "Design of Heating, Ventilation, and Air Conditioning Systems"],
    ["MENG 4667", "Refrigeration and Air-conditioning"],
    ["MENG 4756", "Automatic Control Systems"],
    ["MENG 4757", "Robotics: Design, Analysis and Control"],
    ["MENG 4778", "Microcontrollers and Mechatronics Systems"],
    ["MENG 4779", "Integrated Design of Electromechanical Systems"],
    ["MENG 4930", "Selected Topics in Industrial Engineering"],
    ["MENG 4931", "Selected Topics in Design"],
    ["MENG 4932", "Selected Topics in Materials and Manufacturing"],
    ["MENG 4936", "Selected Topics in Power Engineering"],
    ["MENG 4937", "Selected Topics in Mechatronics"],
    ["MENG 4950", "Industrial Training"],
    ["MENG 4980", "Senior Project I"],
    ["MENG 4981", "Senior Project II"],
    ["MENG 5168", "Nuclear Power Plant Engineering"],
    ["PHYS 1011", "Physics 1: Classical Mechanics, Sound and Heat"],
    ["PHYS 1012", "General Physics Laboratory I"],
    ["PHYS 1021", "Physics 2: Electricity and Magnetism"],
    ["PHYS 1022", "General Physics Laboratory II"],
    ["PHYS 2216", "Fundamentals of Circuits and Electronics"],
    ["PHYS 2217", "Fundamentals of Circuits and Electronics Lab"],
    ["CHEM 1006", "General Chemistry II"],
    ["CHEM 1016", "General Chemistry II-Laboratory"],
    ["CHEM 2003", "Organic Chemistry I"],
    ["CHEM 2006", "Analytical Chemistry I"],
    ["CHEM 2013", "Organic Chemistry I Laboratory"],
    ["CHEM 2016", "Volumetric and Gravimetric Analysis"],
    ["CHEM 3003", "Thermodynamics"],
    ["CHEM 3004", "Physical Chemistry I"],
    ["CHEM 3005", "Principles of Chemical Modeling"],
    ["CHEM 3006", "Organic Chemistry II"],
    ["CHEM 3009", "Inorganic Chemistry I"],
    ["CHEM 3011", "Analytical Chemistry II"],
    ["CHEM 3012", "Analytical Chemistry II Laboratory"],
    ["CHEM 3013", "Thermodynamics Laboratory"],
    ["CHEM 3014", "Physical Chemistry I Laboratory"],
    ["CHEM 3015", "Biochemistry"],
    ["CHEM 3016", "Organic Chemistry II Laboratory"],
    ["CHEM 3018", "Inorganic Chemistry Laboratory"],
    ["CHEM 3940", "Seminar in Science and Technology"],
    ["CHEM 4003", "Physical Chemistry II"],
    ["CHEM 4004", "Physical Chemistry III"],
    ["CHEM 4006", "Organic Chemistry III"],
    ["CHEM 4008", "Inorganic Chemistry II"],
    ["CHEM 4013", "Physical Chemistry II Laboratory"],
    ["CHEM 4016", "Organic Syntheses"],
    ["CHEM 4980", "Senior Thesis I"],
    ["CHEM 4981", "Senior Thesis II"],
    ["BADM 2001", "Introduction to Business"],
    ["CSCE 1001", "Fundamentals of Computing I"],
    ["ENTR 3102", "Entrepreneurship and Innovation"],
    ["MACT 1121", "Calculus I"],
    ["CHEM 3522", "Production Basics for Chemical Industries"],
    ["CHEM 3523", "Chemistry of Petrochemical Processes"],
    ["CHEM 4524", "Polymer Chemistry and Technology"],
    ["CHEM 2020", "Introduction to Food Science and Technology"],
    ["CHEM 3020", "Food Chemistry"],
    ["CHEM 4007", "Food Processing and Preservation"],
    ["CHEM 3002", "Archaeological Chemistry I"],
    ["CHEM 3910", "Guided Studies in Environmental Sciences"],
    ["CHEM 4910", "Independent Study"],
    ["CHEM 4930", "Selected Topics in Chemistry"],
    ["CHEM 4005", "Industrial Chemistry"],
    ["CHEM 4900", "Chemistry Practical Internship"]
  ];

  const subjectLabels = {
    BADM: "Business",
    CHEM: "Chemistry",
    CSCE: "Computer Science",
    ENGR: "Engineering",
    ENTR: "Entrepreneurship",
    MACT: "Mathematics",
    MENG: "Mechanical Engineering",
    PHYS: "Physics"
  };

  const courses = courseEntries.map(function (entry) {
    const subject = entry[0].split(" ")[0];
    const number = entry[0].split(" ")[1] || "";

    return {
      code: entry[0],
      title: entry[1],
      subject: subject,
      department: subjectLabels[subject] || subject,
      level: number.charAt(0) + "000 Level"
    };
  });

  window.aucAtlasCourses = courses;

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function getCheckedSubjects() {
    return Array.from(document.querySelectorAll("[data-course-subject]:checked")).map(function (input) {
      return input.value;
    });
  }

  function renderSubjectFilters() {
    const filtersRoot = document.getElementById("course-subject-filters");

    if (!filtersRoot) {
      return;
    }

    const subjects = Array.from(new Set(courses.map(function (course) {
      return course.subject;
    }))).sort();

    filtersRoot.innerHTML = subjects.map(function (subject) {
      return `
        <label class="course-filter-pill">
          <input type="checkbox" value="${subject}" data-course-subject>
          <span>${subject}</span>
        </label>
      `;
    }).join("");

    filtersRoot.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("change", renderCourses);
    });
  }

  function courseMatches(course) {
    const query = normalize(document.getElementById("course-search-input").value);
    const selectedSubjects = getCheckedSubjects();
    const searchableText = normalize([course.code, course.title, course.subject, course.department, course.level].join(" "));

    return (!query || searchableText.includes(query)) && (!selectedSubjects.length || selectedSubjects.includes(course.subject));
  }

  function renderCourses() {
    const grid = document.getElementById("courses-grid");
    const count = document.getElementById("courses-result-count");

    if (!grid) {
      return;
    }

    const visibleCourses = courses.filter(courseMatches);

    if (count) {
      count.textContent = visibleCourses.length + " courses";
    }

    grid.innerHTML = visibleCourses.map(function (course) {
      return `
        <article class="course-card">
          <div>
            <span class="course-code">${course.code}</span>
            <h2>${course.title}</h2>
          </div>
          <div class="course-card-meta">
            <span>${course.department}</span>
            <span>${course.level}</span>
          </div>
        </article>
      `;
    }).join("");

    if (!visibleCourses.length) {
      grid.innerHTML = '<p class="courses-empty">No courses match those filters.</p>';
    }
  }

  function setupCoursesPage() {
    renderSubjectFilters();

    const searchInput = document.getElementById("course-search-input");

    if (searchInput) {
      searchInput.addEventListener("input", renderCourses);
    }

    renderCourses();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCoursesPage);
  } else {
    setupCoursesPage();
  }
})();
