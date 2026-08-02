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
    ["CHEM 4900", "Chemistry Practical Internship"],
    ["ECON 2011", "Introduction to Microeconomics"],
    ["ECON 2021", "Introduction to Macroeconomics"],
    ["ECON 3041", "Monetary Economics"],
    ["MACT 2222", "Statistics for Business"],
    ["BADM 3003", "Decision Making for Sustainable Organizations"],
    ["BADM 4999", "Internship and Assessment"],
    ["MGMT 3301", "Business Law (Commercial & Fiscal)"],
    ["MKTG 2101", "Principles of Marketing"],
    ["FINC 2101", "Business Finance"],
    ["FINC 3201", "Investment Analysis"],
    ["FINC 3501", "International Finance"],
    ["FINC 4301", "Corporate Finance"],
    ["MOIS 2101", "Introduction to Information Systems/Technology"],
    ["ACCT 2001", "Financial Accounting"],
    ["ACCT 2002", "Managerial Accounting"],
    ["ACCT 3001", "Intermediate Accounting I"],
    ["ACCT 3002", "Intermediate Accounting II"],
    ["ACCT 3003", "Advanced Accounting"],
    ["ACCT 3004", "Cost Accounting"],
    ["ACCT 3005", "Auditing"],
    ["ACCT 3006", "Principles of Taxation"],
    ["ACCT 3007", "Accounting Analytics"],
    ["ACCT 4000", "Automated Financial Accounting"],
    ["ACCT 4001", "Contemporary Issues in Auditing and Forensic Accounting"],
    ["ACCT 4002", "Special Topics in Tax Accounting"],
    ["ACCT 4004", "Financial Statement Analysis and Sustainability Reporting"],
    ["ACCT 4005", "Contemporary Issues in Financial Reporting"],
    ["MACT 2132", "Linear Algebra"],
    ["MACT 3211", "Applied Probability"],
    ["MACT 3223", "Statistical Inference"],
    ["MACT 3311", "Introduction to Financial Mathematics"],
    ["MACT 4212", "Stochastic Processes"],
    ["MACT 4231", "Applied Regression Methods"],
    ["MACT 4232", "Analysis of Time Series Data"],
    ["MACT 4233", "Applied Multivariate Analysis"],
    ["MACT 4314", "Financial Modeling"],
    ["MACT 4321", "Long-Term Actuarial Mathematics I"],
    ["MACT 4322", "Long-Term Actuarial Mathematics II"],
    ["MACT 4323", "Advanced Long Term Actuarial Mathematics"],
    ["MACT 4331", "Short Term Actuarial Mathematics I"],
    ["MACT 4332", "Short Term Actuarial Mathematics II"],
    ["DSCI 1411", "Fundamentals of Data Science I"],
    ["DSCI 2410", "Fundamentals of Data Science II"],
    ["DSCI 2411", "Data Visualization"],
    ["ECON 3011", "Intermediate Microeconomic Theory"],
    ["ECON 3021", "Intermediate Macroeconomic Theory"],
    ["MACT 4950", "Practical Internship"],
    ["MACT 4980", "Senior Thesis"],
    ["CSCE 1101", "Fundamentals of Computing II"],
    ["CSCE 2501", "Fundamentals of Database Systems"],
    ["CSCE 4501", "Big Data Systems"],
    ["DSCI 3415", "Fundamentals of Machine Learning"],
    ["DSCI 4413", "Analysis of Categorical Data"],
    ["ECON 3081", "Introduction to Econometrics"],
    ["ECON 4031", "International Trade"],
    ["FINC 3401", "Applied Banking"],
    ["FINC 4204", "Portfolio Theory and its Applications"],
    ["MACT 3143", "Numerical Methods"],
    ["MACT 4910", "Guided Studies in Mathematics"],
    ["MACT 4930", "Selected Topics in Mathematics"],
    ["MACT 4931", "Selected Topics in Actuarial Science"],
    ["MACT 4990", "Enterprise Risk Management"],
    ["MGMT 3201", "Management Fundamentals"],
    ["MGMT 4202", "Managing the Human Capital"],
    ["MKTG 3201", "Marketing Research"],
    ["MOIS 3201", "Management Information Systems and Database Management"],
    ["MOIS 3601", "Intelligent Decision Support Systems"],
    ["ARCH 3231", "Building Performance"],
    ["ARCH 3422", "Real Estate Development, Project Finance and Cost Analysis"],
    ["ARCH 4422", "Business Management for Architects"],
    ["CENG 2115", "Engineering Mechanics and Structural Analysis for Architects"],
    ["ARCH 1511", "Engineering Drawing & Visual Representation for Architects"],
    ["ARCH 1521", "Digital Representation Tools for Architects"],
    ["ARCH 2512", "Foundations of 3-Dimensional Design"],
    ["ARCH 2551", "Introduction to Architectural Design"],
    ["ARCH 2411", "Surveying for Architects"],
    ["ARCH 2552", "Architectural Design Studio I"],
    ["ARCH 3522", "Digital Design Studio and Workshop"],
    ["ARCH 3553", "Architectural Design Studio II"],
    ["ARCH 3554", "Architectural Design Studio III"],
    ["ARCH 4532", "Urban Design and Landscape Architecture"],
    ["ARCH 4541", "Introduction to Interior Design"],
    ["ARCH 4561", "Architectural Design Studio IV: Contextual Analysis & Structural Tectonics"],
    ["ARCH 4562", "Architectural Design Studio V: Comprehensive & Integrated Design"],
    ["ARCH 4980", "Senior Project I"],
    ["ARCH 4981", "Senior Project II"],
    ["ARCH 2211", "History, Theory & Criticism of Architecture & Urbanism I"],
    ["ARCH 2212", "History, Theory and Criticism of Architecture and Urbanism II"],
    ["ARCH 2221", "Human Aspects in Architectural Design"],
    ["ARCH 2231", "Environmental Control Systems and Sustainable Design"],
    ["ARCH 3311", "Building Construction Methods II for Architects"],
    ["ARCH 3321", "Building Service Systems and Building Systems Integration"],
    ["ARCH 3331", "Construction Materials and Quality Control"],
    ["ARCH 3950", "Internship in Construction Projects"],
    ["ARCH 4312", "Design Development and Construction Documents"],
    ["ARCH 4421", "Building Codes, Laws & Regulations"],
    ["ARCH 4423", "Ethics and Professional Practice"],
    ["ARCH 4951", "Internship in Technical Drawing and Design"],
    ["CENG 2252", "Building Construction Methods I for Architects"],
    ["CENG 3151", "Structural Design for Architects I"],
    ["CENG 3152", "Structural Design for Architects II"],
    ["CENG 4410", "Introduction to Construction Management and Cost Estimating"],
    ["ARCH 4801", "Human and Environmental Studies Theory and Dissertation"],
    ["ARCH 2501", "Let's Get Sustainable"],
    ["ARCH 4932", "Sustainable Landscape Architecture in Hot and Arid Environments"],
    ["ARCH 4936", "Design of Interior Spaces"],
    ["ARCH 4942", "Co-Design Campus as a Sensory Landscape"],
    ["ARCH 4943", "Inclusive & Participatory Design in Architecture"],
    ["ARCH 4971", "Selected Topics in Human and Environmental Studies of Architectural Engineering"],
    ["ARCH 4802", "Tectonics and Computational Design Theory and Dissertation"],
    ["ARCH 4937", "Seminar on Contemporary Architecture Discourse"],
    ["ARCH 4939", "Advanced Architectural Computing"],
    ["ARCH 4972", "Selected Topics in Tectonics and Computational Design of Architectural Engineering"],
    ["PHIL 3010", "Philosophy and Art"],
    ["ARCH 4803", "Architecture and Urban Heritage Theory and Dissertation"],
    ["ARCH 4931", "Introduction to Urban and Architecture Conservation"],
    ["ARCH 4933", "Vernacular Architecture"],
    ["ARCH 4934", "Cairo in the Curriculum, The Urban Laboratory: Mapping Cairo's Complexities"],
    ["ARCH 4935", "Coptic Art and Architecture"],
    ["ARCH 4938", "Urban Dialogues on Heritage and Space"],
    ["ARCH 4973", "Selected Topics in Architecture and Urban Heritage Design"],
    ["ARIC 3272", "Building the Sultanate: Architecture under the Ayyubids and Mamluks in Egypt and Syria"],
    ["ARIC 5124", "Islamic Architecture in Spain and North Africa"],
    ["EGPT 3201", "Art and Architecture of Ancient Egypt I"],
    ["ARCH 3562", "Introduction to Architecture"],
    ["CENG 1001", "Introduction to The Engineering Profession"],
    ["CENG 1251", "Engineering Drawings"],
    ["CENG 2111", "Engineering Mechanics - Statics and Dynamics"],
    ["CENG 2211", "Strength and Testing of Materials for Construction"],
    ["CENG 2251", "Drawing for Construction Engineering"],
    ["CENG 2311", "Construction Surveying"],
    ["CENG 2511", "Fluid Mechanics"],
    ["CENG 2558", "Environmental Science Laboratory"],
    ["CENG 3011", "Electrical and Mechanical Systems for Construction Engineering"],
    ["CENG 3111", "Structural Analysis"],
    ["CENG 3113", "Numerical Methods"],
    ["CENG 3153", "Structural Design"],
    ["CENG 3211", "Construction Materials and Quality Control I"],
    ["CENG 3312", "Geology for Engineers"],
    ["CENG 3511", "Fundamentals of Hydraulic Engineering"],
    ["CENG 4158", "Structural Systems and Advanced Design"],
    ["CENG 4252", "Methods and Equipment for Construction I"],
    ["CENG 4253", "Methods and Equipment for Construction II"],
    ["CENG 4313", "Soil Mechanics"],
    ["CENG 4314", "Design and Construction of Foundations and Retaining Structures"],
    ["CENG 4351", "Transportation Engineering"],
    ["CENG 4420", "Construction Project Specifications, Bids, and Contracts"],
    ["CENG 4440", "Techniques of Planning, Scheduling and Control"],
    ["CENG 4460", "Financial Management and Accounting for Construction"],
    ["CENG 4551", "Environmental and Sanitary Engineering"],
    ["CENG 4951", "Practical Training"],
    ["CENG 4980", "Senior Project I"],
    ["CENG 4981", "Senior Project II"],
    ["CENG 4154", "Advanced Design of Reinforced and Prestressed Concrete Structures"],
    ["CENG 4212", "Construction Materials and Quality Control II"],
    ["CENG 4113", "Structural Mechanics"],
    ["CENG 4155", "Steel and Concrete Bridges"],
    ["CENG 4157", "Tall Buildings and Large Span Structures"],
    ["CENG 4315", "Applications in Geotechnical Engineering"],
    ["CENG 4911", "Selected Topics in Construction Engineering"],
    ["CENG 4952", "Construction Intern Development"],
    ["CENG 4430", "Risk Management and Bidding Strategies"],
    ["CENG 4450", "Design, Modeling and Simulation of Construction Systems"],
    ["CENG 4470", "Contract Administration"],
    ["CENG 4352", "Highway Facilities"],
    ["CENG 4552", "Design of Water Resources Systems"],
    ["CENG 4553", "Unit Operations in Environmental Engineering"],
    ["CENG 4554", "Computer-Aided Design and Construction of Environmental and Sanitary Systems"],
    ["CENG 4555", "Solid and Hazardous Wastes Engineering"],
    ["CENG 4556", "Design of Water and Wastewater Treatment Plants"],
    ["CENG 4557", "Functional Design and Construction of Tunnels and Bridges"],
    ["DSCI 3411", "Fundamentals of Simulation"],
    ["DSCI 4411", "Fundamentals of Data Mining"],
    ["DSCI 4412", "Introduction to Big Data Technologies"],
    ["DSCI 4416", "Capstone I (Data Science Senior Project I)"],
    ["DSCI 4417", "Capstone II (Data Science Project II)"],
    ["DSCI 4950", "Industrial Training"],
    ["CSCE 4604", "Advanced Machine Learning"],
    ["MACT 2146", "Optimization I"],
    ["MACT 3146", "Optimization II"],
    ["BIOL 2090", "Quantitative Biology"],
    ["CSCE 2202", "Analysis and Design of Algorithms"],
    ["CSCE 2211", "Applied Data Structures"],
    ["CSCE 3601", "Fundamentals of Artificial Intelligence"],
    ["CSCE 4602", "Introduction to Artificial Neural Networks"],
    ["CSCE 4603", "Fundamentals of Computer Vision"],
    ["CSCE 4930", "Selected Topics in Computer Science and Engineering"],
    ["DSCI 3413", "Biostatistics"],
    ["DSCI 4980", "Senior Thesis"],
    ["MACT 2131", "Discrete Mathematics"],
    ["MACT 4133", "Formal and Mathematical Logic"],
    ["MACT 4135", "Graph Theory"],
    ["MACT 4213", "Mathematical Modeling with Applications"],
    ["ENGR 2105", "Engineering Mechanics"],
    ["ENGR 2122", "Fundamentals of Fluid Mechanics"],
    ["ENGR 2412", "General Programming Lab"],
    ["PENG 3411", "Thermodynamics"],
    ["PENG 3430", "Health, Safety, Environment and Sustainability"],
    ["SCI 2005", "Introduction to Geology"],
    ["PENG 2400", "Energy Industry Overview"],
    ["PENG 3011", "Petroleum Geology and Exploration"],
    ["PENG 3021", "Reservoir Rock Properties"],
    ["PENG 3111", "Drilling Engineering I"],
    ["PENG 3112", "Drilling Engineering I Lab"],
    ["PENG 3211", "Reservoir Fluids"],
    ["PENG 3215", "Reservoir Engineering Fundamentals"],
    ["PENG 3227", "Formation Evaluation"],
    ["PENG 3228", "Formation Evaluation Laboratory"],
    ["PENG 3311", "Petroleum Production I"],
    ["PENG 4121", "Drilling Engineering II"],
    ["PENG 4223", "Reservoir Simulation and Modeling"],
    ["PENG 4224", "Well Testing"],
    ["PENG 4225", "Secondary and Tertiary Recovery"],
    ["PENG 4226", "Energy Economics"],
    ["PENG 4227", "Reservoir Description and Characterization"],
    ["PENG 4314", "Petroleum Production II"],
    ["PENG 4324", "Surface Facilities"],
    ["PENG 4950", "Industrial Training and Professional Ethics"],
    ["PENG 4980", "Senior Project I"],
    ["PENG 4981", "Senior Project II"],
    ["PENG 3415", "Principles of Energy Engineering"],
    ["PENG 4015", "Exploration Methods"],
    ["PENG 4125", "Advanced Well Construction"],
    ["PENG 4229", "Unconventional Reservoirs"],
    ["PENG 4313", "Oil and Gas Transmission and Storage"],
    ["PENG 4325", "Well Stimulation"],
    ["PENG 4333", "Energy Efficiency and Management"],
    ["PENG 4421", "Renewable and Alternative Energy"],
    ["PENG 4423", "Energy and Environmental Sustainability"],
    ["PENG 4930", "Selected Topics in Petroleum and Energy Engineering"]
  ];

  const subjectLabels = {
    ACCT: "Accounting",
    ARCH: "Architecture",
    ARIC: "Arab and Islamic Civilizations",
    BADM: "Business",
    BIOL: "Biology",
    CENG: "Construction Engineering",
    CHEM: "Chemistry",
    CSCE: "Computer Science",
    DSCI: "Data Science",
    ECON: "Economics",
    EGPT: "Egyptology",
    ENGR: "Engineering",
    ENTR: "Entrepreneurship",
    FINC: "Finance",
    MACT: "Mathematics",
    MENG: "Mechanical Engineering",
    MGMT: "Management",
    MKTG: "Marketing",
    MOIS: "Management Information Systems",
    PENG: "Petroleum and Energy Engineering",
    PHIL: "Philosophy",
    PHYS: "Physics",
    SCI: "Science"
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

  function getCourseSearchQuery() {
    const searchInput = document.getElementById("course-search-input");
    return normalize(searchInput ? searchInput.value : "");
  }

  function getSubjects() {
    const subjectsByCode = {};

    courses.forEach(function (course) {
      subjectsByCode[course.subject] = course.department;
    });

    return Object.keys(subjectsByCode).map(function (code) {
      return {
        code: code,
        label: subjectsByCode[code]
      };
    }).sort(function (firstSubject, secondSubject) {
      return firstSubject.label.localeCompare(secondSubject.label);
    });
  }

  function renderCourseStats() {
    const totalCount = document.getElementById("course-total-count");
    const subjectCount = document.getElementById("course-subject-count");

    if (totalCount) {
      totalCount.textContent = courses.length;
    }

    if (subjectCount) {
      subjectCount.textContent = getSubjects().length;
    }
  }

  function renderSubjectFilters() {
    const filtersRoot = document.getElementById("course-subject-filters");

    if (!filtersRoot) {
      return;
    }

    filtersRoot.innerHTML = getSubjects().map(function (subject) {
      return `
        <label class="course-filter-pill">
          <input type="checkbox" value="${subject.code}" data-course-subject>
          <span>${subject.label}</span>
        </label>
      `;
    }).join("");

    filtersRoot.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("change", renderCourses);
    });
  }

  function courseMatches(course) {
    const query = getCourseSearchQuery();
    const selectedSubjects = getCheckedSubjects();
    const searchableText = normalize([course.code, course.title, course.subject, course.department, course.level].join(" "));

    return (!query || searchableText.includes(query)) && (!selectedSubjects.length || selectedSubjects.includes(course.subject));
  }

  function setCoursesSearchState(hasActiveSearch) {
    const discovery = document.getElementById("course-discovery");
    const grid = document.getElementById("courses-grid");
    const count = document.getElementById("courses-result-count");

    if (discovery) {
      discovery.hidden = hasActiveSearch;
    }

    if (grid) {
      grid.hidden = !hasActiveSearch;
    }

    if (count) {
      count.hidden = !hasActiveSearch;
    }
  }

  function renderCourses() {
    const grid = document.getElementById("courses-grid");
    const count = document.getElementById("courses-result-count");
    const query = getCourseSearchQuery();
    const selectedSubjects = getCheckedSubjects();
    const hasActiveSearch = Boolean(query || selectedSubjects.length);

    if (!grid) {
      return;
    }

    setCoursesSearchState(hasActiveSearch);

    if (!hasActiveSearch) {
      grid.innerHTML = "";
      return;
    }

    const visibleCourses = courses.filter(courseMatches);
    const shownCourses = visibleCourses.slice(0, 48);

    if (count) {
      count.textContent = visibleCourses.length + " matches" + (visibleCourses.length > shownCourses.length ? " · showing first " + shownCourses.length : "");
    }

    grid.innerHTML = shownCourses.map(function (course) {
      return `
        <a class="course-card" href="courses.html?course=${encodeURIComponent(course.code)}" aria-label="Open ${course.code} course page">
          <div class="course-card-main">
            <span class="course-code">${course.code}</span>
            <h2>${course.title}</h2>
          </div>
          <div class="course-card-meta">
            <span>${course.department}</span>
            <span>${course.level}</span>
          </div>
        </a>
      `;
    }).join("");

    if (!visibleCourses.length) {
      grid.innerHTML = '<p class="courses-empty">No courses found. Try a course code, subject, department, or broader keyword.</p>';
    }
  }

  const courseSearchSuggestions = [
    "Search Computer Science",
    "Search Calculus II",
    "Search CSCE 1101",
    "Search Business",
    "Search 3000 Level",
    "Search Senior Project"
  ];

  let courseSuggestionIndex = 0;
  let courseCharacterIndex = 0;
  let isDeletingCourseSuggestion = false;

  function animateCourseSearchPlaceholder() {
    const searchInput = document.getElementById("course-search-input");

    if (!searchInput) {
      return;
    }

    const currentSuggestion = courseSearchSuggestions[courseSuggestionIndex];

    if (searchInput.value.trim().length === 0) {
      searchInput.placeholder = currentSuggestion.substring(0, courseCharacterIndex);
    }

    if (!isDeletingCourseSuggestion && courseCharacterIndex < currentSuggestion.length) {
      courseCharacterIndex += 1;
      setTimeout(animateCourseSearchPlaceholder, 70);
      return;
    }

    if (!isDeletingCourseSuggestion && courseCharacterIndex === currentSuggestion.length) {
      isDeletingCourseSuggestion = true;
      setTimeout(animateCourseSearchPlaceholder, 1200);
      return;
    }

    if (isDeletingCourseSuggestion && courseCharacterIndex > 0) {
      courseCharacterIndex -= 1;
      setTimeout(animateCourseSearchPlaceholder, 35);
      return;
    }

    isDeletingCourseSuggestion = false;
    courseSuggestionIndex = (courseSuggestionIndex + 1) % courseSearchSuggestions.length;
    setTimeout(animateCourseSearchPlaceholder, 250);
  }

  function normalizeCourseCode(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toUpperCase();
  }

  function getSelectedCourseCode() {
    const params = new URLSearchParams(window.location.search);
    return normalizeCourseCode(params.get("course"));
  }

  function setCourseDetailText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function renderCourseDetail(courseCode) {
    const listView = document.getElementById("courses-list-view");
    const detailView = document.getElementById("course-detail-view");

    if (!courseCode || !detailView) {
      return false;
    }

    const selectedCourse = courses.find(function (course) {
      return normalizeCourseCode(course.code) === courseCode;
    });

    if (listView) {
      listView.hidden = true;
    }

    detailView.hidden = false;

    if (!selectedCourse) {
      document.title = "Course not found | AUC Atlas";
      setCourseDetailText("course-detail-code", "Course not found");
      setCourseDetailText("course-detail-title", "Course not found.");
      setCourseDetailText("course-detail-department", "Go back to courses and choose a course from the search results.");
      setCourseDetailText("course-detail-subject", "Unavailable");
      setCourseDetailText("course-detail-level", "Unavailable");
      setCourseDetailText("course-detail-full-code", courseCode || "Unavailable");
      setCourseDetailText("course-detail-note", "This course could not be matched to the current AUC Atlas course list.");
      return true;
    }

    document.title = selectedCourse.code + " | AUC Atlas";
    setCourseDetailText("course-detail-code", selectedCourse.code);
    setCourseDetailText("course-detail-title", selectedCourse.title);
    setCourseDetailText("course-detail-department", selectedCourse.department);
    setCourseDetailText("course-detail-subject", selectedCourse.subject);
    setCourseDetailText("course-detail-level", selectedCourse.level);
    setCourseDetailText("course-detail-full-code", selectedCourse.code);
    setCourseDetailText("course-detail-note", "This course page is ready for professor links, student notes, ratings, prerequisites, and review details.");

    return true;
  }

  function setupCoursesPage() {
    const searchInput = document.getElementById("course-search-input");

    if (renderCourseDetail(getSelectedCourseCode())) {
      return;
    }

    if (searchInput) {
      searchInput.addEventListener("input", renderCourses);
    }

    animateCourseSearchPlaceholder();
    renderCourses();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCoursesPage);
  } else {
    setupCoursesPage();
  }
})();
