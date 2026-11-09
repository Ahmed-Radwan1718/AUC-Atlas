// Original AUC Atlas degree requirement definitions, group 1 of 6.
export const degreePlans1: Record<string, any> = {
      "Mechanical Engineering": {
        note: "",
        groups: [
          {
            scope: "Engineering Core",
            title: "Engineering Core Requirements (45 credits)",
            items: [
              "CHEM 1005 - General Chemistry I (3 cr.)",
              "CHEM 1015 - General Chemistry I-Laboratory (1 cr.)",
              "ENGR 1005 - Descriptive Geometry and Engineering Drawing (2 cr.)",
              "ENGR 2102 - Engineering Mechanics I (Statics) (3 cr.)",
              "ENGR 2104 - Engineering Mechanics II (Dynamics) (3 cr.)",
              "ENGR 3202 - Engineering Analysis and Computation I (3 cr.)",
              "ENGR 3212 - General Electrical Engineering (3 cr.)",
              "ENGR 3222 - Engineering Economy (3 cr.)",
              "MACT 1122 - Calculus II (3 cr.)",
              "MACT 2123 - Calculus III (3 cr.)",
              "MACT 2141 - Differential Equations (3 cr.)",
              "MACT 3224 - Probability and Statistics (3 cr.)",
              "MENG 2202 - Introduction to Computational Thinking and Programming for Engineers Lab (1 cr.)",
              "MENG 2601 - Fluid Mechanics Fundamentals (3 cr.)",
              "PHYS 1011 - Physics 1: Classical Mechanics, Sound and Heat (3 cr.)",
              "PHYS 1012 - General Physics Laboratory I (1 cr.)",
              "PHYS 1021 - Physics 2: Electricity and Magnetism (3 cr.)",
              "PHYS 1022 - General Physics Laboratory II (1 cr.)"
            ]
          },
          {
            scope: "Concentration",
            title: "Concentration Requirements (54 credits)",
            description: "The student is required to spend a minimum of eight weeks in industrial training in Egypt or abroad. A minimum of 67 credits is required prior to the industrial training.",
            items: [
              "MENG 2112 - Strength of Materials (3 cr.)",
              "MENG 2505 - Mechanical Engineering Drawing (1 cr.)",
              "MENG 3207 - Engineering Materials (3 cr.)",
              "MENG 3209 - Fundamentals of Manufacturing Processes (3 cr.)",
              "MENG 3217 - Mechanical and Structural Behavior of Engineering Materials Lab (1 cr.)",
              "MENG 3402 - Quality and Process Control (3 cr.)",
              "MENG 3446 - Engineering and Project Management (2 cr.)",
              "MENG 3502 - Mechanical Systems (3 cr.)",
              "MENG 3505 - Mechanics of Materials (3 cr.)",
              "MENG 3506 - Mechanical Design I (3 cr.)",
              "MENG 3601 - Fundamentals of Thermodynamics (3 cr.)",
              "MENG 3602 - Applied Fluid Mechanics (3 cr.)",
              "MENG 3605 - Applied Thermodynamics (3 cr.)",
              "MENG 3705 - System Dynamics (3 cr.)",
              "MENG 4208 - Selection of Materials and Processes for Design (3 cr.)",
              "MENG 4507 - Mechanical Design II (3 cr.)",
              "MENG 4606 - Heat Transfer (4 cr.)",
              "MENG 4950 - Industrial Training (1 cr.)",
              "MENG 4980 - Senior Project I (1 cr.)",
              "MENG 4981 - Senior Project II (2 cr.)",
              "PHYS 2216 - Fundamentals of Circuits and Electronics (2 cr.)",
              "PHYS 2217 - Fundamentals of Circuits and Electronics Lab (1 cr.)"
            ]
          },
          {
            scope: "Concentration Electives",
            title: "Concentration Electives (15 credit hours)",
            description: "Courses must be selected from at least two of the five available concentrations of courses. A minimum of nine credits must be taken from one concentration and at least one course from another concentration as follows:",
            items: []
          },
          {
            scope: "Concentration Elective",
            title: "Energy Systems Concentration",
            description: "A minimum of six credits from Group A courses, which should include MENG 4663, and either MENG 4662 or MENG 5168. The remaining three credits should be selected from either Group A or Group B.",
            creditGroup: "mechanical-concentration-electives",
            creditCap: 15,
            subgroups: [
              {
                title: "Group A",
                items: [
                  "MENG 4662 - Power Plant Technology (3 cr.)",
                  "MENG 4663 - Design of Renewable Energy Systems (3 cr.)",
                  "MENG 5168 - Nuclear Power Plant Engineering (3 cr.)"
                ]
              },
              {
                title: "Group B",
                items: [
                  "MENG 4661 - Turbo-Machinery (3 cr.)",
                  "MENG 4665 - Internal Combustion Engines (3 cr.)",
                  "MENG 4666 - Design of Heating, Ventilation, and Air Conditioning Systems (3 cr.)",
                  "MENG 4667 - Refrigeration and Air-conditioning (3 cr.)",
                  "MENG 4936 - Selected Topics in Power Engineering (3 cr.)"
                ]
              }
            ]
          },
          {
            scope: "Concentration Elective",
            title: "Design Concentration",
            description: "A minimum of six credits from courses in Group A of the Design concentration and the remaining three credits from courses in either Group A or Group B of the concentration.",
            creditGroup: "mechanical-concentration-electives",
            creditCap: 15,
            subgroups: [
              {
                title: "Group A",
                items: [
                  "MENG 4551 - Design for Additive Manufacturing (3 cr.)",
                  "MENG 4553 - Finite Element Method and Applications in Design (3 cr.)",
                  "MENG 4555 - Applied Vibration Measurements, Analysis and Control (3 cr.)",
                  "MENG 4756 - Automatic Control Systems (3 cr.)"
                ]
              },
              {
                title: "Group B",
                items: [
                  "MENG 4227 - Failure of Mechanical Components (3 cr.)",
                  "MENG 4239 - Advanced Manufacturing Processes (3 cr.)",
                  "MENG 4558 - Integrated Design (3 cr.)",
                  "MENG 4565 - Design of Engineering Systems (3 cr.)",
                  "MENG 4757 - Robotics: Design, Analysis and Control (3 cr.)",
                  "MENG 4931 - Selected Topics in Design (3 cr.)"
                ]
              }
            ]
          },
          {
            scope: "Concentration Elective",
            title: "Industrial Concentration",
            description: "A minimum of six credits from courses in Group A of the Industrial Engineering concentration and the remaining three credits from courses in either Group A or Group B of the concentration.",
            creditGroup: "mechanical-concentration-electives",
            creditCap: 15,
            subgroups: [
              {
                title: "Group A",
                items: [
                  "MENG 4440 - Engineering Operations Research (3 cr.)",
                  "MENG 4444 - Work Analysis and Design (3 cr.)",
                  "MENG 4445 - Production and Inventory Control (3 cr.)"
                ]
              },
              {
                title: "Group B",
                items: [
                  "MENG 4441 - Decision Support in Engineering Systems (3 cr.)",
                  "MENG 4442 - Reliability Engineering and Risk Analysis (3 cr.)",
                  "MENG 4443 - Systems Simulation (3 cr.)",
                  "MENG 4448 - Facilities Planning (3 cr.)",
                  "MENG 4449 - Maintenance Management Systems (3 cr.)",
                  "MENG 4477 - Manufacturing System Automation (3 cr.)",
                  "MENG 4930 - Selected Topics in Industrial Engineering (3 cr.)"
                ]
              }
            ]
          },
          {
            scope: "Concentration Elective",
            title: "Materials and Manufacturing Concentration",
            description: "A minimum of six credits from courses in Group A of the Materials and Manufacturing concentration and the remaining three credits from courses in either Group A or Group B of the concentration.",
            creditGroup: "mechanical-concentration-electives",
            creditCap: 15,
            subgroups: [
              {
                title: "Group A",
                items: [
                  "MENG 4221 - Composites: Design, Materials, and Manufacturing (3 cr.)",
                  "MENG 4229 - Nanostructured Materials (3 cr.)",
                  "MENG 4551 - Design for Additive Manufacturing (3 cr.)"
                ]
              },
              {
                title: "Group B",
                items: [
                  "MENG 4226 - Metals, Alloys and Composites (3 cr.)",
                  "MENG 4227 - Failure of Mechanical Components (3 cr.)",
                  "MENG 4232 - Materials, Processing, and Design (3 cr.)",
                  "MENG 4239 - Advanced Manufacturing Processes (3 cr.)",
                  "MENG 4932 - Selected Topics in Materials and Manufacturing (3 cr.)"
                ]
              }
            ]
          },
          {
            scope: "Concentration Elective",
            title: "Mechatronics Concentration",
            description: "A minimum of six credits from courses in Group A of the Mechatronics concentration and the remaining three credits from courses in either Group A or Group B of the concentration.",
            creditGroup: "mechanical-concentration-electives",
            creditCap: 15,
            subgroups: [
              {
                title: "Group A",
                items: [
                  "MENG 4756 - Automatic Control Systems (3 cr.)",
                  "MENG 4778 - Microcontrollers and Mechatronics Systems (3 cr.)",
                  "MENG 4779 - Integrated Design of Electromechanical Systems (3 cr.)"
                ]
              },
              {
                title: "Group B",
                items: [
                  "MENG 4239 - Advanced Manufacturing Processes (3 cr.)",
                  "MENG 4477 - Manufacturing System Automation (3 cr.)",
                  "MENG 4757 - Robotics: Design, Analysis and Control (3 cr.)",
                  "MENG 4937 - Selected Topics in Mechatronics (3 cr.)"
                ]
              }
            ]
          }
        ]
      },
      "Actuarial Science": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (34 credits)",
            description: "The remaining 6 credit hours required to satisfy the core are fulfilled by the concentration Science (3 cr.) and MACT 4980 - Senior Thesis (3 cr.) or MACT 4950 - Practical Internship (3 cr.). Actuarial Science students must take 1 credit hour of Natural Science lab.",
            items: [
              "Remaining Core Curriculum requirements (27 cr.)",
              "Natural Science Laboratory (1 cr.)",
              "Concentration Science (3 cr.)"
            ]
          },
          {
            scope: "Concentration",
            title: "Concentration Requirements (51 credits)",
            items: [
              "MACT 1121 - Calculus I (3 cr.)",
              "MACT 1122 - Calculus II (3 cr.)",
              "MACT 2123 - Calculus III (3 cr.)",
              "MACT 2132 - Linear Algebra (3 cr.)",
              "MACT 3211 - Applied Probability (3 cr.)",
              "MACT 3223 - Statistical Inference (3 cr.)",
              "MACT 3311 - Introduction to Financial Mathematics (3 cr.)",
              "MACT 4212 - Stochastic Processes (3 cr.)",
              "MACT 4231 - Applied Regression Methods (3 cr.)",
              "MACT 4232 - Analysis of Time Series Data (3 cr.)",
              "MACT 4233 - Applied Multivariate Analysis (3 cr.)",
              "MACT 4314 - Financial Modeling (3 cr.)",
              "MACT 4321 - Long-Term Actuarial Mathematics I (3 cr.)",
              "MACT 4322 - Long-Term Actuarial Mathematics II (3 cr.)",
              "MACT 4323 - Advanced Long Term Actuarial Mathematics (3 cr.)",
              "MACT 4331 - Short Term Actuarial Mathematics I (3 cr.)",
              "MACT 4332 - Short Term Actuarial Mathematics II (3 cr.)"
            ]
          },
          {
            scope: "Collateral",
            title: "Collateral Requirements (30 credits)",
            items: [
              "ACCT 2001 - Financial Accounting (3 cr.)",
              "DSCI 1411 - Fundamentals of Data Science I (3 cr.)",
              "DSCI 2410 - Fundamentals of Data Science II (3 cr.)",
              "DSCI 2411 - Data Visualization (3 cr.)",
              "ECON 2011 - Introduction to Microeconomics (3 cr.)",
              "ECON 2021 - Introduction to Macroeconomics (3 cr.)",
              "ECON 3011 - Intermediate Microeconomic Theory (3 cr.)",
              "ECON 3021 - Intermediate Macroeconomic Theory (3 cr.)",
              "FINC 2101 - Business Finance (3 cr.)",
              "FINC 3201 - Investment Analysis (3 cr.)"
            ]
          },
          {
            scope: "Culminating Project/Experience",
            title: "Culminating Project/Experience (3 credits)",
            description: "Choose either MACT 4950 - Practical Internship or MACT 4980 - Senior Thesis.",
            creditGroup: "actuarial-electives-and-culminating",
            creditCap: 15,
            items: [
              "MACT 4950 - Practical Internship (3 cr.)",
              "MACT 4980 - Senior Thesis (3 cr.)"
            ]
          },
          {
            scope: "Actuarial Science Electives",
            title: "Actuarial Science Electives (12 credits)",
            description: "Students choose courses from the following list in consultation with their adviser. MACT 4950 and MACT 4980 cannot double count toward both the culminating experience and actuarial electives.",
            creditGroup: "actuarial-electives-and-culminating",
            creditCap: 15,
            items: [
              "ACCT 2002 - Managerial Accounting (3 cr.)",
              "BADM 2001 - Introduction to Business (3 cr.)",
              "CSCE 1001 - Fundamentals of Computing I (3 cr.)",
              "CSCE 1101 - Fundamentals of Computing II (3 cr.)",
              "CSCE 2501 - Fundamentals of Database Systems (3 cr.)",
              "CSCE 4501 - Big Data Systems (3 cr.)",
              "DSCI 3415 - Fundamentals of Machine Learning (3 cr.)",
              "DSCI 4413 - Analysis of Categorical Data (3 cr.)",
              "ECON 3041 - Monetary Economics (3 cr.)",
              "ECON 3081 - Introduction to Econometrics (3 cr.)",
              "ECON 4031 - International Trade (3 cr.)",
              "FINC 3401 - Applied Banking (3 cr.)",
              "FINC 3501 - International Finance (3 cr.)",
              "FINC 4204 - Portfolio Theory and its Applications (3 cr.)",
              "FINC 4301 - Corporate Finance (3 cr.)",
              "MACT 2141 - Differential Equations (3 cr.)",
              "MACT 3143 - Numerical Methods (3 cr.)",
              "MACT 4910 - Guided Studies in Mathematics (1-3 cr.)",
              "MACT 4930 - Selected Topics in Mathematics (3 cr.)",
              "MACT 4931 - Selected Topics in Actuarial Science (3 cr.)",
              "MACT 4950 - Practical Internship (3 cr.)",
              "MACT 4980 - Senior Thesis (3 cr.)",
              "MACT 4990 - Enterprise Risk Management (3 cr.)",
              "MGMT 3201 - Management Fundamentals (3 cr.)",
              "MGMT 4202 - Managing the Human Capital (3 cr.)",
              "MKTG 2101 - Principles of Marketing (3 cr.)",
              "MKTG 3201 - Marketing Research (3 cr.)",
              "MOIS 2101 - Introduction to Information Systems/Technology (3 cr.)",
              "MOIS 3201 - Management Information Systems and Database Management (3 cr.)",
              "MOIS 3601 - Intelligent Decision Support Systems (3 cr.)"
            ]
          }
        ]
      },
      "Visual Arts": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (37 credits)",
            description: "The remaining 3 credit hours required to satisfy the Core Curriculum are fulfilled by completing the visual arts major capstone course ARTV 4270 - Senior Project (B) (3 cr.).",
            items: [
              "Remaining Core Curriculum requirements (34 cr.)"
            ]
          },
          {
            scope: "Concentration",
            title: "Concentration Requirements (33 credits)",
            items: [
              "ARTV 2113 - Introduction to Visual Cultures (3 cr.)",
              "ARTV 2200 - Art Foundations (3 cr.)",
              "ARTV 2214 - Global Art History: Ancient Power to Early Modernity (3 cr.)",
              "ARTV 3115 - Art Theory (3 cr.)",
              "ARTV 3311 - Advanced Painting and Drawing (3 cr.)",
              "ARTV 3312 - Advanced Studio Arts: New Media (3 cr.)",
              "ARTV 3313 - Advanced Studio Arts: Archival Practices (3 cr.)",
              "ARTV 3314 - Advanced Studio Arts: Community Engagement (3 cr.)",
              "ARTV 3316 - Global Art History: Modernism to Contemporary Politics (3 cr.)",
              "ARTV 4269 - Senior Project (A) (3 cr.)",
              "ARTV 4270 - Senior Project (B) (3 cr.)"
            ]
          },
          {
            scope: "Additional Requirements",
            title: "Additional Requirements (15 credits)",
            description: "Students must complete 15 additional credits selected from the following courses.",
            creditGroup: "visual-arts-additional-requirements",
            creditCap: 15,
            items: [
              "ARTV 2201 - Introduction to Drawing (3 cr.)",
              "ARTV 2202 - Introduction to Painting (3 cr.)",
              "ARTV 2203 - Introduction to Sculpture (3 cr.)",
              "ARTV 2204 - Introduction to Time-Based Media (3 cr.)",
              "ARTV 2207 - Introduction to Ceramics (3 cr.)",
              "ARTV 2208 - Internship Practice (3 cr.)",
              "ARTV 2230 - Introduction to Photography and Media Arts (3 cr.)",
              "ARTV 3270 - Selected Topics in Art (3 cr.)",
              "ARTV 5110 - Contemporary Issues in Arab Art (3 cr.)",
              "DSGN 2250 - Digital Practices I (3 cr.)"
            ]
          },
          {
            scope: "General Electives",
            title: "General Electives (35 credits)",
            items: [
              "General Electives (35 cr.)"
            ]
          }
        ]
      },
      "Philosophy": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (37 credits)",
            description: "The remaining 3 credit hours required to satisfy the Core Curriculum are fulfilled by completing one Philosophy major capstone course: PHIL 5101, PHIL 5104, PHIL 5112, or PHIL 5119.",
            items: [
              "Core Curriculum requirements (37 cr.)"
            ]
          },
          {
            scope: "Philosophy Concentration",
            title: "Philosophy Concentration Requirements (18 credits)",
            items: [
              "PHIL 2101 - Truth, Lies, and Logical Reasoning (3 cr.)",
              "PHIL 3101 - Classical Philosophy (3 cr.)",
              "PHIL 3102 - Modern Philosophy (3 cr.)"
            ]
          },
          {
            scope: "Philosophy Concentration",
            title: "Choose Two",
            creditGroup: "philosophy-concentration-choice-two",
            creditCap: 6,
            items: [
              "PHIL 2111 - Self and Society (3 cr.)",
              "PHIL 2112 - Philosophy of Religion (3 cr.)",
              "PHIL 2113 - Introduction to Ethics (3 cr.)",
              "PHIL 2117 - Political Philosophy (3 cr.)",
              "PHIL 3010 - Philosophy and Art (3 cr.)",
              "PHIL 3017 - Philosophy of Science and Technology (3 cr.)",
              "PHIL 3104 - Metaphysics and Epistemology (3 cr.)",
              "PHIL 5117 - Philosophy of Language (3 cr.)",
              "PHIL 5121 - Philosophical Logic (3 cr.)"
            ]
          },
          {
            scope: "Philosophy Concentration",
            title: "Choose One Advanced Seminar",
            description: "The Advanced Seminar in Classical Philosophy may count as the major capstone course.",
            creditGroup: "philosophy-advanced-seminar",
            creditCap: 3,
            items: [
              "PHIL 5101 - Advanced Seminar in Classical Philosophy (3 cr.)",
              "PHIL 5122 - Advanced Seminar in Islamic Philosophy (3 cr.)",
              "PHIL 5123 - Kant and Idealism (3 cr.)",
              "PHIL 5124 - Advanced Seminar in Phenomenology (3 cr.)"
            ]
          },
          {
            scope: "Philosophy Major Electives",
            title: "Philosophy Major Electives (18 credits)",
            description: "Choose six additional Philosophy courses excluding 1000-level courses, PHIL 2100 - Philosophical Thinking, and PHIL 2099 - Selected Topics for Core Curriculum.",
            creditGroup: "philosophy-major-electives",
            creditCap: 18,
            items: [
              "PHIL 2112 - Philosophy of Religion (3 cr.)",
              "PHIL 2113 - Introduction to Ethics (3 cr.)",
              "PHIL 2117 - Political Philosophy (3 cr.)",
              "PHIL 2200 - Philosophy and Globalization (3 cr.)",
              "PHIL 3010 - Philosophy and Art (3 cr.)",
              "PHIL 3014 - Literature and Philosophy (3 cr.)",
              "PHIL 3015 - Islamic Philosophy (3 cr.)",
              "PHIL 3016 - American Philosophy (3 cr.)",
              "PHIL 3017 - Philosophy of Science and Technology (3 cr.)",
              "PHIL 3104 - Metaphysics and Epistemology (3 cr.)",
              "PHIL 3200 - Philosophy of History (3 cr.)",
              "PHIL 5100 - Independent Study in Philosophy (1-3 cr.)",
              "PHIL 5101 - Advanced Seminar in Classical Philosophy (3 cr.)",
              "PHIL 5104 - Selected Topics in Contemporary Philosophy (3 cr.)",
              "PHIL 5112 - Advanced Seminar in Aesthetics (3 cr.)",
              "PHIL 5117 - Philosophy of Language (3 cr.)",
              "PHIL 5119 - Advanced Seminar in Political Philosophy (3 cr.)",
              "PHIL 5120 - Advanced Seminar in Feminist Philosophy (3 cr.)",
              "PHIL 5121 - Philosophical Logic (3 cr.)",
              "PHIL 5122 - Advanced Seminar in Islamic Philosophy (3 cr.)",
              "PHIL 5123 - Kant and Idealism (3 cr.)",
              "PHIL 5124 - Advanced Seminar in Phenomenology (3 cr.)",
              "PHIL 5125 - Advanced Seminar in Moral Philosophy (3 cr.)",
              "PHIL 5130 - Philosophy of Mind (3 cr.)",
              "PHIL 5150 - Philosophy and Film (3 cr.)",
              "PHIL 5151 - Philosophy of Media (3 cr.)",
              "PHIL 5199 - Selected Topics in Philosophy (3 cr.)"
            ]
          },
          {
            scope: "General Electives",
            title: "General Electives (47 credits)",
            items: [
              "General Electives (47 cr.)"
            ]
          }
        ]
      },
      "History": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (37 credits)",
            description: "The remaining 3 credit hours required to satisfy the Core Curriculum are fulfilled by completing any History major capstone course.",
            items: [
              "Remaining Core Curriculum requirements (34 cr.)"
            ]
          },
          {
            scope: "History Concentration",
            title: "History Concentration Requirements (9 credits)",
            items: [
              "HIST 1000 - Why History? (3 cr.)",
              "HIST 2000 - How to Use a Time Machine? Investigating the Past (3 cr.)",
              "HIST 4801 - Historical Theory and Methodology (3 cr.)"
            ]
          },
          {
            scope: "History Electives",
            title: "History Electives (27 credits)",
            description: "Complete nine 3-credit History courses, of which six courses must be above the 2000 level, including at least one History major capstone.",
            creditGroup: "history-electives",
            creditCap: 27,
            items: [
              "HIST 4111 - Arabs in America (3 cr.)",
              "HIST 4113 - Ideas Dictators Hate (3 cr.)",
              "HIST 4188 - Selected Topics in World History (3 cr.)",
              "HIST 4215 - The Marriage Crisis and the Middle East (3 cr.)",
              "HIST 4216 - Remembering Cairo (3 cr.)",
              "HIST 4219 - Modern Movements in Islam (3 cr.)",
              "HIST 4288 - Selected Topics in the History of the Modern Middle East (3 cr.)",
              "HIST 4290 - Selected Topics in Modern Egyptian History (3 cr.)",
              "HIST 4303 - Global Capitalism and Africa: An Economic History (3 cr.)",
              "HIST 4488 - Selected Topics in European History (3 cr.)",
              "HIST 4588 - Selected Topics in the History of the United States (3 cr.)",
              "Other approved History electives (24 cr.)"
            ]
          },
          {
            scope: "General Electives",
            title: "General Electives (47 credits)",
            description: "To be selected in consultation with a History faculty advisor.",
            items: [
              "General Electives (47 cr.)"
            ]
          }
        ]
      },
      "Economics": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (37 credits)",
            description: "The remaining 3 credit hours required to satisfy the Core are fulfilled by completing ECON 3071 - Labor Economics.",
            items: [
              "Remaining Core Curriculum requirements (34 cr.)"
            ]
          },
          {
            scope: "Collateral",
            title: "Collateral Requirements (9 credits)",
            items: [
              "ACCT 2001 - Financial Accounting (3 cr.)",
              "BADM 4999 - Internship and Assessment (0 cr.)",
              "FINC 2101 - Business Finance (3 cr.)"
            ],
            subgroups: [
              {
                title: "Choose One",
                creditGroup: "economics-collateral-choice",
                creditCap: 3,
                items: [
                  "MACT 2222 - Statistics for Business (3 cr.)",
                  "DSCI 1411 - Fundamentals of Data Science I (3 cr.)"
                ]
              }
            ]
          },
          {
            scope: "Economics Core",
            title: "Economics Core Requirements (40 credits)",
            items: [
              "ECON 2011 - Introduction to Microeconomics (3 cr.)",
              "ECON 2021 - Introduction to Macroeconomics (3 cr.)",
              "ECON 2061 - Mathematics for Economists I (3 cr.)",
              "ECON 2081 - Statistics for Economists (3 cr.)",
              "ECON 3011 - Intermediate Microeconomic Theory (3 cr.)",
              "ECON 3021 - Intermediate Macroeconomic Theory (3 cr.)",
              "ECON 3041 - Monetary Economics (3 cr.)",
              "ECON 3053 - Economic Development (3 cr.)",
              "ECON 3061 - Mathematics for Economists II (3 cr.)",
              "ECON 3071 - Labor Economics (3 cr.)",
              "ECON 3081 - Introduction to Econometrics (3 cr.)",
              "ECON 3082 - Practicum (1 cr.)",
              "ECON 4031 - International Trade (3 cr.)",
              "ECON 4091 - History of Economic Thought (3 cr.)"
            ]
          },
          {
            scope: "Economics Concentration",
            title: "General Economics Degree (15 or 16 credits)",
            description: "Choose five courses from the following list. A maximum of two Finance courses is allowed.",
            creditGroup: "economics-option-and-general-electives",
            creditCap: 34,
            items: [
              "ECON 2051 - Economic History of the Modern Middle East (3 cr.)",
              "ECON 3054 - Environmental and Natural Resource Economics (3 cr.)",
              "ECON 3055 - The Digital Economy: Artificial Intelligence, the Future of Work and Development (3 cr.)",
              "ECON 3099 - Special Topics in Economics (3 cr.)",
              "ECON 4012 - Feasibility Study (3 cr.)",
              "ECON 4013 - Behavioral Economics (3 cr.)",
              "ECON 4014 - Public Economics and Policy Analysis (3 cr.)",
              "ECON 4015 - Applied Econometrics (3 cr.)",
              "ECON 4041 - Financial Economics (3 cr.)",
              "ECON 4050 - CopyrightX: The Economics of Copyright and Creativity (3 cr.)",
              "ECON 4051 - Seminar on Economic Development and Policy in the Middle East (3 cr.)",
              "ECON 4081 + ECON 4082 - Econometrics and Practicum (4 cr.)",
              "ECON 4094 - Economics of Egypt (3 cr.)",
              "ECON 4099 - Seminar: Selected Topics in Economics (3 cr.)",
              "FINC 3201 - Investment Analysis (3 cr.)",
              "FINC 4202 - Capital Markets (3 cr.)",
              "FINC 4301 - Corporate Finance (3 cr.)"
            ]
          },
          {
            scope: "Economics Concentration",
            title: "Economic Development and Policy Analysis Concentration (15 or 16 credits)",
            description: "Complete the three required courses and choose two additional courses from the list.",
            creditGroup: "economics-option-and-general-electives",
            creditCap: 34,
            items: [
              "ECON 4014 - Public Economics and Policy Analysis (3 cr.)",
              "ECON 4051 - Seminar on Economic Development and Policy in the Middle East (3 cr.)",
              "ECON 4094 - Economics of Egypt (3 cr.)",
              "ECON 3054 - Environmental and Natural Resource Economics (3 cr.)",
              "ECON 3055 - The Digital Economy: Artificial Intelligence, the Future of Work and Development (3 cr.)",
              "ECON 3099 - Special Topics in Economics (3 cr.)",
              "ECON 4012 - Feasibility Study (3 cr.)",
              "ECON 4013 - Behavioral Economics (3 cr.)",
              "ECON 4015 - Applied Econometrics (3 cr.)",
              "ECON 4050 - CopyrightX: The Economics of Copyright and Creativity (3 cr.)",
              "ECON 4061 - Mathematical Economics (3 cr.)",
              "ECON 4081 + ECON 4082 - Econometrics and Practicum (4 cr.)",
              "ECON 4099 - Seminar: Selected Topics in Economics (3 cr.)",
              "ECON 5254 - Economic Growth & Development (3 cr.)",
              "PPAD 5211 - Qualitative Analysis for Policy and Administration (3 cr.)"
            ]
          },
          {
            scope: "Economics Concentration",
            title: "Quantitative and Financial Economics Concentration (16 credits)",
            description: "Complete the four required courses and choose two additional courses from the list.",
            creditGroup: "economics-option-and-general-electives",
            creditCap: 34,
            items: [
              "ECON 4041 - Financial Economics (3 cr.)",
              "ECON 4061 - Mathematical Economics (3 cr.)",
              "ECON 4081 + ECON 4082 - Econometrics and Practicum (4 cr.)",
              "ECON 3054 - Environmental and Natural Resource Economics (3 cr.)",
              "ECON 3055 - The Digital Economy: Artificial Intelligence, the Future of Work and Development (3 cr.)",
              "ECON 3099 - Special Topics in Economics (3 cr.)",
              "ECON 4012 - Feasibility Study (3 cr.)",
              "ECON 4013 - Behavioral Economics (3 cr.)",
              "ECON 4015 - Applied Econometrics (3 cr.)",
              "ECON 4050 - CopyrightX: The Economics of Copyright and Creativity (3 cr.)",
              "ECON 4051 - Seminar on Economic Development and Policy in the Middle East (3 cr.)",
              "ECON 4094 - Economics of Egypt (3 cr.)",
              "ECON 4099 - Seminar: Selected Topics in Economics (3 cr.)",
              "ECON 5241 - Financial Economics (3 cr.)",
              "ECON 5215 - Competitive Strategy and Game Theory (3 cr.)",
              "FINC 3201 - Investment Analysis (3 cr.)",
              "FINC 4202 - Capital Markets (3 cr.)",
              "FINC 4301 - Corporate Finance (3 cr.)",
              "MACT 4233 - Applied Multivariate Analysis (3 cr.)",
              "MACT 4314 - Financial Modeling (3 cr.)"
            ]
          },
          {
            scope: "General Electives",
            title: "General Electives (18 to 19 credits)",
            description: "Students majoring in Economics may also apply for the optional BUSC 4000 - Experiential Learning: CO-OP course.",
            creditGroup: "economics-option-and-general-electives",
            creditCap: 34,
            items: [
              "General Electives (18-19 cr.)"
            ]
          }
        ]
      },
};
