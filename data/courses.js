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
    ["PHYS 2041", "Foundations of Modern Physics"],
    ["PHYS 2042", "Modern Physics Laboratory"],
    ["PHYS 2211", "Introduction to Electronics"],
    ["PHYS 2213", "Electronics Lab"],
    ["PHYS 2216", "Fundamentals of Circuits and Electronics"],
    ["PHYS 2217", "Fundamentals of Circuits and Electronics Lab"],
    ["PHYS 2221", "Waves and Optics"],
    ["PHYS 2222", "Optics Laboratory"],
    ["PHYS 3013", "Theoretical Mechanics"],
    ["PHYS 3023", "Electromagnetic Theory"],
    ["PHYS 3031", "Thermodynamics and Statistical Mechanics"],
    ["PHYS 3052", "Nuclear Physics Lab"],
    ["PHYS 3223", "Advanced Optics"],
    ["PHYS 3232", "Advanced Physics Lab"],
    ["PHYS 3241", "Computational Methods in Physics"],
    ["PHYS 4042", "Quantum Mechanics I"],
    ["PHYS 4043", "Quantum Mechanics II"],
    ["PHYS 4051", "Nuclear and Particle Physics"],
    ["PHYS 4071", "General Relativity and Cosmology"],
    ["PHYS 4224", "Photonics"],
    ["PHYS 4225", "Photonics and Optical Communication Laboratory"],
    ["PHYS 4226", "Fundamentals of Quantum Computing and Big Data"],
    ["PHYS 4231", "Introduction to Solid-State Physics"],
    ["PHYS 4233", "Semiconductor Physics"],
    ["PHYS 4234", "Solar Energy Lab"],
    ["PHYS 4241", "Introduction to Solar Energy"],
    ["PHYS 4242", "Introduction to Nanophysics"],
    ["PHYS 4243", "Physics of Solar Energy Conversion Systems"],
    ["PHYS 4244", "Introduction to Nanotechnology"],
    ["PHYS 4281", "Experimental Methods in Physics"],
    ["PHYS 4980", "Research Skills"],
    ["PHYS 4981", "Senior Thesis"],
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
    ["FILM 4260", "Senior Film Project II"],
    ["ECLT 2010", "Introduction to Literature"],
    ["ECLT 2011", "Survey of British Literature"],
    ["ECLT 3001", "Medieval Literature"],
    ["ECLT 5106", "Greek Classics in Translation"],
    ["ECLT 3002", "Renaissance and Early Modern Literature"],
    ["ECLT 3005", "Romanticism"],
    ["ECLT 3006", "Nineteenth-Century European Literature"],
    ["ECLT 3008", "Modern European and American Literature"],
    ["ECLT 3048", "Contemporary Literature"],
    ["ECLT 3010", "American Literature to 1900"],
    ["ECLT 3011", "Modern American Literature"],
    ["ECLT 5108", "History of Literary Criticism"],
    ["ECLT 5109", "Modern Literary Criticism"],
    ["ECLT 2019", "Introduction to American Studies"],
    ["ECLT 3014", "Literature and Philosophy"],
    ["ECLT 3032", "World Literature"],
    ["ECLT 3033", "African Literature"],
    ["ECLT 3045", "Literature and Gender"],
    ["ECLT 3046", "Third World Literature"],
    ["ECLT 3052", "Recurrent Themes in Literature"],
    ["ECLT 3053", "Modern Drama"],
    ["ECLT 3070", "Creative Writing"],
    ["ECLT 3099", "Selected Topics"],
    ["ECLT 4099", "Capstone Seminar: Selected Topics"],
    ["ANTH 4020", "Anthropology of Violence"],
    ["ANTH 4025", "Religion in a Global World"],
    ["ANTH 4065", "Culture, Economy and the Everyday"],
    ["ANTH 4099", "Selected Topics in Anthropology"],
    ["ANTH 4107", "Senior Seminar"],
    ["ANTH 4203", "Practicum in Community Development"],
    ["ANTH 4560", "Development Studies Seminar"],
    ["ANTH 3102", "History of Social Theory"],
    ["ANTH 3104", "Contemporary Anthropological Theory"],
    ["ANTH 3105", "Fieldwork Methods"],
    ["ANTH 3301", "Anthropologies of Middle East and North Africa"],
    ["ANTH 3302", "Anthropologies of Africa"],
    ["ANTH 2005", "Arab Society"],
    ["ANTH 2006", "Youth Cultures: Anthropologies of Politics and Style"],
    ["ANTH 2007", "Anthropology of the Occupied"],
    ["ANTH 2099", "Selected Topics for Core Curriculum"],
    ["ANTH 2201", "Introduction to Community Development"],
    ["ANTH 3015", "Global Families: Kinship and Relatedness"],
    ["ANTH 3075", "Language in Culture"],
    ["ANTH 3080", "Gender, Sexuality and Social Change"],
    ["ANTH 3085", "Environmental Issues in Egypt"],
    ["ANTH 3090", "Public Anthropology"],
    ["ANTH 3095", "Death, Immortality and the Afterlife"],
    ["ANTH 3202", "Participatory Action Research in Community Settings"],
    ["ANTH 3305", "Selected Topics in Arab World Studies"],
    ["ANTH 4030", "Women, Islam and the State"],
    ["ANTH 4070", "Political Anthropology"],
    ["ANTH 4075", "Migrants and Transnationals"],
    ["ANTH 4085", "Discourse Analysis: Working with Language in Use"],
    ["ANTH 4405", "Independent Study"],
    ["EGPT 2250", "Voices from Ancient Egypt: Ancient Egyptian Literature in Translation"],
    ["EGPT 2251", "Hieroglyphics I"],
    ["EGPT 2252", "Hieroglyphics II"],
    ["EGPT 3202", "Art and Architecture of Ancient Egypt II"],
    ["EGPT 3211", "History of Ancient Egypt I: Pre-Dynastic Through Middle Kingdom Egypt"],
    ["EGPT 3212", "History of Ancient Egypt II: Middle Kingdom Through Ptolemaic Egypt"],
    ["EGPT 5100", "Living Like an Egyptian: Ancient Egyptian Society"],
    ["EGPT 5130", "Art, Societies, and Cultures of the Ancient Near East"],
    ["EGPT 5140", "Societies and Cultures of Ancient Nubia"],
    ["EGPT 5144", "Ancient Egyptian Religion and Ethics"],
    ["EGPT 5151", "Hieroglyphics III"],
    ["EGPT 5153", "Hieroglyphics IV"],
    ["EGPT 2020", "Ancient Egypt: An Introduction"],
    ["EGPT 2210", "Introduction to Archaeology"],
    ["EGPT 3010", "Temples, Tombs and Hieroglyphs"],
    ["EGPT 4030", "Independent Study in Egyptology"],
    ["EGPT 5110", "Egypt in the First Millennium BC"],
    ["EGPT 5120", "History of Egypt in the Graeco-Roman Era"],
    ["EGPT 5150", "Introduction to Coptic"],
    ["EGPT 5152", "Introduction to Hieratic"],
    ["EGPT 5160", "Selected Topics in Coptic Studies"],
    ["EGPT 5170", "Selected Topics in Cultural Resource Management and Museology"],
    ["EGPT 5191", "Selected Aspects of Field Work"],
    ["EGPT 5199", "Selected Topics in Egyptology"],
    ["ARIC 2102", "Modern Arabic Literature"],
    ["ARIC 2205", "The World of Islamic Architecture"],
    ["ARIC 2346", "Survey of Arab History"],
    ["ARIC 3435", "Introduction to the Study of Islam"],
    ["HIST 3213", "State and Society in the Middle East, 1699–1914"],
    ["ARIC 3345", "Gunpowder Empires: Ottomans, Safavids and Mughals"],
    ["ARIC 3346", "Egypt Since the Arab Conquest"],
    ["ARIC 3397", "Selected Topics in Middle East History"],
    ["ARIC 3321", "Zawiyas, Harems, Coffee Shops, Everyday Life in the Pre-Modern Mideast"],
    ["ARIC 3343", "Early Islamic History"],
    ["ARIC 3353", "Islamic Political Thought"],
    ["ARIC 5133", "Islamic Institutions"],
    ["ARIC 5134", "Modern Movements in Islam"],
    ["MEST 4301", "Special Topics in Middle East Studies"],
    ["PPAD 5111", "Essentials of Public Policy and Administration"],
    ["PPAD 5201", "Research Methods for Public Policy and Administration"],
    ["PPAD 5221", "Strategic Management for Government and Nonprofit Organizations"],
    ["PPAD 5222", "Fundamentals of Financial Planning and Management for Government and Nonprofit Organizations"],
    ["PPAD 5224", "Human Resource Management for Government and Nonprofit Organizations"],
    ["PPAD 5212", "Applied Quantitative Analysis"],
    ["PPAD 5113", "Organizational Behavior for Government and Nonprofit Management"],
    ["PPAD 5124", "Leadership and Communication for Public Affairs"],
    ["PPAD 5126", "Managing NGOs in Developing and Transitional Countries"],
    ["PPAD 5132", "Social and Environmental Policy"],
    ["PPAD 5174", "Internship in Public and Non-Profit Organizations"],
    ["PPAD 5202", "Public Policy Theory & Practice"],
    ["JRMC 2200", "Introduction to Mass Communication"],
    ["JRMC 2201", "Media Writing"],
    ["JRMC 2202", "Multimedia Writing and Production"],
    ["JRMC 2203", "Mass Media Ethics and Responsibility"],
    ["JRMC 2208", "Media Literacy in the Digital Age"],
    ["JRMC 2270", "Online Communication"],
    ["JRMC 3305", "Introduction to Visual Communication"],
    ["JRMC 3315", "Introduction to Advertising"],
    ["JRMC 3320", "Mass Communication Research"],
    ["JRMC 3355", "Creative Copywriting Strategies"],
    ["JRMC 3390", "Media Economics"],
    ["JRMC 4405", "Advanced Visual Communication"],
    ["JRMC 4406", "Internship"],
    ["JRMC 4415", "Public Relations Theory and Techniques"],
    ["JRMC 4425", "Integrated Marketing Communication Campaigns Capstone"],
    ["JRMC 4430", "Advertising Agency Operations"],
    ["JRMC 4441", "Camera and Editing Workshop"],
    ["JRMC 2205", "Introduction to Arabic Writing and Reporting"],
    ["JRMC 2230", "Photography Foundations 1"],
    ["JRMC 2250", "Global Media Systems"],
    ["JRMC 2280", "Entertainment Media"],
    ["JRMC 3303", "Data for Media"],
    ["JRMC 3307", "Sports Media"],
    ["JRMC 3310", "Public Opinion, Persuasion and Propaganda"],
    ["JRMC 4420", "Media Management"],
    ["JRMC 4444", "Media Law and Policy"],
    ["CSCE 2203", "Analysis and Design of Algorithms Lab"],
    ["CSCE 2301", "Digital Design I"],
    ["CSCE 2302", "Digital Design I Lab"],
    ["CSCE 2303", "Computer Organization and Assembly Language Programming"],
    ["CSCE 3301", "Computer Architecture"],
    ["CSCE 3302", "Computer Architecture Lab"],
    ["CSCE 3312", "Computer Networks"],
    ["CSCE 3313", "Computer Networks Lab"],
    ["CSCE 3401", "Operating Systems"],
    ["CSCE 3611", "Digital Signal Processing"],
    ["CSCE 4301", "Embedded Systems"],
    ["CSCE 4302", "Embedded Systems Lab"],
    ["CSCE 4411", "Fundamentals of Distributed Systems"],
    ["CSCE 4950", "Industrial Training"],
    ["CSCE 4980", "Senior Project I"],
    ["CSCE 4981", "Senior Project II"],
    ["CSCE 4303", "Embedded Systems on Chip Design"],
    ["CSCE 4315", "Internet of Things Networking Protocols"],
    ["CSCE 3602", "Fundamentals of Machine Learning"],
    ["CSCE 4605", "Fundamentals of Data Mining"],
    ["CSCE 3423", "Introduction to Cybersecurity"],
    ["CSCE 4421", "Network Security"],
    ["CSCE 4423", "Digital Forensics"],
    ["CSCE 4424", "Web Security"],
    ["CSCE 4702", "Secure Systems Engineering"],
    ["CSCE 3102", "Programming in Java"],
    ["CSCE 3103", "Object Oriented Programming"],
    ["CSCE 3303", "Fundamental Microelectronics"],
    ["CSCE 3304", "Digital Design II"],
    ["CSCE 3311", "Data and Computer Communications"],
    ["CSCE 3701", "Software Engineering"],
    ["CSCE 4101", "Compiler Design"],
    ["CSCE 4201", "Theory of Computing"],
    ["CSCE 4910", "Guided Studies in Computer Science and Engineering"],
    ["ECNG 3106", "Electronics II: Analog Circuits"],
    ["ECNG 4103", "Testing of Digital Circuits"],
    ["ECNG 4402", "Electromagnetic Waves"],
    ["ECNG 4930", "Selected Topics in Electronics and Communications Engineering"],
    ["MACT 4125", "Complex-Function Theory"],
    ["MACT 4134", "Modern Algebra"],
    ["BIOL 1010", "Introduction to Life Sciences"],
    ["BIOL 1011", "Introductory Biology I"],
    ["BIOL 1012", "Introductory Biology II"],
    ["BIOL 1040", "Essentials of Environmental Biology"],
    ["BIOL 1098", "Fundamentals of Neurosciences"],
    ["BIOL 1150", "Genetics for Everyone"],
    ["BIOL 1410", "Current Health Issues"],
    ["BIOL 1930", "Selected Topic for Core Curriculum"],
    ["BIOL 2150", "Genetics"],
    ["BIOL 2151", "Genetics Laboratory"],
    ["BIOL 2160", "Introduction to Bioethics"],
    ["BIOL 2230", "Molecular and Cell Biology"],
    ["BIOL 2231", "Molecular and Cell Biology Laboratory"],
    ["BIOL 2340", "General Botany"],
    ["BIOL 3130", "Molecular Evolution and Population Genetics"],
    ["BIOL 3310", "Microbiology"],
    ["BIOL 3320", "Physical Foundations of Biological Systems"],
    ["BIOL 3321", "Physical Foundations of Biological Systems Laboratory"],
    ["BIOL 3326", "Vertebrate Anatomy and Physiology"],
    ["BIOL 3327", "Vertebrate Anatomy and Physiology Laboratory"],
    ["BIOL 3341", "Animal Behavior"],
    ["BIOL 3370", "Developmental Biology"],
    ["BIOL 3540", "Sustainability and Environmental Protection"],
    ["BIOL 3600", "Introduction to Bioinformatics"],
    ["BIOL 3601", "Bioinformatics Tools and Techniques"],
    ["BIOL 3710", "Introduction to Biotechnology"],
    ["BIOL 3750", "Introduction to Genomics"],
    ["BIOL 3910", "Guided Studies in Environmental Sciences"],
    ["BIOL 4098", "Selected Topics in Neuroscience"],
    ["BIOL 4150", "Molecular Biology of the Gene"],
    ["BIOL 4230", "Cellular and Molecular Immunology"],
    ["BIOL 4330", "Tumor Biology"],
    ["BIOL 4360", "Human Anatomy and Physiology"],
    ["BIOL 4361", "Human Anatomy and Physiology Laboratory"],
    ["BIOL 4540", "Marine Ecology and Coral Reef Biology"],
    ["BIOL 4541", "Desert Ecology"],
    ["BIOL 4690", "Bioinformatics Capstone Seminar I"],
    ["BIOL 4691", "Bioinformatics Capstone Seminar II"],
    ["BIOL 4910", "Guided Studies in Biology"],
    ["BIOL 4930", "Selected Topics in Biology"],
    ["BIOL 4980", "Senior Research Thesis"],
    ["BIOL 4981", "Seminar in Biology"],
    ["ALWT 3919", "El Ard Bititkallim 'Arabi; Know Thy World in Arabic"],
    ["AMST 1090", "What is America?"],
    ["AMST 2096", "Selected Topics for Core Curriculum"],
    ["AMST 2190", "Is America Still a Superpower?"],
    ["ANTH 3098", "Selected Topics in Anthropology"],
    ["ARIC 1099", "Selected Topics for Core Curriculum"],
    ["ARIC 2001", "Religion and Politics in Islam"],
    ["ARIC 2098", "Selected Topics in Egypt Studies"],
    ["ARIC 2101", "Introduction to Classical Arabic Literature"],
    ["ARIC 2206", "Art and Architecture of the City of Cairo"],
    ["ARIC 2271", "Islamic Art And Architecture (1250-1800)"],
    ["ARIC 3098", "Selected Topics in Islamic Studies"],
    ["ARIC 3108", "Colloquial and Folk Literature"],
    ["ARIC 3109", "The World of Mahfouz"],
    ["ARIC 3116", "The Arabic Short Story"],
    ["ARIC 3288", "The Art of the Book in the Islamic World"],
    ["ARIC 3324", "Non-Muslim Communities in the Muslim World"],
    ["ARIC 3344", "Caliphs and Sultans in the Age of Crusades and Mongols"],
    ["CHEM 2001", "Egypt Water Crisis: Challenges and Solutions"],
    ["CORE 1099", "Selected Topics for Core Curriculum"],
    ["CORE 1130", "The Human Spirit"],
    ["CORE 2096", "Selected Topics for the Core Curriculum in Global Studies"],
    ["CORE 2097", "Selected Topics for The Arab World"],
    ["CORE 2098", "Selected Topics on Egypt"],
    ["ECLT 1023", "Experiencing Creativity: Texts and Images"],
    ["ECLT 3080", "Shakespeare: Thinking with Shakespeare"],
    ["EDUC 1099", "Selected Topics for the Core Curriculum"],
    ["EDUC 2011", "Education and Society"],
    ["HIST 2096", "Selected Topics for the Core Curriculum in Global Studies"],
    ["HIST 2097", "Selected Topics for the Core Curriculum in Arab World Studies"],
    ["LING 2200", "Introduction to Linguistics"],
    ["LING 2201", "Languages of the World"],
    ["LING 2220", "Language and Society"],
    ["LING 2230", "Language and Communication"],
    ["MENG 2200", "The Art, Science, and Global Aspects of Contemporary Sculpture"],
    ["MUSC 2000", "World Music"],
    ["MUSC 2010", "The Songs of the Americas"],
    ["MUSC 2200", "Introduction to Music"],
    ["MUSC 3250", "Music in the Arab Tradition"],
    ["POLS 1001", "Introduction to Political Science"],
    ["POLS 2096", "Selected Topics for Core Curriculum"],
    ["PSYC 2099", "Selected Topics in Psychology"],
    ["PSYC 3021", "Psychology of Love and Attraction in Egypt"],
    ["PSYC 3022", "Psychology of Inclusion and Exclusion in Egypt"],
    ["RHET 1010", "Freshman Writing"],
    ["RHET 1020", "Research Writing"],
    ["RHET 3130", "Travel Writing"],
    ["SCI 1020", "Scientific Thinking"],
    ["SEMR 1023", "Celebrating Ideas: A Voyage Through Books, film, Art and Theater"],
    ["SEMR 1099", "Selected Topics in Core Curriculum"],
    ["SEMR 1110", "Creative Thinking and Problem Solving"],
    ["SOC 2201", "Introduction to Community Development"],
    ["SOC 2401", "Society and Culture in Egypt"],
    ["SOC 2402", "Family, Kin and Friends in Egypt"],
    ["SOC 2403", "Social Issues in Egypt"],
    ["THTR 1099", "Selected Topics for Core Curriculum"],
    ["THTR 1101", "The World of the Theatre"],
    ["MACT 4126", "Real Analysis I"],
    ["MACT 4127", "Real Analysis II"],
    ["MACT 3142", "Introduction to PDE and Boundary-Value Problems"],
    ["MACT 3940", "Seminar in Mathematics"],
    ["CSCE 5221", "Algorithms and Complexity Theory"],
    ["CSCE 5269", "Pattern Analysis"],
    ["DSCI 4415", "Advanced Machine Learning"],
    ["ECNG 3201", "Signals and Systems"],
    ["ECNG 3202", "Automatic Control Systems"],
    ["ECNG 3401", "Electromagnetic Theory"],
    ["ECNG 4301", "Fundamentals of Communications I"],
    ["ECNG 4302", "Fundamentals of Communications II"],
    ["PHYS 5142", "Computational Physics"],
    ["CSCE 3104", "Concepts of Programming Languages"],
    ["CSCE 3101", "Programming Language"],
    ["CSCE 4502", "Design of Web-based Systems"],
    ["DSGN 3400", "Digital Game Design"]
  ];

  const courseDescriptions = {
    "CHEM 1005":
      "Chemical stoichiometry; atomic structure and periodicity; an overview of chemical bonding with a discussion of models and theories of covalent bonding; introduction to structure and chemistry of organic compounds.",
    "CHEM 1015":
      "Selected experiments in inorganic and organic chemistry.",
    "ENGR 1005":
      "Introductory descriptive geometry. Orthographic and pictorial drawing. Sectional views, auxiliary views, and conventions. Dimensioning. Free hand sketching, and both manual and computer-aided drafting.",
    "ENGR 2102":
      "Fundamentals of mechanics. Equilibrium of practices, forces in space, equivalent systems, equilibrium of rigid bodies, distributed forces, center of gravity, internal actions, analysis of simple structures and machine parts. Friction. Moment of inertia.",
    "ENGR 2104":
      "Kinematics and kinetics of a particle, system of particles, and rigid bodies. Energy and momentum methods. Engineering applications.",
    "ENGR 3202":
      "Solution of sets of linear equations, roots of equations, curve fitting (interpolation), numerical integration and differentiation, numerical solution of ordinary differential equations, boundary value problems and introduction to the finite difference method of computer programs for problem solving. It includes a programming based project.",
    "ENGR 3212":
      "Active, reactive and apparent power, three-phase systems, electrical measurements, transformers, motors: types, performance and selection generation, transmission and distribution of Electrical Energy, protective and earthing systems, energy management and cost.",
    "MACT 1121":
      "Limits of one variable functions. Continuity and differentiability. Implicit differentiation. Differentiation of trigonometric, exponential, and logarithmic functions. Higher derivatives. Applications of derivatives: related rates, linear approximations, the Mean Value Theorem, l’Hopital’s Rule, maxima and minima, curve sketching and optimization problems. Definite and indefinite integrals, Riemann Sums, the Fundamental Theorem of Calculus.",
    "MACT 1122":
      "The calculus of inverse trigonometric and hyperbolic functions. Applications of the definite integral for finding areas and volumes of revolutions. Techniques of integration. Improper integrals. Sequences and series: Convergence tests, power series, Taylor series with applications. Vectors and the three-dimensional space: Dot and cross products, lines and planes.",
    "MACT 2123":
      "Vector valued functions and space curves. Functions of several variables: Limits and continuity, partial derivatives, directional derivatives, maximum and minimum values, Lagrange multipliers. Multiple integrals: Double and triple integrals, change of variables in multiple integrals, including polar, cylindrical and spherical coordinates. Vector calculus: vector fields, The Fundamental Theorem of Line Integrals, Green’s Theorem, surface integrals, Stokes’ and Gauss’s Theorems.",
    "MACT 2141":
      "First-order differential equations and applications. Higher-order differential equations. Applications of second-order linear differential equations with constant coefficients. Systems of linear differential equations. Series solutions. Laplace transform.",
    "MACT 3224":
      "A course in probability and statistics designed for computer science and engineering students. Probability is used to construct parametric models that often arise in computer science and engineering problems. Statistics is then used to estimate the parameters of these models based on available data, check the adequacy of the fitted models, and test specific hypotheses. Topics include random variables and their probability distributions including uniform, binomial, geometric, Poisson, normal, and exponential distributions; expected value of functions of random variables; stochastic simulation; sampling distributions; maximum likelihood and least squares methods of estimation; statistical inference including hypothesis testing and interval estimation.",
    "MENG 2112":
      "Concept of stress and strain in components, mechanical behavior of materials under tensile, compressive, and shear loads, hardness, impact loading, fracture and fatigue. Analysis of stresses and the corresponding deformations in components, axial loading, torsion, bending, and transverse loading. Statically indeterminate problems. Transformation of plane stresses, and Mohr’s circle.",
    "MENG 2202":
      "This lab is intended for students with no programming background. It teaches students solving engineering problems via the principle of programming and computing employing a programming language and techniques of current use in engineering. Topics covered include data types, arithmetic, scripts, user-defined functions, inputs, outputs, conditionals, loops, arrays, and modular programming. An emphasis is given to the visualization and graphical representation. Basics of software engineering introduced (code maintenance, debugging, and documentation). Accuracy and speed are discussed as limitations of engineering computation.",
    "MENG 2505":
      "Computer-aided drafting. Mechanical details and assembly drawings. Working drawings. Geometrical tolerances. Welding symbols and details, introduction to 3D modeling. Introduction to civil and architectural drawings.",
    "MENG 2601":
      "Fluid properties and fluid statics. Fluid flow, Euler’s and Bernoulli’s equations, Conservation of continuity, momentum, and energy. Laminar and turbulent flows, Reynolds number, closed conduit flow and secondary losses, and pipe networks. Fundamental flow measurements.",
    "MENG 3207":
      "Introduction to materials. Crystal structure of solids. Construction and use of phase diagrams in materials systems. Relationship of crystal structure to properties of metallic materials and their applications. Heat treatment of steels. Types of polymers, ceramics, glasses, and semiconducting materials and their applications.",
    "MENG 3209":
      "Processing by casting, powder metallurgy, metal working, material removal, welding and joining. Processing of plastics and ceramics. Finishing processes. Materials recycling.",
    "MENG 3217":
      "Through a series of experiments carried out by the students, the behavior of the different classes of engineering materials including metals, polymers, ceramics, and composites are demonstrated. Relationship of bonding type, crystalline/amorphous structures to properties of metallic/polymeric/ceramic materials and their applications. Materials’ mechanical performance under the various loading modes. Difference between meso and microstructure, single and multiphase solids, etc. Experiments that demonstrate the influence of cooling rate, strain hardening and heat treatment on the mechanical behavior of materials. Identify causes of failure resulting from chemical attack (corrosion), mechanical wear (erosion) or due to structural changes associated with high temperature (creep), etc.",
    "MENG 3402":
      "Fundamentals of statistical quality control; control charts for variables and attributes; process capability analysis; sampling plans and techniques; introduction to design of experiments.",
    "MENG 3446":
      "Concepts of Engineering Management, Organizing, Motivation and Leadership, Performance evaluation, Project selection and initiation, Project planning, Project scheduling, monitoring, control, and evaluation, Resources scheduling, Project management software.",
    "MENG 3502":
      "Linkage synthesis, position, velocity, and acceleration of mechanisms, cams, gears and gear trains, machine dynamics, rotating and reciprocating machines, dynamic balancing.",
    "MENG 3505":
      "Internal reactions, load-stress relations and transformation of stresses for generally loaded rods. Generalized concepts of stress, strain and material relations. Computerized Methods. Elastic-plastic behavior of beams. Analysis of thin walled beams. Membrane theory of axisymmetric shells. Stress concentrations.",
    "MENG 3506":
      "Introduction to design concepts. Constructional details as affected by manufacturing, assembly, and strength considerations. Engineering materials. Design for steady and cyclic loading, and for rigidity and stability. Rigid and elastic connections. Bolts, rivets and welds. Design of shafts and springs. Use of interactive computer programs for problem solving is illustrated and encouraged. Design projects.",
    "MENG 3601":
      "Fundamental Concepts and Definitions. Thermodynamic Processes, pure substances and perfect gases, The First Law of Thermodynamics, the Second Law of Thermodynamics, the Carnot cycle. Thermodynamic Relations, Reversibility and Entropy.",
    "MENG 3602":
      "Dimensional analysis, external flow and aerodynamic forces, compressible flow, turbomachinery, pumps, fans, compressors, and turbines. Measurements of fluid flow applications.",
    "MENG 3605":
      "Availability and second-law analysis. Power cycles: air standard and actual cycles; reversed cycles: refrigerators and heat pumps, gas mixtures, psychrometry and air conditioning, hydrocarbon reactions, waste heat recovery.",
    "MENG 3705":
      "Mathematical modeling of mechanical, electrical, electromechanical, and thermo-fluid systems. Free and forced vibrations for a single degree of freedom systems. Free and forced vibrations of multiple degrees of freedom systems. Linearization. Stability, Steady-state error, and Time response analysis. State-space and transfer function solutions. System analogies. Introduction to automatic control and Feedback control systems. Team based project covering modeling, analysis, and design of a selected system by each team.",
    "MENG 4208":
      "Effect of material properties on design. Effect of manufacturing processes on design. Failure and reliability of components in service. Economics of materials and manufacturing processes. Decision making and the selection process. Integration of design and economic analysis with materials and process selection. Case studies.",
    "MENG 4507":
      "Design of machine elements used in power transmission: couplings, gears, bearings, roller chain drives, clutches. Design for surface failure prevention. Applications: automotive and machine tool areas, etc. Basics of systems design. Design projects.",
    "MENG 4606":
      "Steady and unsteady, one and multi-dimensional, heat conduction. Finite-difference and Finite-volume methods applied to heat conduction. Heat transfer by natural and forced convection. Introduction to Mass transfer. Heat transfer by radiation. Design of Heat exchangers.",
    "MENG 4661":
      "Preliminary design procedures for turbo-machines. Ideal and actual performance characteristics for hydraulic pumps and turbines, axial and centrifugal flow compressors and fans, axial and radial flow gas turbines. Cavitation in hydraulic machinery. Turbo-chargers. Hydro-power plants and pumped-storage.",
    "MENG 4662":
      "Steam and Gas turbine power plants. Combined-cycle power plants. Co-generation. Principles of nuclear energy and introduction to Nuclear power plants. Environmental impacts of power plants.",
    "MENG 4663":
      "The world energy scene. Environmental impact of energy use. Wind power, PV and Solar Thermal Electricity and Biomass. Hybrid systems. Renewable energy generation in Power systems. Economics and sustainability.",
    "MENG 4665":
      "Review of Air standard cycles. Diesel and Petrol combustion overview. Fuels and chemistry of combustion reactions. Octane and Cetane ratings. Fluid mechanic interactions with flames - burn rates. Overview of exhaust emissions. Turbocharging and supercharging, volumetric efficiency and valve timing.",
    "MENG 4666":
      "Calculation of building cooling and heating loads, and ventilation requirements. Design of Air conditioning and ventilation systems. Passive cooling and heating. Air conditioning equipment.",
    "MENG 4667":
      "Refrigeration and Air conditioning cycles and C.O.P. Vapor compression refrigeration systems. Absorption refrigeration. Cryogenics. Design of Air conditioning systems and components. Heat pumps and heating systems. District cooling.",
    "MENG 4936":
      "Covers specialized topics in Power engineering not covered in other listed courses. Offered more than once for credit if contents change. Precise course description depends on course topic.",
    "MENG 4950":
      "Each student is required to spend a minimum of eight weeks in industrial training in Egypt or abroad. A complete account of the experience is reported, presented and evaluated.",
    "MENG 4980":
      "Working in project teams, students will conceptualize and design a multi-disciplinary engineering solution addressing a real-world problem in an area of societal, national or international need. The project work constitutes a substantial design experience, typically based on the integration of knowledge and skills acquired in a broad range of earlier course work, incorporating applicable engineering standards and realistic constraints. Topics are selected by teams of students according to their areas of interest and the approval of advisors. This course is the first of a sequence of two capstone courses, which guides students through execution and documentation of the conceptual and detailed design stage.",
    "MENG 4981":
      "Working in project teams, students continue the work on the project topic selected in MENG 4980 to develop and analyze the engineering solution for the selected problem. The project work constitutes a substantial design experience, typically based on the integration of knowledge and skills acquired in a broad range of earlier course work, incorporating applicable engineering standards and realistic constraints. This course is the second of a sequence of two capstone courses, where development, testing, and analysis take place, resulting in a functional solution that meets design requirements.",
    "MENG 5168":
      "Fundamentals of nuclear reactor engineering and reactor safety. Aspects of nuclear physics, nuclear interactions, reactor criticality and heat removal. Introduction to current nuclear reactor types, and next generation reactor types.",
    "PHYS 1011":
      "An introduction to classical mechanics covering vectors, applications of Newton’s laws, conservation laws and forces, motion in a plane, circular motion, equilibrium and elasticity, rotational motion, simple harmonic motion, energy and power; mechanical and sound waves, temperature, heat and the first law of thermodynamics.",
    "PHYS 1012":
      "The fundamental quantities of physics are measured through selected experiments in mechanics, heat, and sound. Data are summarized, errors are estimated, and reports are presented.",
    "PHYS 1021":
      "An introduction to electricity and magnetism covering the electric field, Gauss’s law, electric potential, capacitance, dc circuits, magnetic fields, Faraday’s and Ampere’s laws, time-varying fields, Maxwell’s equations in integral form and alternating currents.",
    "PHYS 1022":
      "The fundamental quantities of physics are measured through selected experiments in electricity, magnetism, and optics. Data are summarized, errors are estimated, and reports are presented.",
    "PHYS 2216":
      "Foundation of circuit analysis and Theorems, AC theory and circuits analysis, Introduction to semiconductor basics and diodes, Metal-Oxide-Semiconductor Structure, Transistors, Operational amplifiers, Digital Electronic fundamentals, and Logic gates.",
    "PHYS 2217":
      "Basic experiments demonstrating the fundamental theory of circuits and electronics for mechanical engineering students.",
    "PHYS 2041":
      "Introduction to special relativity and quantum physics, experimental basis of relativity, Einstein’s Postulates, Lorentz transformation, relativistic momentum and energy, experimental evidence of quantization, wave-particle duality, and Schrodinger equation.",
    "PHYS 2042":
      "Quantization of electric charge, thermal radiation law, quantization of energy, particle nature of light, spin.",
    "PHYS 2211":
      "Foundation of DC and AC Circuit Analysis, Resonance and Filter Circuits, Semiconductor Basics, Diode and transistor fundamentals and applications, and feedback oscillators.",
    "PHYS 2213":
      "Basic experiments in circuits and electronics.",
    "PHYS 2221":
      "Wave phenomena; EM waves, geometrical and physical optics, and matter waves.",
    "PHYS 2222":
      "Basic experiments in physical optics with special emphasis on laser optics.",
    "PHYS 3013":
      "Newton’s laws of motion, projectiles and charged particles, momentum and angular momentum, energy, oscillations, calculus of variations, Lagrange’s equations, Hamiltonian mechanics, mechanics in noninertial frames.",
    "PHYS 3023":
      "Electric field and potential. Gauss’s law; divergence. Conductors, dielectrics and capacitance. Poisson’s and Laplace’s equations. Electrostatic analogs. Magnetic field and vector potential. Time varying fields; displacement current. Maxwell’s equations in differential form, Poynting’s theorem, Electromagnetic waves in vacuum and in matter.",
    "PHYS 3031":
      "A macroscopic and microscopic study of equilibrium thermal physics, fundamental laws of thermodynamics, and statistical mechanics applied to various systems.",
    "PHYS 3052":
      "Experiments in atomic and nuclear physics.",
    "PHYS 3232":
      "Experiments in solid-state physics and semiconductor devices.",
    "PHYS 3241":
      "Principles of programming and computing employing MATLAB. Topics covered include data types, arithmetic, scripts, user-defined functions, inputs, outputs, conditionals, loops, arrays, and modular programming. An emphasis is given to the visualization and graphical representation. Linear systems of equations and matrices; eigenvalues and eigenvectors; numerical errors; numerical solution of linear and nonlinear equations; curve fitting; numerical differentiation and integration; numerical solution of ordinary differential equations; applications in various fields of physics. MATLAB will mostly be used as a programming language in the weekly computer laboratory sessions.",
    "PHYS 4042":
      "Stern-Gerlach experiments, operators and measurement, Schrödinger time evolution, quantized energies and particle in potential wells, unbound states, angular momentum, Hydrogen atom, harmonic oscillator.",
    "PHYS 4051":
      "A modern view of the fundamental structure of matter, nuclear structure, nuclear models, nuclear decay and radioactivity, nuclear reactions; quarks, gluons, leptons; accelerators, particle interactions with matter, detectors; weak, electromagnetic and strong interactions.",
    "PHYS 4225":
      "Experiments in fiber optics illustrating concepts pertaining to fiber dispersion, attenuation measurements, characterization of light sources (LEDs and laser diodes) and detectors (photodiodes), optical multiplexing and de-multiplexing, optical and interferometric sensors.",
    "PHYS 4231":
      "Classification of materials and their structural characteristics, symmetry and properties of materials, free-electron theory, band theory, dielectric processes, optical processes in material.",
    "PHYS 4980":
      "A capstone course, essential research methods such as preparing a literature survey, assembling a bibliography, using order of magnitude estimates and dimensional analysis. Each student selects a topic in his/her field of interest under the supervision of a faculty member. The student submits a written study plan and delivers a seminar in which this plan is presented for departmental approval. The approved plan is carried out in the student’s Senior Thesis PHYS 4981",
    "PHYS 4981":
      "A capstone course. A continuation of PHYS 4980 where the approved study plan from this course is carried out. After finishing this research project, an oral presentation, defense, and a written thesis are required of each candidate in accordance with the departmental guidelines.",
    "PHYS 4043":
      "Perturbation theory, hyperfine structure and the addition of angular momenta, perturbation of Hydrogen, identical particles, time-dependent perturbation theory, periodic systems, modern applications of quantum mechanics.",
    "PHYS 4071":
      "Coordinate symmetries, the principle of equivalence and its implications, metric description of a curved spacetime, Geodesic equation and Einstein field equation, applications of spacetime outside a spherical star, Hubble’s law, dark matter, Robertson-walker metric, the expanding universe and thermal relics, inflation and the accelerated universe.",
    "PHYS 4233":
      "Fundamental theory and characteristics of elemental and compound semiconductors. Semiconductor technology. P-N junctions and transistors.",
    "PHYS 4234":
      "Experiments on solar energy systems and photovoltaic technology.",
    "PHYS 4241":
      "Working principle of a solar cell, fabrication of solar cells, PV module construction and the design of a PV system. The suitable semiconductor materials, device physics, and fabrication technologies for solar cells are presented. The cost aspects, market development, and the application areas of solar cells are also presented.",
    "PHYS 4242":
      "Nanophysics fundamentals, physics nanostructures, thermodynamics of nanostructures, monocrystalline structures, Quantum nanostructures, Nano optics, nanoplasmonics.",
    "PHYS 4243":
      "Atomic structures, basics of energy conversions, fundamental of nanoscience and nanotechnology, wave optics, light-matter interactions, diffractions and interference, Solar cell physics and design.",
    "PHYS 4244":
      "Fabrication methods of nanomaterials and nano devices, properties of nanoparticles, nanowires and nanotubes. Electronic transport in nanostructures, nanoelectronics and nanophotonics, nanomagnetism.",
    "PHYS 3223":
      "Geometric optics: generalized paraxial formulas, matrix formalism of Gaussian optics. Imaging properties of lens systems: lens combination, the vector nature of light: polarization effects, diffraction effects, superposition of waves: interference, spatial and temporal coherence length, and multilayer structures.",
    "PHYS 4224":
      "Light sources and transmitters, receivers, laser diodes, LEDs and photodiodes. Electromagnetic mode theory for optical propagation. Optical fiber measurements: fiber materials, multimode fibers, single-mode fibers. Fabrication, cabling, connectors and couplers. Optical amplifiers, Erbium-Doped fiber amplifiers. Modulation of light, multiplexing and de-multiplexing, fiber networking.",
    "PHYS 4226":
      "Introduces the physics of quantum computing systems, quantum information, states and, entanglement, quantum gates and quantum circuits, quantum cryptography, quantum computing models, quantum computing techniques and quantum error correction. The big data part includes an introduction to Big data, w’s of big data (what is Big data? why Big-Data? and when Big-Data is really a problem); Techniques; Tools; Applications; Literature; Big Data meets Quantum Physics.",
    "PHYS 4281":
      "Experimental techniques for studying thermal, optical, magnetic and electric properties of matter. Low temperature physics: gas liquefaction, storage of liquefied gases, cryostats for low temperature studies, applied cryogenics.",
    "CENG 3111":
      "Analysis of statically determinate structures under static loads, member forces in trusses, shear and moment diagrams, live loads and influence lines, deflections, analysis of statically indeterminate structures by three-moment equation, the method of consistent deformation, slope-deflection, and moment distribution. Approximate analysis of statically indeterminate structures. Matrix force and displacement methods with computer applications.",
    "CENG 3511":
      "Introduction to water resources projects, pipelines and pipe networks, pumps, open channel flow, hydraulic structures, water flow in soil media, seepage, wells and dewatering systems.",
    "CENG 4313":
      "Soils’ index properties and engineering classification; soil composition and structure; lab and field soil compaction; water seepage and water flow net in soil media, stresses in soil, soil stress-strain properties; consolidation in soil; shear strength of soils, basic theory of lateral earth pressure of soils; analysis of soil slope stability. Experimental testing, measurements and reporting.",
    "CHEM 3004":
      "Chemical potential and equilibria, solutions and colligative properties, electrochemical systems.",
    "CHEM 4003":
      "The kinetic theory of gases, chemical kinetics and dynamics, photochemistry, homogeneous and heterogeneous catalysis, surface chemistry including adsorption.",
    "CSCE 3102":
      "This course offers intermediate programming concepts in the Java programming language to include virtual machines, dynamic type checking, object serialization, inheritance and polymorphism, file manipulation, interfaces and packages. Java Applets, event handling, multithreading and network-based application development in Java are also covered along with a set of selected topics such as remote method invocation and remote database access using the language.",
    "CSCE 3303":
      "The course covers topics related to electronic devices and their applications such as diodes, transistors (BJT and MOSFET), and operational amplifiers with an emphasis on digital CMOS circuits design, simulation and analysis.",
    "CSCE 3304":
      "VLSI fabrication, Design of complex CMOS cells, Combinational and Sequential logic structures in VLSI; Introduction of ASIC design techniques and tools; design and programming of FPGAs using CAD tools; timing in sequential circuits; Digital systems design; Modeling and simulation; Fault models and testing.",
    "CSCE 3601":
      "The course will introduce students to the main foundational concepts and techniques used in Artificial Intelligence including searching and problem solving methods, representing knowledge, dealing with uncertainty, probabilistic reasoning, planning, learning decision rules from data, and statistical learning.",
    "CSCE 3701":
      "Basic concepts of software engineering project management, ethical and social issues as well as the software development life cycle. Techniques for software specification, design, implementation, validation, verification and documentation. State-of-the art tools for computer-aided software engineering (CASE tools) are used to support term projects.",
    "CSCE 4603":
      "Image acquisition, image transformations, gray level operations, histogram equalization, spatial filtering, edge detection, line and circle detection, generalized Hough transform, connected components labeling. Haar features, object detection with Adaboost, applications: face detection, open CV programming.",
    "DSCI 3411":
      "This course is an introduction to fundamental tools in designing, conducting, and interpreting simulation experiments. Topics covered include Random number generation; Continuous, discrete, and rare event simulations. Variance reduction techniques, Bootstrap and Jacknife; Simulation; Markov Chain Monte Carlo. The course includes an applied project (a thorough application of simulation to real-world problems such as finance, statistics) using computer programming language such as R or Python).",
    "DSCI 4411":
      "Introduction to the fundamental concepts of data mining, motivation for and applications of data mining, text and web mining, and survey of techniques and models. Topics include: data pre-processing, frequent pattern mining, clustering, classification, and case studies using data sets taken from real-life applications, and use of data mining software.",
    "DSCI 4412":
      "The course introduces Big Data problems and associated frameworks and technologies. First, the course motivates the topic using real-world big data problems. Second, it sheds light on handling big data, from data collection, to monitoring, storage, analysis and reporting. The course also includes programming models used for scalable big data analysis. It also introduces one of the most common Big Data frameworks, namely Hadoop, in addition to the Map-Reduce Programming Model. Finally, it solves sample case studies using the covered Big Data analytics tools.",
    "ECNG 3106":
      "Differential and Multistage Amplifiers, Frequency Response, Feedback, Output Stages and Power Amplifiers, Analog Integrated Circuits, Filters and Tuned Amplifiers, Signal Generators and Waveform Shaping Circuits.",
    "ECNG 4402":
      "Review of Maxwell’s equations. Transmission lines. Signal matching, Smith chart, Stub matching. Parallel plate, rectangular, and optical waveguides. Antennas and radiation of electromagnetic energy. Boundary Value problems. Several experiments are conducted in the Microwave Lab to illustrate material covered in the course.",
    "MACT 2131":
      "Logic and Proofs: Basic propositional and predicate logic, rules of inference, direct and indirect proof methods (including contraposition and contradiction). Sets: Set operations, functions, sequences and finite series, infinite cardinalities, and matrices. Integers: divisibility and modular arithmetic, primes and the Fundamental Theorem of Arithmetic, the greatest common divisor, proofs by regular and strong mathematical induction. Combinatorics: Permutations and combinations, the Pigeonhole Principle. Relations and their properties, representing relations using Boolean matrices and digraphs, equivalence relations.",
    "MACT 2132":
      "Solutions of systems of linear equations. Matrices and determinants. The space Rn, vector spaces and subspaces. Linear independence, basis and dimension. Inner product and orthonormal bases. Linear transformations. Eigenvalues and eigenvectors. Diagonalization. Various applications.",
    "MACT 3143":
      "Number systems and types of errors. Solution of nonlinear equations. Interpolation and the Lagrange Polynomial. Systems of linear equations. Numerical Differentiation and integration. Numerical solutions of ordinary differential equations: Runge Kutta and Multistep Methods. Numerical solutions of partial differential equations: finite difference and elements of the Spectral Method. The course includes a programming based project.",
    "MACT 3211":
      "Sample space, probability axioms, combinatorial techniques, conditional probability, independence and Bayes’ theorem. Random variables. Distribution functions, moments and generating functions. Discrete probability distributions. Continuous probability distributions. Discrete joint distributions. Continuous Joint distributions. Applications of probability in the social and engineering sciences.",
    "MACT 4125":
      "The complex plane, analytic functions, and Cauchy-Riemann equations. Elementary functions, complex integration. Cauchy’s theorem and Cauchy’s integral formula. Taylor and Laurent series. The calculus of residues.",
    "MACT 4231":
      "Standard least squares method and application to problems arising from social, biological and engineering sciences. Deviation from assumption of multicollinearity. Variable selection methods. Analysis of variance, Generalized linear models including logistic regression models. Course includes an applied project (a thorough analysis of real-life data using computer packaged programs).",
    "MACT 4232":
      "This course is a continuation of MACT 4231. It deals with the problems of modelling and forecasting time series data. Computer program packages are used as an aid for obtaining solutions. Topics include serial correlation, seasonal adjustments, exponential smoothing and extrapolation, state space models, moving average, autoregressive, ARMA and ARIMA models, and nonlinear time series, including ARCH models and chaos. Emphasis on model building, diagnostic checking, and model selection.",
    "PENG 3211":
      "Basic petroleum fluid properties including petroleum fluid composition, phase behavior, phase envelopes, classification of reservoir fluids, ideal gas and real gas laws, z-factor, dry gas properties, modification for wet gases, black-oil PVT properties definition, PVT properties from correlations, oil formation volume factor and solution gas oil ratio corrections, and formation water properties. Fluid sampling. PVT and other reservoir fluid properties laboratory measurement and reporting.",
    "PENG 3411":
      "Thermodynamic fundamentals, concepts, and definitions, first and the second law of thermodynamics, volumetric properties of fluids, thermodynamics of flow processes, solution thermodynamics, phase equilibria, and flash calculations.",
    "ENGR 2105":
      "Fundamentals of mechanics, statics of particles and rigid bodies, center of gravity and moment of inertia, internal forces in members, kinematics and kinetics of particles and rigid bodies. Engineering applications.",
    "ENGR 2122":
      "Fluid properties, fluid statics, fluid flow. Conservation of momentum, energy, continuity and Bernoulli’s equations. Viscous efforts for laminar and turbulent flow. Steady state closed conduit and open channel flow.",
    "ENGR 2412":
      "This lab is intended for students with no programming background. It teaches students problem-solving via the principle of programming and computing employing a programming language and techniques of current use in engineering. Topics covered include data types, arithmetic, scripts, user- defined functions, inputs, outputs, conditionals, loops, arrays, and modular programming. An emphasis is given to the visualization and graphical representation. Basics of software engineering introduced (code maintenance, debugging, and documentation). Accuracy and speed are discussed as limitations of engineering/scientific computation.",
    "PENG 3430":
      "The fundamental aspects of health and safety at work and identification of different types of workplace hazards and their control systems. Explores different sustainability topics such as climate change, global warming, energy, water, waste, socially responsible business, CO2 emissions, and capture and sequestration among others. Examples of creative and integrated strategies on local, national, and global environmental levels (to create a sustainable future); are shown through environmental impact assessment of oil and gas projects.",
    "SCI 2005":
      "The environment of Earth and the natural forces that shape it; Earth’s materials, origin and its 4.5 billion years history; geological events and their implications in finding oil and gas and other natural energy resources; economic contributions of geology to the environment; special case studies with emphasis on Egypt are discussed.",
    "PENG 2400":
      "Introduction to the fundamentals of petroleum and renewable energy resources and related business activities. Introduction to the trends of energy mix with emphasis on challenges, environmental impacts, and integrated solutions.",
    "PENG 3011":
      "History of petroleum geology, the occurrence of petroleum, source rock, migration and accumulation, reservoir rocks, reservoir pore space, reservoir fluids, stratigraphic traps, structural traps, hydrodynamic traps, combination traps, subsurface geology and mapping, and reservoir appraisal. Exploration engineering, gravity surveying, magnetic surveying, seismic data acquisition, seismic data. Introduction to logging and formation testing, hydrocarbon indicators, exploration risk, and analysis.",
    "PENG 3021":
      "Basic petrophysical properties of reservoir rocks including porosity, permeability, fluid saturation, electrical properties, surface tension, wettability, capillary pressure, relative permeability, compressibility, and Other SCAL properties. Routine and core analysis and SCAL reports. Laboratory measurement of the reservoir rock properties.",
    "PENG 3111":
      "Basic concepts of, rig types, rig components, drilling tools, well head equipment, drilling fluids, practices of well drilling operations, drilling techniques and well control equipment. Fundamental concepts of rotary drilling bits, drill string, bottom-hole assembly, casing, cementing operations. Completion concepts, types, equipment, and work-over operations.",
    "PENG 3112":
      "Mud program design, Mud rheology tests (e.g. viscosity, Mud Balance, sand content, etc.); well control simulation, bits dulling, bits selection.",
    "PENG 3215":
      "This course covers the main methods to estimate oil-in-place and reserves such as volumetric methods and material balance. It explains the different natural drive mechanisms in reservoirs focusing on saturated, undersaturated, and gas reservoirs. The course covers the basics to understand the differences between steady-state, pseudo-steady state, and unsteady-state flow. Water influx calculations are also introduced. The course also introduces waterflood as a displacement mechanism.",
    "PENG 3227":
      "This course provides the students with the understanding of the modern well logging tools, measurements, and interpretation. It starts with Borehole environment, environmental corrections of each measurement then the petrophysical evaluation of formation properties using the logging measurements. The evaluation part of the course covers the Clay volume and types, formation porosity and types, fluids distributions and types, rock mechanical properties, core to log calibration.",
    "PENG 3228":
      "This course provides the students with hands-on applications on the material covered in the formation evaluation course. The applications are performed on industry petrophysical software(s). It includes Data Loading and Extracting, Borehole Environmental Corrections of all measurements for all service companies and Petrophysical Evaluation of all formation properties. The evaluation part of the laboratory covers the Clay volume and types, formation porosity and types, fluids distributions and types and core to log calibration.",
    "PENG 3311":
      "The course covers production system components: inflow, outflow, and choke performance. Inflow Performance Relationships (IPR) for oil and gas wells are included. Nodal analysis of the entire production system is reviewed. Formation damage in vertical and horizontal wells and introduction to Well stimulation and artificial lift methods are covered. A review of production problems is covered.",
    "PENG 4121":
      "Rig systems; advanced drilling tools; well control and BOP equipment and calculations; casing design; cementing calculations and operations; bits design; well drilling operations techniques and process optimization for directional drilling, horizontal drilling, multilateral drilling; predicting and over-coming drilling problems (e.g. hole stability, lost circulation, swelling, kicks, etc.); controlled drilling, geo-steering; offshore drilling; well survey; MWD and LWD tools; well trajectory calculations.",
    "PENG 4223":
      "Reservoir simulation fundamentals, input and output for reservoir simulation, understanding reservoir simulation, simulation equations, IMPES method, introduction to reservoir simulation matrix solvers, history matching, reservoir simulation prediction, types of simulators, static models, grid models, exercise on the use of a commercial simulator in single well and full field applications.",
    "PENG 4224":
      "Diffusivity equation, skin factor, radius of investigation, types of well tests, semi-log analysis for drawdown and build up tests, gas well testing, dimensionless variables, type curve analysis, derivative plots, hydraulically fractured wells, DST, well test design. Data Analysis and Modeling Exercises using the state of the art well testing software.",
    "PENG 4225":
      "The course presents all aspects of enhanced oil recovery (EOR) processes of chemical, miscible, and thermal. It covers secondary recovery by water flooding and calculations of reservoir heterogeneity using V-number and Lorenz techniques. It also presents how to use mobility ratio and capillary number to maximize oil recovery for mature oil fields under development.\nThe course also presents principles, application, and screening depleted oil reservoir for application of different EOR processes. More materials will be assigned as technical report for updating the participants with edge technology and EOR actual field cases.",
    "PENG 4226":
      "The dynamics of energy prices; Demand and supply for primary energy sources; Energy business and structure of energy companies; Time value of money; Cash flow analysis, Inflation, interest rate, CAPEX and OPEX; Investments choices and performance metrics (Yardsticks); Reserves and resources classification; International contracts and concession agreements; Risk analysis in energy projects",
    "PENG 4227":
      "This course provides the students with the methodologies and basics of the reservoir description and characterization for both clastics and carbonates. The course integrates geology, reservoir rock properties and formation evaluation to better characterize the reservoir. The in depth understanding of core description, depositional environment from both core and logs and the comparison between core and logging calculations are the core of this course. The geo-statistics part of this course concentrates on building and analyzing the histograms and the variograms and their roles in the reservoir characterization.",
    "PENG 4314":
      "Artificial Lift (AL) methods theory. Artificial lift applicability, screening criteria, operation, design, and field applications. Well stimulation methods which involve matrix acidizing, hydraulic fracturing, and acid fracturing. Software applications for production system modeling and artificial lift design are introduced.",
    "PENG 4324":
      "Oil and gas separation systems, mechanical design of pressure vessels, crude emulsion treatment, stabilization and desalting of crude oil, produced water treatment, and gas processing plants that include: gas specifications, gas test methods, natural gas liquids, gas treating, gas gathering and gas injection.",
    "PENG 4950":
      "Each student is required to spend a minimum of eight weeks of industrial training in Egypt or abroad. A detailed report is presented and evaluated. Students are also introduced to professional ethics, various moral issues and codes of ethics.",
    "PENG 4980":
      "In the capstone projects, students are required to work with field data that cover the life cycle of a petroleum reservoir. Students perform several analyses and design different system components in the areas of geology, formation evaluation, and drilling. Report submission and oral presentation are required.",
    "PENG 4981":
      "Senior Project II is a continuation of the capstone project. Students perform analyses and integrate the results of Senior Project I to design different system components in the areas of reservoir engineering, production engineering, and surface facilities. Report submission and oral presentation are required.",
    "PENG 3415":
      "Fundamentals of material balances: single-phase systems, and multiphase systems. Energy and energy balances: balances on nonreactive processes, balances on reactive processes, computer-aided balance calculations, balances on transient systems. Energy storage systems.",
    "PENG 4015":
      "Fundamental seismic principles and its exploration methods, oil exploration and sub-surface imaging. the elastic wave equation, the acquisition and processing of seismic reflection data and seismic, tomography data. Introduction to seismic stratigraphy, seismic inversion and attribute analysis, role of seismic in reservoir properties and facies modeling. Data acquisition, processing, and interpretation of gravity data, Data acquisition, processing, and interpretation of magnetic data. Introduction to electromagnetics and their applications in petroleum industry.",
    "PENG 4125":
      "Advanced well planning; rig selections; well cost estimation; advanced well design of horizontal and multi-lateral wells; deep water drilling techniques; HPHT wells; drilling operations optimizations; well control predictions and solutions (e.g. relief wells); cement evaluation; advanced geo-steering design and operations; drilling software.",
    "PENG 4229":
      "This course provides the students with the understanding of the unconventional reservoirs from definitions to evaluation and production. The course includes classifications of unconventional reservoirs, signature of unconventional reservoirs on logging measurements, evaluation of hydrocarbon potential. Total organic carbon (TOC) evaluation and determination, pyrolysis analysis of S1, S2, S3 for evaluation of hydrocarbon saturation are covered. The course also covers evaluation of rock mechanical properties including brittleness, drilling unconventional reservoirs.",
    "PENG 4313":
      "Pipe line transport, pipe line design, calculation of the pressure drop through the pipes, fittings, valves, and bends, pipe line construction, pumping and boosting stations, gas transmission lines, metering, pipe line automation, tanker and railroad transportation, pipeline safety, regulations, specifications of the pipeline for onshore and offshore networks, examples of international pipelines, pipeline operations and maintenance, crude oil storage type, temporary storage of crude oil, crude oil stock calculations.",
    "PENG 4325":
      "Well stimulation involves matrix acidizing, hydraulic fracturing proppant, and acid fracturing in vertical and horizontal wells. New applications in the multistage frac, unconventional frac, Candidate selection, treatment design and execution of acidizing and hydraulic fracturing treatments. selection of acid additives, lab testing, QA/QC, and treatment evaluation",
    "PENG 4333":
      "Design of efficient production and use of energy, predominantly strategies in the oil and gas business. It covers the development of Transport, water, and energy efficiency policies. Technical and economic calculations of energy efficiency, management and optimization of energy costs, and environmental impact assessment in the oil and gas industry. Implementation of international standards in energy management supported with successful and industry best practices.",
    "PENG 4421":
      "Principles of Renewable and Alternative Energy Systems: Wind, Solar, Biogas, Geothermal, Fuel Cells, and Hydrogen Technologies. Economic Aspects; Efficiency; Introduction to Nuclear Energy. Connection to Grid, Smart Grids and intermittency.",
    "PENG 4423":
      "Energy use and energy patterns in modern society; Resource estimates; Engineering analysis of energy systems; Managing carbon emissions; Environmental impact and protection, Environmental remediation technologies. Supply and Demand of energy; Energy Scenarios and modeling; Energy Policy and Auditing; Sustainable development.",
    "PENG 4930":
      "Petroleum Topics chosen from: Petroleum or Gas exploration, drilling production, simulation, recovery, and gas liquefaction. Field study including assessment, evaluation, feasibility and economic studies will be required.\nEnergy Topics chosen from: Alternative Energy resources including solar, wind, biomass, fuel cells, nuclear or geothermal energy. Field study including assessment, evaluation, feasibility and economic studies will be required.",
    "ENGR 3222":
      "Economic and cost concepts, the time value of money, single, multiple and series of cash flows, gradients, functional notation, nominal and effective interest rates, continuous compounding, rates of return. Computation and applications, economic feasibility of projects and worth of investments, comparison of alternatives. Replacement, deprecation and B.E. analysis. Introduction to risk analysis.",
    "MENG 4551":
      "Introduction to CAD/CAM and additive manufacturing techniques. CAD software and hardware. 3D Geometric modeling. Types of curves and surfaces. Data capturing techniques. Surface fitting techniques. Rapid prototyping techniques. Materials and Processes for Additive Manufacturing. Overview and utilization of typical interactive computer graphics package. Hands-on experience in using CAD software, 3D laser digitizing scanner, rapid prototyping machine, and applications of additive manufacturing.",
    "MENG 4553":
      "Displacement approach for simple elements in structural mechanics. Generalization to three-dimensional elements. Overview of the finite element method (FEM), variational principles, transformation, assembly, boundary conditions, solutions, convergence and stability. Isoparametric elements. Applications to solid mechanics, heat conduction and coupled problems. Pre- and post processing. Integration of FEM in Computer Aided Design.",
    "MENG 4555":
      "Elements of vibration measuring systems, vibrations-severity measurements, frequency analysis of mechanical vibration, measuring systems for frequency analysis, vibration of continuous systems, application of vibration measurements in condition monitoring and diagnostics, fault detection in rotating equipment, vibration control.",
    "MENG 4756":
      "Feedback control system and analysis in the time domain. System sensitivity to a parameter changes. PID controllers: analysis and design. State-space: analysis and design controllers. Stability and the concept of Routh-Hurwitz. Root locus analysis and design. Analysis of systems in frequency domains. Bode plots and controller design. Nyquist stability criterion. Introduction to intelligent control. Introduction to digital control systems. A term team-based project covering analysis and controller design of selected systems by each team.",
    "MENG 4227":
      "Mechanical failures, fracture mechanics, types of corrosion. Failure modes: fracture fatigue, creep, corrosion and wear. Diagnosis and prevention of failures. Case studies.",
    "MENG 4239":
      "Automation of manufacturing processes. Numerically-controlled machine tools. NC programming. Nontraditional manufacturing processes include thermal, electrical, chemical, and mechanical machining processes, laser and electron beam welding, spark erosion, and microfabrication and nanofabrication technologies.",
    "MENG 4558":
      "The engineering design environment. Design and manufacturing. Design pitfalls and their early identification. Design measures for improving the maintainability, reliability and environmental impact. Implementation of the principle of redundancy. Introduction to design optimization.",
    "MENG 4565":
      "Elements of system architecture, product versus process-driven design objectives, design of systems, synthesis and analysis in systems design, case studies.",
    "MENG 4757":
      "Robotics and Automation, Robot classification and technical specifications, Robotic safety, homogeneous coordinate transformation, Direct and inverse kinematics, Differential motion, Jacobian: Velocities and static forces, Trajectory planning, Manipulator dynamics: Newton-Euler and Lagrange-Euler dynamic models, robot control. A term team-based project covering the selection of a manual process and conducting planning and analysis to automate it using robots.",
    "MENG 4931":
      "Specialized topics in design will be discussed, e.g. advanced strength of materials, power-plant analysis and design, design of manufacturing aids, materials-handling equipment, microcomputers in control, fluid machinery and power systems, finite-elements method in engineering, etc.",
    "MENG 4440":
      "Introduction to operations research, Linear Programming (LP) models; LP Solution approaches; integer programming; post optimality analysis; transportation, transshipment, and assignment problems. Maximal flow, shortest route, minimum spanning tree, and travelling salesman problems. Case studies, model formulations and applications using software.",
    "MENG 4444":
      "Methods used in determining the most effective utilization of effort in human activity systems; work methods, analysis and design; micro motion analysis; predetermined time systems; human and rating factors; work samplings; learning curves; physiological and psychological factors; computer-aided time study.",
    "MENG 4445":
      "Basic concepts of production management ; forecasting; break-even analysis, aggregate production planning; inventory management; master scheduling, materials requirement planning; capacity planning; resource allocation and scheduling.",
    "MENG 4441":
      "Interactive computer-based engineering decision support systems (DSS), Design and development, informational data base, mathematical models including nonlinear, goal and dynamic programming problems, queuing and decision analysis, heuristics and user interface.",
    "MENG 4442":
      "Basic concepts of components and systems reliability. Methods of modeling systems for reliability analysis. Reliability estimation & measurement. Principal methods of reliability analysis, including fault tree and reliability block diagrams; Failure Mode and Effects Analysis (FMEA); event tree construction and evaluation; reliability data collection and analysis. Design by reliability & probabilistic design. Overview of Risk Assessment and Risk Management, relation to System Safety and Reliability Engineering measures.",
    "MENG 4443":
      "Basic concepts; examples of different production and service systems; pseudo random numbers; queuing models; random variate generation; discrete-event simulation; simulation languages; model validation and analysis of simulation data.",
    "MENG 4448":
      "Process analysis; operation analysis, job design; facility location; facility layout; materials handling systems; storage and warehousing; office layout; design principles and analytical solution procedures; computerized approaches.",
    "MENG 4449":
      "Maintenance Systems performance measures, types of equipment, scheduled, preventive, and predictive maintenance, work orders, planning, scheduling and control of maintenance operations, equipment safety and reliability, life cycle costing and replacement, spare parts inventory management and cost of maintenance.",
    "MENG 4477":
      "Computer assisted manufacturing systems NC, CNC, DNC, robotics, material handling, group technology, flexible manufacturing systems, process planning and control.",
    "MENG 4930":
      "Specialized topics in industrial engineering, not covered in other listed courses, will be discussed. Offered more than once for credit if contents change. Precise course description depends on course topic.",
    "MENG 4221":
      "This course provides the students with the knowledge and skills for designing composite products, selecting the type of composite material and its processing. Comprehensive knowledge of composite design principles is covered to tailor its properties. Composite materials, including natural composites such as wood and bone, and engineered materials from concrete to fiber and dispersion reinforced matrices are covered. The course also covers interfacial adhesion, mechanical and functional properties, defects, failure modes, and characterization to study how composite materials behave.",
    "MENG 4229":
      "Introduction to Nanotechnology, Nanomaterials e.g. carbon nanotubes and nanoclays. Nanostructured materials. Transition from microstructure to nanostructure. Grain refinement techniques. Paradox of strength and ductility. Multi-modal microstructures. Fabrication techniques. Overview of mechanical, thermal and structural characterization techniques. Applications.",
    "MENG 4226":
      "Structure-property relationship in alloy systems. Imperfections in solids. Diffusion and phase transformation. Heat treatment of ferrous and non-ferrous alloys. Structure, properties and processing of metal matrix composites (MMCs). Behavior of metallic alloys and composite materials in service. Case studies and laboratory experiments.",
    "MENG 4232":
      "Processing for grain refinement of engineering materials; Solidification, cooling rates and heat treatment for casting and molding; shape forming; powder, fiber, and composite processing; Joining processes; laser processes; deposition technology for coatings for various applications.",
    "MENG 4932":
      "This course will cover topics to be chosen based on the emerging advancements in the field of Materials and Manufacturing. Maybe taken for credit more than once if content changes.",
    "MENG 4778":
      "Mechatronics and digital systems, Digital logic design (Combinational and Sequential logic design), Microprocessor and Microcontroller architecture, Microcontroller selection. Introduction to embedded systems. Sensors and Interfacing techniques, A/D and D/A conversion. Memory addressing techniques, Interrupt techniques, I/O needs, and expansion, Timers. Introduction to assembly, and a term team-based project covering problem selection, design, implementation and demonstration.",
    "MENG 4779":
      "Mechatronics design and development process, Digital systems, Microcontrollers in Mechatronics, Programmable logic controllers (PLC), PLC and interfacing techniques, Ladder logic programming, servo motors: motion, braking and speed control, Transducers and instrumentation, Vision sensing principles, Power supplies, Pneumatic and Electro-pneumatic control. Team based project covering design, control and application of electromechanical systems. Laboratory experiments.",
    "MENG 4937":
      "Covers specialized topics in Mechatronics field not covered in other listed courses.\nOffered more than once for credit if contents change. Precise course description depends on course topic.",
    "CSCE 1001":
      "Introduces fundamental concepts and principles of computing systems, grand challenges in computing, analyzing and formulating solutions to multidisciplinary problems, basic algorithms for solving problems, as well as designing, implementing, and testing programs using one prime language and other supplementary languages. Using data and procedural abstractions as basic design principles, students learn how to design and implement basic data structures such as stacks and queues, and to apply various algorithms for operating on them. Also covers some numbering systems, data representation, and basic computer organization. The course uses the imperative and object-oriented paradigms.",
    "MACT 4126":
      "A first semester course in Real Analysis covering: Structure of the real number line, sequences and series, limits, continuity, differentiation, sequences and series of functions, uniform convergence, the Darboux and Riemann integrals and the Fundamental Theorem of Calculus.",
    "MACT 4127":
      "A second semester course in Real Analysis covering: Further topics in Riemann integration, Riemann-Stieltjes integral, Picard-Lindeloff Theorem, metric and topological spaces, Stone-Weierstrass Theorem, calculus of several variables including Taylor’s theorem, Green’s theorem, and a brief introduction to measure theory.",
    "MACT 4134":
      "Sets, integers, groups. Integral domains. Fields. Rings and ideals. Homomorphisms. Quotient groups and quotient rings.",
    "BIOL 1011":
      "Introduction to the basic concepts of biology, molecules of life, cell structure and function, photosynthesis, cell respiration, cell cycle and cancer are presented. Basis and applications of genetics and molecular biology are addressed. The course introduces students to the fundamental concepts, principles and processes upon which the unity of life is based: the relationship of the course material to their day-to-day world: and how to apply scientific methods. Laboratories introduces students to basic principles of plant and animal structure and function and build on the principles of inheritance to the structure and function of tissues and organ systems.",
    "BIOL 1012":
      "Based on the diversity of life: viruses, bacteria, protistans, fungi, plants and animals are studied. The course concentrates on characteristics of different domains of life, structure, and function of plants and animals, population genetics, ecology and the environment. Laboratories introduce students to evolution, structure and function of different populations of organisms and ecosystems. Some field applications are examined.",
    "CHEM 1006":
      "Gases; thermochemistry; liquids and solids, properties of solutions; introduction to chemical kinetics, chemical equilibria, environmental pollution.",
    "CHEM 1016":
      "Semi-micro qualitative analysis of selected salts and mixtures.",
    "CSCE 1101":
      "Introduces concepts and techniques for developing larger software systems. The object-oriented paradigm is further utilized using a modern programming language such as Java or C++. Covers topics that include classes and objects, inheritance, encapsulation, polymorphism, more algorithms, basic design patterns, generics, testing. Also covers the design and implementation of data structures including but not limited to lists, trees, and graphs.",
    "CSCE 1102":
      "The laboratory will contribute to the capacity building and practice of knowledge units covered in CSCE 1101 (Fundamentals of Computing II).",
    "CSCE 2202":
      "Analysis and complexity bounds of basic classes of algorithms. Basic algorithm design methodologies: Brute force, Transform and Conquer, Divide and conquer, and Greedy methods. Dynamic Programming, Backtracking and Branch and Bound methods. Applications to problems such as sorting and searching, traveling salesperson, knapsack, optimal merge patterns and graph algorithms. Introduction to the theory of complexity.",
    "CSCE 2203":
      "The laboratory will contribute to the capacity building and practice of knowledge units covered in CSCE 2202 (Analysis and Design of Algorithms).",
    "DSCI 1411":
      "Introduction to the fundamentals of the data science domain. Fundamentals of the R programming language and related tools for usage in Data Science. Problem Solving using R. Basic statistics, data gathering, preparation, and analysis, data visualization, case studies, and some ethical issues.",
    "DSCI 2410":
      "Fundamentals of Python programming in the context of Data Science with a focus on relevant packages. Coverage of techniques for database handling, data manipulation, visualization and summarization. Study of statistical inference including confidence intervals, hypothesis testing and goodness of fit tests. Applications in Business.",
    "MACT 3223":
      "Sampling distribution. Point and interval estimation, methods of moments and MLE. Hypothesis testing, Uniformly Most Powerful (UMP), generalized likelihood ratio tests and order statistics.",
    "MACT 4212":
      "Introduction to stochastic process, discrete time Markov chain, Poisson process, Compound Poisson Processes and Renewal Processes, continuous-time Markov Chain, Transition probabilities and limiting behavior for Markov Chains, Martingales, Brownian Motion, applications in finance and insurance.",
    "MACT 4233":
      "Techniques of multivariate statistical analysis illustrated by examples from various fields. Topics include: Multivariate normal distribution. Sample geometry and multivariate distances. Inference about a mean vector. Comparison of several multivariate means, variances, and covariances. Detection of multivariate outliers. Principle components. Multidimensional scaling. Factor analysis. Canonical correlation. Discriminant analysis. and Clustering. Course includes an applied project (a thorough analysis of real-life data sets using computer-packaged programs).",
    "DSCI 4413":
      "The analysis of discretely measured responses such as counts, proportions, nominal variables, ordinal variables, discrete interval variables with few values, continuous variables grouped into a small number of categories, etc. Topics include: Detection of outliers in categorical data; Inference and distributions for discrete data; Inference for contingency tables; Generalized linear models for count data; Models for binary and multinomial response (logistic regression, Poisson regression, Loglinear models); Classification and regression trees; Cluster analysis for categorical data; The course includes an applied project using computer programming language such as R or Python.",
    "MACT 2146":
      "Formulation of linear programming problems, graphical solutions, simplex method, duality theory, sensitivity analysis, integer programming, deterministic dynamic programming. An intro to nonlinear programming and combinatorial optimization.",
    "MACT 3142":
      "Special functions. Partial differential equations. Fourier series and integrals. Diffusion, potential and wave equations in rectangular, cylindrical, and spherical coordinates. Numerical methods.",
    "MACT 3146":
      "Combinatorial optimization problems such as scheduling, matching, resource allocation, network and assignment problems, with real life applications. Graph modeling, minimum cost network flow problems and its reduction to shortest path and maximum flow problems. Discussion of graph algorithms as well as dual formulations such as the minimum cut problem. The course concludes with an intro to stochastic programming with examples.",
    "MACT 3311":
      "The most commonly used mathematical functions for computing interest and discount rates are discussed. This includes simple, compound, and other forms of interest used in financial valuations, accumulated value and present value, annuities, sinking funds, amortization of debt, and determination of yield rates on securities. The theory developed in the first part of the course is then applied to the valuation of bonds, mortgages, capital budgeting, depreciation methods, and other financial instruments. Zero-coupon bond, term structure of interest rates, coupon bonds, modified and Macaulay durations, convexity.",
    "MACT 3940":
      "Weekly one hour seminar in different areas of Mathematics to be given by faculty or invited speakers from industries and other scientific communities.",
    "MACT 4133":
      "Introduction to the goals and methods of mathematical logic. Propositional and predicate calculus (first order logic) are presented in detail. Goedel’s completeness and incompleteness theorems, and some of the philosophico-mathematical problems in set theory, and alternative logics are discussed.",
    "MACT 4135":
      "Set-theoretic definition of a graph. Bipartite graph, directed acyclic graph, and tournament. Matchings, Hall’s Theorem and Berge’s Theorem, as well as the algorithms of Prim, Dijkstra, Kruskal, and Ford-Fulkerson. Trees, connectivity and Menger’s Theorem. Planarity and chromatic number. Choice of topics among: Graph Ramsey Theory, dynamic programming, Bayesian Belief Propagation, and treewidth.",
    "MACT 4213":
      "Introduction to stochastic modeling and its real-life applications. Overview of discrete- and continuous-time models, including random walks, Brownian motion, and Poisson and compound Poisson processes. Introduction to stochastic differential equations, Itô calculus, and diffusion processes. Mathematical modeling of various real-life problems.",
    "MACT 4314":
      "Financial modeling, Excel functions, Simulation models, Applications of financial modeling in practice.",
    "MACT 4321":
      "Survival models, analytical mortality laws, life table, fractional age assumptions, non-parametric estimation of survival models, continuous and discrete life insurances, continuous and discrete life annuities, loss random variable, net single premium and gross premiums.",
    "MACT 4322":
      "Policy values for life insurance policies and Reserves, Multiple life models, Multiple decrement models, Multi-state models including Pension Plans and Retirement and Profit Analysis.",
    "MACT 4331":
      "The course aims to introduce students to severity models and frequency models and how they are used in short-term insurance applications. The course introduces aggregate models, risk measures and coverage modifications. The course introduces simulation techniques.",
    "MACT 4332":
      "The course aims to introduce students to parametric estimation for complete/incomplete data; Credibility theory, Bühlmann models and Bayesian credibility; Short term insurance arrangements: property and casualty, homeowners, health and disability and finally techniques for pricing and reserving for short-term insurance coverage.",
    "MACT 4910":
      "Under guidance of a faculty member and with approval of the Chairman, the student carries on reading or research on a specific mathematics topic. Student should demonstrate achievements by presenting results, submitting a report, or passing an examination as determined by the supervisor..",
    "MACT 4930":
      "Topics chosen according to interests of students and faculty.",
    "MACT 4931":
      "Under guidance of a faculty member and with approval of the Chairman, the student carries on reading or research on a specific actuarial science topic. Student should demonstrate achievements by presenting results, submitting a report, or passing an examination as determined by the supervisor.",
    "MACT 4950":
      "This course consists of participation in a full-time or part-time internship experience, related to the student’s field of study under the supervision of both an approved internship provider and a faculty adviser. This culminating course provides practical, hands-on training in a relevant industry to enhance classroom learning and allows senior students to apply the knowledge and skills they have acquired in the actuarial science program to real-world problems.",
    "MACT 4980":
      "The Senior Thesis serves as a culminating course that is intended in particular for senior students who may have the intention to pursue graduate studies or research-oriented careers. With the approval of a faculty advisor, students work independently under their guidance to plan and conduct deeper studies on a topic of contemporary interest. This research effort begins with creative inquiry and systematic research, includes documentation of substantive scholarly effort, and culminates in a written thesis and an oral defense. Students may choose to work alone or in a group of maximum 3 (in which case the contribution of each participant should be substantial and well identified).",
    "MACT 4990":
      "The course introduces students to the concept of risk and the role of enterprise risk management (ERM) in mitigating loss and optimizing opportunity across a business. The course covers the development of an ERM framework, identification, measurement and management of risk within risk-bearing enterprises. Students will participate in a mock risk committee, practice the risk control process in a case study group and gain hands-on experience drafting an ERM framework.",
    "CENG 3113":
      "Numerical techniques and algorithms for solving systems of linear and non-linear equations, curve fitting and interpolation, numerical integration and differentiation, numerical solutions for initial and boundary-value ordinary differential equations, and introduction to numerical techniques for partial differential equations.",
    "CSCE 3611":
      "Characterizations of signals, ADC and DAC, Fourier series and Fourier transform for discrete and continuous time signals, sampling, Digital spectrum analysis, discrete transforms, digital filters, audio and image processing applications.",
    "CSCE 4201":
      "Finite automata and regular expressions, context-free grammars and push-down automata, nondeterminism. Context-sensitive grammars and the Chomsky hierarchy of grammars. Turing machine and the halting problem. Undecidable problems. Church’s Conjecture and its implications.",
    "CSCE 4602":
      "An introduction to basic concepts in the design, analysis, and application for computational neural networks. Mathematical models of biological neurons. Multilayer perceptrons backward error propagation. Hopfield networks and Boltzmann machines. Radial-basis function networks. Kohonen self-organizing feature maps. Adaptive Resonance Theory networks.",
    "CSCE 4604":
      "Supervised and Unsupervised learning, Logistic and soft-max regression, Perception and multilayer neural networks, Back-propagation, Convolutional Neural Network (CNN), Recurrent Neural Network, Generative models, Reinforcement Learning, case studies.",
    "CSCE 5221":
      "Correctness and complexity of algorithms, amortized analysis, graph algorithms and their proofs, NP-completeness and intractability, NPC reductions and introduction to approximation algorithms and optimization problems.",
    "CSCE 5269":
      "Decision Theory, Linear Discriminants, Logistic Regression, Principal Components Analysis, Support Vector Machines, Vector Quantization, Mixture of Gaussian, Expectation-Maximization, Clustering, Mixture of Gaussian, Case Studies and applications: object classification.",
    "DSCI 3415":
      "Data Preparation and Preprocessing, Feature Extraction and Engineering, Supervised Learning Methods including Probabilistic Classifiers (Naive Bayes and Bayesian Networks), Rule-based Methods (Decision Trees and Random Forests), Instance Based Learning (KNNs), Support Vector Machines, and Introduction to Neural Networks, Unsupervised Learning Methods including k-means Clustering, MLE, Expectation Maximization, and Affinity Propagation.",
    "DSCI 4415":
      "Perceptron and multilayer neural networks, Gradient descent, Back-propagation, Convolutional Neural Network (CNN), pooling layers, CNN applications, Recurrent Neural Networks (RNN), vanishing gradient problem, case studies: object detection, and stock price estimation, GANs.",
    "ECNG 3201":
      "Basic properties of signals and systems, linearity, stability, step and impulse response,superposition integral, block diagrams, Fourier series and Fourier transform for discrete and continuous time signals, sampling theorem, Z-transform.",
    "ECNG 3202":
      "Principles of closed-loop feedback control systems, control systems design criteria, block diagrams, signal flow graphs, state space representation of linear systems, general feedback theory, transfer functions of control systems, Routh criterion, root locus theory and methods. Several experiments are conducted in the Control Lab to illustrate material covered in the course.",
    "ECNG 3401":
      "Electric field and potential. Gauss’s law; divergence. Conductors, dielectrics and capacitance. Poisson’s and Laplace’s equations. Electrostatic analogs. Magnetic field and vector potential. Time varying fields; displacement current. Maxwell’s equations in differential form, Poynting’s theorem and Electromagnetic waves in vacuum and in matter.",
    "ECNG 4301":
      "Review of signal representation and classification, time and frequency domains, Fourier transform; Energy and power spectral density. Basics of analog communication: amplitude, angle, and pulse modulation; modulators and demodulators; frequency division multiplexing. Introduction to digital communication: Review of sampling and quantization; pulse code modulation (PCM), Delta Modulation, Differential PCM, time division multiplexing, line codes; the matched filter. Introduction to Random Processes. Noise in communication systems.",
    "ECNG 4302":
      "Fundamentals of Digital Communications. Geometric Representation of Signals; Binary and M-ary Modulation and their Performance Analysis and Spectral Efficiency. Introduction to Information Theory and Source and Channel Coding; Channel Capacity; Block and Convolutional Codes. Introduction to broadband communications; OFDM. A course project is assigned.",
    "PHYS 5142":
      "Numerical methods for quadrature solution of integral and differential equations, and linear algebra. finite difference methods, finite element techniques, solving a system of equations. Use of computation and computer graphics to simulate the behavior of complex physical systems. Monte Carlo simulations.",
    "DSCI 2411":
      "The amount and complexity of information produced in science, engineering, business, and everyday human activity is increasing at staggering rates. The course discusses visual representation methods and techniques that increase the understanding of complex data. Good visualizations not only present a visual interpretation of data, but do so by improving comprehension, communication, and decision making. In this course, you will learn how the human visual system processes and perceives images, good design practices for visualization, tools for visualization of data from a variety of fields, and programming of interactive visualizations using 3D.",
    "DSCI 4416":
      "A capstone project divided between two courses DSCI 4416 and DSCI 4417. With the approval of the advisor, topics/data in an area of applications are selected by groups of 1 to 3 students who have common interests in the same area of application. A preliminary data examination, pre-processing, and exploratory data analysis are carried out on the selected data. Students will decide on the data science techniques, models, and methods to be used for the analysis. Students will submit a brief written proposal specifying their plan of work that they will follow in DSCI 4417.",
    "DSCI 4417":
      "This is a continuation of DSCI 4416, where students will implement their plan for the completion of the project. Students will develop and write well-documented computer programs to illustrate the iterative process of Data Science and business solutions are sought. The students will submit a carefully written project. The project is then submitted and presented orally to the advisors.",
    "DSCI 4950":
      "This course consists of participation in a full-time or part-time internship experience, related to the student’s field of study under the supervision of both an approved internship provider and a faculty adviser. This culminating course provides practical, hands-on training in a relevant industry to enhance classroom learning and allows senior students to apply the knowledge and skills they have acquired in their program to real-world problems.",
    "CSCE 2501":
      "Basic concepts, database system environment, DBMS. Components and architecture access structures, indexing and hashing, high-level data models, ER, the relational model, relational languages, relational algebra, relational calculus, SQL, functional dependencies and normalization, database security, query evaluation and optimization techniques, distributed database systems architecture and an introduction to NOSQL Databases.",
    "ACCT 2001":
      "The course introduces accounting as a discipline and the various uses of accounting information. It covers the accumulation, processing, and communication of accounting information. The measurement of assets, liabilities, equities and income are emphasized.",
    "ACCT 3007":
      "Data analytics is an analytical process by which data, information technology and statistical analysis are used to help managers gain improved insight about their operations and make better data driven decisions. Given the dramatic effect that data analytics is having on financial reporting, managerial accounting, auditing and taxation, accounting professionals are expected to know how data is created, collected, cleaned and analyzed. This course is designed to help students gain sufficient understanding of the analytical mindset. Additionally, this course offers both theoretical and hands-on learning experience on data collection, exploration, preparation and analysis as pre-requisites to formulate and solve business problems in general and accounting problems in particular.\nThis course offers the students the necessary background and hands-on experience to work with datasets that showcase how analytics could be applied to different areas of accounting that have been covered in other accounting courses like financial accounting, managerial accounting, fraud detection, auditing and taxation.",
    "BIOL 2090":
      "This course discusses essential concepts in experimental design and hypothesis testing and introduces quantitative skills for processing, analysing, and visualizing data generated by biological and medical experiments, focusing on the analysis of gene expression data. The open-source bioinformatics and computing platform R will be introduced and used throughout the course in the laboratory sessions.",
    "CSCE 2211":
      "In depth coverage of applied data structures needed by computing professionals. Includes but not limited to: Abstract data types and classes, analysis of algorithms, trees, binary search trees, dictionaries, self-balancing trees, B-Trees, red black trees, heaps, priority queues, sets, and graphs. Practical usage of the data structures is covered.",
    "CSCE 4501":
      "Data Cluster architectures, scheduling and resource management, big data stacks such as Hadoop, HDFS and Spark, big data processing techniques such as MapReduce, and an introduction to big data analytics.",
    "CSCE 4930":
      "Topics chosen according to special interests of faculty and major students. May be repeated for credit more than once if content changes.",
    "DSCI 3413":
      "This course is an introduction to important topics in biological, medical, health, and environmental statistical concepts and reasoning. Topics include: Introduction to Biological data Processing and Analysis, Hypothesis testing, nonparametric tests, Logistic regression, Poisson regression, Statistical methodologies in analysis of survival data (Kaplan-Meier estimator, Cox’s proportional hazards models, time-dependent covariates, multiple failure outcomes). Typical biomedical applications, including clinical trials. The course includes an applied project using computer programming language such as R or Python.",
    "DSCI 4980":
      "The Senior Thesis serves as a culminating course that allows senior students to put together the knowledge and skills they have acquired in their program. Students work under the direction of a faculty adviser to plan and conduct research on a topic of interest. The senior thesis could be an application of data science in various domains such as business, computer science, mathematics, sciences (biology, physics, chemistry) or engineering. This research effort begins with creative inquiry and systematic research. It culminates in a written thesis and an oral defense.",
    "FINC 2101":
      "The study of the principles of finance and their application to business enterprises. Special emphasis on financial analysis, management of working capital, cost of capital, capital budgeting, long term financing, dividend policy and internal finance.",
    "MKTG 2101":
      "The nature and scope of marketing. Marketing systems and the marketing environment, definition of a market, market segmentation, and buyer behavior. The marketing mix: product, place, price, and promotion. Marketing research and marketing information systems. The application of these topics to the Egyptian environment constitutes an important part of the study. Some of the class discussions and projects will incorporate entrepreneurial issues in Marketing.",
    "MOIS 2101":
      "This course is an introduction to information systems/technology and its applications for business students. The course explores the computer base applications in the major functional areas of business including accounting, finance, marketing, production, and personnel. It aims at the development of computer end-users and systems managers through a comprehensive coverage of business processes, systems concepts, systems types, applications software, database concepts, electronic commerce and competitive advantage.",
    "MOIS 3201":
      "The course aims at defining a framework of management information systems with emphasis on the organization. It relates to a number of important organizational aspects such as the human and technological infrastructure and the needs and requirements of an organizational information system. The course also covers the relational database model, with special emphasis on the design and querying of relational databases and exploration of the relationship of database to the rest of the system.",
    "MOIS 3601":
      "The course establishes a foundation for understanding analyzing and designing an Intelligent Decision Support Systems (IDSS). It also provides an overview of technical and organizational aspects of decision support systems (DSS), including individual, group and organizational DSS as well as executive information systems (EIS). It examines the integration of Experts Systems (ES) with Statistical models, the use of MS SQL data mining/warehousing, and the implementation of Information Technology (IT) based systems that support managerial and professional work, including Communications-Driven and Group Decision Support Systems (GDSS), Data-Driven DSS, Model-Driven DSS and Knowledge-Driven DSS.",
    "ARCH 3562":
      "Role of the architect and other engineers in building construction. Introduction to the factors influencing architectural design. Building components, materials and assemblies. Architectural drawing and detailing.",
    "CENG 1001":
      "History of engineering. Engineering fields of specialization and curricula. The engineering profession: team work, professionalism, ethics, licensing, communication and societal obligations. Engineering support. Engineering approach to problem solving. Examples of major engineering projects. Course project.",
    "CENG 1251":
      "Orthographic and pictorial drawing, sectional views, auxiliary views, and conventions, dimensioning and dimensional sensitivity skills, free hand sketching, and computer-aided drafting.",
    "CENG 2111":
      "Statics: Fundamentals of engineering mechanics. Equilibrium of practices, forces in space, equivalent systems, equilibrium of rigid bodies. Distributed forces, center of gravity, Distributed moments, moment of inertia. Internal actions in trusses and beams, analysis of simple structures. Friction. Dynamics: Kinematics and kinetics of a particle, rigid bodies. Energy and momentum methods.",
    "CENG 2211":
      "Concept of stress and strain in components, mechanical behavior of materials under tensile, compressive, and shear loads, hardness, impact loading, fracture and fatigue. Analysis of stresses and the corresponding deformations in components, axial loading, torsion, bending, and transverse loading. Statically indeterminate problems. Transformation of plane stresses, and Mohr’s circle. Construction engineering applications.",
    "CENG 2251":
      "Architectural and structural drawings. Roads and hydraulic works drawings. Construction details. Electro-mechanical drawings for construction.",
    "CENG 2311":
      "Principles of plane surveying; methods of measuring distances, angles and differences in heights (levels); traverse computations; setting out horizontal and vertical curves; earthwork computation; setting out engineering structures and construction projects.",
    "CENG 2511":
      "Fluid properties, fluid statics, fluid flow. Conservation of momentum, energy, continuity and Bernoulli’s equations. Viscous efforts for laminar and turbulent flow. Steady-state closed conduit and open channel flow. Application to construction engineering.",
    "CENG 2558":
      "The science of environmental pollution, contamination and their chemical sources, Environmental quality parameters, Laboratory techniques for sample analysis, Interpretation of laboratory results.",
    "CENG 3011":
      "A study of electrical and mechanical systems used in both residential and commercial construction. Lectures cover the basic principles of electrical distribution, artificial lighting, fire protection, plumbing systems and heating, ventilating and air conditioning (HVAC) systems. Course content will include system design, component selection and utilization for energy conservation. Techniques of application and installation will be included as well as site visits and workshops.",
    "CENG 3153":
      "Properties of plain and reinforced concrete, behavior of composite sections, ultimate strength and working stress design of structural elements, beams, columns, one-way and two-way solid slabs, detailing of reinforcing steel. Concept of elastic design of steel structures, structural systems for steel buildings and bridges, elastic design and analysis of steel tension members, compression members, beams, columns, and connections.",
    "CENG 3211":
      "Types and properties of construction materials and components. Concepts of quality control, statistical evaluation and corresponding experimental work. Aggregates types, sources and quality. Inorganic cements. Concrete mix design, admixtures and quality control. Asphalt cement, asphalt concrete mix design and quality control. Steel in construction. Masonry materials, timber, insulation materials and coatings.",
    "CENG 3312":
      "Minerals and rock types, superficial deposits, interpretation of geologic maps, structural geology, geologic exploration, ground water cycle, geology of Egypt and greater Cairo.",
    "CENG 4158":
      "Structural design process, structural performance criteria, choice of structural system, design topics for reinforced concrete and steel structures including: rigid frames, ribbed and flat floor systems, torsion, biaxial bending, deflections, composite construction.",
    "CENG 4252":
      "Techniques of building construction. Methods, materials, tools and equipment of construction. Traditional, mechanized and prefabrication construction systems. Applications on site management and safety, Selection of construction equipment. Applications on influence of construction methods on design and details. Emphasis in applications will be provided based on student Program.",
    "CENG 4253":
      "Civil construction; methods, materials, tools and equipment; traditional and modern construction technologies. Evaluation and selection of appropriate construction technology. Sizing, operation and maintenance of construction equipment, design of temporary construction elements such as: concrete formwork, scaffolding systems, cofferdams.",
    "CENG 4314":
      "Subsurface soil exploration and reporting; types of foundations systems and design criteria; theory of bearing capacity, design of shallow foundations, dimensioning footings; structural design of footings; isolated, combined and strap beam, design of deep foundations; bases for design of retaining structures; construction methods; effects of construction of nearby structures.",
    "CENG 4351":
      "Introduction to transportation planning and engineering; transportation planning tools, concepts of geometric and structural design and construction of highways, and concepts of geometric design of railways.",
    "CENG 4410":
      "Introduction to construction management: participants involved types of construction project life cycle. Estimating techniques and procedures: approximate estimating, quantity surveying, detailed estimating procedure, costing of labor, material, equipment, overhead costs, cash flow analysis, financing costs, cost recording and cost accounts, Quality Management, and Safety Management; basics of company’s organization and HR management.",
    "CENG 4420":
      "Participants in a construction contract. Contract definition. Types of contracts; formation principles of a contract, performance or breach of contractual obligations. Analysis and comparison of the different kinds of construction contracts. Bidding logistics. Legal organizational structures. Different types and uses of specifications. Different forms of contracts utilized in construction.",
    "CENG 4440":
      "Project definition and work breakdown structure, deterministic and probabilistic scheduling and control models and techniques. Resource allocation and levelling, optimal schedules, documentation and reporting, time and cost control, progress monitoring and evaluation. Computer applications.",
    "CENG 4460":
      "Basic accounting terminology, accounting cycle and process, financial statements and analysis, unique aspects of accounting for the construction industry methods of revenue recognition for construction, percentage of completion computations, unbalanced items in construction: costs in excess and billings in excess.",
    "CENG 4551":
      "Water quality. Material balance relationships and water pollution control. Water demand. Drinking water: collection, treatment, distribution and quality assurance. Domestic and industrial wastewater collection, treatment and disposal. Environmental Impact Assessment.",
    "CENG 4951":
      "Each student is required to spend a minimum of eight weeks in industrial training in Egypt or abroad. A complete account of the experience is reported, presented and evaluated. Professional ethics: theories and analysis of ethical case studies.",
    "CENG 4980":
      "A capstone project. Topics are selected by groups of students according to their area of interest upon advisors’ approval. Projects address solutions to open ended applications using an integrated engineering approach.",
    "CENG 4981":
      "An applied cap stone project. Continuation of senior project I topics is encouraged. Actual construction projects are selected by groups of students upon advisors’ approval for analysis. The management and technology aspects of construction are simulated and investigated.",
    "CENG 4154":
      "Prestressed concrete: basic concepts of prestressing, fibre stresses in a prestressed beam, load balancing, permissible stress in concrete and steel, prestressing systems, prestress partial losses, flexure, shear and torsion design of prestressed concrete elements, indeterminate PC structures, prestressed concrete slabs. Concrete water structures: design considerations and parameters, water tightness, analysis and design of circular and rectangular tanks.",
    "CENG 4212":
      "Various types of advanced concrete, metals, and highway materials. Examples are concrete admixtures, special concretes, special construction alloys, soil stabilizers, and bituminous materials and high strength low alloy steels. Advanced mechanics of components incorporating innovative materials. Environmental-friendly use of materials and incorporation of waste materials. Advanced quality control techniques. Laboratory experiments are conducted for demonstration purposes.",
    "CENG 4113":
      "Structural Mechanics: normal stress and strain due to normal force and bending moment, shear stress and strain due to shear force and torsion, shear center, shear stress in thin-walled sections, general stress state, principal stresses and stress invariants, failure criteria for brittle and ductile materials.\nStability of Structures: overall buckling of columns, local buckling of thin-walled sections, lateral torsion-flexure buckling of beams.\nStructural Dynamics: single degree of freedom systems, damping, response to harmonic excitation, response to support excitation, response spectra, multi-degree of freedom systems, modal analysis, mass participation and earthquake analysis.\nIntroduction to fracture mechanics: Beams on elastic foundation and raft analysis; Introduction to theory of plates and shells.",
    "CENG 4155":
      "Types of bridges. Loads; dead, live, impact, wind and other loading. Basic design and construction of various types of bridges; truss, beam and plate girder, slab, box girder. bearings and expansion details.",
    "CENG 4157":
      "Structural systems for modern tall buildings: gravity load systems; transfer floor systems; lateral load systems for resisting wind and earthquake forces; design considerations for tall buildings. Roof systems for large span areas and arenas: shell structures; folded plates; tensile structures and canopies.",
    "CENG 4315":
      "Geotechnical analysis and design concepts applied to engineering projects: stability of natural and man-made soil and rock slopes, reinforced earth, deep soil stabilization, cofferdams, mat foundation, deep foundation under various loading conditions.",
    "CENG 4911":
      "Specialized topics in construction engineering will be selected and presented.",
    "CENG 4952":
      "Students will spend 12 weeks as full-time engineers-in-training in construction companies. During their engagement, the students will partake in activities related to one or more experience areas related to construction engineering, such as Tendering, Planning and Progress Control, Contract Administration, Construction Execution, Advanced Construction Materials, Technical Office, BIM Engineering, Procurement, Quality Management, Pre-stressing, Structural Design, Infrastructure Systems.\nStudents will be assigned daily tasks and responsibilities, and they will actively contribute to the progress of their assigned construction projects.",
    "CENG 4430":
      "Introduction to Risk and Uncertainty. Process of Risk Management: Risk Identification, Risk Analysis (Qualitative and Quantitative), Risk Response Planning, Risk Monitoring and Control, Tools and Techniques: Decision Tree, modeling, optimization, linear programming, network optimization, and inventory models. Monte Carlo Simulation and Application. Accounting for Project Risks. Introduction to Risk Analysis packages (Crystal Ball, PERT Master). Analyzing the Bidding Behavior of Key Competitors and Estimating Optimum Markup.",
    "CENG 4450":
      "Building Information Modeling, Computer modeling of construction processes, 4D Simulation of construction operations, Productivity modeling, measuring and forecasting, Sequencing and coordination of construction systems, Post-Optimality Analysis of Integer and Linear Programming Models in construction, discrete event simulation of construction processes.",
    "CENG 4470":
      "Construction project parties’ responsibilities pursuant to Civil Code and the Law of Tenders and Auctions (No. 89/1998), tendering procedures, contract negotiation and drafting, document control, international form of contracts (FIDIC), management of the variation process, Claims preparation and evaluation, disputes resolution methods.",
    "CENG 4352":
      "Analysis of factors in developing highway transportation facilities, traffic estimates and assignment, problems of highway geometric and design standards, planning and location principles, intersection design factors, structural design of pavement and highway maintenance.",
    "CENG 4552":
      "Introduction to water resources engineering. Design of irrigation systems and canals. Hydraulic structures: types, functions, hydraulic design, environmental impact. Urban and rural drainage systems associated with public infrastructure projects: types, design considerations, and hydraulic design.",
    "CENG 4553":
      "Theory and design of unit operations and processes in environmental engineering, emphasizing water and wastewater treatment; namely: physical, chemical and biological unit processes, sludge handling processes.",
    "CENG 4554":
      "Sanitary, storm water and combined sewerage systems: selection, elements, layout, computer-assisted hydraulic modeling and design. Water supply and distribution systems: hydraulic modeling and design. Pipeline asset management, GIS application in pipeline management and Life Cycle Cost Analysis. Pipeline rehabilitation and repair methods. Planning and construction considerations.",
    "CENG 4555":
      "Solid wastes - Nature, generation and collection. Local and regional management strategies including recycling and recovery of useful products, landfilling, and incineration. Hazardous wastes - Nature, generation and collection. Risk assessment. Management strategies including source reduction, treatment, recovery, landfilling, and incineration.",
    "CENG 4556":
      "Water impurities, Water quality regulations, drinking water standards; process and hydraulic design of water purification works: Flash mixing, flocculation, sedimentation, clariflocculator, sand filtration, membrane filtration, and disinfection. Wastewater characterization; process and hydraulic design of wastewater treatment works: Preliminary and primary treatment; secondary biological treatment units. Layout design of water treatment plants and wastewater treatment plants.",
    "CENG 4557":
      "Bridges and tunnels as part of road and/or rail networks, geometric features of bridges and tunnels, conceptual designs of substructure and superstructure of bridges and tunnels, geotechnical investigations; ramps, design of intersections and interchanges, earthwork configuration and stability, soil-structure interaction, methods of construction.",
    "CSCE 2301":
      "Basic logic gates, Boolean algebra, logic minimization algorithms, modular design of combinational circuits, introduction to computer arithmetic, memory elements, sequential circuits, Finite State Machines analysis and design, top-down digital systems design approach, timing aspects of digital systems. Exposure to modern Electronic Design Automation tools, Hardware Description Languages and programmable logic devices. The laboratory component will cover experiments in digital electronics.",
    "CSCE 2302":
      "The laboratory will cover experiments in digital design and experiments illustrating material of course CSCE 2301 .",
    "CSCE 2303":
      "Instruction set architecture, computer performance (affecting factors and metrics), computer arithmetics (integers and floating-point numbers), assembly programming and the corresponding machine code (RISC and CISC architectures), the instruction cycle, the interrupt cycle, the memory hierarchy, and caching.",
    "CSCE 3104":
      "Comparative study of abstraction, syntax, semantics, binding times, data and sequence control, run-time resources, translators, and storage of programming languages. Programming projects using selected programming languages to enhance practical aspects.",
    "CSCE 3401":
      "Operating systems concepts and structure. The Kernel, interrupts, system calls. Process concepts, operations, and implementation. Threads. Concurrency, interprocess communication and synchronization. Process scheduling. Resources and deadlocks. Memory management: swapping, paging, segmentation, virtual memory. File system interface, protection. Case studies: Windows, Linux, and MINIX.",
    "CSCE 4101":
      "Principles and practices in the design of compilers. Lexical analysis. Syntax analysis, top-down and bottom-up parsing. Syntax-directed translation and syntax trees. Declarations, types, and symbol management. Run-time environments, storage organization, parameter passing, dynamic storage allocation. Intermediate languages and intermediate code generation. Code generation and optimization.",
    "CSCE 4950":
      "Each student is required to spend a minimum of eight weeks in training related to the computing domain in Egypt or abroad. Students need to follow guidelines published by the department. Evidence, including references are provided demonstrating the nature and duration of training. A report followed by discussion is submitted to a departmental committee for evaluation.",
    "CSCE 4980":
      "Participating students select project topic according to their subject of interest and the availability of facilities and advisers. Students carry out necessary preliminary work, which involves initial design space exploration, and submit a progress report. Ethical responsibilities of a computing professional are covered by lectures and seminars and emphasized through the student’s teamwork.",
    "CSCE 4981":
      "Participating students carry on the plan of work they developed in CSCE 4980 . Students use all of their acquired knowledge toward the design, implementation, testing, and documentation of a product. Each participant gives an oral presentation of his/her results. On the approval of the supervisor, each group prepares and presents a complete package. Further ethical issues of the computing profession are covered and emphasized all over the course work.",
    "CSCE 4301":
      "This is a hands-on course on the theory and practice of developing low-power embedded systems with real-time constraints. Students will learn how to develop embedded hardware and software, interface a variety of sensors and actuators for interactive systems, communicate over embedded networks and use RTOS kernel to develop embedded software. The course will culminate with a significant project which will extend the concepts covered earlier in the course",
    "CSCE 4302":
      "The laboratory will cover experiments in embedded systems illustrating material of course CSCE 4301 .",
    "CSCE 4303":
      "Systems-on-Chip (SoCs) are at the core of most embedded computing and consumer devices nowadays. The course gives Hands-on coverage of the breadth of computer engineering within the context of SoCs, including on-chip memories and buses, I/O interfacing, RTL design of accelerators, firmware development and OS support. The course emphasizes hardware/software tradeoffs, and hardware/software codesign.",
    "CSCE 4315":
      "Covers introduction to networking fundamentals, Internet of Things (IoT) performance metrics, energy-efficient networking, IoT link layer protocols, e.g., IEEE 802.11, Bluetooth, Bluetooth Low Energy (BLE) and IEEE 802.15.4, IoT network layer protocols, e.g., 6LoWPAN and Routing Protocol for Low Power and Lossy Networks (RPL), transport and application layer protocols, e.g., Constrained Application Protocol (CoAP) and Message Queue Telemetry Transport (MQTT).",
    "CSCE 3423":
      "Secure Network Architecture and Components, Network Attacks, Router Hardening, Secure Communications, Secure Campus Network, Significance of security protocols and frameworks, Security Governance Through Principles and Policies, Personnel Security and Risk Management Concepts, Business Continuity Planning, Laws, Regulations, and Compliance, Protecting Security of Assets, Cryptography and Symmetric Key Algorithms, PKI and Cryptographic Applications, Principles of Security Models, Design, and Capabilities; Security Vulnerabilities, Threats, and Countermeasures, Controlling and Monitoring Access, Security Assessment and Testing, Preventing and Responding to Incidents, Disaster Recovery Planning.",
    "CSCE 4421":
      "Fundamentals of Network Security. Introduction to symmetric and public key cryptography. Analysis of network attacks such as DNS cache poisoning, malware, and DOS. Network defensive tools such as firewalls, intrusion detection systems, and endpoint detection systems. Practical implementation of network attacks. Practical configuration of defensive mechanisms.",
    "CSCE 4423":
      "The Scope of Computer Forensics, Windows Operating and File Systems, Handling computer Hardware, Acquiring Evidence in a Computer Forensics Lab, Online Investigations,Documenting the Investigation, Admissibility of Digital Evidence, Network Forensics, Mobile Forensics, Photograph Forensics, Video Forensics, Vehicle Forensics, Mac Forensics, Case Studies.",
    "CSCE 4424":
      "Fundamentals of the security of web applications. Server-side vulnerabilities such as SQL injections, Server-side request forgery, path traversal, and command injection. Client-side vulnerabilities such as cross-site scripting, cross-site request forgery, and race conditions. Defensive mechanisms such as web application filters, content security policy, and secure coding techniques. Practical implementation of penetration testing tasks and report writing.",
    "CSCE 4702":
      "This course introduces the main security problems found in contemporary systems and addresses how such problems are introduced and how we may work towards their eradication. The course enables students to treat security issues as an important and integral part of system design and development. It also provides them with a solid understanding of the basic ideas and techniques used in assessing and addressing security risks.",
    "CSCE 3101":
      "A programming language different from those studied in CSCE 1001 and CSCE 1101 will be presented according to the interest of both students and faculty.",
    "CSCE 3103":
      "In-depth study of a typical object-oriented programming language (C++) from a software engineering perspective, with emphasis on features supporting the development of large, efficient and reusable object-oriented applications. Principles and practice of three software development paradigms: developing classes from scratch, reuse of existing classes, incremental extension of frameworks. Encapsulation, templates, polymorphism, dynamic binding and virtual methods, operator’s overloading, complex associations, dynamic aggregation, inheritance (single and multiple), exception handling, the standard template library. Introduction to UML for describing program designs.",
    "CSCE 3311":
      "Overview the network protocol stack and TCP/IP. Data transmission technologies, transmission impairments and channel capacity. Basics of wired and wireless transmission media. Signal encoding techniques. Introduction to error detection and correction. LAN fundamentals, Ethernet LANs, WLANs and MAC protocols. Cellular networks fundamental concepts and evolution from 1G to 5G networks.",
    "CSCE 3312":
      "Covers the fundamentals of computer networking. Topics include Introduction to computer networks, historical perspective and types, switching techniques, the concept of layering, network performance metrics, data link layer, network layer, IP networking and addressing, and the transport layer.",
    "CSCE 3313":
      "Offers hands-on experience in the area of computer networks. This includes basic network components, equipment, and experiments on network monitoring and virtualization tools, link layer, network layer, transport layer and application layer protocols, along with well-known static and dynamic routing protocols, in use in the Internet today.",
    "CSCE 4411":
      "Introduction to distributed systems. Modeling, specifications, consistency, fault tolerance, interprocess communication, network and distributed operating systems, distributed mutual exclusion, distributed deadlock detection, load balancing and process migration.",
    "CSCE 4502":
      "Introduction to the Web as a platform, the Web as an n-tier client-server architecture, basic components of a web-based application, developing static and dynamic web pages. Enhancing Web pages using Scripting languages. Developing Web-based applications. Using Server-extension techniques and tools. Introduction to XML and its associated technologies. Emerging technologies and tools on the web. Wireless Web protocols and techniques.",
    "CSCE 4910":
      "Under the guidance of a faculty member, the student carries on a reading, research, or a project on a specific computer-science topic. The student will present his/her results by submitting a report or passing an examination as determined by the supervisor.",
    "DSGN 3400":
      "A multi-disciplinary course that guides students to form teams of designers, programmers, and illustrators to ideate, prototype, and pitch their digital games.\nThe course will include theoretical and practical components, group discussions, and assignments.",
    "CHEM 2003":
      "Aliphatic and aromatic hydrocarbons, stereochemistry and conformational analysis, ionic and free-radical substitution and addition reactions.",
    "CHEM 2006":
      "Ionic equilibria: solubility, activity and ionic strength. Gravimetry: nucleation and crystal growth, methodology, colloids. Acid-base, complexation, oxidation-reduction and precipitation equilibria and titrations. Introduction to separations in analytical chemistry.",
    "CHEM 2013":
      "Characterization of organic compounds by classification tests.",
    "CHEM 2016":
      "Acid-base, oxidation-reduction, complexometric and precipitation titrations; gravimetric analysis; potentiometric titrations.",
    "CHEM 3003":
      "Gas laws, state variables and equations of state, energy and the first law, thermochemistry; entropy and the second and third laws; spontaneity and equilibrium; physical transformation of pure substances, phase rule, phase equilibria.",
    "CHEM 3005":
      "Introduction to computational chemistry techniques and their applications to chemical and biochemical areas; Principles of Density Functional Theory; Thermochemistry modeling in Chemistry; Generating and Analyzing a Molecular Dynamics Trajectory; Mass transport in material science; Basics of Monte Carlo Sampling Techniques; Binding Energies in Biochemistry; Combined QM/MM Simulation; Enzyme Reaction Mechanism.",
    "CHEM 3006":
      "Stereochemistry, aromaticity, electrophilic aromatic substitution; spectroscopy and structure; SN1, SN2, E1, and E2 reactions.",
    "CHEM 3009":
      "Basic principles of quantum mechanics as applied to hydrogenic and polyelectron atoms, atomic orbitals, electron-electron interactions, atomic parameters. Molecular orbital theory as applied to diatomic and polyatomic molecules and to solids, bond properties, molecular shape and symmetry, introduction to applications of molecular symmetry in chemistry. The structures of simple solids; acids & bases; oxidation-reduction. Overview of methods of molecular structure determination.",
    "CHEM 3011":
      "Instrumental methods of chemical analysis: visible, ultraviolet, and infrared absorption spectroscopy, atomic absorption and emission spectrometry, fluorimetry, X-ray diffraction and fluorescence; mass spectrometry, gas chromatography, thermometric and electrochemical methods.",
    "CHEM 3012":
      "Analytical measurements using instrumental methods of chemical analysis such as visible, ultraviolet and infrared absorption spectroscopy; atomic absorption, and emission spectrometry; fluorimetry, X-ray diffraction, and fluorescence; mass spectrometry, gas chromatography, thermometric and electrochemical methods.",
    "CHEM 3013":
      "Experiments in physical chemistry, thermodynamics and error analyses.",
    "CHEM 3014":
      "Experiments in electrochemistry. One three-hour lab period.",
    "CHEM 3015":
      "The living cell, structure of biomolecules and their relationship to biological functions; biochemical energetics; metabolism of major cellular components and their relationship to clinical conditions.",
    "CHEM 3016":
      "Systematic identification of organic compounds, analysis of mixtures (qualitative and quantitative).",
    "CHEM 3018":
      "Preparations, reactions, and characterization of some inorganic compounds; ion-exchange; chromatography; measurements of stability constants.",
    "CHEM 3940":
      "Weekly one-hour seminars in different areas of science and technology with emphasis on chemistry to be given by faculty and invited speakers from industries and other scientific communities.",
    "CHEM 4004":
      "Basic concepts and theory of quantum mechanics, applications to atomic and molecular spectroscopy; introduction to statistical thermodynamics.",
    "CHEM 4006":
      "A continuation of the chemistry of monofunctional and polyfunctional compounds, including the chemistry of carbanions, condensation reactions, nucleophiic addition and multistep syntheses.",
    "CHEM 4008":
      "Coordination chemistry, transition metals and their complexes, theories of metal-ligand bonding, complexes of pi-acceptor ligands and organometallic compounds, reaction mechanisms of d-block complexes. Selected topics in nanochemistry, solid state chemistry, bioinorganic chemistry and/ or catalysis.",
    "CHEM 4013":
      "Experiments in physical chemistry emphasizing chemical kinetics.",
    "CHEM 4016":
      "Organic Synthesis of compounds through one step or multistep, using different techniques for separation and purification. Several spectroscopic tools, (MS, IR, NMR & C13) are used to confirm the structure of synthesized compounds.",
    "CHEM 4980":
      "A capstone course. Each student selects a topic in his/her field of interest under the supervision of a faculty member. In this course, the student prepares an outline, assembles a bibliography, and develops a study plan under the supervision of the faculty advisor to be followed in preparing his/her project. The students are also expected to compose a theoretical background section that illustrates his/her knowledge of the range of equipment and techniques that will be used in obtaining and reporting the results of research. Each student is expected to deliver a seminar by the end of the semester that provides an overview of the research topic, anticipated outcomes and evaluation criteria.",
    "CHEM 4981":
      "A capstone course. Students will embark in this course on performing the actual work on the project topics selected in CHEM 4980 . After completion of this research study, the students are expected to compose in accordance with the departmental guidelines, a full thesis and give an oral presentation of the main results achieved.",
    "BADM 2001":
      "The course is designed to be an introductory course for students with no prior knowledge in business. The course starts by defining the business organization and its role in society as well as entrepreneurship and its role in the economy. The course then covers some of the business functions including research and development, marketing, production, finance. The four basic functions of a manager, namely planning, organizing, leading and controlling are also introduced. The ethical and social responsibility if business if emphasized. The course is meant to give students who are considering majoring or minoring in Business or Entrepreneurship an introductory overview about the field , that gives a practical and integrated view of the profession and the field of study.",
    "ENTR 3102":
      "This is an interdisciplinary course combining skills from all areas of business. It focuses on the creation of new business ventures with an emphasis on personal rather than corporate goals. Special focus is placed on problems encountered by the entrepreneurs in the Middle East and development of solutions to those problems. The course also prepares students for intrapreneur or entrepreneur business careers in startups and small and large corporations. It offers and understanding of the stages of business formation and what activities are appropriate at each stage of business development to meet financial goals including preparations of feasibility studies for business start-ups.",
    "CHEM 3522":
      "An overview of planning scale-up from laboratory to pilot plant, to production plant, with a focus on models for determining profitability of new projects, new products and new processes. Selected topics from: process design, plant layout and flowsheets, material and energy balances, mass and heat transfer, reactor kinetics, chemical economics, process design strategies and waste management.",
    "CHEM 3523":
      "Crude oil processing and production of basic, intermediate, and final petrochemicals; ethylene, propylene, butenes, benzene, toluene, xylene; non-hydrocarbon intermediates; higher paraffin-based chemicals; C4 olefins and diolefin-based chemicals; process technologies in petrochemical industries including thermal and catalytic cracking, reforming, dehydrogenation",
    "CHEM 4524":
      "Mechanisms and kinetics of polymerization reactions of monomers; principles, limitations and advantages of various methods for molecular weight characterization; structure - physical properties relationship; specific catalysis for the control of polymeric stereo-specificity and morphology; polymer production and processing techniques",
    "CHEM 2020":
      "An overview of the interdisciplinary nature of food science. The chemical and physical properties of foods. An overview of food regulation. Concepts and applications of food chemistry, food analysis, food processing, biotechnology, sensory evaluation, food packaging, food product development and food engineering. Global food situation with an emphasis on the Egyptian context.",
    "CHEM 3020":
      "This course covers the chemistry of food constituents, the changes these constituents undergo during processing, the chemistry and technology of meat and meat products, dairy products, fruit and vegetables, cereal products and alcoholic/non-alcoholic beverages. It also covers the basic chemistry of color, odor and taste (sensory properties of foodstuffs).",
    "CHEM 4007":
      "An overview of fruit, vegetable, cereal, dairy, seafood and meat science and technology. The principles of food processes, including refrigeration, freezing, heat processing, dehydration, fermentation, high pressure, irradiation, pulsed electric field and packaging. Commercial preservation technologies used in the preservation of minimally processed and processed foods.",
    "CHEM 3002":
      "Characterization of metals, minerals, pigments, glass, stone, dyes. Dating techniques: thermoluminescence, radiocarbon, amino-acid, Obsedian hydration and potassium/argon. Introduction to Mossbauer spectroscopy and neutron activation analysis.",
    "CHEM 3910":
      "Under faculty guidance, the student(s) will carry out a group individual project on an environmental related topic. The student(s) will present their results by submitting a common/individual report or by passing an examination, as determined by the supervisor.",
    "CHEM 4910":
      "In exceptional circumstances some senior Chemistry students, with departmental approval, may arrange to study a selected topic outside of the regular course offerings. The student and faculty member will select a topic of mutual interest and the student will be guided in research and readings. The student would demonstrate achievement either by submitting a report or passing an examination, according to the decision of the supervisor.",
    "CHEM 4930":
      "Topics chosen according to special interests of faculty and students..",
    "CHEM 4005":
      "Several aspects in a variety of chemical industries such as pharmaceutical, petrochemical, polymer, metal catalysis, surfactants, biotechnology, and inorganic chemical industries will be discussed.",
    "CHEM 4900":
      "This is a summer-based chemistry practical internship where students will spend 12 consecutive weeks as full-time employees-in-training in approved entities within the chemistry-related fields. The course is available to students in any of the CHEM undergraduate concentrations."
  };

  const coursePrerequisites = {
    "PHYS 1011":
      "MACT 1121\nPHYS 1012 to be taken concurrently",
    "PHYS 1012":
      "Concurrent with PHYS 1011",
    "PHYS 1021":
      "PHYS 1011, PHYS 1012, MACT 1122 or concurrent.\nConcurrent with PHYS 1022",
    "PHYS 1022":
      "Concurrent with PHYS 1021",
    "PHYS 2041":
      "PHYS 1021. Co-requisite MACT 2141.",
    "PHYS 2042":
      "PHYS 1022",
    "PHYS 2211":
      "PHYS 1021\nConcurrent: PHYS 2213",
    "PHYS 2213":
      "Concurrent: PHYS 2211",
    "PHYS 2221":
      "PHYS 1021",
    "PHYS 2222":
      "PHYS 2221 or concurrent.",
    "PHYS 3013":
      "MACT 2141; MACT 2123",
    "PHYS 3023":
      "PHYS 2221 and MACT 2123",
    "PHYS 3031":
      "Concurrent PHYS 4042",
    "PHYS 3052":
      "PHYS 2041 or concurrent.",
    "PHYS 3232":
      "PHYS 2042",
    "PHYS 3241":
      "MACT 2132, MACT 2141",
    "PHYS 4042":
      "PHYS 2041, MACT 2132, PHYS 3013",
    "PHYS 4051":
      "PHYS 4042",
    "PHYS 4225":
      "PHYS 2222",
    "PHYS 4231":
      "PHYS 3031",
    "CHEM 1005":
      "Thanawiya Amma Science or equivalent.",
    "CHEM 1015":
      "Thanawiya Amma Science or equivalent",
    "MACT 1122":
      "MACT 1121 or exemption.",
    "MACT 2123":
      "MACT 1122",
    "MACT 2132":
      "MACT 1122 or concurrent",
    "MACT 2141":
      "MACT 1122",
    "PHYS 4980":
      "Senior standing.",
    "PHYS 4981":
      "PHYS 4980",
    "PHYS 4043":
      "PHYS 4042",
    "PHYS 4071":
      "MACT 2132 and PHYS 3023",
    "PHYS 4233":
      "PHYS 2211 and PHYS 2041",
    "PHYS 4234":
      "PHYS 1022",
    "PHYS 4241":
      "PHYS 2221",
    "PHYS 4242":
      "PHYS 2221, PHYS 2041",
    "PHYS 4243":
      "PHYS 2221",
    "PHYS 4244":
      "PHYS 2221, PHYS 2041 and (PHYS 2211 or PHYS 2216 or ECNG 3105)",
    "PHYS 3223":
      "PHYS 2222, PHYS 2221",
    "PHYS 4224":
      "PHYS 2221 or consent of instructor.",
    "PHYS 4226":
      "PHYS 2041, MACT 2132",
    "PHYS 4281":
      "Junior standing. Consent of instructor.",
    "CENG 3111":
      "CENG 2111 and CENG 2211 or concurrent",
    "CENG 3511":
      "CENG 2511 or ENGR 2122",
    "CENG 4313":
      "CENG 2211, CENG 3511, CENG 3312",
    "CHEM 3004":
      "CHEM 2006,CHEM 3003, PHYS 1021.\nConcurrent: Concurrent with CHEM 3014",
    "CHEM 4003":
      "CHEM 3004\nConcurrent: Concurrent with CHEM 4013",
    "CSCE 3102":
      "CSCE 1101",
    "CSCE 3303":
      "PHYS 2211 and CSCE 2301 or concurrent",
    "CSCE 3304":
      "CSCE 3301 and CSCE 3303",
    "CSCE 3601":
      "CSCE 1101 or DSCI 2410",
    "CSCE 3701":
      "CSCE 1101",
    "CSCE 4603":
      "CSCE 1101 or DSCI 2410",
    "DSCI 3411":
      "DSCI 1411 and MACT 2132 and (MACT 3223 or MACT 3224)",
    "DSCI 4411":
      "DSCI 3415 or CSCE 3602",
    "DSCI 4412":
      "(DSCI 1411 or CSCE 1101) and (DSCI 2410 or MACT 2222 or MACT 3223 or MACT 3224)",
    "ECNG 3106":
      "ECNG 3105, concurrent with ECNG 3109L.",
    "ECNG 4402":
      "ECNG 3401",
    "MACT 2131":
      "MACT 1121 (concurrent or exemption)",
    "MACT 3143":
      "Pre-requisites or concurrent: CSCE 1001, MACT 2141 and MACT 2132",
    "MACT 3211":
      "MACT 2123 or concurrently.",
    "MACT 3224":
      "MACT 1122 or ECON 3061",
    "MACT 4125":
      "MACT 2123",
    "MACT 4231":
      "(MACT 2132 or ECON 3061) and (MACT 3224 or ECON 2081 or concurrent with MACT 3223)",
    "MACT 4232":
      "MACT 4231 or ECON 3081",
    "MENG 3602":
      "(ENGR 2122 or MENG 2601), MENG 3601",
    "MENG 3605":
      "MENG 3601",
    "PENG 3211":
      "PENG 2013 or PENG 2400",
    "PENG 3411":
      "ENGR 2122 and CHEM 1005",
    "ENGR 1005":
      "None listed.",
    "ENGR 2105":
      "MACT 1122 and PHYS 1011",
    "ENGR 2122":
      "PHYS 1021 and (ENGR 2104 or ENGR 2105)",
    "ENGR 2412":
      "MACT 1121",
    "ENGR 3202":
      "CSCE 1001 (or MENG 2202 or ENGR 2412) and MACT 2141",
    "MENG 2112":
      "ENGR 2102 or ENGR 2105",
    "PENG 3430":
      "PENG 2013 or PENG 2400",
    "SCI 2005":
      "None listed.",
    "PENG 2400":
      "None listed.",
    "PENG 3011":
      "SCI 2005",
    "PENG 3021":
      "SCI 2005 and PENG 2400",
    "PENG 3111":
      "PENG 3021",
    "PENG 3112":
      "Concurrent with PENG 3111",
    "PENG 3215":
      "PENG 3211, PENG 3021 or concurrent",
    "PENG 3227":
      "PENG 3011 and PENG 3021\nConcurrent: PENG 3228",
    "PENG 3228":
      "Concurrent with PENG 3227",
    "PENG 3311":
      "PENG 3211",
    "PENG 4121":
      "PENG 3111",
    "PENG 4223":
      "ENGR 3202 and PENG 4224",
    "PENG 4224":
      "PENG 3215",
    "PENG 4225":
      "PENG 3215",
    "PENG 4226":
      "PENG 2400 and senior standing.",
    "PENG 4227":
      "PENG 3227",
    "PENG 4314":
      "PENG 3311",
    "PENG 4324":
      "PENG 3311 and PENG 3411",
    "PENG 4950":
      "A minimum of 12 credits of PENG courses.",
    "PENG 4980":
      "Consent of Department Chair",
    "PENG 4981":
      "PENG 4980",
    "PENG 3415":
      "PENG 2400",
    "PENG 4015":
      "PENG 3011",
    "PENG 4125":
      "PENG 4121",
    "PENG 4229":
      "PENG 3215 and PENG 3227",
    "PENG 4313":
      "PENG 3311",
    "PENG 4325":
      "PENG 3311 and PENG 3227",
    "PENG 4333":
      "PENG 3411",
    "PENG 4421":
      "PENG 2400 and senior standing.",
    "PENG 4423":
      "PENG 2400 and senior standing.",
    "PENG 4930":
      "Senior standing.",
    "ENGR 2102":
      "MACT 1121 and PHYS 1011",
    "ENGR 2104":
      "MACT 1122 and ENGR 2102",
    "ENGR 3212":
      "PHYS 1021 and MACT 1122",
    "ENGR 3222":
      "MACT 1121",
    "MENG 2202":
      "PHYS 1021",
    "MENG 2601":
      "PHYS 1021 and ENGR 2104",
    "MENG 2505":
      "ENGR 1005",
    "MENG 3207":
      "CHEM 1005 and MENG 2112\nConcurrent: MENG 3217",
    "MENG 3209":
      "MENG 3207",
    "MENG 3217":
      "MENG 2112\nConcurrent: MENG 3207",
    "MENG 3402":
      "ENGR 3202 and MACT 3224",
    "MENG 3446":
      "MACT 3224, ENGR 3222",
    "MENG 3502":
      "ENGR 2104 and ENGR 3202.",
    "MENG 3505":
      "MENG 2112, MENG 2505, and Concurrent (or prerequisite) ENGR 3202.",
    "MENG 3506":
      "ENGR 2104, MENG 2505, MENG 3209, MENG 3505\nConcurrent: MENG 3209",
    "MENG 3601":
      "(ENGR 2122 or MENG 2601), CHEM 1005, CHEM 1015",
    "MENG 3705":
      "(PHYS 2211 or (PHYS 2216 and PHYS 2217)), MENG 3502",
    "MENG 4208":
      "MENG 3209 and MENG 3506",
    "MENG 4507":
      "MENG 3506 and MENG 3502",
    "MENG 4606":
      "ENGR 3202 and MENG 3602",
    "MENG 4950":
      "Prerequisite: Senior standing and completion of all ENGR in addition to a minimum of 18 credits of MENG.",
    "MENG 4980":
      "Co- or pre-requisites\nMENG 3446, MENG 3605 and MENG 3705",
    "MENG 4981":
      "MENG 4980",
    "PHYS 2216":
      "PHYS 1021\nConcurrent: PHYS 2217",
    "PHYS 2217":
      "Concurrent: PHYS 2216",
    "MENG 4662":
      "MENG 4606 and MENG 3605 .",
    "MENG 4663":
      "MENG 3605 and MENG 4606 .",
    "MENG 5168":
      "Consent of instructor",
    "MENG 4661":
      "MENG 3602",
    "MENG 4665":
      "MENG 3602 and MENG 3605",
    "MENG 4666":
      "MENG 3605 and MENG 4606.",
    "MENG 4667":
      "MENG 4606 and MENG 3605 .",
    "MENG 4936":
      "Depends on topic.",
    "MENG 4551":
      "Senior standing, MENG 2505 and MENG 3506",
    "MENG 4553":
      "MENG 3505 and ENGR 3202",
    "MENG 4555":
      "Senior standing and MENG 3705",
    "MENG 4756":
      "Senior standing and MENG 3705",
    "MENG 4227":
      "MENG 3209 .",
    "MENG 4239":
      "MENG 3209 and PHYS 2216",
    "MENG 4558":
      "MENG 3209 and MENG 3506",
    "MENG 4565":
      "MENG 3506",
    "MENG 4757":
      "ENGR 2104",
    "MENG 4931":
      "Prerequisite: senior standing in mechanical engineering.",
    "MENG 4440":
      "ENGR 3202",
    "MENG 4444":
      "MENG 3209",
    "MENG 4445":
      "ENGR 3202 and ENGR 3222",
    "MENG 4441":
      "MENG 4440 and MACT 3224 .",
    "MENG 4442":
      "MENG 3402",
    "MENG 4443":
      "MENG 3402",
    "MENG 4448":
      "ENGR 3202",
    "MENG 4449":
      "ENGR 3222",
    "MENG 4477":
      "MENG 3209",
    "MENG 4930":
      "Senior standing.",
    "MENG 4221":
      "MENG 3209",
    "MENG 4229":
      "MENG 3209",
    "MENG 4226":
      "MENG 3209",
    "MENG 4232":
      "MENG 3209",
    "MENG 4932":
      "MENG 3209",
    "MENG 4778":
      "(PHYS 2211) or (PHYS 2216 and PHYS 2217)",
    "MENG 4779":
      "MENG 3705 or Concurrent",
    "MENG 4937":
      "depends on topic",
    "CSCE 1001":
      "College level preparation course in Mathematics or MACT 1111.",
    "MACT 1121":
      "Thanawiya Amma Science or equivalent or exemption exam",
    "MACT 4126":
      "MACT 2123, MACT 2131 and MACT 2132.",
    "MACT 4127":
      "MACT 4126",
    "MACT 4134":
      "MACT 2131 and MACT 2132.",
    "BIOL 1011":
      "None listed.",
    "BIOL 1012":
      "BIOL 1011 or exemption",
    "CHEM 1006":
      "CHEM 1005",
    "CHEM 1016":
      "CHEM 1015",
    "CSCE 1101":
      "CSCE 1001 and concurrent with CSCE 1102",
    "CSCE 1102":
      "Concurrent with CSCE 1101",
    "CSCE 2202":
      "MACT 2131 (or concurrent) and CSCE 2211\nConcurrent: CSCE 2203",
    "CSCE 2203":
      "MACT 2131 or concurrent, and concurrent with CSCE 2202",
    "DSCI 1411":
      "None listed.",
    "DSCI 2410":
      "DSCI 1411 or MACT 2222",
    "MACT 3223":
      "MACT 3211",
    "MACT 4212":
      "MACT 2132 and (MACT 3211 or MACT 3224)",
    "MACT 4233":
      "(MACT 2132 or ECON 3061) and (MACT 3223 or MACT 3224 or ECON 2081)",
    "DSCI 4413":
      "(MACT 2132 or ECON 3061) and (MACT 3223 or MACT 3224 or ECON 2081)",
    "MACT 2146":
      "MACT 1122 and MACT 2132",
    "MACT 3142":
      "MACT 2141",
    "MACT 3146":
      "MACT 2146",
    "MACT 3311":
      "MACT 1122 or concurrently.\nConcurrent: MACT 1122",
    "MACT 3940":
      "Prerequisite: junior standing",
    "MACT 4133":
      "MACT 2131",
    "MACT 4135":
      "MACT 2131 and MACT 2132 .",
    "MACT 4213":
      "MACT 2132 and MACT 4212",
    "MACT 4314":
      "FINC 3201",
    "MACT 4321":
      "MACT 3211 and MACT 3311",
    "MACT 4322":
      "MACT 4212 and MACT 4321",
    "MACT 4331":
      "MACT 3211 - Applied Probability (3 cr.)",
    "MACT 4332":
      "MACT 3223 - Statistical Inference (3 cr.) and MACT 4331 - Short Term Actuarial Mathematics I (3 cr.)",
    "MACT 4910":
      "Prerequisite: senior standing and consent of supervisor.",
    "MACT 4930":
      "Prerequisite: consent of instructor.",
    "MACT 4931":
      "Senior standing and consent of supervisor.",
    "MACT 4950":
      "Consent of department chairperson or program director.",
    "MACT 4980":
      "Restricted to seniors.",
    "MACT 4990":
      "Senior standing and consent of adviser and instructor.",
    "CENG 3113":
      "CSCE 1001 and MACT 2141",
    "CSCE 3611":
      "PHYS 2211 and junior standing.",
    "CSCE 4201":
      "MACT 2131 and Senior standing.",
    "CSCE 4602":
      "(CSCE 3602 or DSCI 3415) and MACT 2132",
    "CSCE 4604":
      "CSCE 3602 or DSCI 3415",
    "CSCE 5221":
      "None listed.",
    "CSCE 5269":
      "None listed.",
    "DSCI 3415":
      "(DSCI 2410 or CSCE 1101) and (MACT 3223 or MACT 3224)",
    "DSCI 4415":
      "DSCI 3415",
    "ECNG 3201":
      "ECNG 2105 and MACT 2141",
    "ECNG 3202":
      "ECNG 3201",
    "ECNG 3401":
      "PHYS 2221 and MACT 2123",
    "ECNG 4301":
      "ECNG 3201 , MACT 3224 ,ENGR 3202 , concurrent with ECNG 4314L",
    "ECNG 4302":
      "ECNG 4301",
    "PHYS 5142":
      "MACT 2141, MACT 3143 or consent of instructor.",
    "DSCI 2411":
      "DSCI 2410 and (MACT 2222 or MACT 3223 or MACT 3224)",
    "DSCI 4416":
      "Senior standing",
    "DSCI 4417":
      "DSCI 4416",
    "DSCI 4950":
      "Consent of department chair or program director.",
    "CSCE 2501":
      "CSCE 1101 or DSCI 2410",
    "ACCT 2001":
      "None listed.",
    "ACCT 3007":
      "ACCT 2001, ACCT 2002, MACT 2222",
    "BIOL 2090":
      "BIOL 2150",
    "CSCE 2211":
      "CSCE 1101",
    "CSCE 4501":
      "CSCE 2501",
    "CSCE 4930":
      "Junior standing or higher.",
    "DSCI 3413":
      "MACT 4231",
    "DSCI 4980":
      "Restricted to seniors.",
    "FINC 2101":
      "ACCT 2001 and ((MACT 2222 or DSCI 1411) or (MACT 4231 and MACT 4233) or MACT 3224 or PSYC 2000 or SOC 3103) and (ENGR 3222 or ECON 2011 or ECON 2021)",
    "MKTG 2101":
      "None listed.",
    "MOIS 2101":
      "None listed.",
    "MOIS 3201":
      "MOIS 2101",
    "MOIS 3601":
      "MOIS 2101",
    "ARCH 3562":
      "CENG 2251",
    "CENG 1001":
      "Should be taken in one of the first two semesters in the program.",
    "CENG 1251":
      "None listed.",
    "CENG 2111":
      "MACT 1121 and PHYS 1011",
    "CENG 2211":
      "CENG 2111 or ENGR 2102",
    "CENG 2251":
      "CENG 1251 or ENGR 1005",
    "CENG 2311":
      "MACT 1121",
    "CENG 2511":
      "PHYS 1021, CENG 2111 or ENGR 2104",
    "CENG 2558":
      "CHEM 1005 and CHEM 1015",
    "CENG 3011":
      "ARCH 3562 , CENG 2511",
    "CENG 3153":
      "CENG 3111, CENG 3211",
    "CENG 3211":
      "CENG 2211",
    "CENG 3312":
      "CENG 2311",
    "CENG 4158":
      "CENG 3152 or CENG 3153",
    "CENG 4252":
      "ARCH 2551 or ARCH 3562 , CENG 3112 or CENG 3153\nConcurrent: ARCH 3331 or CENG 3211",
    "CENG 4253":
      "CENG 4252",
    "CENG 4314":
      "CENG 4313",
    "CENG 4351":
      "CENG 2111 and CENG 3211",
    "CENG 4410":
      "ENGR 3222, (CENG 3153 or CENG 3151), (ARCH 3562 or ARCH 2551)",
    "CENG 4420":
      "CENG 4410",
    "CENG 4440":
      "CENG 4410",
    "CENG 4460":
      "CENG 4420",
    "CENG 4551":
      "CENG 2558 and CENG 3511",
    "CENG 4951":
      "Prerequisite: completion of 96 credit hours.",
    "CENG 4980":
      "At least 4 of the 5 following courses CENG 3211 , CENG 4351 , CENG 4158 , CENG 4314 ,CENG 4551",
    "CENG 4981":
      "CENG 4980, CENG 4440, CENG 4420, CENG 4252\nConcurrent: CENG 4460",
    "CENG 4154":
      "CENG 4158 - Structural Systems and Advanced Design (3 cr.)",
    "CENG 4212":
      "CENG 3211",
    "CENG 4113":
      "CENG 3153",
    "CENG 4155":
      "CENG 3153",
    "CENG 4157":
      "CENG 3152 or CENG 3153",
    "CENG 4315":
      "CENG 4314 or concurrent.",
    "CENG 4911":
      "Prerequisite: senior standing.",
    "CENG 4952":
      "Department Approval",
    "CENG 4430":
      "CENG 4410 and CENG 4440",
    "CENG 4450":
      "CENG 3113 and CENG 4252",
    "CENG 4470":
      "CENG 4420 or concurrent.",
    "CENG 4352":
      "CENG 4351",
    "CENG 4552":
      "CENG 4313",
    "CENG 4553":
      "CENG 4551 concurrent.",
    "CENG 4554":
      "CENG 3511 and CENG 4410 .",
    "CENG 4555":
      "Senior standing.",
    "CENG 4556":
      "CENG 4551 - Environmental and Sanitary Engineering (3 cr.)",
    "CENG 4557":
      "CENG 4352 - Highway Facilities (3 cr.)",
    "CSCE 2301":
      "PHYS 2211 or concurrent. Must be taken concurrently with CSCE 2302.",
    "CSCE 2302":
      "Concurrent with CSCE 2301 .",
    "CSCE 2303":
      "CSCE 1101\nConcurrent: CSCE 2301 or ECNG 2101",
    "CSCE 3104":
      "CSCE 1101",
    "CSCE 3401":
      "CSCE 2211 and CSCE 3301",
    "CSCE 4101":
      "CSCE 3104 .",
    "CSCE 4950":
      "Junior standing and approval of instructor.",
    "CSCE 4980":
      "Instructor approval",
    "CSCE 4981":
      "CSCE 4980",
    "CSCE 4301":
      "CSCE 3301, CSCE 3401, CSCE 3312, and Concurrent with CSCE 4302",
    "CSCE 4302":
      "Concurrent with CSCE 4301",
    "CSCE 4303":
      "CSCE 3304 and CSCE 4301\nConcurrent: CSCE 4301",
    "CSCE 4315":
      "CSCE 2202",
    "CSCE 3423":
      "None listed.\nConcurrent: CSCE 3401",
    "CSCE 4421":
      "CSCE 3423",
    "CSCE 4423":
      "CSCE 3301",
    "CSCE 4424":
      "CSCE 2501",
    "CSCE 4702":
      "CSCE 3701 and CSCE 3401",
    "CSCE 3101":
      "CSCE 1001",
    "CSCE 3103":
      "CSCE 1101",
    "CSCE 3311":
      "CSCE 1101 and PHYS 2211",
    "CSCE 3312":
      "CSCE 1101 and (MACT 3211 or MACT 3224)\nConcurrent: CSCE 3313 for Computer Engineering students.",
    "CSCE 3313":
      "Concurrent with CSCE 3312.",
    "CSCE 4411":
      "CSCE 3401",
    "CSCE 4502":
      "CSCE 2501 or MOIS 3201*\n*for MICT students only",
    "CSCE 4910":
      "Prerequisite: consent of instructor.",
    "DSGN 3400":
      "DSGN 3300",
    "CHEM 2003":
      "CHEM 1005",
    "CHEM 2006":
      "CHEM 1006 and to be taken concurrently with CHEM 2016",
    "CHEM 2013":
      "None listed.\nConcurrent: CHEM 2003",
    "CHEM 2016":
      "CHEM 1016 and concurrent with CHEM 2006",
    "CHEM 3003":
      "CHEM 1006 and MACT 1122\nConcurrent: CHEM 3013",
    "CHEM 3005":
      "CHEM 3003 and CSCE 1001 .",
    "CHEM 3006":
      "CHEM 2003",
    "CHEM 3009":
      "CHEM 1006",
    "CHEM 3011":
      "CHEM 2006 and CHEM 2016.",
    "CHEM 3012":
      "CHEM 2006, CHEM 2016\nConcurrent: CHEM 3011",
    "CHEM 3013":
      "CHEM 1006 ,CHEM 2016 and concurrent with CHEM 3003 .",
    "CHEM 3014":
      "CHEM 3013 and concurrent with CHEM 3004 .",
    "CHEM 3015":
      "CHEM 2003",
    "CHEM 3016":
      "CHEM 2013",
    "CHEM 3018":
      "None listed.\nConcurrent: CHEM 3009",
    "CHEM 3940":
      "Junior standing",
    "CHEM 4004":
      "CHEM 3004, PHYS 2221",
    "CHEM 4006":
      "CHEM 3006",
    "CHEM 4008":
      "CHEM 3009",
    "CHEM 4013":
      "CHEM 3014 and concurrent with CHEM 4003 .",
    "CHEM 4016":
      "CHEM 3016 and CHEM 4006 .",
    "CHEM 4980":
      "Senior standing.",
    "CHEM 4981":
      "CHEM 4980 .",
    "BADM 2001":
      "None listed.",
    "ENTR 3102":
      "MGMT 3201 or BADM 2001",
    "CHEM 3522":
      "CHEM 1006 .",
    "CHEM 3523":
      "CHEM 3003",
    "CHEM 4524":
      "(CHEM 3003 and CHEM 3522) or equivalent",
    "CHEM 2020":
      "CHEM 1005 .",
    "CHEM 3020":
      "CHEM 1005 .",
    "CHEM 4007":
      "CHEM 1006 .",
    "CHEM 3002":
      "CHEM 1006 .",
    "CHEM 3910":
      "None listed.",
    "CHEM 4910":
      "Consent of instructor, senior standing.",
    "CHEM 4930":
      "Prerequisite: consent of instructor.",
    "CHEM 4005":
      "CHEM 3004, CHEM 3006, CHEM 3009, CHEM 3011, CHEM 3015",
    "CHEM 4900":
      "Senior Standing"
  };

  const subjectLabels = {
    ACCT: "Accounting",
    ALWT: "Arabic Writing",
    AMST: "American Studies",
    ANTH: "Anthropology",
    ARCH: "Architecture",
    ARIC: "Arab and Islamic Civilizations",
    ARTV: "Visual Arts",
    BADM: "Business",
    BIOL: "Biology",
    BUSC: "Business",
    CENG: "Construction Engineering",
    CHEM: "Chemistry",
    CORE: "Core Curriculum",
    CSCE: "Computer Science",
    DSCI: "Data Science",
    DSGN: "Graphic Design",
    ECLT: "English and Comparative Literature",
    ECNG: "Electronics and Communications Engineering",
    ECON: "Economics",
    EDUC: "Education",
    EGPT: "Egyptology",
    ENGR: "Engineering",
    ENTR: "Entrepreneurship",
    FILM: "Film",
    FINC: "Finance",
    HIST: "History",
    JRMC: "Journalism and Mass Communication",
    LAW: "Law",
    LING: "Linguistics",
    MACT: "Mathematics",
    MEST: "Middle East Studies",
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
    SEMR: "Core Seminar",
    SOC: "Sociology",
    THTR: "Theatre"
  };

  const courses = courseEntries.map(function (entry) {
    const subject = entry[0].split(" ")[0];
    const number = entry[0].split(" ")[1] || "";

    return {
      code: entry[0],
      title: entry[1],
      description: courseDescriptions[entry[0]] || "",
      prerequisite: coursePrerequisites[entry[0]] || "",
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

  const fallbackPopularCourseCodes = [
    "MACT 1121",
    "CSCE 1001",
    "PHYS 1011",
    "CHEM 1005",
    "ACCT 2001",
    "ECON 2011",
    "MKTG 2101",
    "BADM 2001"
  ];
  const recordedCourseViews = new Set();

  function getCourseByCode(courseCode) {
    const normalizedCode = normalizeCourseCode(courseCode);

    return courses.find(function (course) {
      return normalizeCourseCode(course.code) === normalizedCode;
    });
  }

  function getPopularCoursesForDisplay(courseCodes) {
    const seenCodes = new Set();

    return courseCodes
      .map(getCourseByCode)
      .filter(function (course) {
        if (!course) {
          return false;
        }

        const normalizedCode = normalizeCourseCode(course.code);

        if (seenCodes.has(normalizedCode)) {
          return false;
        }

        seenCodes.add(normalizedCode);
        return true;
      })
      .slice(0, 8);
  }

  function renderPopularCourseCards(root, popularCourses) {
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

  async function renderPopularCourses() {
    const root = document.getElementById("course-popular-grid");

    if (!root) {
      return;
    }

    renderPopularCourseCards(
      root,
      getPopularCoursesForDisplay(fallbackPopularCourseCodes)
    );

    try {
      const response = await fetch(
        "/api/course-popularity",
        {
          method: "GET",
          credentials: "same-origin"
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not load popular courses."
        );
      }

      const rankedCourseCodes =
        Array.isArray(data.popularCourses)
          ? data.popularCourses
              .map(function (item) {
                return normalizeCourseCode(
                  item && item.courseCode
                );
              })
              .filter(Boolean)
          : [];

      renderPopularCourseCards(
        root,
        getPopularCoursesForDisplay(
          rankedCourseCodes.concat(
            fallbackPopularCourseCodes
          )
        )
      );
    } catch (error) {
      // Keep the fallback courses visible if popularity data is unavailable.
    }
  }

  async function recordCourseView(courseCode) {
    const normalizedCode = normalizeCourseCode(courseCode);

    if (
      !normalizedCode ||
      recordedCourseViews.has(normalizedCode)
    ) {
      return;
    }

    const storageKey =
      "aucAtlasCourseView:" + normalizedCode;

    try {
      if (window.sessionStorage.getItem(storageKey) === "1") {
        recordedCourseViews.add(normalizedCode);
        return;
      }
    } catch (error) {
      // In-memory tracking still prevents duplicate counts on this page.
    }

    recordedCourseViews.add(normalizedCode);

    try {
      const response = await fetch(
        "/api/course-popularity",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            courseCode: normalizedCode
          })
        }
      );

      if (!response.ok) {
        throw new Error("Could not record the course view.");
      }

      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch (error) {
        // The view was recorded even if browser storage is unavailable.
      }
    } catch (error) {
      recordedCourseViews.delete(normalizedCode);
    }
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
          <strong>No course materials yet.</strong>
          <p>New uploads will appear here as soon as students share them.</p>
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
      const fileName = String(
        material.fileName ||
        material.title ||
        "Course material"
      ).trim();
      const fileExtension =
        getMaterialFileExtension(
          fileName,
          material.fileType
        );
      const fileIconMap = {
        pdf: "pdf.png",
        doc: "doc.png",
        docx: "doc.png",
        xls: "xls.png",
        xlsx: "xls.png",
        ppt: "ppt.png",
        pptx: "ppt.png",
        png: "png.png",
        jpg: "jpg.png",
        jpeg: "jpg.png"
      };
      const fileIconUrl =
        fileIconMap[fileExtension] || "";
      const extensionLabel =
        fileExtension === "file"
          ? "FILE"
          : fileExtension
              .slice(0, 5)
              .toUpperCase();
      const fileIconMarkup = fileIconUrl
        ? `
          <img
            class="course-recent-file-icon-image"
            src="${escapeMaterialText(fileIconUrl)}"
            alt=""
            aria-hidden="true"
          >
        `
        : `
          <span
            class="course-recent-file-icon-fallback"
            aria-hidden="true"
          >
            <strong>${escapeMaterialText(extensionLabel)}</strong>
          </span>
        `;
      const uploaderName = String(
        material.uploaderDisplayName ||
        "AUC student"
      ).trim();
      const uploaderInitial =
        uploaderName.charAt(0).toUpperCase() || "A";
      const uploaderPhotoURL =
        material.isAnonymous
          ? ""
          : String(
              material.uploaderPhotoURL || ""
            ).trim();
      const uploaderPhotoSrc =
        uploaderPhotoURL.includes(
          "res.cloudinary.com"
        ) &&
        uploaderPhotoURL.includes(
          "/image/upload/"
        )
          ? uploaderPhotoURL.replace(
              "/image/upload/",
              "/image/upload/f_auto,q_auto:eco,c_fill,g_face,w_72,h_72/"
            )
          : uploaderPhotoURL;
      const uploaderPhotoMarkup =
        uploaderPhotoSrc
          ? `
              <img
                src="${escapeMaterialText(uploaderPhotoSrc)}"
                alt=""
                loading="lazy"
                decoding="async"
              >
            `
          : "";

      return `
        <a class="course-recent-card" href="${href}">
          <div class="course-recent-icon-shell">
            ${fileIconMarkup}
          </div>

          <div class="course-recent-card-copy">
            <span class="course-recent-type">
              ${escapeMaterialText(material.materialType || "Course material")}
            </span>

            <h3>${escapeMaterialText(material.title || "Course material")}</h3>
            <p>${escapeMaterialText(courseLabel || "AUC course material")}</p>
          </div>

          <div class="course-recent-meta">
            <span>${escapeMaterialText(material.professor || "Professor not listed")}</span>
            <span>${escapeMaterialText(material.semester || "Semester not listed")}</span>
          </div>

          <div class="course-recent-footer">
            <span class="course-recent-uploader">
              <span class="course-recent-uploader-avatar" aria-hidden="true">
                ${escapeMaterialText(uploaderInitial)}
                ${uploaderPhotoMarkup}
              </span>
              <span class="course-recent-uploader-name">
                Uploaded by ${escapeMaterialText(uploaderName)}
              </span>
            </span>

            <small>${escapeMaterialText(formatMaterialUploadDate(material.createdAt))}</small>
          </div>
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
        "/api/course-materials?random=true&limit=6",
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
            <strong>Sign in to view course materials.</strong>
            <p>Course files are available to students with a verified AUC email.</p>
            <a href="login.html">Log in</a>
          </div>
        `;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not load course materials.");
      }

      renderRecentMaterials(data.materials);
    } catch (error) {
      root.innerHTML = `
        <div class="course-recent-status">
          <strong>Course materials are unavailable right now.</strong>
          <p>Please try again later.</p>
        </div>
      `;
    }
  }

  function setupCourseUploadStart() {
    const button = document.getElementById(
      "course-upload-start"
    );
    const modal = document.getElementById(
      "quick-material-upload-modal"
    );
    const form = document.getElementById(
      "quick-material-upload-form"
    );
    const closeButton = document.getElementById(
      "quick-material-upload-close"
    );

    if (
      !button ||
      !modal ||
      !form ||
      modal.dataset.ready === "true"
    ) {
      return;
    }

    modal.dataset.ready = "true";

    populateQuickMaterialCourseSelect(form);
    populateMaterialProfessorSelect(form);
    setupMaterialChoiceMenus(form);
    setupMaterialFilePicker(form);

    setupMaterialUploadForm(null, {
      form: form,
      buttonLabel: "Upload material",
      getCourse: function () {
        const courseInput = getMaterialFormControl(
          form,
          "course",
          "quick-material-course"
        );

        return courseInput
          ? getCourseByCode(courseInput.value)
          : null;
      },
      onSuccess: function () {
        return loadRecentMaterials();
      }
    });

    let lastTrigger = null;

    function openQuickMaterialUpload() {
      lastTrigger =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : button;

      modal.hidden = false;
      document.body.classList.add(
        "quick-material-upload-open"
      );
      button.setAttribute("aria-expanded", "true");

      setMaterialUploadStatus("", "", form);
      setMaterialUploadProgress(
        0,
        "Uploading files",
        false,
        form
      );

      const courseInput = getMaterialFormControl(
        form,
        "course",
        "quick-material-course"
      );
      const courseChoice = courseInput
        ? courseInput.nextElementSibling
        : null;
      const courseChoiceButton =
        courseChoice &&
        courseChoice.classList.contains(
          "material-choice"
        )
          ? courseChoice.querySelector(
              ".material-choice-button"
            )
          : null;

      window.setTimeout(function () {
        if (courseChoiceButton) {
          courseChoiceButton.focus();
        } else if (closeButton) {
          closeButton.focus();
        }
      }, 0);
    }

    function closeQuickMaterialUpload() {
      modal.hidden = true;
      document.body.classList.remove(
        "quick-material-upload-open"
      );
      button.setAttribute("aria-expanded", "false");
      closeMaterialChoiceMenus();

      if (lastTrigger) {
        lastTrigger.focus();
      }
    }

    button.addEventListener(
      "click",
      openQuickMaterialUpload
    );

    modal
      .querySelectorAll(
        "[data-close-quick-material-upload]"
      )
      .forEach(function (closeTrigger) {
        closeTrigger.addEventListener(
          "click",
          closeQuickMaterialUpload
        );
      });

    document.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key === "Escape" &&
          !modal.hidden
        ) {
          closeQuickMaterialUpload();
        }
      }
    );
  }

  function courseMatches(course) {
    const query = getCourseSearchQuery();
    const selectedSubjects = getCheckedSubjects();
    const searchableText = normalize([course.code, course.title, course.subject, course.department, course.level].join(" "));

    return (!query || searchableText.includes(query)) && (!selectedSubjects.length || selectedSubjects.includes(course.subject));
  }

  function setCoursesSearchState(hasActiveSearch) {
    const dropdown = document.getElementById(
      "course-search-dropdown"
    );
    const searchInput = document.getElementById(
      "course-search-input"
    );
    const results = document.querySelector(
      ".courses-results"
    );

    if (dropdown) {
      dropdown.hidden = !hasActiveSearch;
    }

    if (results) {
      results.classList.toggle(
        "is-search-active",
        hasActiveSearch
      );
    }

    if (searchInput) {
      searchInput.setAttribute(
        "aria-expanded",
        hasActiveSearch ? "true" : "false"
      );
    }
  }

  function renderCourses() {
    const grid = document.getElementById("courses-grid");
    const count = document.getElementById(
      "courses-result-count"
    );
    const query = getCourseSearchQuery();
    const selectedSubjects = getCheckedSubjects();
    const hasActiveSearch = Boolean(
      query || selectedSubjects.length
    );

    if (!grid) {
      return;
    }

    setCoursesSearchState(hasActiveSearch);

    if (!hasActiveSearch) {
      grid.innerHTML = "";
      return;
    }

    const visibleCourses = courses.filter(courseMatches);

    if (count) {
      count.textContent =
        visibleCourses.length + " matches";
    }

    grid.innerHTML = visibleCourses.map(function (course) {
      return `
        <a
          class="course-card"
          href="courses.html?course=${encodeURIComponent(course.code)}"
          aria-label="Open ${escapeMaterialText(course.code)} course page"
        >
          <span class="course-code">
            ${escapeMaterialText(course.code)}
          </span>

          <span class="course-search-copy">
            <strong>
              ${escapeMaterialText(course.title)}
            </strong>
            <small>
              ${escapeMaterialText(course.department)}
              ·
              ${escapeMaterialText(course.level)}
            </small>
          </span>

          <span class="course-search-arrow" aria-hidden="true">
            →
          </span>
        </a>
      `;
    }).join("");

    if (!visibleCourses.length) {
      grid.innerHTML = `
        <p class="courses-empty">
          No courses found. Try a course code, title, department, or broader keyword.
        </p>
      `;
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
      const searchPlaceholder = String(
        select.dataset.materialSearchPlaceholder || ""
      ).trim();
      const isSearchableSelect =
        Boolean(searchPlaceholder) ||
        select.id === "material-professor" ||
        select.dataset.materialRole === "professor";
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

      if (isSearchableSelect) {
        const searchWrap = document.createElement("div");
        const resolvedSearchPlaceholder =
          searchPlaceholder || "Search professors";

        searchInput = document.createElement("input");
        searchInput.type = "search";
        searchInput.className = "material-choice-search";
        searchInput.placeholder =
          resolvedSearchPlaceholder;
        searchInput.setAttribute(
          "aria-label",
          resolvedSearchPlaceholder
        );
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
    const selection = form.querySelector(
      '[data-material-role="file-selection"], #material-file-selection'
    );
    const fileInput = form.querySelector(
      '[data-material-role="file"], #material-file'
    );
    const fileField = fileInput
      ? fileInput.closest(".material-file-field")
      : null;
    const selectedFiles = Array.from(files || []);

    if (fileInput) {
      fileInput.materialSelectedFiles = selectedFiles;
    }

    if (fileField) {
      fileField.classList.toggle(
        "has-files",
        Boolean(selectedFiles.length)
      );
    }

    if (!selection) {
      return;
    }

    selection.hidden = !selectedFiles.length;
    selection.classList.remove("is-uploading");
    selection.removeAttribute("aria-busy");

    if (!selectedFiles.length) {
      selection.innerHTML = "";
      return;
    }

    selection.innerHTML = `
      <div class="material-file-selection-head">
        <button
          class="material-file-add-button"
          type="button"
          data-add-material-file
        >
          <span class="material-file-add-icon" aria-hidden="true">+</span>
          <span>Add more files</span>
        </button>
      </div>

      <div class="material-file-list">
        ${selectedFiles.map(function (file) {
          return `
            <div class="material-file-item">
              <strong>${escapeMaterialText(file.name)}</strong>

              <span class="material-file-item-status">
                <span class="material-file-size">
                  ${formatMaterialFileSize(file.size)}
                </span>

                <span
                  class="material-file-upload-spinner"
                  aria-hidden="true"
                ></span>
              </span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function setMaterialFileUploadState(
    form,
    isUploading
  ) {
    const selection = form.querySelector(
      '[data-material-role="file-selection"], #material-file-selection'
    );

    if (!selection) {
      return;
    }

    selection.classList.toggle(
      "is-uploading",
      isUploading
    );

    selection.setAttribute(
      "aria-busy",
      isUploading ? "true" : "false"
    );

    const addButton = selection.querySelector(
      "[data-add-material-file]"
    );

    if (addButton) {
      addButton.disabled = isUploading;
    }
  }

  function setupMaterialFilePicker(form) {
    const fileInput = form.querySelector(
      '[data-material-role="file"], #material-file'
    );
    const selection = form.querySelector(
      '[data-material-role="file-selection"], #material-file-selection'
    );

    if (
      !fileInput ||
      fileInput.dataset.fileReady === "true"
    ) {
      return;
    }

    fileInput.dataset.fileReady = "true";
    fileInput.materialSelectedFiles = [];

    function applySelectedFiles(files) {
      const transfer = new DataTransfer();

      files.forEach(function (file) {
        transfer.items.add(file);
      });

      fileInput.files = transfer.files;

      setMaterialFileSelection(
        form,
        fileInput.files
      );
    }

    fileInput.addEventListener("change", function () {
      const existingFiles = Array.isArray(
        fileInput.materialSelectedFiles
      )
        ? fileInput.materialSelectedFiles
        : [];
      const newlySelectedFiles = Array.from(
        fileInput.files || []
      );
      const seenFiles = new Set();

      const mergedFiles = existingFiles
        .concat(newlySelectedFiles)
        .filter(function (file) {
          const fileKey = [
            file.name,
            file.size,
            file.lastModified
          ].join("::");

          if (seenFiles.has(fileKey)) {
            return false;
          }

          seenFiles.add(fileKey);
          return true;
        });

      applySelectedFiles(mergedFiles);
    });

    if (selection) {
      selection.addEventListener(
        "click",
        function (event) {
          const addButton = event.target.closest(
            "[data-add-material-file]"
          );

          if (
            !addButton ||
            addButton.disabled
          ) {
            return;
          }

          event.preventDefault();

          fileInput.value = "";
          fileInput.click();
        }
      );
    }
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

  function submitContentReport(
    button,
    targetType,
    targetId,
    targetLabel
  ) {
    const modal = document.getElementById(
      "course-report-modal"
    );
    const form = document.getElementById(
      "course-report-form"
    );
    const title = document.getElementById(
      "course-report-title"
    );
    const copy = document.getElementById(
      "course-report-copy"
    );
    const reasonInput = document.getElementById(
      "course-report-reason"
    );
    const status = document.getElementById(
      "course-report-status"
    );
    const submitButton = document.getElementById(
      "course-report-submit"
    );

    if (
      !modal ||
      !form ||
      !title ||
      !copy ||
      !reasonInput ||
      !status ||
      !submitButton
    ) {
      return;
    }

    function closeReportPanel() {
      modal.hidden = true;
      document.body.classList.remove(
        "content-report-open"
      );
      form.reset();
      status.textContent = "";
      status.className = "course-report-status";
      submitButton.disabled = false;
      submitButton.textContent = "Submit report";

      if (
        modal.reportSourceButton &&
        !modal.reportSourceButton.disabled
      ) {
        modal.reportSourceButton.focus();
      }
    }

    if (modal.dataset.ready !== "true") {
      modal.dataset.ready = "true";

      modal
        .querySelectorAll(
          "[data-close-course-report]"
        )
        .forEach(function (closeButton) {
          closeButton.addEventListener(
            "click",
            closeReportPanel
          );
        });

      document.addEventListener(
        "keydown",
        function (event) {
          if (
            event.key === "Escape" &&
            !modal.hidden
          ) {
            closeReportPanel();
          }
        }
      );

      form.addEventListener(
        "submit",
        async function (event) {
          event.preventDefault();

          const activeButton =
            modal.reportSourceButton;
          const activeTargetType =
            modal.dataset.targetType || "";
          const activeTargetId =
            modal.dataset.targetId || "";
          const cleanedReason =
            reasonInput.value.trim();

          if (cleanedReason.length < 3) {
            status.textContent =
              "Briefly explain why you are reporting this content.";
            status.className =
              "course-report-status error";
            reasonInput.focus();
            return;
          }

          status.textContent = "";
          status.className =
            "course-report-status";
          submitButton.disabled = true;
          submitButton.textContent =
            "Submitting...";

          if (activeButton) {
            activeButton.disabled = true;
            activeButton.textContent =
              "Reporting...";
          }

          try {
            const response = await fetch(
              "/api/content-reports",
              {
                method: "POST",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                  Accept: "application/json",
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                  targetType:
                    activeTargetType,
                  targetId:
                    activeTargetId,
                  reason: cleanedReason
                })
              }
            );

            const data = await response
              .json()
              .catch(function () {
                return {};
              });

            if (
              response.status !== 409 &&
              !response.ok
            ) {
              throw new Error(
                data.error ||
                  "Could not submit the report."
              );
            }

            if (activeButton) {
              activeButton.textContent =
                "Reported";
              activeButton.disabled = true;
            }

            modal.hidden = true;
            document.body.classList.remove(
              "content-report-open"
            );
            form.reset();
          } catch (error) {
            status.textContent =
              error.message ||
              "Could not submit the report.";
            status.className =
              "course-report-status error";
            submitButton.disabled = false;
            submitButton.textContent =
              "Submit report";

            if (activeButton) {
              activeButton.disabled = false;
              activeButton.textContent =
                modal.reportSourceOriginalText ||
                "Report";
            }
          }
        }
      );
    }

    modal.reportSourceButton = button;
    modal.reportSourceOriginalText =
      button.textContent;
    modal.dataset.targetType = targetType;
    modal.dataset.targetId = targetId;

    title.textContent = "Report material";
    copy.textContent =
      "Tell us what is wrong with " +
      (targetLabel || "this course material") +
      ". Our moderators will review your report.";

    form.reset();
    status.textContent = "";
    status.className = "course-report-status";
    submitButton.disabled = false;
    submitButton.textContent = "Submit report";

    modal.hidden = false;
    document.body.classList.add(
      "content-report-open"
    );

    window.setTimeout(function () {
      reasonInput.focus();
    }, 0);
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

    function openPreview(button) {
      const downloadUrl = button.dataset.downloadUrl || "";

      if (!downloadUrl) {
        return;
      }

      const previewUrl = appendMaterialQueryParameter(
        downloadUrl,
        "disposition",
        "inline"
      );

      const previewWindow = window.open(
        previewUrl,
        "_blank",
        "noopener"
      );

      if (previewWindow) {
        previewWindow.opener = null;
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
      const reportButton =
        event.target.closest(
          "[data-report-material]"
        );

      if (
        reportButton &&
        list.contains(reportButton)
      ) {
        submitContentReport(
          reportButton,
          "material",
          reportButton.dataset
            .reportMaterial,
          reportButton.dataset
            .reportLabel
        );

        return;
      }

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
    const list = document.getElementById(
      "course-materials-list"
    );
    const filterChoice = document.getElementById(
      "course-material-filter"
    );
    const filterButton = filterChoice
      ? filterChoice.querySelector(
          "[data-material-filter-button]"
        )
      : null;
    const filterOptions = filterChoice
      ? Array.from(
          filterChoice.querySelectorAll(
            "[data-material-filter-option]"
          )
        )
      : [];
    const pageSize = 6;
    let visibleCount = pageSize;
    let activeFilter =
      filterButton &&
      filterButton.dataset.materialFilterValue
        ? filterButton.dataset.materialFilterValue
        : "all";
    let sortDirection = "newest";

    if (!list) {
      return;
    }

    function setupMaterialFilterChoice(onFilterChange) {
      if (
        !filterChoice ||
        !filterButton ||
        !filterOptions.length
      ) {
        return;
      }

      function closeFilterMenu() {
        filterChoice.classList.remove("open");
        filterButton.setAttribute(
          "aria-expanded",
          "false"
        );
      }

      filterButton.onclick = function () {
        const shouldOpen =
          !filterChoice.classList.contains(
            "open"
          );

        closeMaterialChoiceMenus(filterChoice);
        filterChoice.classList.toggle(
          "open",
          shouldOpen
        );

        filterButton.setAttribute(
          "aria-expanded",
          shouldOpen ? "true" : "false"
        );
      };

      filterOptions.forEach(
        function (option) {
          option.onclick = function () {
            const nextFilter =
              option.dataset
                .materialFilterOption ||
              "all";

            activeFilter = nextFilter;
            filterButton.dataset.materialFilterValue =
              activeFilter;
            filterButton.textContent =
              option.textContent.trim();
            visibleCount = pageSize;

            filterOptions.forEach(
              function (filterOption) {
                filterOption.setAttribute(
                  "aria-selected",
                  filterOption === option
                    ? "true"
                    : "false"
                );
              }
            );

            closeFilterMenu();

            if (typeof onFilterChange === "function") {
              onFilterChange();
            }
          };
        }
      );

      filterChoice.onfocusout = function () {
        window.setTimeout(function () {
          if (
            !filterChoice.contains(
              document.activeElement
            )
          ) {
            closeFilterMenu();
          }
        }, 0);
      };

      filterChoice.onkeydown = function (event) {
        if (event.key === "Escape") {
          closeFilterMenu();
          filterButton.focus();
        }
      };
    }

    setupMaterialFilterChoice(null);

    if (!materials.length) {
      list.innerHTML =
        '<p class="course-material-status">No course files shared yet.</p>';
      return;
    }

    const materialGroups = [];
    const groupsByKey = new Map();

    materials.forEach(function (material, index) {
      const groupId = String(
        material.uploadGroupId ||
        material.id ||
        "legacy-" + index
      ).trim();
      const uploaderKey = String(
        material.uploaderUid ||
        material.uploaderDisplayName ||
        ""
      ).trim();
      const groupKey =
        groupId + "::" + uploaderKey;

      let group = groupsByKey.get(groupKey);

      if (!group) {
        group = {
          material,
          files: []
        };

        groupsByKey.set(groupKey, group);
        materialGroups.push(group);
      }

      group.files.push(material);
    });

    function getMaterialTimestamp(value) {
      const timestamp = new Date(
        value || ""
      ).getTime();

      return Number.isNaN(timestamp)
        ? 0
        : timestamp;
    }

    materialGroups.forEach(function (group) {
      group.latestTime = group.files.reduce(
        function (latestTime, fileMaterial) {
          return Math.max(
            latestTime,
            getMaterialTimestamp(
              fileMaterial.createdAt
            )
          );
        },
        0
      );
    });

    function groupMatchesFilter(group) {
      if (activeFilter === "all") {
        return true;
      }

      function normalizeMaterialFilter(value) {
        return String(value || "")
          .trim()
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      const normalizedActiveFilter =
        normalizeMaterialFilter(activeFilter);
      const acceptedFilters =
        normalizedActiveFilter === "past-assignment" ||
        normalizedActiveFilter === "past-assignments"
          ? [
              "past-assignment",
              "past-assignments"
            ]
          : [normalizedActiveFilter];

      return group.files.some(function (fileMaterial) {
        const materialType =
          fileMaterial.materialType ||
          group.material.materialType ||
          "";

        return acceptedFilters.includes(
          normalizeMaterialFilter(materialType)
        );
      });
    }

    function getFileView(
      fileMaterial,
      material,
      files
    ) {
      const rawFileName =
        fileMaterial.fileName ||
        fileMaterial.title ||
        "Course material";
      const extension =
        getMaterialFileExtension(
          rawFileName,
          fileMaterial.fileType
        );
      const fileLabel =
        getMaterialFileLabel(extension);
      const fileSize =
        Number(fileMaterial.size) > 0
          ? formatMaterialFileSize(
              fileMaterial.size
            )
          : "Size unavailable";
      const rawDownloadUrl =
        fileMaterial.downloadUrl || "";
      const previewable =
        Boolean(rawDownloadUrl) &&
        isMaterialPreviewable(extension);
      const fileName =
        escapeMaterialText(rawFileName);
      const safeFileLabel =
        escapeMaterialText(fileLabel);
      const safeFileSize =
        escapeMaterialText(fileSize);
      const safeDownloadUrl =
        escapeMaterialText(
          rawDownloadUrl || "#"
        );
      const safeExtension =
        escapeMaterialText(extension);
      const safeMaterialId =
        escapeMaterialText(
          fileMaterial.id || ""
        );
      const safeMaterialLabel =
        escapeMaterialText(
          (material.title ||
            "Course material") +
          (
            files.length > 1
              ? " — " + rawFileName
              : ""
          )
        );
      const extensionLabel =
        escapeMaterialText(
          extension === "file"
            ? "FILE"
            : extension.toUpperCase()
        );

      const fileIcon =
        extension === "pdf"
          ? `
            <img
              class="course-material-file-icon-image"
              src="pdf.png"
              alt=""
              aria-hidden="true"
            >
          `
          : ["doc", "docx"].includes(
              extension
            )
            ? `
              <img
                class="course-material-file-icon-image"
                src="doc.png"
                alt=""
                aria-hidden="true"
              >
            `
            : `
              <span
                class="course-material-file-icon"
                aria-hidden="true"
              >
                <strong>${extensionLabel}</strong>
              </span>
            `;

      const previewDataAttributes = [
        'data-download-url="' +
          safeDownloadUrl +
          '"',
        'data-file-name="' +
          fileName +
          '"',
        'data-file-extension="' +
          safeExtension +
          '"',
        'data-file-label="' +
          safeFileLabel +
          '"',
        'data-file-size="' +
          safeFileSize +
          '"'
      ].join(" ");

      return {
        fileName,
        safeFileLabel,
        safeFileSize,
        safeDownloadUrl,
        safeMaterialId,
        safeMaterialLabel,
        fileIcon,
        previewable,
        previewDataAttributes,
        hasDownload:
          Boolean(rawDownloadUrl)
      };
    }

    function buildActions(fileView) {
      const downloadMarkup =
        fileView.hasDownload
          ? `
            <a
              class="course-material-compact-download"
              href="${fileView.safeDownloadUrl}"
              target="_blank"
              rel="noopener"
              aria-label="Download ${fileView.fileName}"
              title="Download"
            ></a>
          `
          : "";

      const menuMarkup =
        fileView.safeMaterialId
          ? `
            <details
              class="course-material-action-menu"
            >
              <summary
                aria-label="More actions for ${fileView.fileName}"
                title="More actions"
              >⋮</summary>

              <div
                class="course-material-action-menu-panel"
              >
                <button
                  class="course-material-report-button"
                  type="button"
                  data-report-material="${fileView.safeMaterialId}"
                  data-report-label="${fileView.safeMaterialLabel}"
                >Report</button>
              </div>
            </details>
          `
          : "";

      return downloadMarkup + menuMarkup;
    }

    function buildPreviewMain(
      fileView,
      primaryTitle,
      secondaryText,
      metadataText,
      materialType
    ) {
      const typeMarkup = materialType
        ? `
          <em>${materialType}</em>
        `
        : "";

      const secondaryMarkup =
        secondaryText
          ? `
            <span
              class="course-material-row-file-name"
            >${secondaryText}</span>
          `
          : "";

      const previewMarkup =
        fileView.previewable
          ? `
            <span
              class="course-material-preview-label"
            >Preview</span>
          `
          : "";

      const content = `
        ${fileView.fileIcon}

        <span class="course-material-row-copy">
          <span
            class="course-material-row-title-line"
          >
            <strong>${primaryTitle}</strong>
            ${typeMarkup}
          </span>

          ${secondaryMarkup}

          <small>${metadataText}</small>
        </span>

        ${previewMarkup}
      `;

      if (fileView.previewable) {
        return `
          <button
            class="course-material-row-main course-material-preview-trigger"
            type="button"
            ${fileView.previewDataAttributes}
            aria-label="Preview ${fileView.fileName}"
          >
            ${content}
          </button>
        `;
      }

      return `
        <div
          class="course-material-row-main is-disabled"
        >
          ${content}
        </div>
      `;
    }

    function buildGroupMetadata(material) {
      const uploadDate =
        formatMaterialUploadDate(
          material.createdAt
        ).replace(
          /^Uploaded\s+/,
          ""
        );

      return [
        material.professor ||
          "Professor not listed",
        material.semester ||
          "Semester not listed",
        material.uploaderDisplayName ||
          "AUC student",
        uploadDate
      ]
        .map(function (value) {
          return escapeMaterialText(value);
        })
        .join(" · ");
    }

    function buildSingleRow(group) {
      const material = group.material;
      const files = group.files;
      const fileView = getFileView(
        files[0],
        material,
        files
      );
      const title =
        escapeMaterialText(
          material.title ||
          "Course material"
        );
      const materialType =
        escapeMaterialText(
          material.materialType ||
          "Material"
        );
      const metadata =
        buildGroupMetadata(material) +
        " · " +
        fileView.safeFileSize;

      return `
        <article class="course-material-row">
          ${buildPreviewMain(
            fileView,
            title,
            "",
            metadata,
            materialType
          )}

          ${buildActions(fileView)}
        </article>
      `;
    }

    function buildChildRow(
      fileMaterial,
      material,
      files
    ) {
      const fileView = getFileView(
        fileMaterial,
        material,
        files
      );

      return `
        <div class="course-material-child-row">
          ${buildPreviewMain(
            fileView,
            fileView.fileName,
            "",
            fileView.safeFileLabel +
              " · " +
              fileView.safeFileSize,
            ""
          )}

          ${buildActions(fileView)}
        </div>
      `;
    }

    function buildMultiFileGroup(group) {
      const material = group.material;
      const files = group.files;
      const firstFileView = getFileView(
        files[0],
        material,
        files
      );
      const title =
        escapeMaterialText(
          material.title ||
          "Course material"
        );
      const materialType =
        escapeMaterialText(
          material.materialType ||
          "Material"
        );
      const hasCompleteFileSizes =
        files.every(function (fileMaterial) {
          return Number(fileMaterial.size) > 0;
        });
      const totalFileSize =
        files.reduce(
          function (total, fileMaterial) {
            return (
              total +
              Math.max(
                0,
                Number(fileMaterial.size) || 0
              )
            );
          },
          0
        );
      const groupFileSize =
        hasCompleteFileSizes
          ? formatMaterialFileSize(totalFileSize)
          : "Size unavailable";
      const metadata =
        buildGroupMetadata(material) +
        " · " +
        escapeMaterialText(groupFileSize);

      const fileRows = files
        .map(function (fileMaterial) {
          return buildChildRow(
            fileMaterial,
            material,
            files
          );
        })
        .join("");

      return `
        <details class="course-material-group">
          <summary
            class="course-material-group-summary"
          >
            ${firstFileView.fileIcon}

            <span class="course-material-group-copy">
              <span
                class="course-material-row-title-line"
              >
                <strong>${title}</strong>
                <em>${materialType}</em>
              </span>

              <small>${metadata}</small>
            </span>

            <span class="course-material-file-count">
              ${files.length} files
            </span>

            <span
              class="course-material-group-chevron"
              aria-hidden="true"
            ></span>
          </summary>

          <div class="course-material-group-files">
            ${fileRows}
          </div>
        </details>
      `;
    }

    function setupMaterialGroupAnimations() {
      if (
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        return;
      }

      list.querySelectorAll(
        ".course-material-group"
      ).forEach(function (group) {
        if (
          group.dataset.animationReady ===
          "true"
        ) {
          return;
        }

        const summary = group.querySelector(
          ".course-material-group-summary"
        );

        if (!summary) {
          return;
        }

        group.dataset.animationReady = "true";

        summary.addEventListener(
          "click",
          function (event) {
            event.preventDefault();

            if (
              group.dataset.animating ===
              "true"
            ) {
              return;
            }

            const wasOpen = group.open;
            const startHeight =
              group.getBoundingClientRect()
                .height;

            group.dataset.animating = "true";
            group.classList.add(
              "is-animating"
            );

            if (!wasOpen) {
              group.open = true;

              const endHeight =
                group.getBoundingClientRect()
                  .height;

              const animation =
                group.animate(
                  [
                    {
                      height:
                        startHeight + "px"
                    },
                    {
                      height:
                        endHeight + "px"
                    }
                  ],
                  {
                    duration: 280,
                    easing:
                      "cubic-bezier(0.22, 1, 0.36, 1)"
                  }
                );

              animation.onfinish =
                function () {
                  group.dataset.animating =
                    "false";
                  group.classList.remove(
                    "is-animating"
                  );
                };

              return;
            }

            const endHeight =
              summary.getBoundingClientRect()
                .height + 2;

            const animation =
              group.animate(
                [
                  {
                    height:
                      startHeight + "px",
                    opacity: 1
                  },
                  {
                    height:
                      endHeight + "px",
                    opacity: 0.98
                  }
                ],
                {
                  duration: 240,
                  easing:
                    "cubic-bezier(0.4, 0, 0.2, 1)"
                }
              );

            animation.onfinish =
              function () {
                group.open = false;
                group.dataset.animating =
                  "false";
                group.classList.remove(
                  "is-animating"
                );
              };
          }
        );
      });
    }

    function renderMaterialView() {
      const filteredGroups =
        materialGroups
          .filter(groupMatchesFilter)
          .slice()
          .sort(function (
            firstGroup,
            secondGroup
          ) {
            if (sortDirection === "oldest") {
              return (
                firstGroup.latestTime -
                secondGroup.latestTime
              );
            }

            return (
              secondGroup.latestTime -
              firstGroup.latestTime
            );
          });

      if (!filteredGroups.length) {
        list.innerHTML =
          '<p class="course-material-status">No materials match this filter yet.</p>';
        return;
      }

      const visibleGroups =
        filteredGroups.slice(
          0,
          visibleCount
        );

      const rows = visibleGroups
        .map(function (group) {
          return group.files.length > 1
            ? buildMultiFileGroup(group)
            : buildSingleRow(group);
        })
        .join("");

      const remainingCount =
        filteredGroups.length -
        visibleGroups.length;

      const showMoreMarkup =
        remainingCount > 0
          ? `
            <button
              class="course-material-show-more"
              type="button"
              data-material-show-more
            >
              Show more
            </button>
          `
          : "";

      list.innerHTML =
        rows + showMoreMarkup;

      setupMaterialGroupAnimations();
    }

    let materialViewAnimationTimer = 0;

    function animateMaterialViewUpdate() {
      if (
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        renderMaterialView();
        return;
      }

      window.clearTimeout(
        materialViewAnimationTimer
      );

      list.classList.add("is-changing");

      materialViewAnimationTimer =
        window.setTimeout(
          function () {
            renderMaterialView();

            window.requestAnimationFrame(
              function () {
                window.requestAnimationFrame(
                  function () {
                    list.classList.remove(
                      "is-changing"
                    );
                  }
                );
              }
            );
          },
          140
        );
    }

    setupMaterialFilterChoice(animateMaterialViewUpdate);

    list.onclick = function (event) {
      const showMoreButton =
        event.target.closest(
          "[data-material-show-more]"
        );

      if (
        !showMoreButton ||
        !list.contains(showMoreButton)
      ) {
        return;
      }

      visibleCount += pageSize;
      animateMaterialViewUpdate();
    };

    renderMaterialView();
  }

  function setCourseMaterialsLocked(access, isLocked) {
    if (!access) {
      return;
    }

    access.classList.toggle("is-locked", isLocked);

    access.querySelectorAll(
      ".course-material-summary > :not(.course-material-access-lock), " +
      ".material-upload-panel > :not(.course-material-access-lock)"
    ).forEach(function (element) {
      element.inert = isLocked;

      if (isLocked) {
        element.setAttribute("aria-hidden", "true");
      } else {
        element.removeAttribute("aria-hidden");
      }
    });

    access.querySelectorAll(
      ".course-material-access-lock"
    ).forEach(function (lock) {
      lock.setAttribute(
        "aria-hidden",
        isLocked ? "false" : "true"
      );
    });
  }

  async function loadCourseMaterials(course) {
    const access = document.getElementById("course-materials-access");
    const list = document.getElementById("course-materials-list");
    const loading = document.getElementById("course-materials-loading");

    if (access) {
      access.hidden = false;
      setCourseMaterialsLocked(access, true);
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
      const response = await fetch(
        "/api/course-materials?courseCode=" +
          encodeURIComponent(course.code),
        {
          credentials: "same-origin",
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("Course-material access was denied.");
      }

      const data = await response.json();

      renderCourseMaterials(
        Array.isArray(data.materials)
          ? data.materials
          : []
      );

      if (loading) {
        loading.hidden = true;
      }

      if (access) {
        access.classList.remove("is-loading");
        access.removeAttribute("aria-busy");
        setCourseMaterialsLocked(access, false);
      }
    } catch (error) {
      if (loading) {
        loading.hidden = true;
      }

      if (list) {
        list.innerHTML =
          '<p class="course-material-status">Verified account required.</p>';
      }

      if (access) {
        access.hidden = false;
        access.classList.remove("is-loading");
        access.removeAttribute("aria-busy");
        setCourseMaterialsLocked(access, true);
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
    const prerequisiteRow = document.getElementById(
      "course-detail-prerequisite-row"
    );

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
      setCourseDetailText(
        "course-detail-description",
        "Go back to courses and choose a course from the search results."
      );
      setCourseDetailText("course-detail-subject", "Unavailable");
      setCourseDetailText("course-detail-level", "Unavailable");
      setCourseDetailText("course-detail-full-code", courseCode || "Unavailable");

      if (prerequisiteRow) {
        prerequisiteRow.hidden = true;
      }

      renderCourseProfessors({ code: "" }, []);
      return true;
    }

    document.title = selectedCourse.code + " | AUC Atlas";
    setCourseDetailText("course-detail-code", selectedCourse.code);
    setCourseDetailText("course-detail-title", selectedCourse.title);
    setCourseDetailText(
      "course-detail-description",
      selectedCourse.description ||
        "Course description coming soon."
    );
    setCourseDetailText("course-detail-subject", selectedCourse.subject);
    setCourseDetailText("course-detail-level", selectedCourse.level);
    setCourseDetailText("course-detail-full-code", selectedCourse.code);
    setCourseDetailText(
      "course-detail-prerequisite",
      selectedCourse.prerequisite
    );

    if (prerequisiteRow) {
      prerequisiteRow.hidden = !selectedCourse.prerequisite;
    }

    recordCourseView(selectedCourse.code);
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

  function getMaterialFormControl(
    form,
    role,
    fallbackId
  ) {
    const selectors = [];

    if (role) {
      selectors.push(
        '[data-material-role="' + role + '"]'
      );
    }

    if (fallbackId) {
      selectors.push("#" + fallbackId);
    }

    if (form && selectors.length) {
      const control = form.querySelector(
        selectors.join(", ")
      );

      if (control) {
        return control;
      }
    }

    return fallbackId
      ? document.getElementById(fallbackId)
      : null;
  }

  function setMaterialUploadStatus(
    message,
    type,
    form
  ) {
    const status = getMaterialFormControl(
      form,
      "status",
      "material-upload-status"
    );

    if (!status) {
      return;
    }

    status.className =
      "material-upload-status" +
      (type ? " " + type : "");
    status.textContent = message;
  }

  function getMaterialProfessorOptions() {
    const source = Array.isArray(
      window.aucAtlasProfessors
    )
      ? window.aucAtlasProfessors
      : [];
    const seen = {};
    const names = [];

    source.forEach(function (professor) {
      const name = String(
        professor && professor.name
          ? professor.name
          : ""
      ).trim();
      const key = name
        .toLowerCase()
        .replace(/\s+/g, " ");

      if (name && !seen[key]) {
        seen[key] = true;
        names.push(name);
      }
    });

    return names.sort(
      function (firstName, secondName) {
        return firstName.localeCompare(
          secondName
        );
      }
    );
  }

  function populateMaterialProfessorSelect(form) {
    const select = getMaterialFormControl(
      form,
      "professor",
      "material-professor"
    );

    if (
      !select ||
      select.dataset.professorOptionsReady ===
        "true"
    ) {
      return;
    }

    const currentValue = select.value;
    const professorNames =
      getMaterialProfessorOptions();
    const placeholder =
      document.createElement("option");

    select.dataset.professorOptionsReady = "true";
    select.innerHTML = "";
    placeholder.value = "";
    placeholder.textContent = "Choose professor";
    select.appendChild(placeholder);

    professorNames.forEach(function (name) {
      const option =
        document.createElement("option");

      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    if (
      currentValue &&
      professorNames.includes(currentValue)
    ) {
      select.value = currentValue;
    }
  }

  function populateQuickMaterialCourseSelect(form) {
    const select = getMaterialFormControl(
      form,
      "course",
      "quick-material-course"
    );

    if (
      !select ||
      select.dataset.courseOptionsReady ===
        "true"
    ) {
      return;
    }

    const placeholder =
      document.createElement("option");

    select.dataset.courseOptionsReady = "true";
    select.innerHTML = "";
    placeholder.value = "";
    placeholder.textContent = "Choose course";
    select.appendChild(placeholder);

    courses.forEach(function (course) {
      const option =
        document.createElement("option");

      option.value = course.code;
      option.textContent =
        course.code + " — " + course.title;
      select.appendChild(option);
    });
  }

  function setMaterialUploadProgress(
    percent,
    label,
    isVisible,
    form
  ) {
    const progress = getMaterialFormControl(
      form,
      "progress",
      "material-upload-progress"
    );
    const progressTrack = getMaterialFormControl(
      form,
      "progress-track",
      "material-upload-progress-track"
    );
    const progressFill = getMaterialFormControl(
      form,
      "progress-fill",
      "material-upload-progress-fill"
    );
    const progressValue = getMaterialFormControl(
      form,
      "progress-value",
      "material-upload-progress-value"
    );
    const progressLabel = getMaterialFormControl(
      form,
      "progress-label",
      "material-upload-progress-label"
    );
    const safePercent = Math.max(
      0,
      Math.min(
        100,
        Math.round(Number(percent) || 0)
      )
    );

    setMaterialFileUploadState(
      form,
      Boolean(isVisible && safePercent < 100)
    );

    if (progress) {
      progress.hidden = !isVisible;
    }

    if (progressTrack) {
      progressTrack.setAttribute(
        "aria-valuenow",
        String(safePercent)
      );
    }

    if (progressFill) {
      progressFill.style.width =
        safePercent + "%";
    }

    if (progressValue) {
      progressValue.textContent =
        safePercent + "%";
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

  function setupMaterialUploadForm(
    course,
    options
  ) {
    const settings = options || {};
    const form =
      settings.form ||
      document.getElementById(
        "material-upload-form"
      );
    const button = getMaterialFormControl(
      form,
      "submit",
      "material-upload-button"
    );

    if (
      !form ||
      form.dataset.ready === "true"
    ) {
      return;
    }

    const defaultButtonLabel =
      settings.buttonLabel ||
      (
        button
          ? button.textContent.trim()
          : "Upload material"
      );

    form.dataset.ready = "true";
    form.noValidate = true;
    populateMaterialProfessorSelect(form);
    setupMaterialChoiceMenus(form);
    setupMaterialFilePicker(form);

    form.addEventListener(
      "submit",
      async function (event) {
        event.preventDefault();

        const activeCourse =
          typeof settings.getCourse === "function"
            ? settings.getCourse()
            : course;
        const professorInput =
          getMaterialFormControl(
            form,
            "professor",
            "material-professor"
          );
        const materialTypeInput =
          getMaterialFormControl(
            form,
            "type",
            "material-type"
          );
        const semesterInput =
          getMaterialFormControl(
            form,
            "semester",
            "material-semester"
          );
        const titleInput =
          getMaterialFormControl(
            form,
            "title",
            "material-title"
          );
        const fileInput =
          getMaterialFormControl(
            form,
            "file",
            "material-file"
          );
        const anonymousInput =
          getMaterialFormControl(
            form,
            "anonymous",
            "material-anonymous"
          );
        const files =
          fileInput && fileInput.files
            ? Array.from(fileInput.files)
            : [];
        const professor = professorInput
          ? professorInput.value.trim()
          : "";
        const materialType = materialTypeInput
          ? materialTypeInput.value.trim()
          : "";
        const semester = semesterInput
          ? semesterInput.value.trim()
          : "";
        const title = titleInput
          ? titleInput.value.trim()
          : "";
        const isAnonymous = Boolean(
          anonymousInput &&
          anonymousInput.checked
        );

        if (
          !activeCourse ||
          !activeCourse.code
        ) {
          setMaterialUploadStatus(
            "Choose a course before uploading material.",
            "error",
            form
          );
          return;
        }

        if (
          !professor ||
          !materialType ||
          !semester ||
          !title ||
          !files.length
        ) {
          setMaterialUploadStatus(
            "Fill in the professor, material type, semester, title, and choose at least one file.",
            "error",
            form
          );
          return;
        }

        const oversizedFile = files.find(
          function (file) {
            return (
              file.size >
              25 * 1024 * 1024
            );
          }
        );

        if (oversizedFile) {
          setMaterialUploadStatus(
            oversizedFile.name +
              " is above the 25MB upload limit.",
            "error",
            form
          );
          return;
        }

        if (button) {
          button.disabled = true;
        }

        const totalBytes = files.reduce(
          function (total, file) {
            return total + file.size;
          },
          0
        );

        let uploadedCount = 0;
        let completedBytes = 0;
        let activeAuthorizationId = "";

        const uploadGroupId =
          window.crypto &&
          typeof window.crypto.randomUUID === "function"
            ? window.crypto.randomUUID()
            : [
                Date.now().toString(36),
                Math.random().toString(36).slice(2, 12)
              ].join("-");

        setMaterialUploadProgress(
          0,
          "Preparing upload",
          true,
          form
        );

        try {
          for (
            let index = 0;
            index < files.length;
            index += 1
          ) {
            const file = files[index];
            const progressLabel =
              files.length > 1
                ? "Uploading file " +
                  (index + 1) +
                  " of " +
                  files.length
                : "Uploading file";

            if (button) {
              button.textContent =
                files.length > 1
                  ? "Uploading " +
                    (index + 1) +
                    " of " +
                    files.length +
                    "..."
                  : "Uploading...";
            }

            const authResponse = await fetch(
              "/api/imagekit-auth",
              {
                method: "POST",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json",
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                  action: "authorize",
                  courseCode:
                    activeCourse.code,
                  courseTitle:
                    activeCourse.title || "",
                  professor: professor,
                  semester: semester,
                  materialType:
                    materialType,
                  isAnonymous:
                    isAnonymous,
                  title: title,
                  fileName: file.name,
                  fileSize: file.size
                })
              }
            );

            const auth =
              await authResponse
                .json()
                .catch(function () {
                  return {};
                });

            if (!authResponse.ok) {
              throw new Error(
                auth.error ||
                  "Could not prepare the next file upload."
              );
            }

            const uploadPayload =
              auth &&
              auth.uploadPayload &&
              typeof auth.uploadPayload ===
                "object"
                ? auth.uploadPayload
                : {};

            activeAuthorizationId =
              String(
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

            const formData =
              new FormData();

            formData.append("file", file);
            formData.append(
              "token",
              auth.token
            );

            Object.keys(
              uploadPayload
            ).forEach(function (key) {
              formData.append(
                key,
                String(
                  uploadPayload[key]
                )
              );
            });

            const uploadedFile =
              await uploadMaterialFormData(
                formData,
                function (
                  fileProgress
                ) {
                  const uploadedBytes =
                    completedBytes +
                    file.size *
                      fileProgress;
                  const overallProgress =
                    totalBytes > 0
                      ? (
                          uploadedBytes /
                          totalBytes
                        ) * 100
                      : 0;

                  setMaterialUploadProgress(
                    overallProgress,
                    progressLabel,
                    true,
                    form
                  );
                }
              );

            const saveResponse =
              await fetch(
                "/api/course-materials",
                {
                  method: "POST",
                  credentials:
                    "same-origin",
                  headers: {
                    "Content-Type":
                      "application/json"
                  },
                  body: JSON.stringify({
                    uploadAuthorizationId:
                      activeAuthorizationId,
                    uploadGroupId:
                      uploadGroupId,
                    fileId:
                      uploadedFile.fileId ||
                      ""
                  })
                }
              );

            let saveData = {};

            try {
              saveData =
                await saveResponse.json();
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
                ? (
                    completedBytes /
                    totalBytes
                  ) * 100
                : 100,
              progressLabel,
              true,
              form
            );
          }

          form.reset();
          syncMaterialChoiceMenus(form);
          setMaterialFileSelection(
            form,
            []
          );

          if (
            typeof settings.onSuccess ===
            "function"
          ) {
            await settings.onSuccess(
              activeCourse
            );
          } else {
            await loadCourseMaterials(
              activeCourse
            );
          }

          setMaterialUploadProgress(
            100,
            "Upload complete",
            true,
            form
          );

          setMaterialUploadStatus(
            files.length === 1
              ? "File uploaded successfully and added to the course materials library."
              : files.length +
                  " files uploaded successfully and added to the course materials library.",
            "success",
            form
          );

          window.setTimeout(
            function () {
              setMaterialUploadProgress(
                0,
                "Uploading files",
                false,
                form
              );
            },
            900
          );
        } catch (error) {
          if (activeAuthorizationId) {
            await fetch(
              "/api/imagekit-auth",
              {
                method: "POST",
                credentials:
                  "same-origin",
                cache: "no-store",
                headers: {
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                  action: "cancel",
                  authorizationId:
                    activeAuthorizationId
                })
              }
            ).catch(function () {});
          }

          const progressMessage =
            uploadedCount
              ? uploadedCount +
                " of " +
                files.length +
                " files uploaded. "
              : "";

          setMaterialUploadProgress(
            0,
            "Uploading files",
            false,
            form
          );

          setMaterialUploadStatus(
            progressMessage +
              (
                error.message ||
                "Upload failed. Try again."
              ),
            "error",
            form
          );
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent =
              defaultButtonLabel;
          }
        }
      }
    );
  }

  function setupCoursesPage() {
    const searchInput = document.getElementById(
      "course-search-input"
    );

    if (renderCourseDetail(getSelectedCourseCode())) {
      return;
    }

    if (searchInput) {
      const searchBox = searchInput.closest(
        ".courses-search-box"
      );

      searchInput.addEventListener(
        "input",
        renderCourses
      );

      searchInput.addEventListener(
        "focus",
        renderCourses
      );

      searchInput.addEventListener(
        "keydown",
        function (event) {
          if (event.key !== "Escape") {
            return;
          }

          setCoursesSearchState(false);
          searchInput.blur();
        }
      );

      document.addEventListener(
        "click",
        function (event) {
          if (
            searchBox &&
            !searchBox.contains(event.target)
          ) {
            setCoursesSearchState(false);
          }
        }
      );
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
