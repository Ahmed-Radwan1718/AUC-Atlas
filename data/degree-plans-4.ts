// Original AUC Atlas degree requirement definitions, group 4 of 6.
export const degreePlans4: Record<string, any> = {
      "Mathematics": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (36 credits)",
            description: "The science/lab requirements of the core curriculum electives is satisfied by the collateral requirements of the major.",
            items: [
              "Core Curriculum requirements (36 cr.)"
            ]
          },
          {
            scope: "Main Concentration",
            title: "Main Concentration Requirements (33 credits)",
            description: "Students need to take all of the following eleven 3-credit courses:",
            items: [
              "CSCE 1001 - Fundamentals of Computing I (3 cr.)",
              "MACT 1121 - Calculus I (3 cr.)",
              "MACT 1122 - Calculus II (3 cr.)",
              "MACT 2123 - Calculus III (3 cr.)",
              "MACT 2131 - Discrete Mathematics (3 cr.)",
              "MACT 2132 - Linear Algebra (3 cr.)",
              "MACT 2141 - Differential Equations (3 cr.)",
              "MACT 4125 - Complex-Function Theory (3 cr.)",
              "MACT 4126 - Real Analysis I (3 cr.)",
              "MACT 4127 - Real Analysis II (3 cr.)",
              "MACT 4134 - Modern Algebra (3 cr.)"
            ]
          },
          {
            scope: "Collateral",
            title: "Collateral Requirements (13 credits)",
            description: "Students must take four 3-credit courses in addition to one lab.",
            creditGroup: "mathematics-collateral",
            creditCap: 13,
            items: [
              "BIOL 1011 - Introductory Biology I (3 cr. + 1 cr. lab)",
              "BIOL 1012 - Introductory Biology II (3 cr. + 1 cr. lab)",
              "CHEM 1005 - General Chemistry I (3 cr.)",
              "CHEM 1006 - General Chemistry II (3 cr.)",
              "CHEM 1015 - General Chemistry I-Laboratory (1 cr.)",
              "CHEM 1016 - General Chemistry II-Laboratory (1 cr.)",
              "CSCE 1101 - Fundamentals of Computing II (3 cr.)",
              "CSCE 1102 - Fundamentals of Computing II Lab (1 cr.)",
              "CSCE 2202 - Analysis and Design of Algorithms (3 cr.)",
              "CSCE 2203 - Analysis and Design of Algorithms Lab (1 cr.)",
              "DSCI 1411 - Fundamentals of Data Science I (3 cr.)",
              "DSCI 2410 - Fundamentals of Data Science II (3 cr.)",
              "ENGR 2412 - General Programming Lab (1 cr.)",
              "PHYS 1011 - Physics 1: Classical Mechanics, Sound and Heat (3 cr.)",
              "PHYS 1012 - General Physics Laboratory I (1 cr.)",
              "PHYS 1021 - Physics 2: Electricity and Magnetism (3 cr.)",
              "PHYS 1022 - General Physics Laboratory II (1 cr.)"
            ]
          },
          {
            scope: "General Electives",
            title: "General Electives (18 credits)",
            description: "Courses to be chosen in consultation with the advisor, excluding MACT 1111 and MACT 1112.",
            items: [
              "General Electives (18 cr.)"
            ]
          },
          {
            scope: "Concentration Electives",
            title: "Concentration Electives (30 credits)",
            description: "Bachelor of Science in Mathematics: Students must take 6 credits from Group A and a minimum of 12 credits from Group B. For the remaining 12 credits, students may choose courses from Groups B, C or any 3000-, 4000-, 51xx-, 52xx-level courses with high relevance to mathematics, in consultation with the advisor and the approval of the department chair. Due to their overlap, only one of MACT 3143, CENG 3113, ENGR 3202, and PHYS 3241 can count toward the electives. Since Group A overlaps with Groups B and C, the 6 credits from Group A cannot double count with the remaining 24 credits.",
            creditGroup: "mathematics-concentration-electives",
            creditCap: 30,
            items: [],
            subgroups: [
              {
                title: "Group A (Probability and Statistics)",
                items: [
                  "MACT 3211 - Applied Probability (3 cr.)",
                  "MACT 3223 - Statistical Inference (3 cr.)",
                  "MACT 3224 - Probability and Statistics (3 cr.)",
                  "DSCI 4413 - Analysis of Categorical Data (3 cr.)",
                  "MACT 4212 - Stochastic Processes (3 cr.)",
                  "MACT 4231 - Applied Regression Methods (3 cr.)",
                  "MACT 4233 - Applied Multivariate Analysis (3 cr.)"
                ]
              },
              {
                title: "Group B (Mathematics Electives)",
                items: [
                  "MACT 2146 - Optimization I (3 cr.)",
                  "MACT 3142 - Introduction to PDE and Boundary-Value Problems (3 cr.)",
                  "MACT 3143 - Numerical Methods (3 cr.)",
                  "MACT 3146 - Optimization II (3 cr.)",
                  "MACT 3311 - Introduction to Financial Mathematics (3 cr.)",
                  "MACT 3940 - Seminar in Mathematics (1 cr.)",
                  "MACT 4133 - Formal and Mathematical Logic (3 cr.)",
                  "MACT 4135 - Graph Theory (3 cr.)",
                  "MACT 4212 - Stochastic Processes (3 cr.)",
                  "MACT 4213 - Mathematical Modeling with Applications (3 cr.)",
                  "MACT 4231 - Applied Regression Methods (3 cr.)",
                  "MACT 4232 - Analysis of Time Series Data (3 cr.)",
                  "MACT 4233 - Applied Multivariate Analysis (3 cr.)",
                  "MACT 4314 - Financial Modeling (3 cr.)",
                  "MACT 4321 - Long-Term Actuarial Mathematics I (3 cr.)",
                  "MACT 4322 - Long-Term Actuarial Mathematics II (3 cr.)",
                  "MACT 4331 - Short Term Actuarial Mathematics I (3 cr.)",
                  "MACT 4332 - Short Term Actuarial Mathematics II (3 cr.)",
                  "MACT 4910 - Guided Studies in Mathematics (1-3 cr.)",
                  "MACT 4930 - Selected Topics in Mathematics (3 cr.)",
                  "MACT 4931 - Selected Topics in Actuarial Science (3 cr.)",
                  "MACT 4950 - Practical Internship (3 cr.)",
                  "MACT 4980 - Senior Thesis (3 cr.)",
                  "MACT 4990 - Enterprise Risk Management (3 cr.)"
                ]
              },
              {
                title: "Group C (Mathematical Sciences Electives)",
                items: [
                  "CENG 3113 - Numerical Methods (3 cr.)",
                  "CSCE 3611 - Digital Signal Processing (3 cr.)",
                  "CSCE 4201 - Theory of Computing (3 cr.)",
                  "CSCE 4602 - Introduction to Artificial Neural Networks (3 cr.)",
                  "CSCE 4604 - Advanced Machine Learning (3 cr.)",
                  "CSCE 5221 - Algorithms and Complexity Theory (3 cr.)",
                  "CSCE 5269 - Pattern Analysis (3 cr.)",
                  "DSCI 3415 - Fundamentals of Machine Learning (3 cr.)",
                  "DSCI 4411 - Fundamentals of Data Mining (3 cr.)",
                  "DSCI 4412 - Introduction to Big Data Technologies (3 cr.)",
                  "DSCI 4413 - Analysis of Categorical Data (3 cr.)",
                  "DSCI 4415 - Advanced Machine Learning (3 cr.)",
                  "ECNG 3201 - Signals and Systems (3 cr.)",
                  "ECNG 3202 - Automatic Control Systems (3 cr.)",
                  "ECNG 3401 - Electromagnetic Theory (3 cr.)",
                  "ECNG 4301 - Fundamentals of Communications I (3 cr.)",
                  "ECNG 4302 - Fundamentals of Communications II (3 cr.)",
                  "ECNG 4402 - Electromagnetic Waves (3 cr.)",
                  "ENGR 3202 - Engineering Analysis and Computation I (3 cr.)",
                  "MENG 3705 - System Dynamics (3 cr.)",
                  "MENG 4440 - Engineering Operations Research (3 cr.)",
                  "MENG 4606 - Heat Transfer (4 cr.)",
                  "MENG 4756 - Automatic Control Systems (3 cr.)",
                  "MENG 4757 - Robotics: Design, Analysis and Control (3 cr.)",
                  "PHYS 3013 - Theoretical Mechanics (3 cr.)",
                  "PHYS 3023 - Electromagnetic Theory (3 cr.)",
                  "PHYS 3241 - Computational Methods in Physics (3 cr. + 1 cr.)",
                  "PHYS 4042 - Quantum Mechanics I (3 cr.)",
                  "PHYS 4071 - General Relativity and Cosmology (3 cr.)",
                  "PHYS 5142 - Computational Physics (3 cr.)"
                ]
              }
            ]
          },
          {
            scope: "Statistics and Data Analysis Specialization",
            title: "Statistics and Data Analysis Specialization",
            description: "For the Bachelor of Science in Mathematics with the Specialization in Statistics and Data Analysis, students must take all of the following courses. Three other MACT or DSCI courses (9 cr.) from Groups B or C that are not included below, or any 3000-, 4000-, 51xx-, 52xx-level courses with high relevance to mathematics, may be selected in consultation with the advisor and approval of the department chair. Due to overlap, only one of MACT 3143, CENG 3113, ENGR 3202, and PHYS 3241 can count toward the electives.",
            creditGroup: "mathematics-concentration-electives",
            creditCap: 30,
            items: [
              "MACT 3211 - Applied Probability (3 cr.)",
              "MACT 3223 - Statistical Inference (3 cr.)",
              "MACT 4212 - Stochastic Processes (3 cr.)",
              "MACT 4231 - Applied Regression Methods (3 cr.)",
              "MACT 4232 - Analysis of Time Series Data (3 cr.)",
              "MACT 4233 - Applied Multivariate Analysis (3 cr.)",
              "DSCI 4413 - Analysis of Categorical Data (3 cr.)"
            ]
          }
        ]
      },
      "Biology": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (33 credits)",
            description: "The remaining 7 credit hours required to satisfy the core are fulfilled by the concentration Science/lab (4 cr.) and the capstone projects BIOL 4980 and BIOL 4981.",
            items: [
              "Remaining Core Curriculum requirements (26 cr.)"
            ]
          },
          {
            scope: "Biology",
            title: "Concentration Requirements (46 credits)",
            items: [
              "BIOL 1011 - Introductory Biology I (3 cr. + 1 cr. lab)",
              "BIOL 1012 - Introductory Biology II (3 cr. + 1 cr. lab)",
              "BIOL 2090 - Quantitative Biology (3 cr. + 1 cr. lab)",
              "BIOL 2150 - Genetics (3 cr.)",
              "BIOL 2151 - Genetics Laboratory (1 cr.)",
              "BIOL 2160 - Introduction to Bioethics (3 cr.)",
              "BIOL 2230 - Molecular and Cell Biology (3 cr.)",
              "BIOL 2231 - Molecular and Cell Biology Laboratory (1 cr.)",
              "BIOL 2340 - General Botany (3 cr. + 1 cr. lab)",
              "BIOL 3130 - Molecular Evolution and Population Genetics (3 cr. + 1 cr. lab)",
              "BIOL 3310 - Microbiology (3 cr. + 1 cr. lab)",
              "BIOL 3326 - Vertebrate Anatomy and Physiology (3 cr.)",
              "BIOL 3327 - Vertebrate Anatomy and Physiology Laboratory (1 cr.)",
              "BIOL 3510 - Ecology and Conservation Biology (3 cr. + 1 cr. lab)",
              "BIOL 4980 - Senior Research Thesis (1 cr.)",
              "BIOL 4981 - Seminar in Biology (2 cr.)"
            ]
          },
          {
            scope: "Collateral",
            title: "Collateral Requirements (25 credits)",
            items: [
              "CHEM 1005 - General Chemistry I (3 cr.)",
              "CHEM 1006 - General Chemistry II (3 cr.)",
              "CHEM 1015 - General Chemistry I-Laboratory (1 cr.)",
              "CHEM 1016 - General Chemistry II-Laboratory (1 cr.)",
              "CHEM 2003 - Organic Chemistry I (3 cr.)",
              "CHEM 2013 - Organic Chemistry I Laboratory (1 cr.)",
              "CHEM 3015 - Biochemistry (3 cr.)",
              "MACT 1121 - Calculus I (3 cr.)",
              "PHYS 1011 - Physics 1: Classical Mechanics, Sound and Heat (3 cr.)",
              "PHYS 1012 - General Physics Laboratory I (1 cr.)"
            ],
            subgroups: [
              {
                title: "Computing Requirement - Choose One",
                creditGroup: "biology-computing-choice",
                creditCap: 3,
                items: [
                  "CSCE 1001 - Fundamentals of Computing I (3 cr.)",
                  "DSCI 1411 - Fundamentals of Data Science I (3 cr.)"
                ]
              }
            ]
          },
          {
            scope: "Electives",
            title: "Electives (22 credits)",
            description: "For the B.Sc. in Biology, students must take 22 additional credits from the elective courses listed below.",
            creditGroup: "biology-electives",
            creditCap: 22,
            items: [
              "BIOL 3320 - Physical Foundations of Biological Systems (3 cr.)",
              "BIOL 3321 - Physical Foundations of Biological Systems Laboratory (1 cr.)",
              "BIOL 3341 - Animal Behavior (3 cr. + 1 cr. lab)",
              "BIOL 3370 - Developmental Biology (3 cr. + 1 cr. lab)",
              "BIOL 3540 - Sustainability and Environmental protection (3 cr.)",
              "BIOL 3600 - Introduction to Bioinformatics (3 cr.)",
              "BIOL 3601 - Bioinformatics Tools and Techniques (3 cr.)",
              "BIOL 3710 - Introduction to Biotechnology (3 cr.)",
              "BIOL 3750 - Introduction to Genomics (3 cr.)",
              "BIOL 3910 - Guided Studies in Environmental Sciences (3 cr.)",
              "BIOL 4098 - Selected Topics in Neuroscience (3 cr.)",
              "BIOL 4150 - Molecular Biology of the Gene (3 cr. + 1 cr. lab)",
              "BIOL 4160 - Methods in Behavioral Neuroscience (3 cr.)",
              "BIOL 4170 - Molecular Biotechnology (3 cr. + 1 cr. lab)",
              "BIOL 4230 - Cellular and Molecular Immunology (3 cr.)",
              "BIOL 4330 - Tumor Biology (3 cr. + 1 cr. lab)",
              "BIOL 4360 - Human Anatomy and Physiology (3 cr.)",
              "BIOL 4361 - Human Anatomy and Physiology Laboratory (1 cr.)",
              "BIOL 4540 - Marine Ecology and Coral Reef Biology (3 cr.)",
              "BIOL 4541 - Desert Ecology (3 cr. + 1 cr. lab)",
              "BIOL 4930 - Selected Topics in Biology (1-4 cr.)",
              "BIOL 4950 - Practical Internship (1 cr.)"
            ]
          },
          {
            scope: "Specialization",
            title: "Specialization in Genomics and Biotechnology",
            description: "Students must complete the required courses below. In addition, students must complete two courses from the second group. The remaining credits will be selected from the list of electives.",
            creditGroup: "biology-electives",
            creditCap: 22,
            subgroups: [
              {
                title: "Required Courses",
                items: [
                  "BIOL 3600 - Introduction to Bioinformatics (3 cr.)",
                  "BIOL 3710 - Introduction to Biotechnology (3 cr.)",
                  "BIOL 3750 - Introduction to Genomics (3 cr.)",
                  "BIOL 4150 - Molecular Biology of the Gene (3 cr. + 1 cr. lab)"
                ]
              },
              {
                title: "Choose Two",
                items: [
                  "BIOL 3601 - Bioinformatics Tools and Techniques (3 cr.)",
                  "BIOL 4170 - Molecular Biotechnology (3 cr. + 1 cr. lab)",
                  "BIOL 4230 - Cellular and Molecular Immunology (3 cr.)",
                  "BIOL 4330 - Tumor Biology (3 cr. + 1 cr. lab)",
                  "BIOL 4930 - Selected Topics in Biology (1-4 cr.)"
                ]
              }
            ]
          },
          {
            scope: "Specialization",
            title: "Specialization in Ecology and Conservation Biology",
            description: "Students must complete the required courses below. In addition, students must complete three courses from the second group. The remaining credits will be selected from the list of electives.",
            creditGroup: "biology-electives",
            creditCap: 22,
            subgroups: [
              {
                title: "Required Courses",
                items: [
                  "BIOL 3540 - Sustainability and Environmental protection (3 cr.)",
                  "BIOL 4540 - Marine Ecology and Coral Reef Biology (3 cr.)",
                  "BIOL 4541 - Desert Ecology (3 cr. + 1 cr. lab)"
                ]
              },
              {
                title: "Choose Three",
                items: [
                  "BIOL 3341 - Animal Behavior (3 cr. + 1 cr. lab)",
                  "BIOL 3600 - Introduction to Bioinformatics (3 cr.)",
                  "BIOL 3710 - Introduction to Biotechnology (3 cr.)",
                  "BIOL 3910 - Guided Studies in Environmental Sciences (3 cr.)",
                  "BIOL 4360 - Human Anatomy and Physiology (3 cr.)",
                  "BIOL 4930 - Selected Topics in Biology (1-4 cr.)"
                ]
              }
            ]
          },
          {
            scope: "General Electives",
            title: "General Electives (6 credits)",
            items: [
              "General Electives (6 cr.)"
            ]
          }
        ]
      },
      "Sociology": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (37 credits)",
            description: "The remaining 3 credit hours required to satisfy the Core Curriculum are fulfilled by completing one major capstone course: SOC 4025, SOC 4107, SOC 4203, or SOC 4560.",
            items: [
              "Core Curriculum requirements (37 cr.)"
            ]
          },
          {
            scope: "Concentration",
            title: "Concentration Requirements (39 credits)",
            items: [
              "SOC 2101 - Introduction to Sociology (3 cr.)",
              "SOC 3102 - History of Social Theory (3 cr.)",
              "SOC 3103 - Social Statistics (3 cr.)",
              "SOC 3104 - Contemporary Sociological Theory (3 cr.)",
              "SOC 3105 - Sociological Research Methods and Tools (3 cr.)",
              "SOC 4107 - Senior Seminar (3 cr.)"
            ]
          },
          {
            scope: "Concentration Selection",
            title: "Choose One",
            creditGroup: "sociology-concentration-selections",
            creditCap: 21,
            items: [
              "SOC 2301 - Social Problems of the Middle East (3 cr.)",
              "SOC 2302 - Arab Family Structure and Dynamics (3 cr.)"
            ]
          },
          {
            scope: "Concentration Selection",
            title: "Choose One",
            description: "If both courses are taken, one may count toward this requirement and the other toward the additional requirements.",
            creditGroup: "sociology-concentration-selections",
            creditCap: 21,
            items: [
              "SOC 3303 - Social Movements (3 cr.)",
              "SOC 3304 - Social Class and Inequality (3 cr.)"
            ]
          },
          {
            scope: "Concentration Selection",
            title: "Two Additional 3000-Level Sociology Courses",
            creditGroup: "sociology-concentration-selections",
            creditCap: 21,
            items: [
              "SOC 3010 - Social Psychology (3 cr.)",
              "SOC 3025 - Development Agencies (3 cr.)",
              "SOC 3045 - The Urban Experience (3 cr.)",
              "SOC 3060 - Social Constructions of Difference: Race, Class and Gender (3 cr.)",
              "SOC 3085 - Environmental Issues in Egypt (3 cr.)",
              "SOC 3202 - Participatory Action Research in Community Settings (3 cr.)",
              "SOC 3303 - Social Movements (3 cr.)",
              "SOC 3304 - Social Class and Inequality (3 cr.)",
              "SOC 3305 - Selected Topics in Sociology (3 cr.)"
            ]
          },
          {
            scope: "Concentration Selection",
            title: "Three Additional 4000-Level Sociology Courses",
            description: "With approval from the student's advisor and unit head, other 3000- or 4000-level courses in the social sciences may be taken.",
            creditGroup: "sociology-concentration-selections",
            creditCap: 21,
            items: [
              "SOC 4005 - Sociology of Work (3 cr.)",
              "SOC 4025 - Religion in a Global World (3 cr.)",
              "SOC 4035 - Political Sociology (3 cr.)",
              "SOC 4099 - Selected Topics in Sociology (3 cr.)",
              "SOC 4203 - Practicum in Community Development (3 cr.)",
              "SOC 4405 - Independent Study (3 cr.)",
              "SOC 4560 - Development Studies Seminar (3 cr.)"
            ]
          },
          {
            scope: "Collateral",
            title: "Collateral Requirements (24 credits)",
            description: "Eight courses from any social science or humanities discipline approved by the advisor, at least four of which must be at the 3000 or 4000 level.",
            items: [
              "Approved Social Science/Humanities collateral courses (24 cr.)"
            ]
          },
          {
            scope: "General Electives",
            title: "General Electives (20 credits)",
            items: [
              "General Electives (20 cr.)"
            ]
          }
        ]
      },
      "Integrated Marketing Communication": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (40 credits)",
            items: [
              "Core Curriculum requirements (40 cr.)"
            ]
          },
          {
            scope: "JRMC Core",
            title: "JRMC Core Requirements (18 credits)",
            items: [
              "JRMC 2200 - Introduction to Mass Communication (3 cr.)",
              "JRMC 2201 - Media Writing (3 cr.)",
              "JRMC 2202 - Multimedia Writing and Production (3 cr.)",
              "JRMC 2203 - Mass Media Ethics and Responsibility (3 cr.)",
              "JRMC 2208 - Media Literacy in the Digital Age (3 cr.)",
              "JRMC 2270 - Online Communication (3 cr.)"
            ]
          },
          {
            scope: "IMC Concentration",
            title: "IMC Concentration Requirements (42 credits)",
            items: [
              "JRMC 3305 - Introduction to Visual Communication (3 cr.)",
              "JRMC 3315 - Introduction to Advertising (3 cr.)",
              "JRMC 3320 - Mass Communication Research (3 cr.)",
              "JRMC 3355 - Creative Copywriting Strategies (3 cr.)",
              "JRMC 3366 - Online Behavior and Web Analytics (3 cr.)",
              "JRMC 3390 - Media Economics (3 cr.)",
              "JRMC 4405 - Advanced Visual Communication (3 cr.)",
              "JRMC 4406 - Internship (3 cr.)",
              "JRMC 4415 - Public Relations Theory and Techniques (3 cr.)",
              "JRMC 4425 - Integrated Marketing Communication Campaigns Capstone (3 cr.)",
              "JRMC 4430 - Advertising Agency Operations (3 cr.)",
              "JRMC 4441 - Camera and Editing Workshop (3 cr.)",
              "MKTG 2101 - Principles of Marketing (3 cr.)",
              "MKTG 3202 - Consumer-Buyer Behaviour (3 cr.)"
            ]
          },
          {
            scope: "IMC Electives",
            title: "IMC Electives (12 credits)",
            creditGroup: "imc-electives",
            creditCap: 12,
            items: [
              "DSGN 2280 - Production for Designers (3 cr.)",
              "DSGN 3117 - History of Advertising in the Arab World (3 cr.)",
              "DSGN 3265 - Advertising and Branding (3 cr.)",
              "ENTR 4503 - Digital Strategy (3 cr.)",
              "JRMC 2205 - Introduction to Arabic Writing and Reporting (3 cr.)",
              "JRMC 2230 - Photography Foundations I (3 cr.)",
              "JRMC 2250 - Global Media Systems (3 cr.)",
              "JRMC 2280 - Entertainment Media (3 cr.)",
              "JRMC 3303 - Data for Media (3 cr.)",
              "JRMC 3307 - Sports Media (3 cr.)",
              "JRMC 3310 - Public Opinion, Persuasion and Propaganda (3 cr.)",
              "JRMC 4420 - Media Management (3 cr.)",
              "JRMC 4444 - Media Law and Policy (3 cr.)"
            ]
          },
          {
            scope: "General Electives",
            title: "General Electives (8 credits)",
            items: [
              "General Electives (8 cr.)"
            ]
          }
        ]
      },
      "Film": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (37 credits)",
            description: "The remaining 3 credit hours required to satisfy the Core Curriculum are fulfilled by completing the Film major capstone course, either FILM 4250 or FILM 5170.",
            items: [
              "Remaining Core Curriculum requirements (34 cr.)"
            ]
          },
          {
            scope: "Introductory Required Courses",
            title: "Introductory Required Courses (9 credits)",
            items: [
              "FILM 2120 - Introduction to Film Art (3 cr.)",
              "FILM 2121 - Introduction to Fiction Filmmaking (3 cr.)",
              "FILM 2123 - Introduction to Non-Fiction & Experimental Filmmaking (3 cr.)"
            ]
          },
          {
            scope: "Film Studies",
            title: "Film Studies Courses (18 credits)",
            items: [
              "FILM 3110 - World Cinema (3 cr.)",
              "FILM 3130 - Film Theory I (3 cr.)",
              "FILM 3132 - Film Theory II (3 cr.)"
            ]
          },
          {
            scope: "Film Studies",
            title: "Film Studies - Choose Three",
            creditGroup: "film-studies-electives",
            creditCap: 9,
            items: [
              "ANTH 3070 - Anthropology and Film (3 cr.)",
              "ARIC 3106 - Arabic Literature and Film (3 cr.)",
              "ECLT 3030 - Literature and Cinema (3 cr.)",
              "FILM 3070 - Selected Topics in Film (3 cr.)",
              "FILM 3115 - Topics in American Cinema (3 cr.)",
              "FILM 3120 - Cinema in Egypt and the Arab World (3 cr.)",
              "FILM 3125 - Topics in National Cinemas (3 cr.)",
              "FILM 3150 - Topics in Gender and Film (3 cr.)",
              "FILM 3160 - The Filmmaker (3 cr.)",
              "FILM 4402 - Independent Study (1-3 cr.)",
              "PHIL 5150 - Philosophy and Film (3 cr.)"
            ]
          },
          {
            scope: "Film Production",
            title: "Film Production (18 credits)",
            items: [
              "FILM 3201 - Directing Fiction Films (3 cr.)",
              "FILM 3252 - Writing for Film (3 cr.)",
              "FILM 3254 - Film Editing (3 cr.)",
              "FILM 3402 - Hybrid Filmmaking (3 cr.)"
            ]
          },
          {
            scope: "Film Production",
            title: "Film Production - Choose Two",
            creditGroup: "film-production-electives",
            creditCap: 6,
            items: [
              "DSGN 3235 - Animation and 3D (3 cr.)",
              "FILM 3071 - Selected Topics in Filmmaking (3 cr.)",
              "FILM 3253 - Cinematography (3 cr.)",
              "FILM 3255 - Film Producing (3 cr.)",
              "FILM 3355 - Internship in Film Production (3 cr.)",
              "MUSC 3306 - Sound for Picture Production (3 cr.)"
            ]
          },
          {
            scope: "Capstone",
            title: "Capstone Courses (3-6 credits)",
            description: "Choose either FILM 5170 - Advanced Seminar in Film Studies and Research, or both FILM 4250 - Senior Film Project I and FILM 4260 - Senior Film Project II.",
            creditGroup: "film-capstone-and-general-electives",
            creditCap: 29,
            items: [
              "FILM 5170 - Advanced Seminar in Film Studies and Research (3 cr.)",
              "FILM 4250 + FILM 4260 - Senior Film Project I and II (6 cr.)"
            ]
          },
          {
            scope: "Collateral",
            title: "Collateral Requirements (9 credits)",
            description: "Choose three courses in THTR, DSGN, ARTV, MUSC, or ECLT in consultation with the advisor.",
            items: [
              "Approved Film collateral courses (9 cr.)"
            ]
          },
          {
            scope: "General Electives",
            title: "General Electives (23-26 credits)",
            creditGroup: "film-capstone-and-general-electives",
            creditCap: 29,
            items: [
              "General Electives (23-26 cr.)"
            ]
          }
        ]
      },
      "Architecture": {
        note: "",
        groups: [
          {
            scope: "Core Curriculum",
            title: "Core Curriculum (33 credits)",
            description: "The remaining 7 credit hours required to satisfy the core are fulfilled by the concentration Science/lab (4 credits) and one stream course: ARCH 4801, ARCH 4802, or ARCH 4803 (3 credits).",
            items: [
              "Remaining Core Curriculum requirements (26 cr.)"
            ]
          },
          {
            scope: "Engineering Core",
            title: "Engineering Core Requirements (18 credits)",
            items: [
              "ARCH 3231 - Building Performance (3 cr.)",
              "ARCH 3422 - Real Estate Development, Project Finance and Cost Analysis (2 cr.)",
              "ARCH 4422 - Business Management for Architects (2 cr.)",
              "CENG 2115 - Engineering Mechanics and Structural Analysis for Architects (4 cr.)",
              "MACT 1121 - Calculus I (3 cr.)",
              "PHYS 1011 - Physics 1: Classical Mechanics, Sound and Heat (3 cr.)",
              "PHYS 1012 - General Physics Laboratory I (1 cr.)"
            ]
          },
          {
            scope: "Concentration",
            title: "Concentration Requirements (93 credits)",
            items: []
          },
          {
            scope: "Concentration",
            title: "Visual Communication and Basic Design",
            items: [
              "ARCH 1511 - Engineering Drawing & Visual Representation for Architects (2 cr.)",
              "ARCH 1521 - Digital Representation Tools for Architects (2 cr.)",
              "ARCH 2512 - Foundations of 3-Dimensional Design (2 cr.)",
              "ARCH 2551 - Introduction to Architectural Design (3 cr.)"
            ]
          },
          {
            scope: "Concentration",
            title: "Architecture, Urban Planning and Interior Design",
            items: [
              "ARCH 2411 - Surveying for Architects (1 cr.)",
              "ARCH 2552 - Architectural Design Studio I (4 cr.)",
              "ARCH 3522 - Digital Design Studio and Workshop (3 cr.)",
              "ARCH 3553 - Architectural Design Studio II (4 cr.)",
              "ARCH 3554 - Architectural Design Studio III (4 cr.)",
              "ARCH 4532 - Urban Design and Landscape Architecture (4 cr.)",
              "ARCH 4541 - Introduction to Interior Design (3 cr.)",
              "ARCH 4561 - Architectural Design Studio IV: Contextual Analysis & Structural Tectonics (4 cr.)",
              "ARCH 4562 - Architectural Design Studio V: Comprehensive & Integrated Design (4 cr.)",
              "ARCH 4980 - Senior Project I (4 cr.)",
              "ARCH 4981 - Senior Project II (5 cr.)"
            ]
          },
          {
            scope: "Concentration",
            title: "History and Humanities",
            items: [
              "ARCH 2211 - History, Theory & Criticism of Architecture & Urbanism I (3 cr.)",
              "ARCH 2212 - History, Theory and Criticism of Architecture and Urbanism II (3 cr.)",
              "ARCH 2221 - Human Aspects in Architectural Design (3 cr.)"
            ]
          },
          {
            scope: "Concentration",
            title: "Construction Engineering and Professional Practice",
            items: [
              "ARCH 2231 - Environmental Control Systems and Sustainable Design (3 cr.)",
              "ARCH 3311 - Building Construction Methods II for Architects (3 cr.)",
              "ARCH 3321 - Building Service Systems and Building Systems Integration (3 cr.)",
              "ARCH 3331 - Construction Materials and Quality Control (4 cr.)",
              "ARCH 3950 - Internship in Construction Projects (0 cr.)",
              "ARCH 4312 - Design Development and Construction Documents (3 cr.)",
              "ARCH 4421 - Building Codes, Laws & Regulations (3 cr.)",
              "ARCH 4423 - Ethics and Professional Practice (3 cr.)",
              "ARCH 4951 - Internship in Technical Drawing and Design (1 cr.)",
              "CENG 2252 - Building Construction Methods I for Architects (3 cr.)",
              "CENG 3151 - Structural Design for Architects I (3 cr.)",
              "CENG 3152 - Structural Design for Architects II (3 cr.)",
              "CENG 4410 - Introduction to Construction Management and Cost Estimating (3 cr.)"
            ]
          },
          {
            scope: "Concentration Elective Streams",
            title: "Concentration Elective Streams (6 credits)",
            description: "Students follow one stream according to their selected area of study and complete the stream theory and dissertation course plus one additional stream course.",
            items: []
          },
          {
            scope: "Architecture Stream",
            title: "Building Design: Human and Environmental Studies Stream",
            creditGroup: "architecture-elective-stream",
            creditCap: 6,
            items: [
              "ARCH 4801 - Human and Environmental Studies Theory and Dissertation (3 cr.)",
              "ARCH 2601 - Let's Get Sustainable (3 cr.)",
              "ARCH 4932 - Sustainable Landscape Architecture in Hot and Arid Environments (3 cr.)",
              "ARCH 4936 - Design of Interior Spaces (3 cr.)",
              "ARCH 4942 - Co-Design Campus as a Sensory Landscape (3 cr.)",
              "ARCH 4943 - Inclusive & Participatory Design in Architecture (3 cr.)",
              "ARCH 4971 - Selected Topics in Human and Environmental Studies of Architectural Engineering (3 cr.)"
            ]
          },
          {
            scope: "Architecture Stream",
            title: "Tectonics and Computational Design Stream",
            creditGroup: "architecture-elective-stream",
            creditCap: 6,
            items: [
              "ARCH 4802 - Tectonics and Computational Design Theory and Dissertation (3 cr.)",
              "ARCH 4937 - Seminar on Contemporary Architecture Discourse (3 cr.)",
              "ARCH 4939 - Advanced Architectural Computing (3 cr.)",
              "ARCH 4972 - Selected Topics in Tectonics and Computational Design of Architectural Engineering (3 cr.)",
              "PHIL 3010 - Philosophy and Art (3 cr.)"
            ]
          },
          {
            scope: "Architecture Stream",
            title: "Architecture and Urban Heritage Design Stream",
            creditGroup: "architecture-elective-stream",
            creditCap: 6,
            items: [
              "ARCH 4803 - Architecture and Urban Heritage Theory and Dissertation (3 cr.)",
              "ARCH 4931 - Introduction to Urban and Architecture Conservation (3 cr.)",
              "ARCH 4933 - Vernacular Architecture (3 cr.)",
              "ARCH 4934 - Cairo in the Curriculum, The Urban Laboratory: Mapping Cairo's Complexities (3 cr.)",
              "ARCH 4935 - Coptic Art and Architecture (3 cr.)",
              "ARCH 4938 - Urban Dialogues on Heritage and Space (3 cr.)",
              "ARCH 4973 - Selected Topics in Architecture and Urban Heritage Design (3 cr.)",
              "ARIC 3272 - Building the Sultanate: Architecture under the Ayyubids and Mamluks in Egypt and Syria (3 cr.)",
              "ARIC 5124 - Islamic Architecture in Spain and North Africa (3 cr.)",
              "EGPT 3201 - Art and Architecture of Ancient Egypt I (3 cr.)"
            ]
          }
        ]
      },
};
