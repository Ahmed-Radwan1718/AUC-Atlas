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
    ["PENG 4930", "Selected Topics in Petroleum and Energy Engineering"],
    ["RHET 3210", "Business Communication"],
    ["BADM 4001", "Business Strategy"],
    ["BADM 4900", "Graduation Project"],
    ["MGMT 4203", "Organizational Behavior"],
    ["OPMG 3201", "Operations for Sustainable Advantage"],
    ["OPMG 4301", "Supply Chain Management"],
    ["MKTG 3202", "Consumer-Buyer Behaviour"],
    ["MKTG 3301", "Marketing Communications Management"],
    ["MKTG 4034", "Strategic Brand Management"],
    ["MKTG 4302", "Digital Marketing"],
    ["MKTG 4601", "International Marketing"],
    ["MKTG 4602", "Marketing Strategy"],
    ["BUSC 4000", "Experiential Learning: CO-OP"],
    ["BUSC 4001", "Business 360"],
    ["ENTR 4303", "Social Entrepreneurship, Innovation and Sustainability"],
    ["ENTR 4503", "Digital Strategy"],
    ["JRMC 3366", "Online Behavior and Web Analytics"],
    ["MKTG 3203", "Social Media Marketing"],
    ["MKTG 4201", "Advanced Marketing Insights and Analytics"],
    ["MKTG 4303", "Principles of Public Relations"],
    ["MKTG 4401", "Professional Selling"],
    ["MKTG 4501", "Services Marketing"],
    ["MKTG 4970", "Special Topics in Marketing"],
    ["MOIS 3301", "Entrepreneurial IT and Digital Transformation in E-Business"],
    ["MOIS 4704", "AI in Business"],
    ["PSYC 3010", "Social Psychology"],
    ["PSYC 3130", "Learning and Behavioral Psychology"],
    ["PSYC 3270", "Theories of Personality"],
    ["BADM 3002", "International Business"],
    ["ENTR 4302", "Corporate Entrepreneurship and Innovation"],
    ["ENTR 3201", "Entrepreneurial Finance and Venture Capital"],
    ["ENTR 4301", "Entrepreneurship Lab: Developing and Launching a New Venture"],
    ["ENTR 4501", "Managing and Growing Family Businesses"],
    ["ENTR 4502", "Innovation and Technology"],
    ["ENTR 4970", "Special Topics in Entrepreneurship"],
    ["ECON 2061", "Mathematics for Economists I"],
    ["FINC 3301", "Non-Banking Financial Institutions"],
    ["FINC 4203", "Introduction to Derivatives"],
    ["FINC 4302", "Introduction to Private Equity and Direct Investments"],
    ["FINC 4303", "Financial Risk Management"],
    ["ECON 2081", "Statistics for Economists"],
    ["FINC 3601", "Debt Markets"],
    ["FINC 4202", "Capital Markets"],
    ["FINC 4970", "Special Topics in Financial Management"],
    ["ECON 3053", "Economic Development"],
    ["ECON 3061", "Mathematics for Economists II"],
    ["ECON 3071", "Labor Economics"],
    ["ECON 3082", "Practicum"],
    ["ECON 4091", "History of Economic Thought"],
    ["ECON 2051", "Economic History of the Modern Middle East"],
    ["ECON 3054", "Environmental and Natural Resource Economics"],
    ["ECON 3055", "The Digital Economy: Artificial Intelligence, the Future of Work and Development"],
    ["ECON 3099", "Special Topics in Economics"],
    ["ECON 4012", "Feasibility Study"],
    ["ECON 4013", "Behavioral Economics"],
    ["ECON 4014", "Public Economics and Policy Analysis"],
    ["ECON 4015", "Applied Econometrics"],
    ["ECON 4041", "Financial Economics"],
    ["ECON 4050", "CopyrightX: The Economics of Copyright and Creativity"],
    ["ECON 4051", "Seminar on Economic Development and Policy in the Middle East"],
    ["ECON 4061", "Mathematical Economics"],
    ["ECON 4081", "Econometrics"],
    ["ECON 4082", "Practicum"],
    ["ECON 4094", "Economics of Egypt"],
    ["ECON 4099", "Seminar: Selected Topics in Economics"],
    ["ECON 5254", "Economic Growth & Development"],
    ["PPAD 5211", "Qualitative Analysis for Policy and Administration"],
    ["ECON 5241", "Financial Economics"],
    ["ECON 5215", "Competitive Strategy and Game Theory"],
    ["MOIS 4202", "Business Information Systems Analysis and Development"],
    ["MOIS 4999", "Internship and Graduation Project"],
    ["CSCE 1102", "Fundamentals of Computing II Lab"],
    ["CSCE 3422", "Introduction to Information Security"],
    ["CSCE 3101", "Programming Language"],
    ["CSCE 3104", "Concepts of Programming Languages"],
    ["CSCE 3421", "Fundamentals of Computing and Communication Systems"],
    ["CSCE 4502", "Design of Web-Based Systems"],
    ["MOIS 3401", "Human Machine Interaction and Internet of Things (IoT)"],
    ["MOIS 3501", "Geographic Information Systems (GIS)"],
    ["MOIS 3801", "Strategic Management of Information Technology"],
    ["MOIS 4701", "Software Quality Management"],
    ["MOIS 4702", "IT Service Management Course (ITSM)"],
    ["MOIS 4703", "Enterprise Information Systems"],
    ["MOIS 4705", "IT Project Management"],
    ["MOIS 4970", "Special Topics in Management of Information Systems"],
    ["ARTV 2113", "Introduction to Visual Cultures"],
    ["ARTV 2200", "Art Foundations"],
    ["ARTV 2214", "Global Art History: Ancient Power to Early Modernity"],
    ["ARTV 3115", "Art Theory"],
    ["ARTV 3311", "Advanced Painting and Drawing"],
    ["ARTV 3312", "Advanced Studio Arts: New Media"],
    ["ARTV 3313", "Advanced Studio Arts: Archival Practices"],
    ["ARTV 3314", "Advanced Studio Arts: Community Engagement"],
    ["ARTV 3316", "Global Art History: Modernism to Contemporary Politics"],
    ["ARTV 4269", "Senior Project (A)"],
    ["ARTV 4270", "Senior Project (B)"],
    ["ARTV 2201", "Introduction to Drawing"],
    ["ARTV 2202", "Introduction to Painting"],
    ["ARTV 2203", "Introduction to Sculpture"],
    ["ARTV 2204", "Introduction to Time-Based Media"],
    ["ARTV 2207", "Introduction to Ceramics"],
    ["ARTV 2208", "Internship Practice"],
    ["ARTV 2230", "Introduction to Photography and Media Arts"],
    ["ARTV 3270", "Selected Topics in Art"],
    ["ARTV 5110", "Contemporary Issues in Arab Art"],
    ["DSGN 2250", "Digital Practices I"],
    ["THTR 1201", "Theatre in the Making"],
    ["THTR 2201", "Acting I"],
    ["THTR 2401", "Introduction to Technical Theatre"],
    ["THTR 3103", "Drama in Context I: Ritual to Pre-Modern"],
    ["THTR 3104", "Drama in Context II: Modern to Contemporary"],
    ["THTR 3301", "Directing I"],
    ["THTR 3401", "Design for the Theatre"],
    ["THTR 3601", "Advanced Theatre Practicum"],
    ["THTR 4703", "Senior Thesis"],
    ["THTR 2601", "Production Practicum"],
    ["THTR 2603", "Rehearsal and Performance Practicum"],
    ["THTR 2211", "Acting in Arabic I"],
    ["THTR 3099", "Selected Topics in Theatre"],
    ["THTR 3201", "Acting II"],
    ["THTR 3202", "Acting for the Camera"],
    ["THTR 3203", "Special Topics in Acting"],
    ["THTR 3205", "Acting Styles"],
    ["THTR 3207", "Movement for the Stage"],
    ["THTR 3211", "Acting in Arabic II"],
    ["THTR 3403", "Make Up for the Theatre"],
    ["THTR 3501", "Scriptwriting"],
    ["THTR 3603", "Design Practicum"],
    ["THTR 3604", "Arab Women Playwrights"],
    ["THTR 4103", "Dramatic Theory and Criticism"],
    ["THTR 4110", "Theatrical and Dramatic Translation"],
    ["THTR 4301", "Directing II"],
    ["THTR 4405", "Stage Lighting"],
    ["THTR 4406", "Costume Design for Theatre and Film"],
    ["THTR 4444", "Internship in Drama"],
    ["ARIC 3115", "Arabic Drama"],
    ["ECLT 3060", "Shakespeare"],
    ["MUSC 1011", "Vocal Methods"],
    ["SOC 4025", "Religion in a Global World"],
    ["SOC 4107", "Senior Seminar"],
    ["SOC 4203", "Practicum in Community Development"],
    ["SOC 4560", "Development Studies Seminar"],
    ["SOC 2101", "Introduction to Sociology"],
    ["SOC 3102", "History of Social Theory"],
    ["SOC 3103", "Social Statistics"],
    ["SOC 3104", "Contemporary Sociological Theory"],
    ["SOC 3105", "Sociological Research Methods and Tools"],
    ["SOC 2301", "Social Problems of the Middle East"],
    ["SOC 2302", "Arab Family Structure and Dynamics"],
    ["SOC 3303", "Social Movements"],
    ["SOC 3304", "Social Class and Inequality"],
    ["SOC 3010", "Social Psychology"],
    ["SOC 3025", "Development Agencies"],
    ["SOC 3045", "The Urban Experience"],
    ["SOC 3060", "Social Constructions of Difference: Race, Class and Gender"],
    ["SOC 3085", "Environmental Issues in Egypt"],
    ["SOC 3202", "Participatory Action Research in Community Settings"],
    ["SOC 3305", "Selected Topics in Sociology"],
    ["SOC 4005", "Sociology of Work"],
    ["SOC 4035", "Political Sociology"],
    ["SOC 4099", "Selected Topics in Sociology"],
    ["SOC 4405", "Independent Study"],
    ["PSYC 1000", "Introduction to Psychology"],
    ["PSYC 2000", "Introduction to Psychological Statistics"],
    ["PSYC 2100", "Research Methods for Psychology"],
    ["PSYC 3003", "Community Psychology"],
    ["PSYC 3040", "Lifespan Development"],
    ["PSYC 3080", "Cognitive Psychology"],
    ["PSYC 3420", "Psychopathology"],
    ["PSYC 3800", "Biopsychology"],
    ["PSYC 4030", "History and Systems of Psychology"],
    ["PSYC 4150", "Psychological Testing and Assessment"],
    ["ANTH 2101", "Cultural Anthropology"],
    ["POLS 4030", "Seminar: Special Topics in Political Science for Undergraduates"],
    ["POLS 4640", "Seminar: Special Topics in International Relations for Undergraduates"],
    ["POLS 5130", "Seminar: Special Topics in Political Science"],
    ["POLS 5140", "Seminar: Special Topics in International Relations"],
    ["POLS 2003", "Introduction to Political Science II"],
    ["POLS 2104", "Introduction to Research Methods in Political Science"],
    ["POLS 2405", "History and International Politics"],
    ["POLS 3201", "History of Political Theory I"],
    ["POLS 3202", "History of Political Theory II"],
    ["POLS 3401", "Introduction to Comparative Politics"],
    ["POLS 3408", "Comparative Politics of the Middle East"],
    ["POLS 3510", "Introduction to Development"],
    ["POLS 3550", "Introduction to Political Economy"],
    ["POLS 3620", "Introduction to International Relations Theories"],
    ["POLS 4371", "Introduction to Public International Law"],
    ["POLS 4608", "Critical Approaches to International Relations and the Global South"],
    ["POLS 4609", "International Organizations"],
    ["POLS 4610", "Global Security"],
    ["POLS 4611", "Comparative Foreign Policy Analysis"],
    ["POLS 4605", "International Politics of the Middle East"],
    ["POLS 4614", "Egyptian Foreign Policy"],
    ["POLS 4615", "U.S. Foreign Policy"],
    ["POLS 4435", "The State and Society"],
    ["POLS 4403", "American Government and Politics"],
    ["POLS 4405", "Comparative Politics of Contemporary Africa"],
    ["POLS 4420", "Issues in Middle East Politics"],
    ["POLS 4423", "Comparative Government and Politics: Developing Systems"],
    ["POLS 4424", "Comparative Government and Politics in Contemporary Eastern Europe and Russia"],
    ["POLS 4425", "Government and Politics of Egypt"],
    ["POLS 4432", "Seminar: Comparative Politics and/or Policies"],
    ["POLS 4437", "Comparative Politics of Asia"],
    ["POLS 4438", "Modern China"],
    ["POLS 4439", "Comparative Politics of the Modern Caucasus and Central Asia"],
    ["POLS 4444", "Comparative Politics of Latin America"],
    ["POLS 4480", "Israeli Politics and Society"],
    ["ARIC 5142", "Islamic Law"],
    ["POLS 4372", "International Law in the Middle East"],
    ["POLS 4375", "Introduction to Egyptian and Islamic Law"],
    ["POLS 4377", "Law and Development"],
    ["POLS 4422", "Contemporary Egypt"],
    ["POLS 4525", "Global Political Economy"],
    ["POLS 4526", "Political Economy of the Global South"],
    ["POLS 4551", "Theories of Political Economy"],
    ["POLS 4502", "Political Economy of Egypt and the Middle East"],
    ["POLS 4513", "International Financial Institutions"],
    ["POLS 4523", "The Political Economy of Poverty and Inequality"],
    ["POLS 4542", "Environmental Politics"],
    ["POLS 4378", "Introduction to International Human Rights Law"],
    ["HIST 2204", "The Making of the Modern Arab World"],
    ["HIST 2301", "The Struggle for Africa"],
    ["HIST 2502", "History of Modern American Civilization"],
    ["HIST 3207", "Histories of Palestine"],
    ["HIST 3208", "Zionism and Modern Judaism"],
    ["HIST 3214", "State and Society in the Middle East, 1906–Present"],
    ["HIST 3288", "Selected Topics in Middle East History"],
    ["HIST 3302", "Violence, War, and Conflict in Modern Africa"],
    ["HIST 4107", "The Environment in World History"],
    ["HIST 4188", "Selected Topics in World History"],
    ["HIST 4216", "Remembering Cairo"],
    ["HIST 4217", "Colonialism and Imperialism: Domination and Resistance"],
    ["HIST 4219", "Modern Movements in Islam"],
    ["HIST 4288", "Selected Topics in the History of the Modern Middle East"],
    ["HIST 4290", "Selected Topics in Modern Egyptian History"],
    ["HIST 4303", "Global Capitalism and Africa: An Economic History"],
    ["HIST 4488", "Selected Topics in European History"],
    ["HIST 4588", "Selected Topics in the History of the United States"],
    ["LAW 5134", "International Humanitarian Law"],
    ["LAW 5175", "Human Rights in the Middle East"],
    ["LAW 5176", "Economic, Social, and Cultural Rights"],
    ["LAW 5298", "Graduate Law Seminar"],
    ["LAW 5299", "Research Guidance/Thesis"],
    ["PHIL 5101", "Advanced Seminar in Classical Philosophy"],
    ["PHIL 5104", "Selected Topics in Contemporary Philosophy"],
    ["PHIL 5112", "Advanced Seminar in Aesthetics"],
    ["PHIL 5119", "Advanced Seminar in Political Philosophy"],
    ["PHIL 2010", "Truth, Lies, and Logical Reasoning"],
    ["PHIL 3101", "Classical Philosophy"],
    ["PHIL 3102", "Modern Philosophy"],
    ["PHIL 2111", "Self and Society"],
    ["PHIL 2112", "Philosophy of Religion"],
    ["PHIL 2113", "Introduction to Ethics"],
    ["PHIL 2117", "Political Philosophy"],
    ["PHIL 3017", "Philosophy of Science and Technology"],
    ["PHIL 3104", "Metaphysics and Epistemology"],
    ["PHIL 5117", "Philosophy of Language"],
    ["PHIL 5121", "Philosophical Logic"],
    ["PHIL 5122", "Advanced Seminar in Islamic Philosophy"],
    ["PHIL 5123", "Kant and Idealism"],
    ["PHIL 5124", "Advanced Seminar in Phenomenology"],
    ["PHIL 2100", "Philosophical Thinking"],
    ["PHIL 2099", "Selected Topics for Core Curriculum"],
    ["PHIL 2200", "Philosophy and Globalization"],
    ["PHIL 3014", "Literature and Philosophy"],
    ["PHIL 3015", "Islamic Philosophy"],
    ["PHIL 3016", "American Philosophy"],
    ["PHIL 3200", "Philosophy of History"],
    ["PHIL 5100", "Independent Study in Philosophy"],
    ["PHIL 5120", "Advanced Seminar in Feminist Philosophy"],
    ["PHIL 5125", "Advanced Seminar in Moral Philosophy"],
    ["PHIL 5130", "Philosophy of Mind"],
    ["PHIL 5150", "Philosophy and Film"],
    ["PHIL 5151", "Philosophy of Media"],
    ["PHIL 5199", "Selected Topics in Philosophy"],
    ["POLS 4000", "The Discipline and Critical Social Theory"],
    ["POLS 4090", "Honors Thesis Seminar"],
    ["POLS 4104", "Political Science Methods"],
    ["HIST 4111", "Arabs in America"],
    ["HIST 4113", "Ideas Dictators Hate"],
    ["HIST 4215", "The Marriage Crisis and the Middle East"],
    ["HIST 1000", "Why History?"],
    ["HIST 2000", "How to Use a Time Machine? Investigating the Past"],
    ["HIST 4801", "Historical Theory and Methodology"],
    ["DSGN 2113", "Introduction to Visual Cultures"],
    ["DSGN 2115", "History of Graphic Design"],
    ["DSGN 2200", "Design Foundations"],
    ["DSGN 2201", "Design Principles & Practices"],
    ["DSGN 2210", "Typography I"],
    ["DSGN 2240", "Color"],
    ["DSGN 2260", "Production for Designers"],
    ["DSGN 3220", "Typography II"],
    ["DSGN 4269", "Senior Project Thesis"],
    ["DSGN 4270", "Senior Project Practice"],
    ["DSGN 2300", "Analog Game Design"],
    ["DSGN 3202", "Logo and Visual Identity Design"],
    ["DSGN 3203", "Publication Design"],
    ["DSGN 3204", "Packaging Design"],
    ["DSGN 3205", "Retail Design"],
    ["DSGN 3210", "Information Design"],
    ["DSGN 3213", "Interactive Design"],
    ["DSGN 3230", "Type Design"],
    ["DSGN 3265", "Advertising and Branding"],
    ["DSGN 3266", "Design for Social Change"],
    ["DSGN 3270", "Selected Topics in Design"],
    ["DSGN 3400", "Digital Game Design"],
    ["DSGN 4200", "Design Field Practices"],
    ["DSGN 2245", "Illustration"],
    ["DSGN 3235", "Animation and 3D"],
    ["DSGN 3250", "Digital Practices II"],
    ["DSGN 3260", "Photography for Designers"],
    ["DSGN 3300", "Digital Game Mechanics"],
    ["DSGN 4210", "Portfolio"],
    ["ARIC 3268", "The Art of the Book in the Islamic World"],
    ["DSGN 3117", "History of Advertising in the Arab World"],
    ["DSGN 3118", "History of Arabic Calligraphy"],
    ["DSGN 5115", "History of Graphic Design in the Arab World"],
    ["FILM 2120", "Introduction to Film Art"],
    ["FILM 2121", "Introduction to Fiction Filmmaking"],
    ["FILM 2123", "Introduction to Non-Fiction & Experimental Filmmaking"],
    ["FILM 3110", "World Cinema"],
    ["FILM 3130", "Film Theory I"],
    ["FILM 3132", "Film Theory II"],
    ["ANTH 3070", "Anthropology and Film"],
    ["ARIC 3106", "Arabic Literature and Film"],
    ["ECLT 3030", "Literature and Cinema"],
    ["FILM 3070", "Selected Topics in Film"],
    ["FILM 3115", "Topics in American Cinema"],
    ["FILM 3120", "Cinema in Egypt and the Arab World"],
    ["FILM 3125", "Topics in National Cinemas"],
    ["FILM 3150", "Topics in Gender and Film"],
    ["FILM 3160", "The Filmmaker"],
    ["FILM 4402", "Independent Study"],
    ["FILM 3201", "Directing Fiction Films"],
    ["FILM 3252", "Writing for Film"],
    ["FILM 3254", "Film Editing"],
    ["FILM 3402", "Hybrid Filmmaking"],
    ["FILM 3071", "Selected Topics in Filmmaking"],
    ["FILM 3253", "Cinematography"],
    ["FILM 3255", "Film Producing"],
    ["FILM 3355", "Internship in Film Production"],
    ["MUSC 3306", "Sound for Picture Production"],
    ["FILM 5170", "Advanced Seminar in Film Studies and Research"],
    ["FILM 4250", "Senior Film Project I"],
    ["FILM 4260", "Senior Film Project II"]
  ];

  const subjectLabels = {
    ACCT: "Accounting",
    ANTH: "Anthropology",
    ARCH: "Architecture",
    ARIC: "Arab and Islamic Civilizations",
    ARTV: "Visual Arts",
    BADM: "Business",
    BIOL: "Biology",
    BUSC: "Business",
    CENG: "Construction Engineering",
    CHEM: "Chemistry",
    CSCE: "Computer Science",
    DSCI: "Data Science",
    DSGN: "Graphic Design",
    ECLT: "English and Comparative Literature",
    ECON: "Economics",
    EGPT: "Egyptology",
    ENGR: "Engineering",
    ENTR: "Entrepreneurship",
    FILM: "Film",
    FINC: "Finance",
    HIST: "History",
    JRMC: "Journalism and Mass Communication",
    LAW: "Law",
    MACT: "Mathematics",
    MENG: "Mechanical Engineering",
    MGMT: "Management",
    MKTG: "Marketing",
    MOIS: "Management Information Systems",
    MUSC: "Music",
    OPMG: "Operations Management",
    PENG: "Petroleum and Energy Engineering",
    PHIL: "Philosophy",
    PHYS: "Physics",
    POLS: "Political Science",
    PPAD: "Public Policy and Administration",
    PSYC: "Psychology",
    RHET: "Rhetoric and Composition",
    SCI: "Science",
    SOC: "Sociology",
    THTR: "Theatre"
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

  const courseProfessors = {};

  window.aucAtlasCourses = courses;
  window.aucAtlasCourseProfessors = courseProfessors;

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
        <button
          class="course-department-button"
          type="button"
          data-course-department="${subject.label}"
        >
          <span>${subject.code}</span>
          <strong>${subject.label}</strong>
        </button>
      `;
    }).join("");

    filtersRoot.querySelectorAll("[data-course-department]").forEach(function (button) {
      button.addEventListener("click", function () {
        const searchInput = document.getElementById("course-search-input");

        if (!searchInput) {
          return;
        }

        searchInput.value = button.dataset.courseDepartment || "";
        renderCourses();

        searchInput.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
    });
  }

  const popularCourseCodes = [
    "MACT 1121",
    "CSCE 1001",
    "PHYS 1011",
    "CHEM 1005",
    "ACCT 2001",
    "ECON 2011",
    "MKTG 2101",
    "BADM 2001"
  ];

  function getCourseByCode(courseCode) {
    const normalizedCode = normalizeCourseCode(courseCode);

    return courses.find(function (course) {
      return normalizeCourseCode(course.code) === normalizedCode;
    });
  }

  function renderPopularCourses() {
    const root = document.getElementById("course-popular-grid");

    if (!root) {
      return;
    }

    const popularCourses = popularCourseCodes
      .map(getCourseByCode)
      .filter(Boolean);

    root.innerHTML = popularCourses.map(function (course) {
      return `
        <a
          class="course-feature-card"
          href="courses.html?course=${encodeURIComponent(course.code)}"
          aria-label="Open ${escapeMaterialText(course.code)} course page"
        >
          <span class="course-feature-code">${escapeMaterialText(course.code)}</span>
          <h3>${escapeMaterialText(course.title)}</h3>

          <div class="course-feature-meta">
            <span>${escapeMaterialText(course.department)}</span>
            <span>${escapeMaterialText(course.level)}</span>
          </div>
        </a>
      `;
    }).join("");
  }

  function renderRecentMaterials(materials) {
    const root = document.getElementById("course-recent-materials");
    const safeMaterials = Array.isArray(materials)
      ? materials.slice(0, 6)
      : [];

    if (!root) {
      return;
    }

    if (!safeMaterials.length) {
      root.innerHTML = `
        <div class="course-recent-status">
          <strong>No approved course materials yet.</strong>
          <p>New uploads will appear here after they are reviewed.</p>
        </div>
      `;
      return;
    }

    root.innerHTML = safeMaterials.map(function (material) {
      const courseCode = String(material.courseCode || "").trim();
      const courseTitle = String(material.courseTitle || "").trim();
      const courseLabel = [courseCode, courseTitle]
        .filter(Boolean)
        .join(" — ");
      const href = courseCode
        ? "courses.html?course=" +
          encodeURIComponent(courseCode) +
          "#course-materials-access"
        : "courses.html";

      return `
        <a class="course-recent-card" href="${href}">
          <span class="course-recent-type">
            ${escapeMaterialText(material.materialType || "Course material")}
          </span>

          <h3>${escapeMaterialText(material.title || "Course material")}</h3>
          <p>${escapeMaterialText(courseLabel || "AUC course material")}</p>

          <div class="course-recent-meta">
            <span>${escapeMaterialText(material.professor || "Professor not listed")}</span>
            <span>${escapeMaterialText(material.semester || "Semester not listed")}</span>
          </div>

          <small>${escapeMaterialText(formatMaterialUploadDate(material.createdAt))}</small>
        </a>
      `;
    }).join("");
  }

  async function loadRecentMaterials() {
    const root = document.getElementById("course-recent-materials");

    if (!root) {
      return;
    }

    try {
      const response = await fetch(
        "/api/course-materials?recent=true&limit=6",
        {
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        }
      );

      const data = await response.json().catch(function () {
        return {};
      });

      if (response.status === 401 || response.status === 403) {
        root.innerHTML = `
          <div class="course-recent-status">
            <strong>Sign in to view recent materials.</strong>
            <p>Course files are available to students with a verified AUC email.</p>
            <a href="login.html">Log in</a>
          </div>
        `;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not load recent materials.");
      }

      renderRecentMaterials(data.materials);
    } catch (error) {
      root.innerHTML = `
        <div class="course-recent-status">
          <strong>Recent materials are unavailable right now.</strong>
          <p>Please try again later.</p>
        </div>
      `;
    }
  }

  function setupCourseUploadStart() {
    const button = document.getElementById("course-upload-start");
    const searchInput = document.getElementById("course-search-input");

    if (!button || !searchInput) {
      return;
    }

    button.addEventListener("click", function () {
      searchInput.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      window.setTimeout(function () {
        searchInput.focus();
      }, 350);
    });
  }

  function courseMatches(course) {
    const query = getCourseSearchQuery();
    const selectedSubjects = getCheckedSubjects();
    const searchableText = normalize([course.code, course.title, course.subject, course.department, course.level].join(" "));

    return (!query || searchableText.includes(query)) && (!selectedSubjects.length || selectedSubjects.includes(course.subject));
  }

  function setCoursesSearchState(hasActiveSearch) {
    const homeContent = document.getElementById("courses-home-content");
    const grid = document.getElementById("courses-grid");
    const count = document.getElementById("courses-result-count");

    if (homeContent) {
      homeContent.hidden = hasActiveSearch;
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

  function getReviewedCourseProfessor(review) {
    const professorId = String(review && review.professorId ? review.professorId : "").trim();
    const professorName = String(review && review.professorName ? review.professorName : "").trim();
    const professorSource = Array.isArray(window.aucAtlasProfessors)
      ? window.aucAtlasProfessors
      : [];
    const knownProfessor = professorSource.find(function (professor) {
      return String(professor && professor.id ? professor.id : "").trim().toLowerCase() === professorId.toLowerCase();
    });

    return {
      id: knownProfessor ? knownProfessor.id : professorId,
      name: knownProfessor ? knownProfessor.name : professorName,
      department: knownProfessor
        ? (knownProfessor.displayDepartment || knownProfessor.department || "AUC")
        : "AUC"
    };
  }

  function renderCourseProfessors(course, reviews) {
    const list = document.getElementById("course-professor-list");

    if (!list) {
      return;
    }

    const professorRow = list.closest(".course-detail-professors");
    const professorsById = new Map();
    const safeReviews = Array.isArray(reviews) ? reviews : [];

    safeReviews.forEach(function (review) {
      const professor = getReviewedCourseProfessor(review);
      const professorKey = String(professor.id || professor.name || "").trim().toLowerCase();

      if (professorKey && professor.name) {
        professorsById.set(professorKey, professor);
      }
    });

    const professors = Array.from(professorsById.values()).sort(function (firstProfessor, secondProfessor) {
      return firstProfessor.name.localeCompare(secondProfessor.name);
    });

    if (professorRow) {
      professorRow.hidden = !professors.length;
    }

    if (!professors.length) {
      list.innerHTML = "";
      return;
    }

    list.innerHTML = professors.map(function (professor) {
      return `
        <a class="course-professor-link" href="professors.html?id=${encodeURIComponent(professor.id)}">
          <strong>${escapeMaterialText(professor.name)}</strong>
        </a>
      `;
    }).join("");
  }

  async function loadCourseProfessors(course) {
    const list = document.getElementById("course-professor-list");
    const professorRow = list ? list.closest(".course-detail-professors") : null;

    if (professorRow) {
      professorRow.hidden = true;
    }

    if (list) {
      list.innerHTML = "";
    }

    try {
      const response = await fetch(
        "/api/professor-reviews?courseCode=" + encodeURIComponent(course.code),
        {
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Accept": "application/json"
          }
        }
      );

      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        throw new Error(data.error || "Could not load course professors.");
      }

      renderCourseProfessors(course, data.reviews || []);
    } catch (error) {
      renderCourseProfessors(course, []);
    }
  }

  function closeMaterialChoiceMenus(activeChoice) {
    document.querySelectorAll(".material-choice.open").forEach(function (choice) {
      if (choice !== activeChoice) {
        choice.classList.remove("open");

        const button = choice.querySelector(".material-choice-button");

        if (button) {
          button.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  function syncMaterialChoiceButton(choice, select) {
    const button = choice.querySelector(".material-choice-button");
    const selectedOption = select.options[select.selectedIndex];

    if (button && selectedOption) {
      button.textContent = selectedOption.textContent;
    }

    choice.querySelectorAll(".material-choice-option").forEach(function (optionButton) {
      optionButton.setAttribute("aria-selected", optionButton.dataset.value === select.value ? "true" : "false");
    });
  }

  function syncMaterialChoiceMenus(form) {
    form.querySelectorAll("select.material-native-select").forEach(function (select) {
      const choice = select.nextElementSibling;

      if (choice && choice.classList.contains("material-choice")) {
        syncMaterialChoiceButton(choice, select);
      }
    });
  }

  function setupMaterialChoiceMenus(form) {
    form.querySelectorAll("select.material-native-select").forEach(function (select) {
      if (select.dataset.choiceReady === "true") {
        return;
      }

      select.dataset.choiceReady = "true";

      const choice = document.createElement("div");
      const button = document.createElement("button");
      const menu = document.createElement("div");
      const isProfessorSelect = select.id === "material-professor";
      let searchInput = null;

      choice.className = "material-choice";
      button.type = "button";
      button.className = "material-choice-button";
      button.setAttribute("aria-haspopup", "listbox");
      button.setAttribute("aria-expanded", "false");
      menu.className = "material-choice-menu";
      menu.setAttribute("role", "listbox");

      function filterChoiceOptions(query) {
        const terms = String(query || "")
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        menu.querySelectorAll(".material-choice-option").forEach(function (optionButton) {
          const optionText = optionButton.textContent.toLowerCase();
          const hasValue = Boolean(optionButton.dataset.value);
          const matches = !terms.length || (hasValue && terms.every(function (term) {
            return optionText.indexOf(term) !== -1;
          }));

          optionButton.hidden = !matches;
        });
      }

      function clearChoiceSearch() {
        if (searchInput) {
          searchInput.value = "";
          filterChoiceOptions("");
        }
      }

      if (isProfessorSelect) {
        const searchWrap = document.createElement("div");

        searchInput = document.createElement("input");
        searchInput.type = "search";
        searchInput.className = "material-choice-search";
        searchInput.placeholder = "Search professors";
        searchInput.setAttribute("aria-label", "Search professors");
        searchInput.setAttribute("autocomplete", "new-password");
        searchInput.setAttribute("autocorrect", "off");
        searchInput.setAttribute("autocapitalize", "none");
        searchInput.setAttribute("spellcheck", "false");
        searchInput.setAttribute("data-lpignore", "true");
        searchInput.setAttribute("data-form-type", "other");

        searchWrap.className = "material-choice-search-wrap";
        searchWrap.appendChild(searchInput);
        menu.appendChild(searchWrap);

        searchInput.addEventListener("input", function () {
          filterChoiceOptions(searchInput.value);
        });

        searchInput.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            event.preventDefault();
            clearChoiceSearch();
            searchInput.blur();
          }
        });
      }

      Array.from(select.options).forEach(function (option) {
        const optionButton = document.createElement("button");

        optionButton.type = "button";
        optionButton.className = "material-choice-option";
        optionButton.dataset.value = option.value;
        optionButton.textContent = option.textContent;
        optionButton.setAttribute("role", "option");

        optionButton.addEventListener("click", function () {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          choice.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
          clearChoiceSearch();
          syncMaterialChoiceButton(choice, select);
        });

        menu.appendChild(optionButton);
      });

      button.addEventListener("click", function () {
        const willOpen = !choice.classList.contains("open");

        closeMaterialChoiceMenus(choice);
        choice.classList.toggle("open", willOpen);
        button.setAttribute("aria-expanded", willOpen ? "true" : "false");

        if (willOpen && searchInput) {
          window.setTimeout(function () {
            searchInput.focus();
          }, 0);
        } else {
          clearChoiceSearch();
        }
      });

      document.addEventListener("click", function (event) {
        if (!choice.contains(event.target)) {
          choice.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
          clearChoiceSearch();
        }
      });

      select.addEventListener("change", function () {
        syncMaterialChoiceButton(choice, select);
      });

      choice.appendChild(button);
      choice.appendChild(menu);
      select.insertAdjacentElement("afterend", choice);
      syncMaterialChoiceButton(choice, select);
    });
  }

  function formatMaterialFileSize(fileSize) {
    const bytes = Number(fileSize) || 0;

    if (bytes >= 1024 * 1024) {
      const megabytes = bytes / (1024 * 1024);
      return megabytes.toFixed(megabytes >= 10 ? 0 : 1) + " MB";
    }

    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function setMaterialFileSelection(form, files) {
    const selection = form.querySelector("#material-file-selection");
    const selectedFiles = Array.from(files || []);

    if (!selection) {
      return;
    }

    selection.hidden = !selectedFiles.length;

    selection.innerHTML = selectedFiles.map(function (file) {
      return `
        <div class="material-file-item">
          <strong>${escapeMaterialText(file.name)}</strong>
          <span>${formatMaterialFileSize(file.size)}</span>
        </div>
      `;
    }).join("");
  }

  function setupMaterialFilePicker(form) {
    const fileInput = form.querySelector("#material-file");

    if (!fileInput || fileInput.dataset.fileReady === "true") {
      return;
    }

    fileInput.dataset.fileReady = "true";

    fileInput.addEventListener("change", function () {
      setMaterialFileSelection(form, fileInput.files);
    });
  }

  function escapeMaterialText(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function getMaterialInitials(name) {
    return String(name || "AUC student")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("") || "A";
  }

  function getMaterialFileExtension(fileName, fileType) {
    const name = String(fileName || "").trim().toLowerCase();
    const extensionMatch = name.match(/\.([a-z0-9]{1,8})$/);

    if (extensionMatch) {
      return extensionMatch[1];
    }

    const type = String(fileType || "").toLowerCase();

    if (type.indexOf("pdf") !== -1) return "pdf";
    if (type.indexOf("word") !== -1) return "docx";
    if (type.indexOf("presentation") !== -1) return "pptx";
    if (type.indexOf("spreadsheet") !== -1) return "xlsx";
    if (type.indexOf("jpeg") !== -1) return "jpg";
    if (type.indexOf("png") !== -1) return "png";
    if (type.indexOf("webp") !== -1) return "webp";

    return "file";
  }

  function getMaterialFileLabel(extension) {
    const labels = {
      pdf: "PDF document",
      doc: "Word document",
      docx: "Word document",
      ppt: "PowerPoint presentation",
      pptx: "PowerPoint presentation",
      xls: "Excel spreadsheet",
      xlsx: "Excel spreadsheet",
      jpg: "Image",
      jpeg: "Image",
      png: "Image",
      webp: "Image",
      gif: "Image",
      zip: "ZIP archive"
    };

    return labels[extension] ||
      extension.toUpperCase() + " file";
  }

  function formatMaterialUploadDate(value) {
    const date = new Date(value || "");

    if (Number.isNaN(date.getTime())) {
      return "Upload date unavailable";
    }

    return "Uploaded " + date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function isMaterialPreviewable(extension) {
    return [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "xls",
      "xlsx",
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif"
    ].includes(extension);
  }

  function appendMaterialQueryParameter(url, name, value) {
    const separator = String(url || "").indexOf("?") === -1
      ? "?"
      : "&";

    return String(url || "") +
      separator +
      encodeURIComponent(name) +
      "=" +
      encodeURIComponent(value);
  }

  function setupCourseMaterialPreview() {
    const list = document.getElementById("course-materials-list");
    const modal = document.getElementById("course-material-preview-modal");
    const frame = document.getElementById("course-material-preview-frame");
    const image = document.getElementById("course-material-preview-image");
    const loading = document.getElementById("course-material-preview-loading");
    const fallback = document.getElementById("course-material-preview-fallback");
    const title = document.getElementById("course-material-preview-title");
    const meta = document.getElementById("course-material-preview-meta");
    const download = document.getElementById("course-material-preview-download");
    const closeButton = document.getElementById("course-material-preview-close");

    if (
      !list ||
      !modal ||
      !frame ||
      !image ||
      !loading ||
      !fallback ||
      !title ||
      !meta ||
      !download ||
      modal.dataset.ready === "true"
    ) {
      return;
    }

    modal.dataset.ready = "true";

    let lastTrigger = null;

    function resetPreview() {
      frame.hidden = true;
      frame.removeAttribute("src");
      image.hidden = true;
      image.removeAttribute("src");
      fallback.hidden = true;
      fallback.textContent = "";
      loading.hidden = false;
    }

    function showPreviewFallback(message) {
      frame.hidden = true;
      frame.removeAttribute("src");
      image.hidden = true;
      image.removeAttribute("src");
      loading.hidden = true;
      fallback.textContent = message;
      fallback.hidden = false;
    }

    function closePreview() {
      modal.hidden = true;
      document.body.classList.remove("material-preview-open");
      resetPreview();

      if (lastTrigger) {
        lastTrigger.focus();
      }
    }

    async function openPreview(button) {
      const downloadUrl = button.dataset.downloadUrl || "";
      const fileName = button.dataset.fileName || "Course material";
      const extension = button.dataset.fileExtension || "file";
      const fileLabel = button.dataset.fileLabel || "File";
      const fileSize = button.dataset.fileSize || "Size unavailable";

      if (!downloadUrl) {
        return;
      }

      lastTrigger = button;
      resetPreview();

      title.textContent = fileName;
      meta.textContent = fileLabel + " · " + fileSize;
      download.href = downloadUrl;

      modal.hidden = false;
      document.body.classList.add("material-preview-open");

      if (closeButton) {
        closeButton.focus();
      }

      try {
        const response = await fetch(
          appendMaterialQueryParameter(
            downloadUrl,
            "format",
            "json"
          ),
          {
            credentials: "same-origin",
            cache: "no-store"
          }
        );

        if (!response.ok) {
          throw new Error("Could not prepare this preview.");
        }

        const data = await response.json();
        const signedUrl = String(data.url || "");

        if (!signedUrl) {
          throw new Error("The secure preview URL is missing.");
        }

        if (
          ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)
        ) {
          image.src = signedUrl;
          image.hidden = false;
          return;
        }

        if (extension === "pdf") {
          frame.src =
            signedUrl +
            "#toolbar=1&navpanes=0&view=FitH";
          frame.hidden = false;
          return;
        }

        if (
          [
            "doc",
            "docx",
            "ppt",
            "pptx",
            "xls",
            "xlsx"
          ].includes(extension)
        ) {
          frame.src =
            "https://view.officeapps.live.com/op/embed.aspx?src=" +
            encodeURIComponent(signedUrl);
          frame.hidden = false;
          return;
        }

        showPreviewFallback(
          "A browser preview is not available for this file type. Review the uploader, filename, size, course, professor, and semester before downloading."
        );
      } catch (error) {
        showPreviewFallback(
          error.message ||
          "The preview could not be prepared. You can still download the original file."
        );
      }
    }

    frame.addEventListener("load", function () {
      loading.hidden = true;
    });

    image.addEventListener("load", function () {
      loading.hidden = true;
    });

    image.addEventListener("error", function () {
      showPreviewFallback(
        "The image preview could not be displayed. You can still download the original file."
      );
    });

    list.addEventListener("click", function (event) {
      const button = event.target.closest(
        ".course-material-preview-trigger"
      );

      if (!button || !list.contains(button)) {
        return;
      }

      openPreview(button);
    });

    modal
      .querySelectorAll("[data-close-material-preview]")
      .forEach(function (button) {
        button.addEventListener("click", closePreview);
      });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.hidden) {
        closePreview();
      }
    });
  }

  function renderCourseMaterials(materials) {
    const list = document.getElementById("course-materials-list");

    if (!list) {
      return;
    }

    if (!materials.length) {
      list.innerHTML =
        '<p class="course-material-status">No course files shared yet.</p>';
      return;
    }

    list.innerHTML = materials.map(function (material) {
      const rawUploaderName =
        material.uploaderDisplayName || "AUC student";
      const uploaderName =
        escapeMaterialText(rawUploaderName);
      const uploaderPhoto =
        escapeMaterialText(material.uploaderPhotoURL || "");
      const avatar = uploaderPhoto
        ? '<img class="course-material-avatar" src="' +
          uploaderPhoto +
          '" alt="">'
        : '<span class="course-material-avatar-fallback">' +
          escapeMaterialText(
            getMaterialInitials(rawUploaderName)
          ) +
          "</span>";

      const rawFileName =
        material.fileName ||
        material.title ||
        "Course material";
      const extension = getMaterialFileExtension(
        rawFileName,
        material.fileType
      );
      const fileLabel = getMaterialFileLabel(extension);
      const fileSize = Number(material.size) > 0
        ? formatMaterialFileSize(material.size)
        : "Size unavailable";
      const uploadDate = formatMaterialUploadDate(
        material.createdAt
      );
      const rawDownloadUrl = material.downloadUrl || "";
      const previewable =
        Boolean(rawDownloadUrl) &&
        isMaterialPreviewable(extension);

      const fileName = escapeMaterialText(rawFileName);
      const safeFileLabel = escapeMaterialText(fileLabel);
      const safeFileSize = escapeMaterialText(fileSize);
      const safeDownloadUrl = escapeMaterialText(
        rawDownloadUrl || "#"
      );
      const safeExtension = escapeMaterialText(extension);
      const extensionLabel = escapeMaterialText(
        extension === "file"
          ? "FILE"
          : extension.toUpperCase()
      );
      const fileIcon = extension === "pdf"
        ? `
          <img
            class="course-material-file-icon-image"
            src="pdf.png"
            alt=""
            aria-hidden="true"
          >
        `
        : `
          <span class="course-material-file-icon" aria-hidden="true">
            <strong>${extensionLabel}</strong>
          </span>
        `;

      const previewDataAttributes = [
        'data-download-url="' + safeDownloadUrl + '"',
        'data-file-name="' + fileName + '"',
        'data-file-extension="' + safeExtension + '"',
        'data-file-label="' + safeFileLabel + '"',
        'data-file-size="' + safeFileSize + '"'
      ].join(" ");

      const previewTile = previewable
        ? `
          <button
            class="course-material-preview-tile course-material-preview-trigger"
            type="button"
            ${previewDataAttributes}
            aria-label="Preview ${fileName}"
          >
            ${fileIcon}

            <span class="course-material-file-copy">
              <strong>${fileName}</strong>
              <small>${safeFileLabel} · ${safeFileSize}</small>
            </span>

            <span class="course-material-preview-hint">Open preview</span>
          </button>
        `
        : `
          <div class="course-material-preview-tile is-disabled">
            ${fileIcon}

            <span class="course-material-file-copy">
              <strong>${fileName}</strong>
              <small>${safeFileLabel} · ${safeFileSize}</small>
            </span>

            <span class="course-material-preview-hint">No browser preview</span>
          </div>
        `;

      return `
        <article class="course-material-card">
          <div class="course-material-card-top">
            <div class="course-material-author">
              ${avatar}

              <div class="course-material-author-copy">
                <strong>${uploaderName}</strong>

                <small class="course-material-upload-date">
                  ${escapeMaterialText(uploadDate)}
                </small>
              </div>
            </div>
          </div>

          <h3 class="course-material-title">
            ${escapeMaterialText(
              material.title || "Course material"
            )}
          </h3>

          ${previewTile}

          <div class="course-material-footer">
            <div class="course-material-context">
              <span>${escapeMaterialText(
                material.materialType || "Material"
              )}</span>
              <span>${escapeMaterialText(
                material.professor ||
                "Professor not listed"
              )}</span>
              <span>${escapeMaterialText(
                material.semester ||
                "Semester not listed"
              )}</span>
            </div>

            <div class="course-material-actions">
              <a
                class="course-material-download-button"
                href="${safeDownloadUrl}"
                target="_blank"
                rel="noopener"
              >Download file</a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  async function loadCourseMaterials(course) {
    const access = document.getElementById("course-materials-access");
    const list = document.getElementById("course-materials-list");
    const loading = document.getElementById("course-materials-loading");

    if (access) {
      access.hidden = false;
      access.classList.add("is-loading");
      access.setAttribute("aria-busy", "true");
    }

    if (loading) {
      loading.hidden = false;
    }

    if (list) {
      list.innerHTML = '<p class="course-material-status">Loading course files...</p>';
    }

    try {
      const response = await fetch("/api/course-materials?courseCode=" + encodeURIComponent(course.code), {
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error("Could not load course materials.");
      }

      const data = await response.json();

      renderCourseMaterials(Array.isArray(data.materials) ? data.materials : []);

      if (loading) {
        loading.hidden = true;
      }

      if (access) {
        access.classList.remove("is-loading");
        access.removeAttribute("aria-busy");
      }
    } catch (error) {
      if (loading) {
        loading.hidden = true;
      }

      if (access) {
        access.classList.remove("is-loading");
        access.removeAttribute("aria-busy");
        access.hidden = true;
      }
    }
  }

  function setupCourseMaterialsAccess(course) {
    setupMaterialUploadForm(course);
    setupCourseMaterialPreview();
    loadCourseMaterials(course);
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
      renderCourseProfessors({ code: "" }, []);
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
    loadCourseProfessors(selectedCourse);
    setupCourseMaterialsAccess(selectedCourse);

    return true;
  }

  function slugifyMaterialValue(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown";
  }

  function getFileExtension(fileName) {
    const parts = String(fileName || "").split(".");
    return parts.length > 1 ? "." + parts.pop().toLowerCase() : "";
  }

  function buildMaterialFileName(title, originalName) {
    const extension = getFileExtension(originalName);
    return slugifyMaterialValue(title) + extension;
  }

  function setMaterialUploadStatus(message, type) {
    const status = document.getElementById("material-upload-status");

    if (!status) {
      return;
    }

    status.className = "material-upload-status" + (type ? " " + type : "");
    status.textContent = message;
  }

  function getMaterialProfessorOptions() {
    const source = Array.isArray(window.aucAtlasProfessors) ? window.aucAtlasProfessors : [];
    const seen = {};
    const names = [];

    source.forEach(function (professor) {
      const name = String(professor && professor.name ? professor.name : "").trim();
      const key = name.toLowerCase().replace(/\s+/g, " ");

      if (name && !seen[key]) {
        seen[key] = true;
        names.push(name);
      }
    });

    return names.sort(function (firstName, secondName) {
      return firstName.localeCompare(secondName);
    });
  }

  function populateMaterialProfessorSelect(form) {
    const select = form.querySelector("#material-professor");

    if (!select || select.dataset.professorOptionsReady === "true") {
      return;
    }

    const currentValue = select.value;
    const professorNames = getMaterialProfessorOptions();
    const placeholder = document.createElement("option");

    select.dataset.professorOptionsReady = "true";
    select.innerHTML = "";
    placeholder.value = "";
    placeholder.textContent = "Choose professor";
    select.appendChild(placeholder);

    professorNames.forEach(function (name) {
      const option = document.createElement("option");

      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    if (currentValue && professorNames.includes(currentValue)) {
      select.value = currentValue;
    }
  }

  function setMaterialUploadProgress(percent, label, isVisible) {
    const progress = document.getElementById("material-upload-progress");
    const progressTrack = document.getElementById("material-upload-progress-track");
    const progressFill = document.getElementById("material-upload-progress-fill");
    const progressValue = document.getElementById("material-upload-progress-value");
    const progressLabel = document.getElementById("material-upload-progress-label");
    const safePercent = Math.max(
      0,
      Math.min(100, Math.round(Number(percent) || 0))
    );

    if (progress) {
      progress.hidden = !isVisible;
    }

    if (progressTrack) {
      progressTrack.setAttribute("aria-valuenow", String(safePercent));
    }

    if (progressFill) {
      progressFill.style.width = safePercent + "%";
    }

    if (progressValue) {
      progressValue.textContent = safePercent + "%";
    }

    if (progressLabel && label) {
      progressLabel.textContent = label;
    }
  }

  function uploadMaterialFormData(formData, onProgress) {
    return new Promise(function (resolve, reject) {
      const request = new XMLHttpRequest();

      request.open(
        "POST",
        "https://upload.imagekit.io/api/v2/files/upload"
      );

      request.upload.addEventListener("progress", function (event) {
        if (event.lengthComputable && typeof onProgress === "function") {
          onProgress(event.loaded / event.total);
        }
      });

      request.addEventListener("load", function () {
        let responseData = {};

        try {
          responseData = JSON.parse(request.responseText || "{}");
        } catch (error) {
          responseData = {};
        }

        if (request.status >= 200 && request.status < 300) {
          resolve(responseData);
          return;
        }

        reject(
          new Error(
            responseData.message ||
              responseData.error ||
              "ImageKit rejected the upload."
          )
        );
      });

      request.addEventListener("error", function () {
        reject(new Error("The upload connection failed."));
      });

      request.addEventListener("abort", function () {
        reject(new Error("The upload was cancelled."));
      });

      request.send(formData);
    });
  }

  function setupMaterialUploadForm(course) {
    const form = document.getElementById("material-upload-form");
    const button = document.getElementById("material-upload-button");

    if (!form || form.dataset.ready === "true") {
      return;
    }

    form.dataset.ready = "true";
    form.noValidate = true;
    populateMaterialProfessorSelect(form);
    setupMaterialChoiceMenus(form);
    setupMaterialFilePicker(form);

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const professorInput = document.getElementById("material-professor");
      const materialTypeInput = document.getElementById("material-type");
      const semesterInput = document.getElementById("material-semester");
      const titleInput = document.getElementById("material-title");
      const fileInput = document.getElementById("material-file");
      const files = fileInput && fileInput.files
        ? Array.from(fileInput.files)
        : [];
      const professor = professorInput ? professorInput.value.trim() : "";
      const materialType = materialTypeInput
        ? materialTypeInput.value.trim()
        : "";
      const semester = semesterInput ? semesterInput.value.trim() : "";
      const title = titleInput ? titleInput.value.trim() : "";

      if (
        !professor ||
        !materialType ||
        !semester ||
        !title ||
        !files.length
      ) {
        setMaterialUploadStatus(
          "Fill in the professor, material type, semester, title, and choose at least one file.",
          "error"
        );
        return;
      }

      const oversizedFile = files.find(function (file) {
        return file.size > 25 * 1024 * 1024;
      });

      if (oversizedFile) {
        setMaterialUploadStatus(
          oversizedFile.name + " is above the 25MB upload limit.",
          "error"
        );
        return;
      }

      if (button) {
        button.disabled = true;
      }

      const totalBytes = files.reduce(function (total, file) {
        return total + file.size;
      }, 0);

      let uploadedCount = 0;
      let completedBytes = 0;
      let activeAuthorizationId = "";

      setMaterialUploadProgress(0, "Preparing upload", true);

      try {
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          const originalTitle = file.name.replace(/\.[^.]+$/, "");
          const uploadTitle = files.length > 1
            ? title + " - " + originalTitle
            : title;
          const progressLabel =
            files.length > 1
              ? "Uploading file " + (index + 1) + " of " + files.length
              : "Uploading file";

          if (button) {
            button.textContent =
              files.length > 1
                ? "Uploading " + (index + 1) + " of " + files.length + "..."
                : "Uploading...";
          }

          setMaterialUploadStatus(progressLabel + "...", "");

          const authResponse = await fetch("/api/imagekit-auth", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              action: "authorize",
              courseCode: course.code,
              courseTitle: course.title || "",
              professor: professor,
              semester: semester,
              materialType: materialType,
              title: uploadTitle,
              fileName: file.name,
              fileSize: file.size
            })
          });
          const auth = await authResponse.json().catch(
            function () {
              return {};
            }
          );

          if (!authResponse.ok) {
            throw new Error(
              auth.error ||
                "Could not prepare the next file upload."
            );
          }

          const uploadPayload =
            auth && auth.uploadPayload &&
            typeof auth.uploadPayload === "object"
              ? auth.uploadPayload
              : {};

          activeAuthorizationId = String(
            auth.authorizationId || ""
          ).trim();

          if (
            !auth.token ||
            !activeAuthorizationId ||
            !uploadPayload.fileName
          ) {
            throw new Error(
              "The secure upload authorization is incomplete."
            );
          }

          const formData = new FormData();

          formData.append("file", file);
          formData.append("token", auth.token);

          Object.keys(uploadPayload).forEach(function (key) {
            formData.append(
              key,
              String(uploadPayload[key])
            );
          });

          const uploadedFile = await uploadMaterialFormData(
            formData,
            function (fileProgress) {
              const uploadedBytes =
                completedBytes + file.size * fileProgress;
              const overallProgress =
                totalBytes > 0
                  ? (uploadedBytes / totalBytes) * 100
                  : 0;

              setMaterialUploadProgress(
                overallProgress,
                progressLabel,
                true
              );
            }
          );

          const saveResponse = await fetch("/api/course-materials", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              uploadAuthorizationId:
                activeAuthorizationId,
              fileId: uploadedFile.fileId || ""
            })
          });

          let saveData = {};

          try {
            saveData = await saveResponse.json();
          } catch (error) {
            saveData = {};
          }

          if (!saveResponse.ok) {
            throw new Error(
              saveData.error ||
                "The file uploaded, but its course-material record could not be saved."
            );
          }

          activeAuthorizationId = "";
          completedBytes += file.size;
          uploadedCount += 1;

          setMaterialUploadProgress(
            totalBytes > 0
              ? (completedBytes / totalBytes) * 100
              : 100,
            progressLabel,
            true
          );
        }

        form.reset();
        syncMaterialChoiceMenus(form);
        setMaterialFileSelection(form, []);
        await loadCourseMaterials(course);
        setMaterialUploadProgress(100, "Upload complete", true);

        setMaterialUploadStatus(
          files.length === 1
            ? "File uploaded successfully and added to the course materials library."
            : files.length +
                " files uploaded successfully and added to the course materials library.",
          "success"
        );

        window.setTimeout(function () {
          setMaterialUploadProgress(0, "Uploading files", false);
        }, 900);
      } catch (error) {
        if (activeAuthorizationId) {
          await fetch("/api/imagekit-auth", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              action: "cancel",
              authorizationId: activeAuthorizationId
            })
          }).catch(function () {});
        }

        const progressMessage = uploadedCount
          ? uploadedCount + " of " + files.length + " files uploaded. "
          : "";

        setMaterialUploadProgress(0, "Uploading files", false);

        setMaterialUploadStatus(
          progressMessage + (error.message || "Upload failed. Try again."),
          "error"
        );
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = "Upload material";
        }
      }
    });
  }

  function setupCoursesPage() {
    const searchInput = document.getElementById("course-search-input");

    if (renderCourseDetail(getSelectedCourseCode())) {
      return;
    }

    if (searchInput) {
      searchInput.addEventListener("input", renderCourses);
    }

    renderSubjectFilters();
    renderPopularCourses();
    setupCourseUploadStart();
    loadRecentMaterials();
    animateCourseSearchPlaceholder();
    renderCourses();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCoursesPage);
  } else {
    setupCoursesPage();
  }
})();
