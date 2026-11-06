(function () {
  const professors = [
    { id: "eslam-badr", name: "Eslam Badr", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Calculus 1, Linear Algebra", group: "A-F", email: "eslammath@aucegypt.edu", bio: "Eslam Badr earned his PhD from UAB before joining AUC. His work focuses on algebraic geometry and arithmetic, including plane curves, moduli spaces, automorphism groups, twisting theory, quadratic points, and Weierstrass points.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793702504/sztnt1mkiieumbmihhv1.png" },
    { id: "kate-ellis", name: "Kate Ellis", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "kate.ellis@aucegypt.edu", bio: "Kate Ellis is an associate professor and clinical psychologist at AUC. Her work focuses on refugees, trauma, youth exposed to violence, and accessible mental health interventions for conflict-affected communities.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793648828/yywrnyebmy41tpn6efed.png" },
    { id: "aya-musmar", name: "Aya Musmar", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "aya.musmar@aucegypt.edu", bio: "Aya Musmar is an assistant professor of humanities in architecture at AUC. Her work focuses on forced displacement, refugee camps, injustice, climate change, heritage, and architecture as a form of testimony.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793649917/lwzsdfu2qokguxldi0om.png" },
    { id: "tamir-el-khouly", name: "Tamir El-Khouly", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "t.el-khouly@aucegypt.edu", bio: "Tamir El-Khouly earned his PhD in the built environment from UCL before joining AUC. His work focuses on architectural computing, BIM, machine learning, design thinking, and parametric design.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765913/Tamir_El-Khouly_r80cnx.png" },
    { id: "wael-el-mahallawy", name: "Wael El Mahallawy", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "wfawzy@aucegypt.edu", bio: "Wael El Mahallawy is an associate professor and music program director at AUC. His work focuses on Arab music theory, qanoun performance, sound engineering, and music technology.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765912/Wael_El-Mahallawy_ajg1rj.png" },
    { id: "addison-ellis", name: "Addison Ellis", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", bio: "Addison Ellis earned his PhD from the University of Illinois before joining AUC. His work focuses on Kant, post-Kantian philosophy, Heidegger, self-consciousness, and spontaneity.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793648436/iw8h5ymou2xm5k0b7ne9.png" },
    { id: "daoud-siniora", name: "Daoud Siniora", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "daoud.siniora@aucegypt.edu", bio: "Daoud Siniora is an assistant professor of mathematics at AUC. His work focuses on pure mathematics, model theory, and mathematical logic.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718848/72f62805-f9c9-43d9-9b06-40e3117f26ad.png" },
    { id: "tamer-el-leithy", name: "Tamer El-Leithy", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", bio: "Tamer El-Leithy studied economics and philosophy at AUC before specializing in medieval history. His work focuses on Coptic conversion, Arabization, and religious change in medieval Egypt.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764419/Tamer_El-Leithy_d25vt8.png" },
    { id: "peter-barsoum", name: "Peter Barsoum", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "pbarsoum@aucegypt.edu", bio: "Peter Barsoum has lived, studied, and taught across Southeast Europe, the Middle East, Africa, and Asia. He most recently taught writing at Samarkand State University in Uzbekistan.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764419/Peter_Barsoum_fbvgzf.png" },
    { id: "maha-bali", name: "Maha Bali", department: "Center for Learning and Teaching", displayDepartment: "CLT", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "bali@aucegypt.edu", bio: "Maha Bali earned her PhD in education from the University of Sheffield before joining AUC. Her work focuses on equitable, open, and connected learning, academic inclusion, and community-building.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793733358/8a7da883-aad0-4e39-8332-16d11333828a.png" },
    { id: "mohamed-aly", name: "Mohamed Aly", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mfawzyaly@aucegypt.edu", bio: "Mohamed Fawzy Aly earned his PhD in mechanical engineering from McMaster University before joining AUC in 2010. His work focuses on advanced manufacturing, design optimization, and topology optimization.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793963813/c4118660-53ef-43e4-85ad-d568adc564a9.png" },
    { id: "karim-banawan", name: "Karim Banawan", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "karim.banawan@aucegypt.edu", bio: "Karim A. Banawan earned his PhD in electrical engineering from the University of Maryland before joining AUC. His work focuses on information theory, wireless communications, network security, private information retrieval, and machine learning.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732675/de1b5766-fc3b-406c-8a83-1c4c6457dad1.png" },
    { id: "karim-seddik", name: "Karim Seddik", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "kseddik@aucegypt.edu", bio: "Karim G. Seddik earned his PhD in electrical engineering from the University of Maryland before joining AUC. His work focuses on machine learning, wireless networks, intelligent reflecting surfaces, and backscatter communications.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732650/000f244d-89e6-42d1-a706-955c97577a0c.png" },
    { id: "suher-zada", name: "Suher Zada", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "suzada@aucegypt.edu", bio: "Suher Zada is a professor of biology and immunology at AUC. Her work focuses on infectious diseases and immune-system research using biotechnology, nanotechnology, and computational methods.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793703162/kd2i9rsegyzh230ht9ig.png" },
    { id: "karim-addas", name: "Karim Addas", department: "Physics", displayDepartment: "PHYS", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "kaddas@aucegypt.edu", bio: "Karim Addas earned his PhD in physics from Indiana University before joining AUC. His work focuses on microrheology and the behavior of semiflexible biological materials.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732574/7ca4de48-ec64-4af2-b3e9-208dcf6493bd.png" },
    { id: "tamer-elbatt", name: "Tamer ElBatt", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "tamer.elbatt@aucegypt.edu", bio: "Tamer ElBatt earned his PhD in electronics and communications engineering from the University of Maryland before joining AUC. His work focuses on wireless, mobile, and IoT networks.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793962307/f85389e6-7517-4c3e-a309-aa8bcd8888a8.png" },
    { id: "hani-henry", name: "Hani Henry", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hhenry@aucegypt.edu", bio: "Hani Henry earned his PhD in clinical psychology from Miami University before joining AUC. His work focuses on culture, marginalized communities, psychotherapy, counseling, and cross-cultural psychology.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793703159/ouithn8if6ccl9gffzfa.jpg" },
    { id: "yasmine-motawy", name: "Yasmine Motawy", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "ymotawy@aucegypt.edu", bio: "Yasmine Motawy teaches rhetoric and composition at AUC. Her work focuses on children’s literature, translation, criticism, editing, and contemporary Egyptian society.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793715750/iikqgeg9xgpihbw1k0tw.png" },
    { id: "catarina-belo", name: "Catarina Belo", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "cbelo@aucegypt.edu", bio: "Catarina Belo is an associate professor of philosophy at AUC. Her work focuses on Islamic philosophy, medieval Christian thought, Hegel, religion, and virtue ethics.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718680/ecc6a59f-eee9-4d18-a61c-f1be0bb3becb.png" },
    { id: "yasmine-ahmed", name: "Yasmine Ahmed", department: "Core Curriculum", displayDepartment: "CORE", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "yasminemoataz@aucegypt.edu", bio: "Yasmine Moataz Ahmed earned her PhD in social anthropology from the University of Cambridge before joining AUC. Her work focuses on the state, citizenship, rural Egypt, agriculture, environment, and labor.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764398/Yasmine_Ahmed_g1ohx6.png" },
    { id: "nihal-nagi", name: "Nihal Nagi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", bio: "Nihal Nagi is an associate professor of applied linguistics at AUC. Her research spans sociolinguistics, discourse analysis, and cognitive linguistics, including how children and adults acquire and use language.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764398/Nihal_Nagi_dgdper.png" },
    { id: "salah-al-agha", name: "Salah Al-Agha", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "salah.alagha@aucegypt.edu", bio: "Salah Al-Agha earned his MSc and PhD from Purdue University after completing his BSc at AUC. His work focuses on operations research, decision-making, lean practices, simulation, and engineering education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793802535/dea92160-2037-408a-ae5e-df345585473c.png" },
    { id: "richard-fincham", name: "Richard Fincham", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "rfincham@aucegypt.edu", bio: "Richard Fincham earned his PhD from the University of Warwick before joining AUC. His work focuses on Kant, German philosophy, Humean skepticism, and transcendental idealism.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793703209/o3xsb11xwahokdyghseq.jpg" },
    { id: "ehab-elsawy", name: "Ehab ElSawy", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "A-F", email: "ehab.elsawy@aucegypt.edu", bio: "Ehab El Sawy earned his PhD in physical chemistry at the University of Calgary before joining AUC in 2017. His work focuses on nano-electrochemistry, fuel cells, hydrogen production, batteries, sensors, and corrosion protection.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793703166/ymrpykrdnjxianfocuur.png" },
    { id: "nageh-allam", name: "Nageh Allam", department: "Physics", displayDepartment: "PHYS", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", email: "nageh.allam@aucegypt.edu", bio: "Nageh Allam earned his PhD in materials science and engineering from Penn State before joining AUC in 2011. His work focuses on nanomaterials for energy, sensors, desalination, biomaterials, and computational materials science.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558061/c0f7ea2d-853f-4973-8dbe-5040bc8e917a.png" },
    { id: "tamer-shoeib", name: "Tamer Shoeib", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", email: "t.shoeib@aucegypt.edu", bio: "Tamer Shoeib earned his PhD in chemistry from York University before conducting postdoctoral research in Canada. His work focuses on analytical and biophysical chemistry, molecular structure, mass spectrometry, and metal-containing biomolecules.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793703164/tltp5hnirzesjr6ihhbb.png" },
    { id: "hassan-azazy", name: "Hassan Azazy", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "hazzazy@aucegypt.edu", bio: "Hassan Azzazy earned his PhD from the University of North Texas Health Science Center before joining AUC. His work focuses on diagnostics, biosensors, nanobiotechnology, drug delivery, and clinical laboratory medicine.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793703163/syclzbuuroxxejwd99oh.png" },
    { id: "ibrahim-abotaleb", name: "Ibrahim Abotaleb", department: "Construction Engineering", displayDepartment: "CENG", filterDepartment: "Engineering", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "ibrahimsalah@aucegypt.edu", bio: "Ibrahim Abotaleb earned his PhD from the University of Tennessee before joining AUC. His work focuses on AI in construction, sustainability, project control, risk, optimization, and contract management.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730417/0dcf17e2-5e8d-480c-aa5e-b2c9f84cf626.png" },
    { id: "arthur-bos", name: "Arthur Bos", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "A-F", email: "arbos@aucegypt.edu", bio: "Arthur Bos earned his PhD in coastal zone management and fish biology from Hamburg University before joining AUC in 2011. His work focuses on reef fish, marine protected areas, invertebrates, seagrass ecology, and habitat restoration.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793703165/wieyufbwn0w8uexw3sel.png" },
    { id: "walid-fouad", name: "Walid Fouad", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", email: "wfouad@aucegypt.edu", bio: "Walid Fouad earned his PhD in plant molecular and cellular biology from the University of Florida before joining AUC. His work focuses on plant biotechnology, crop improvement, stress tolerance, algae, biofuels, and sustainable agriculture.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785288250/Walid_Fouad_khxyvf.png" },
    { id: "mohamed-badran", name: "Mohamed Badran", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "mobadran@aucegypt.edu", bio: "Mohamed Badran earned his PhD in engineering systems and computing from the University of Guelph before joining AUC. His work focuses on operations research, optimization, autonomous vehicles, and BioMEMS sensors and actuators.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793964482/a9ebac0a-bd53-48cb-b339-48ff3206ce3d.png" },
    { id: "ahmed-abdellatif", name: "Ahmed Abdellatif", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "A-F", email: "ahmed.abdellatif@aucegypt.edu", bio: "Ahmed Abdellatif earned his MSc and PhD in anatomical sciences and neurobiology from the University of Louisville before joining AUC. His work focuses on tissue repair, diabetes, aging, dementia, and neurodegenerative diseases.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793716894/q9m5fsngtegh7ut0ypeq.png" },
    { id: "wafik-lotfallah", name: "Wafik Lotfallah", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", email: "lotfallah@aucegypt.edu", bio: "Wafik Lotfallah earned his PhD from the University of Wisconsin-Madison before joining AUC in 2009. His work focuses on finite model theory, descriptive complexity, fuzzy logic, and mathematical modeling.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785326069/Wafik_Lotfallah_to4w8v.png" },
    { id: "laila-elserty", name: "Laila ElSerty", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "G-M", bio: "Laila ElSerty earned her MA in TEFL from AUC and is pursuing a PhD in discourse analysis. Her work focuses on academic writing, linguistics, curriculum design, and teacher training.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793733106/61c92489-2acf-4113-82e3-413591dbf55e.png" },
    { id: "mariah-fairley", name: "Mariah Fairley", department: "English Language Instruction", displayDepartment: "ELI", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "mariah@aucegypt.edu", bio: "Mariah J. Fairley is an English language educator with over 20 years of experience. Her work focuses on social justice, humanizing pedagogy, academic writing, identity, and TESOL.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793878981/55520a58-a9ba-4d9a-b610-1f249f851eaf.png" },
    { id: "gretchen-mccullough", name: "Gretchen McCullough", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "gretchen@aucegypt.edu", bio: "Gretchen McCullough earned her MFA in creative writing from the University of Alabama. Her work focuses on fiction, essays, literary translation, and expatriate life in Cairo.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793648756/dlnhr6egw8r9vtxy81ca.png" },
    { id: "kathleen-saville", name: "Kathleen Saville", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "ksaville@aucegypt.edu", bio: "Kathleen Saville is a senior instructor and department chair at AUC. Her work focuses on writing, curriculum development, teacher education, adult literacy, and creative nonfiction.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732860/fc30a3d3-89b5-4493-9b0c-6e795e0b5455.png" },
    { id: "fikry-boutros", name: "Fikry Boutros", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "A-F", email: "fsb@aucegypt.edu", bio: "Fikry Boutros earned his PhD in TESOL from the University of Nicosia before joining AUC. His work focuses on second-language pragmatics, politeness, apologies, and email communication.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793877758/35f4282b-cb05-461f-a0df-ede0822f8609.png" },
    { id: "mostafa-abbas", name: "Mostafa Abbas", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hala-abd-alhak", name: "Hala Abd Alhak", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "areeg-abdalla", name: "Areeg Abdalla", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hassan-abdalla", name: "Hassan Abdalla", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nadine-abdalla", name: "Nadine Abdalla", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nadine.abdalla@aucegypt.edu", bio: "Nadine Abdalla earned her PhD in political science from Sciences Po Grenoble before joining AUC. Her work focuses on social movements, state-society relations, local politics, and democracy in the MENA region.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793876738/f4f0e3c3-e397-4149-82fc-eda9af868a02.png" },
    { id: "wael-abdallah", name: "Wael Abdallah", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "wael.mostafa@aucegypt.edu", bio: "Wael Abdallah earned his PhD from the University of Salford before joining AUC. His work focuses on corporate finance, investment, banking, international finance, and credit risk.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786199112/Wael_Abdallah_nxhjof.jpg" },
    { id: "mohamed-abdallah", name: "Mohamed Abdallah", department: "Construction Engineering", displayDepartment: "CENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mohamed-abdallah@aucegypt.edu", bio: "Mohamed Abdallah earned his PhD in environmental engineering from the University of Ottawa. His work focuses on waste management, waste-to-energy, sustainability, life-cycle assessment, and AI applications.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793963485/db1ab610-4d8c-4ed9-90b7-0b8516361491.png" },
    { id: "rasha-abdulla", name: "Rasha Abdulla", department: "Journalism and Mass Communication", displayDepartment: "JRMC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "rasha@aucegypt.edu", bio: "Rasha Abdulla is a professor of journalism and mass communication at AUC. Her work focuses on new media, social media, political participation, media in transition, and freedom of expression.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801397/0db4ce11-b1de-4f84-b970-ed6fcc1ff03b.png" },
    { id: "s-abdel-azeem", name: "Sherif Abdel Azeem", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "shazeem@aucegypt.edu", bio: "Sherif Abdel Azeem earned his PhD in electrical and computer engineering from Queen’s University before joining AUC. His work focuses on pattern recognition, OCR, and Arabic handwriting recognition.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786232652/Sherif_Abdel_Azeem_dgckli.png" },
    { id: "omar-abdelaziz", name: "Omar Abdelaziz", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Omar Abdelaziz earned his PhD in mechanical engineering from the University of Maryland. His work focuses on thermofluids, energy-efficient buildings, sustainable energy, HVAC&R, and low-GWP refrigerants.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801224/0b479fe4-cb49-47dd-adbd-6121fc73ed62.png" },
    { id: "rehab-abdel-aziz", name: "Rehab Abdel-Aziz", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "youssef-abdel-aziz", name: "Youssef Abdel Aziz", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-abdel-kawi", name: "Amr Abdelkawi", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "akawi@aucegypt.edu", bio: "Amr Abdelkawi studied architecture in the United States before joining AUC in 2010. His work focuses on architecture, design management, furniture, publishing, and vocational education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793649651/kyz1qvybc8dvryoq9bwb.png" },
    { id: "tarek-abdel-kawi", name: "Tarek Abdel Kawi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-abdel-meguid", name: "Ahmed Abdelmeguid", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "a_meguid@aucegypt.edu", bio: "Ahmed Abdel-Meguid earned his PhD in accounting from Syracuse University before joining AUC. His work focuses on auditing, audit quality, corporate governance, and earnings quality.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793716911/ticrvzydbtj7dvpdmkr8.png" },
    { id: "sherif-abdel-mohsen", name: "Sherif Abdelmohsen", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sherifmorad@aucegypt.edu", bio: "Sherif Morad Abdelmohsen earned his PhD in architecture from Georgia Tech before joining AUC. His work focuses on computational design, digital fabrication, robotics, BIM, and virtual reality.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786018329/Sherif_Abdelmohsen_wlbl66.png" },
    { id: "mohamed-abdel-mooty", name: "Mohamed Abdel Mooty", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "anwar-abd-elnaser", name: "Anwar Abd ElNaser", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "anwar.abdelnaser@aucegypt.edu", bio: "Anwar Abd ElNaser earned his MSc and PhD from the University of Alberta before joining AUC. His work focuses on hepatic and cardiovascular clinical chemistry and biomedical research.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718314/cf697f63-aee6-4721-a6a6-81f4f52191be.png" },
    { id: "shahinaz-abdel-rahman", name: "Shahinaz Abdel Rahman", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ashraf-abdelraouf", name: "Ashraf Abdelraouf", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "alaa-abdel-salam", name: "Alaa Abdel Salam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "laila-abdel-salam", name: "Laila Abdel Salam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-abdel-wahab", name: "Ahmed Abdel Wahab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalal-abo-el-seoud", name: "Dalal Abo El Seoud", department: "Arabic Language Instruction", displayDepartment: "ALIN", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "dalalas@aucegypt.edu", bio: "Dalal Abo El Seoud earned her PhD from Ain Shams University and has taught at AUC since 1997. Her work focuses on teaching Arabic as a foreign language, oral skills, vocabulary, and Arabic writing.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793877168/648e723e-7a80-42bb-8216-86412106d856.png" },
    { id: "walid-aboelsoud", name: "Walid Aboelsoud", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "walid.aboelsoud@aucegypt.edu", bio: "Biography coming soon.", image: "https://eng.asu.edu.eg/ar/download?sid=uttCRzZ4WPD66gdEtHWNnUylxj9yA4MhweVnfGulUjs%3D" },
    { id: "mohamed-abotera", name: "Mohamed Abotera", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-abou-auf", name: "Ahmed Abou-Auf", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "aabouauf@aucegypt.edu", bio: "Ahmed Abou-Auf is a professor of electronics and communications engineering who joined AUC in 2006. His work focuses on FPGA and ASIC design and signal-processing systems.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793717022/smkstnjpsxidtpyqavtq.png" },
    { id: "tarek-abou-el-seoud", name: "Tarek Abou El Seoud", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "essam-abou-el-zahab", name: "Essam Abou El-Zahab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hend-abou-ghaly", name: "Hend Abou Ghaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "noha-abou-khatwa", name: "Noha Abou-Khatwa", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nkhatwa@aucegypt.edu", bio: "Noha Abou-Khatwa earned her PhD in Islamic art and material culture from the University of Toronto. Her work focuses on manuscripts, calligraphy, architecture, and intellectual life in the medieval Muslim world.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786199957/Noha_Abou-Khatwa_cf0x24.jpg" },
    { id: "nidaa-aboulhosn", name: "Nidaa Aboulhosn", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nidaa.aboulhosn@aucegypt.edu", bio: "Nidaa Aboulhosn is a Lebanese-American visual artist and assistant professor at AUC. Her work spans photography, drawing, time-based media, bookmaking, perception, light, sound, and visual language.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786199993/Nidaa_Aboulhosn_mtr9ny.jpg" },
    { id: "mohamed-abou-zeid", name: "Mohamed Abou-Zeid", department: "Construction Engineering", displayDepartment: "CENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mnagiba@aucegypt.edu", bio: "Mohamed Abou-Zeid earned his PhD from the University of Kansas before joining AUC in 1997. His work spans construction engineering, academic integrity, accreditation, and university governance.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793963684/27fc50fc-5e43-47b8-9ef1-083dc0d12ac5.png" },
    { id: "reham-abou-zeid", name: "Reham Abou-Zeid", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-abozaied", name: "Hanan Abozaied", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-abu-el-kheir", name: "Mohamed Abu El Kheir", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-abu-helw", name: "Amr Abu Helw", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nayera-abusetit", name: "Nayera Abusetit", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-adly", name: "Amr Adly", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "amradly82@aucegypt.edu", bio: "Amr Adly earned his PhD in political economy from the European University Institute before joining AUC. His work focuses on political economy, economic sociology, development, and Middle East studies.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793877009/13d8f2b5-f143-4494-8e7f-d170c49c0f42.png" },
    { id: "reem-ahmed", name: "Reem Ahmed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "samah-ahmed", name: "Samah Ahmed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "firas-al-atraqshi", name: "Firas Al-Atraqchi", department: "Journalism and Mass Communication", displayDepartment: "JRMC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "falatraqchi@aucegypt.edu", bio: "Firas Al-Atraqchi is a Canadian journalist and editor who has covered the Middle East and North America since 1992. His work focuses on journalism, editing, global affairs, and student media.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793719329/3eb68694-e023-41f7-9648-80521146e456.png" },
    { id: "eman-al-ayyat", name: "Eman Al-Ayyat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-alhalaby", name: "Mohamed Alhalaby", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ramy-ali", name: "Ramy Ali", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "aya-alkholy", name: "Aya Alkholy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "salma-al-saady", name: "Salma Al-Saady", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-al-sahouly", name: "Ibrahim Al-Sahouly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ramy-aly", name: "Ramy Aly", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "ramy.aly@aucegypt.edu", bio: "Ramy Aly earned his PhD in social anthropology from the University of Sussex before joining AUC in 2013. His work focuses on Arab diasporas, identity, ethics, revolution, and racial formations in Egypt.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805141/5280f586-0045-44f3-93eb-62891165d065.png" },
    { id: "sherif-aly", name: "Sherif Aly", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sgamal@aucegypt.edu", bio: "Sherif Aly earned his doctorate from George Washington University. His work focuses on mobile and pervasive computing, academic program development, accreditation, and technology governance.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793962769/871e63a6-5073-4406-ac78-69ae799f6872.png" },
    { id: "hassanein-amer", name: "Hassanein Amer", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hamer@aucegypt.edu", bio: "Hassanein Amer earned his MSc and PhD in electrical engineering from Stanford University. His work focuses on circuit reliability, VLSI fault modeling, networked control systems, and wireless communications.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793731412/b290248f-744c-43f3-9a1c-7c48b90027ff.png" },
    { id: "mona-amer", name: "Mona Amer", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "monaamer@aucegypt.edu", bio: "Mona Amer is a professor of clinical and community psychology who founded AUC's psychology department. Her scholarship examines Arab and Muslim communities, cultural psychology, counseling, and mental health.", image: "https://www.aucegypt.edu/sites/default/files/2023-02/Copy%20of%20IMG_3682.jpg" },
    { id: "ayatalla-amin", name: "Ayatalla Amin", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-amin", name: "Dina Amin", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "dina.a@aucegypt.edu", bio: "Dina Amin is a professor of theatre and stage director at AUC. She earned her PhD from the University of Pennsylvania and works in dramatic literature, directing, and Egyptian theatre.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793559201/4afc6619-9e14-4e3d-bc0f-3b1814ba704a.png" },
    { id: "khaled-amin", name: "Khaled Amin", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "asma-amleh", name: "Asma Amleh", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "aamleh@aucegypt.edu", bio: "Asma Amleh earned her PhD in biology from McGill University and is a biology professor at AUC. Her research investigates tumor biology, ovarian cancer biomarkers, and molecular mechanisms of disease.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718501/2884052d-05b8-456b-a081-f21d07962dd4.png" },
    { id: "mohamed-anany", name: "Mohamed Anany", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohab-anis", name: "Mohab Anis", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "manis@aucegypt.edu", bio: "Mohab Anis earned his PhD in computer engineering from the University of Waterloo. His work spans microelectronics, innovation strategy, intellectual property, technology commercialization, and business development.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793963397/7de012a0-9ef9-434b-b4e0-0a6d55d9eabd.png" },
    { id: "marina-apaydin", name: "Marina Apaydin", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Marina Apaydin is a management professor with a PhD in strategic management and innovation from Western University. Her research and teaching focus on strategy, leadership, international business, and innovation.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793879196/5e85f401-6c17-4a3a-a2a8-feb9ad4ff20a.png" },
    { id: "mustafa-arafa", name: "Mustafa Arafa", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mharafa@aucegypt.edu", bio: "Mustafa Arafa earned his PhD in mechanical engineering from the University of Maryland. His research focuses on engineering design and dynamics, vibration analysis, energy harvesting, and fluid-structure interaction.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793558739/800ea61f-86a8-4493-b325-7f7f11c9f16b.png" },
    { id: "maher-asham", name: "Maher Asham", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "iman-ashmawy", name: "Iman Ashmawy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yara-ashour", name: "Yara Ashour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ali-atef", name: "Ali Atef", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sara-attawiya", name: "Sara Attawiya", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ali-awni", name: "Ali Awni", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahawni@aucegypt.edu", bio: "Ali Awni is a professor of practice in management and director of AUC's Gerhart Center. His work examines operations management, supply chains, business innovation, and small and medium enterprises.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793717787/768a20de-7410-40cf-98ec-6daeebf447cf.png" },
    { id: "mariam-ayad", name: "Mariam Ayad", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "m.ayad@aucegypt.edu", bio: "Mariam Ayad earned her PhD in Egyptology from Brown University. Her research examines ancient Egyptian language, funerary texts, women's roles in temple ritual, and first-millennium Egyptian history.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793879038/44a3d4a0-e5f9-404d-80ca-2975c60b2cce.png" },
    { id: "mina-ayad", name: "Mina Ayad", department: "Economics", displayDepartment: "ECON", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mina_sami@aucegypt.edu", bio: "Mina Ayad is an associate professor of economics specializing in econometrics and financial economics. His research studies financial markets, risk, technological change, firm performance, and the effects of economic shocks.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793963163/9bcbcb6f-963f-45d1-a101-84a3c73ba013.png" },
    { id: "maysa-ayoub", name: "Maysa Ayoub", department: "Center for Migration and Refugee Studies", displayDepartment: "CMRS", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "maysa@aucegypt.edu", bio: "Maysa Ayoub is an assistant professor of public policy with a doctorate in Euro-Mediterranean studies from Cairo University. Her research focuses on migration policy, refugee integration, statelessness, and public opinion.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793879607/319b7b15-650d-4508-a8c2-b3c5641a49af.png" },
    { id: "nahed-azab", name: "Nahed Azab", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nazab@aucegypt.edu", bio: "Nahed Azab is a management information systems scholar at AUC. Her research examines digital government, information technology adoption, electronic commerce, and how digital tools support entrepreneurship and organizations.", image: "https://menaobservatory.ai/storage/ad44c57d9a38ac815b437302719823a4.jpg" },
    { id: "khalid-azzouz", name: "Khalid Azzouz", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nesrine-badawi", name: "Nesrine Badawi", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nbadawi@aucegypt.edu", bio: "Nesrine Badawi earned her PhD in law from SOAS, University of London. Her research explores Islamic jurisprudence, international humanitarian law, refugee law, and connections between Islamic and international legal traditions.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201449/Nesrine_Badawi_apyijm.jpg" },
    { id: "mohga-badran", name: "Mohga Badran", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mabadran@aucegypt.edu", bio: "Mohga Badran earned her PhD from Stockholm University and served as a professor and chair of management at AUC. Her academic career includes management teaching, advising, and departmental leadership.", image: "https://www.aucegypt.edu/sites/default/files/mohga_badran_1.jpg" },
    { id: "roba-bairakdar", name: "Roba Bairakdar", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Roba Bairakdar earned her PhD in mathematics from Concordia University. Her research focuses on actuarial science, catastrophe insurance, extreme value theory, and stochastic modeling of financial and disaster risks.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801342/6b80efe7-f6db-46a4-bca4-8b789dd9ef7c.png" },
    { id: "mohamed-baitie", name: "Mohamed Baitie", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "may-bakr", name: "May Bakr", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "may.bakr@aucegypt.edu", bio: "May Bakr earned her PhD in neuroscience from the University of Bordeaux. Her research examines synaptic trafficking, neurodegenerative diseases, Parkinson's disease, and biomarkers for monitoring disease progression.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793879430/72ce198b-5b9b-43e5-84c2-5efed1fef6c5.png" },
    { id: "yousra-bakr", name: "Yousra Bakr", department: "Journalism and Mass Communication", displayDepartment: "JRMC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Yousra Bakr earned her doctorate in business administration from Maastricht School of Management. Her research explores digital marketing communications, online consumer behavior, advertising, food acceptance, and gender representation.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233958/Yousra_Bakr_qbqarn.png" },
    { id: "christopher-barker", name: "Chris Barker", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "chris.barker@aucegypt.edu", bio: "Chris Barker is a political theorist whose work examines John Stuart Mill, liberty, popular sovereignty, imperialism, and power. He also studies the history of political thought and theories of freedom.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718809/c6c22323-e054-47bc-9dda-f61924c62104.png" },
    { id: "ghada-barsoum", name: "Ghada Barsoum", department: "Public Policy and Administration", displayDepartment: "PPAD", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "gbarsoum@aucegypt.edu", bio: "Ghada Barsoum earned her PhD in sociology from the University of Toronto. Her research focuses on social policy, women's employment, youth labor markets, higher education, and green economic transitions.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793719364/2d786b47-7bdf-422c-96ec-7bee45496464.png" },
    { id: "reem-bassiouney", name: "Reem Bassiouney", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "reem.bassiouney@aucegypt.edu", bio: "Reem Bassiouney earned her doctorate in Arabic linguistics from the University of Oxford. Her scholarship explores sociolinguistics, language and identity, code-switching, discourse, and language policy; she also writes novels.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201805/Reem_Bassiouney_sry5re.jpg" },
    { id: "dina-bassiouni", name: "Dina Bassiouni", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "dbassiouni@aucegypt.edu", bio: "Dina Bassiouni earned her PhD from Royal Holloway, University of London, studying children's engagement with digital games. Her research and teaching focus on marketing, consumer behavior, advertising, and promotional communications.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793877369/34b6afd9-cbf4-4c89-a551-523019960a5c.png" },
    { id: "mohamed-basuony", name: "Mohamed Basuony", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mohamed.basuony@aucegypt.edu", bio: "Mohamed Basuony is a professor and chair of accounting at AUC. He earned his PhD from Brunel University after completing accounting degrees at Ain Shams University.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793715916/0441600d-7dd0-4b8f-a367-f8f4a68695c1.png" },
    { id: "nizar-becheikh", name: "Nizar Becheikh", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nbecheikh@aucegypt.edu", bio: "Nizar Becheikh earned his PhD in business administration from Laval University. His academic work centers on strategy, innovation management, and international business, and he has held leadership roles in AUC's business school.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201978/Nizar_Becheikh_ysujiw.jpg" },
    { id: "teklu-bekele", name: "Teklu Bekele", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "teklu.abate@aucegypt.edu", bio: "Teklu Bekele is an associate professor of international and comparative education who previously taught at the University of Oslo. His research examines higher education, educational policy, and university-society engagement in Africa.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234309/Teklu_Bekele_zvvqiz.png" },
    { id: "shahjahan-bhuiyan", name: "Shahjahan Bhuiyan", department: "Public Policy and Administration", displayDepartment: "PPAD", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sbhuiyan@aucegypt.edu", bio: "Shahjahan Bhuiyan is a professor of public policy and administration and a fellow of the National Academy of Public Administration. His work spans public administration, governance, and institutional development.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786202121/Shahjahan_Bhuiyan_lec2fw.jpg" },
    { id: "mohammed-bouaddi", name: "Mohammed Bouaddi", department: "Economics", displayDepartment: "ECON", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "m.bouaddi@aucegypt.edu", bio: "Mohammed Bouaddi is a professor in AUC's economics department. He earned his PhD from HEC Montréal following studies at Université du Québec à Montréal and universities in Morocco.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786202174/Mohammed_Bouaddi_rbtgg3.jpg" },
    { id: "kamal-boutros", name: "Kamal Boutros", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "jochen-braun", name: "Jochen Braun", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "jochen.braun@aucegypt.edu", bio: "Jochen Braun is a designer and professor of practice in AUC's graphic design program. His work includes interaction design, user experience, service design, brand identity, and inclusive civic engagement.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732497/5d9114da-2546-40be-b12b-89934b90e152.png" },
    { id: "heather-browne", name: "Heather Browne", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rodrigo-brum", name: "Rodrigo Brum", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Rodrigo Brum holds an MA in philosophy and an MFA in film and new media. His work focuses on filmmaking, media installation, speculative design, and documentary production.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786027912/Rodrigo_Brum_szl4mi.jpg" },
    { id: "melanie-carter", name: "Melanie Carter", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mcarter@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "rim-cherif", name: "Rim Cherif", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Rim Cherif earned her PhD in financial engineering from HEC Montréal. Her research develops methods for pricing financial derivatives, modeling credit risk, and studying climate-related and sustainable finance.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234576/Rim_Cherif_cp0spq.png" },
    { id: "sungsoo-chun", name: "Sungsoo Chun", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Sungsoo Chun earned his MPH and PhD in public health from Seoul National University. His research spans epidemiology, global health governance, substance policy, pandemic preparedness, and health surveillance.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234650/Sungsoo_Chun_ypxogd.png" },
    { id: "amira-dabour", name: "Amira Dabour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khaled-dahawy", name: "Khaled Dahawy", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "dahawy@aucegypt.edu", bio: "Khaled Dahawy earned his PhD from the University of North Texas and is a professor of accounting at AUC. His professional work spans financial accounting, auditing, corporate governance, and consultancy.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732962/860ff953-b580-4384-b6ad-457efb036d89.png" },
    { id: "lubna-dairanieh", name: "Lubna Dairanieh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "moataz-darwish", name: "Moataz Darwish", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "moataz.darwish@aucegypt.edu", bio: "Moataz Darwish earned his doctorate in business administration from the University of Bradford. His work combines corporate strategy, entrepreneurial leadership, innovation, scenario planning, and extensive experience in energy management.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793963302/4a836c39-dbdd-4c74-8ce8-bd908ac42b07.png" },
    { id: "mohamed-darwish", name: "Mohamed Darwish", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mark-deets", name: "Mark Deets", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mark.deets@aucegypt.edu", bio: "Mark Deets earned his PhD in history from Cornell University. His research examines West African history, nationalism, decolonization, and the social and diplomatic legacies of colonial borders in Senegambia.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793800988/d387010e-f63f-4901-b227-b6e5dfc561c7.png" },
    { id: "reem-deif", name: "Reem Deif", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "veronica-del-puerto", name: "Veronica Del Puerto", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nabil-diab", name: "Nabil Diab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khairy-doma", name: "Khairy Doma", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "el-khayam-dorra", name: "El Khayam Dorra", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-ebeid", name: "Dina Ebeid", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "d.makramebeid@aucegypt.edu", bio: "Dina Ebeid is an assistant professor of social anthropology at AUC. She earned her PhD from the London School of Economics, where she also studied anthropology and development.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793719084/8f7af358-84fa-43ce-95ae-51a59c52ce4f.png" },
    { id: "yasmine-eissa", name: "Yasmine Eissa", department: "Economics", displayDepartment: "ECON", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "yasmeen_rida@aucegypt.edu", bio: "Yasmine Eissa earned her PhD in economics from Cairo University. Her research explores global value chains, trade policy, innovation, labor markets, and how international integration affects firms in developing economies.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786202729/Yasmine_Eissa_yia24f.jpg" },
    { id: "hadeel-el-ahraf", name: "Hadeel El-Ahraf", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maha-el-ashram", name: "Maha El-Ashram", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ashraf-el-assaly", name: "Ashraf El Assaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amira-el-ayouty", name: "Amira El Ayouty", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-elbanbi", name: "Ahmed ElBanbi", department: "Petroleum and Energy Engineering", displayDepartment: "PENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmed.elbanbi@aucegypt.edu", bio: "Ahmed ElBanbi is a petroleum engineering professor with extensive experience in reservoir engineering and the oil industry. His research covers reservoir simulation, artificial intelligence, multiphase flow, and enhanced oil recovery.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793717418/a78149c3-6355-4404-b5fb-2bfb50a5368f.png" },
    { id: "dina-el-baradie", name: "Dina El-baradie", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-el-basiouny", name: "Dina El-Bassiouny", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Dina El-Bassiouny earned her PhD from RWTH Aachen University, focusing on sustainability accounting and corporate social responsibility. Her research covers business ethics, sustainability reporting, corporate governance, and responsible business.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793877553/d747e33c-2bb0-4797-be04-0bc581468c39.png" },
    { id: "dina-elbawab", name: "Dina Elbawab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-elbayoumi", name: "Ahmed Elbayoumi", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmed.elbayoumi@aucegypt.edu", bio: "Ahmed Elbayoumi earned his PhD in accounting from Cairo University. His research examines financial reporting, corporate governance, market-based accounting, national culture, and sustainability performance in business.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793717547/908d60f4-cfe3-4031-bd1d-a59d72374616.png" },
    { id: "maha-el-bedaiwy", name: "Maha El-Bedaiwy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "randa-elbedawy", name: "Randa El Bedawy", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "rbedawy@aucegypt.edu", bio: "Randa El Bedawy is an associate professor of management with extensive academic and consulting experience. Her work spans strategic management, organizational development, quality assurance, leadership, and entrepreneurship.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786235612/Randa_El_Bedawy_ybip6w.png" },
    { id: "amina-el-bindary", name: "Amina El-Bindary", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "abendary@aucegypt.edu", bio: "Amina El-Bindary researches the social and political history of the medieval Middle East. Her work examines urban protest, popular politics, and community relations in Mamluk-era Egypt and Syria.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718012/ac851f40-1ee2-43e7-bb4e-7a611099e556.png" },
    { id: "alia-el-bolock", name: "Alia El Bolock", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Alia El Bolock earned her PhD from Ulm University. Her research combines computer science and psychology through character computing, applied machine learning, privacy preservation, cryptography, and ethical artificial intelligence.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793798224/83808d1b-30bc-4475-a5e9-3f18f4dc45d7.png" },
    { id: "alaa-el-butch", name: "Alaa El Butch", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-el-dabaa", name: "Sherif El-Dabaa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "marwa-el-daly", name: "Marwa El Daly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "seif-eldawlatly", name: "Seif Eldawlatly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Seif Eldawlatly earned his PhD in electrical engineering from Michigan State University. His research applies machine learning and signal processing to neural engineering, brain-computer interfaces, and neurodegenerative disease.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793806434/188e2a64-102f-49de-98cf-9de29567d570.png" },
    { id: "heba-el-deeb", name: "Heba El Deeb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-el-deghaidy", name: "Heba El-Deghaidy", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "h.eldeghaidy@aucegypt.edu", bio: "Heba El-Deghaidy earned her doctorate in science education from the University of Birmingham. Her work focuses on STEAM education, interdisciplinary learning, teacher development, educational technologies, and sustainability.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793878253/5871f327-a7b9-44d6-9a7f-4a9a32a4ee1c.png" },
    { id: "reem-el-degwi", name: "Reem El Degwi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "lameese-eldesouky", name: "Lameese Eldesouky", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "lameese.eldesouky@aucegypt.edu", bio: "Lameese Eldesouky earned her PhD in social and personality psychology from Washington University in St. Louis. Her research explores emotion regulation, personality, social relationships, and mental and physical health.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793733186/bb1880b9-50a2-4ef1-864c-1a0338e775dc.png" },
    { id: "lobna-el-dessouky", name: "Lobna El-Dessouky", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "tarek-el-domiaty", name: "Tarek El Domiaty", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nellie-el-enany", name: "Nellie El-Enany", department: "Department of Management", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nellie.elenany@aucegypt.edu", bio: "Nellie El-Enany studies identity, stigma, legitimacy, and entrepreneurship among marginalized groups and organizations. Her teaching research examines experiential learning, student identity, drama-based education, and innovative assessment.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1788470953/Nellie_El_Anany_hhsf3h.jpg" },
    { id: "raghda-el-essawi", name: "Raghda El Essawi", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "ressawi@aucegypt.edu", bio: "Raghda El Essawi earned her PhD from Al-Azhar University. Her work focuses on teaching Arabic as a foreign language, second-language acquisition, sociolinguistics, and educational technology.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786236836/Raghda_El_Essawi_ymgzcp.png" },
    { id: "ashraf-el-fiqi", name: "Ashraf El Fiqi", department: "Physics", displayDepartment: "PHYS", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "elfiqi@aucegypt.edu", bio: "Ashraf El Fiqi earned his PhD in physics from the University of Nevada, Reno. He has taught theoretical physics and held academic leadership positions at AUC, including physics department chair.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730076/a7cdb6ee-1b0d-4ec6-a697-8ef30300743a.png" },
    { id: "nadia-el-gamel", name: "Nadia El Gamel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amani-el-gammal", name: "Amani El-Gammal", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-el-gayar", name: "Mohamed El Gayar", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ingy-el-gazzar", name: "Ingy El Gazzar", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-el-gendy", name: "Ahmed El-Gendy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasmeen-el-ghazaly", name: "Yasmeen El-Ghazaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Yasmeen El-Ghazaly has taught American studies and feminist perspectives at AUC. Her research examines gender, nationalism, women's rights, and cultural attitudes toward women athletes in Egypt.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801188/b984772b-f2fe-48b2-b259-f2ef7013ac1c.png" },
    { id: "mohamed-el-hadidi", name: "Mohamed El-Hadidi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "salah-el-haggar", name: "Salah El Haggar", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "elhaggar@aucegypt.edu", bio: "Salah El Haggar earned his PhD from Washington State University. His research examines sustainable development, industrial ecology, cleaner production, renewable energy, waste management, and resource recycling.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793802889/52ced89c-0473-40f7-a3ff-8967fb4a0338.png" },
    { id: "moataz-el-helaly", name: "Moataz El Helaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Moataz El Helaly earned his PhD in management and accounting from Aston University. His research explores financial reporting standards, earnings management, related-party transactions, and corporate governance.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805694/85ae59e3-6f58-44da-9335-7782cee5860a.png" },
    { id: "amr-el-kadi", name: "Amr El-Kadi", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "elkadi@aucegypt.edu", bio: "Amr El-Kadi is a professor of computer systems engineering at AUC. His research spans operating systems, distributed and cloud computing, high-performance systems, software engineering, and professional ethics.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793560587/48421bd4-b7ea-45b0-9636-e62d3e20225a.png" },
    { id: "mohamed-elkaramany", name: "Mohamed Elkaramany", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "soha-elkassas", name: "Soha ElKassas", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khalil-elkhodary", name: "Khalil Elkhodary", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Khalil Elkhodary earned his PhD from North Carolina State University. His research focuses on multiscale mechanical modeling, computational biomechanics, cardiovascular simulation, and virtual and augmented reality for engineering education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801891/8e8f2edf-f400-40e2-874b-dad726ebfa6f.png" },
    { id: "rasha-el-kholy", name: "Rasha El Kholy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hoda-el-kolaly", name: "Hoda El Kolaly", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Hoda El Kolaly earned her PhD in business management from the University of Nottingham. Her research explores consumer engagement, service experiences, value creation, social media, and entrepreneurial marketing.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793731782/164e7853-e786-4306-8f99-9faa2d523c2e.png" },
    { id: "rehab-el-maghraby", name: "Rehab El-Maghraby", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "rehabelmaghraby@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "rabab-el-mahdi", name: "Rabab El Mahdi", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "relmahdi@aucegypt.edu", bio: "Rabab El Mahdi earned her PhD from McGill University. Her political science research examines social movements, state-civil society relations, democratic transitions, women's movements, and the political economy of social policy.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786236933/Rabab_El_Mahdi_wfis4f.png" },
    { id: "hanan-el-malla", name: "Hanan El Malla", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "reham-el-morally", name: "Reham El Morally", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-el-morsi", name: "Mohamed El Morsi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Mohamed El Morsi earned his PhD from the University of Wisconsin-Madison. His mechanical engineering research focuses on thermal-fluid systems, computational fluid dynamics, and renewable energy applications.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805720/f30b63e0-e2e9-4aac-967c-d6aba7484a17.png" },
    { id: "amr-el-mougy", name: "Amr El Mougy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Amr El Mougy earned his PhD from Queen's University in Canada. His research focuses on cybersecurity, cryptography, privacy, machine learning security, autonomous driving, and Internet of Things networks.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805459/eeb6794c-7c10-4836-964d-c1150c6fecd0.png" },
    { id: "seham-elmrayed", name: "Seham Elmrayed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mahmoud-el-nably", name: "Mahmoud El Nably", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-el-naghy", name: "Hanan El Naghy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shaymaa-el-nawawy", name: "Shaymaa El Nawawy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "waleed-el-nemr", name: "Waleed El-Nemr", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-elnur", name: "Ibrahim Elnur", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "ielnur@aucegypt.edu", bio: "Ibrahim Elnur is a political science scholar whose research examines development, political economy, migration, war and reconstruction, and public policy. He previously chaired AUC's political science department.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793731924/215e3966-c820-4c60-b0e6-45af3170226e.png" },
    { id: "mona-elrakhawy", name: "Mona Elrakhawy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mona-el-roby-saleh", name: "Mona El Roby Saleh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "tamer-el-said", name: "Tamer El Said", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-el-sayed", name: "Ahmed El Sayed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mayyada-el-sayed", name: "Mayyada El-Sayed", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mayyada@aucegypt.edu", bio: "Mayyada El-Sayed earned her PhD in chemical engineering and biotechnology from the University of Cambridge. Her research focuses on bioseparations, protein purification, chromatography, membrane processes, and environmental applications.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793962924/63b8de82-9202-45a3-93a2-0c3da0eec104.png" },
    { id: "salma-el-sayeh", name: "Salma El Sayeh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalia-el-serafy", name: "Dalia El Serafy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "walaa-el-sharkawy", name: "Walaa El Sharkawy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasser-el-shayeb", name: "Yasser El Shayeb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Yasser El Shayeb is a professor of rock engineering applications and former leader of AUC's Center of Excellence for Water. His work has supported water engineering education and applied research.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793827534/b153bb71-2d9a-4113-9778-892000328619.png" },
    { id: "sherif-el-sheemy", name: "Sherif El-Sheemy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "omar-el-shenety", name: "Omar El-Shenety", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maha-el-shinnawy", name: "Maha ElShinnawy", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mshinnawy@aucegypt.edu", bio: "Maha ElShinnawy earned her PhD from the University of California, Los Angeles. Her management research explores organizational leadership, change, group dynamics, virtual communication, ethics, and cultural influences on teamwork.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793878461/f6fd9a04-0c89-42ac-9695-caee5723aefa.png" },
    { id: "ahmed-el-sonbaty", name: "Ahmed El Sonbaty", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ghalia-el-srakbi", name: "Ghalia El Srakbi", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "ghalia.s@aucegypt.edu", bio: "Ghalia El Srakbi previously chaired AUC's graphic design department. She helped present exhibitions showcasing students' creative work and design responses to social challenges, sustainability, and cultural heritage.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793719462/dfbb6b56-3027-4366-b1ee-aceab7923efb.png" },
    { id: "asmaa-el-taher", name: "Asmaa El-Taher", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yomna-el-taweel", name: "Yomna El Taweel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-el-turky", name: "Dina El Turky", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amira-elwaan", name: "Amira Elwaan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherwat-elwan", name: "Sherwat Elwan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rehab-emad-el-din", name: "Rehab Emad El din", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "waled-emam", name: "Waled Emam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "aly-erfan", name: "Aly Erfan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Aly Erfan is a professor of practice in global affairs and a former Egyptian diplomat. His work draws on experience in conflict resolution, international relations, regional diplomacy, and public policy.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793800075/9a9e4c99-6156-4d59-87ae-164d3f47c16b.png" },
    { id: "amal-esawi", name: "Amal Esawi", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "a_esawi@aucegypt.edu", bio: "Amal Esawi earned her PhD in materials engineering from the University of Cambridge. Her research develops nanocomposites, lightweight structural materials, and membrane technologies for filtration and desalination.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793717967/ea700aef-d50c-4e8c-b6b0-1bfd39220c76.png" },
    { id: "ahmed-essam", name: "Ahmed Essam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "abdelmaged-essawey", name: "Abdelmaged Essawey", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "magdy-eteiba", name: "Magdy Eteiba", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-ezeldin", name: "Ahmed Ezeldin", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "abdel-ezz-el-arab", name: "Abdel Ezz El-Arab", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ezelarab@aucegypt.edu", bio: "Abdel Ezz El-Arab earned his PhD in Islamic Studies from McGill University. His research examines Middle Eastern economic history, Egypt's nineteenth- and twentieth-century economy, development, and project evaluation.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793716076/tluj5vzvqyrg2xapbgcf.png" },
    { id: "hagar-fadlallah", name: "Hagar Fadlallah", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-faheem", name: "Ahmed Faheem", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-fahmy", name: "Mohamed Fahmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shahira-fahmy", name: "Shahira Fahmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Shahira Fahmy earned her PhD from the Missouri School of Journalism. Her research examines visual communication, peace journalism, digital activism, emerging media technologies, and the portrayal of conflict.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793806475/64bc05cc-65da-4550-9028-7cb02fd85b85.png" },
    { id: "sherif-fahmy", name: "Sherif Fahmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Sherif Fahmy earned his PhD in mechanical and industrial engineering from the University of Manitoba. His research focuses on manufacturing systems, optimization, supply chains, transportation, and production planning.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793806508/acb5cb26-24b5-4231-9e30-f15175b1656e.png" },
    { id: "sherif-fakher", name: "Sherif Fakher", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mahmoud-farag", name: "Mahmoud Farag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasmin-farag", name: "Yasmin Farag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "karim-farahat", name: "Karim Farahat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "marian-fares", name: "Marian Fares", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "noah-farhadi", name: "Noah Farhadi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shadi-farid", name: "Shadi Farid", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalia-farouk", name: "Dalia Farouk", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-fathelbab", name: "Heba Fathelbab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Heba Fathelbab earned her master's degree in applied linguistics from AUC. Her work focuses on communicative language teaching, curriculum development, higher education assessment, teacher training, and educational identity.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805593/b3b0e3c9-2a5b-4fd3-bf92-6eb3c7b4a4db.png" },
    { id: "ahmed-fayed", name: "Ahmed Fayed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ashraf-fouad", name: "Ashraf Fouad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-fouad", name: "Dina Fouad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "jasmin-fouad", name: "Jasmin Fouad", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "jfouad@aucegypt.edu", bio: "Jasmin Fouad earned her PhD in finance from Cairo University. Her research and professional work span financial markets, corporate social responsibility, microfinance, foreign investment, and gender-responsive budgeting.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732351/e9d1a3d5-dc79-42bc-afdd-d3cd642174f7.png" },
    { id: "mai-fouad", name: "Mai Fouad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rania-fouad", name: "Rania Fouad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasser-gadallah", name: "Yasser Gadallah", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "aya-galal", name: "Aya Galal", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "galal-galal-edeen", name: "Galal Galal-Edeen", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "galaledeen@aucegypt.edu", bio: "Galal Galal-Edeen earned his PhD in information systems engineering from Brunel University. His research explores systems architecture, software engineering, human-computer interaction, usability, and technological innovation.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793802152/a19aa1c0-a12c-420d-8de3-94004076cda8.png" },
    { id: "alexandra-gazis", name: "Alexandra Gazis", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "atta-gebril", name: "Atta Gebril", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "agebril@aucegypt.edu", bio: "Atta Gebril earned his PhD in foreign language and ESL education from the University of Iowa. His research examines language assessment, second-language writing, test validation, and learning-oriented evaluation.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718600/6406d3e5-96c4-4615-8568-4144b4d8e772.png" },
    { id: "seham-ghalwash", name: "Seham Ghalwash", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "pascale-ghazaleh", name: "Pascale Ghazaleh", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "ghazaleh@aucegypt.edu", bio: "Pascale Ghazaleh earned her PhD in history from EHESS in Paris. Her research examines Ottoman history and nineteenth-century Egypt, including urban wealth, property, social relations, and Cairo's economic history.", image: "https://www.aucegypt.edu/sites/default/files/2024-04/pascale_ghazaleh-2.jpg" },
    { id: "dina-gomaa", name: "Dina Gomaa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-goubran", name: "Sherif Goubran", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "alexander-grechenko", name: "Alexander Grechenko", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "elena-grechenko", name: "Elena Grechenko", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "chelsea-green", name: "Chelsea Green", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "cgreen@aucegypt.edu", bio: "Chelsea Green directs AUC's music program and performs as a guitarist. She teaches music history, theory, ethnomusicology, entrepreneurship, and guitar performance, and develops educational resources and guitar arrangements.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718716/7e973fd9-60dd-4e32-8807-b72722f402f1.png" },
    { id: "minas-guirguis", name: "Minas Guirguis", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ali-hadi", name: "Ali Hadi", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahadi@aucegypt.edu", bio: "Ali Hadi earned his PhD from New York University and previously taught at Cornell. He founded AUC's actuarial science and data science programs and works in mathematical statistics.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793717875/39f59e45-48c6-47a7-9ddc-332251e3de5d.png" },
    { id: "may-haggag", name: "May Haggag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "May Haggag earned her PhD in civil engineering from McMaster University. Her research focuses on disaster-risk mitigation, structural resilience, infrastructure performance, and methods for improving construction engineering systems.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793879515/c94e98b7-4888-4d5c-ac35-e533bfb2a699.png" },
    { id: "fouad-halbouni", name: "Fouad Halbouni", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maryam-hamdy", name: "Maryam Hamdy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ola-hamdy", name: "Ola Hamdy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-hamed", name: "Ahmed Hamed", department: "Physics", displayDepartment: "PHYS", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmed.mhamed@aucegypt.edu", bio: "Ahmed Hamed earned his PhD in experimental high-energy nuclear physics from Wayne State University. His work includes particle and nuclear collisions through the STAR collaboration at Brookhaven National Laboratory.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801925/2fc66884-6c80-4e47-beb7-339178f54195.png" },
    { id: "heba-hanafy", name: "Heba Hanafy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nelly-hanna", name: "Nelly Hanna", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nhanna@aucegypt.edu", bio: "Nelly Hanna earned her doctorate from the University of Aix-en-Provence. Her research explores the social, economic, and cultural history of Ottoman Egypt, especially merchants and urban life in Cairo.", image: "https://www.aucegypt.edu/sites/default/files/2023-10/nelly_hanna.jpg" },
    { id: "john-harris", name: "John Harris", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ola-hashad", name: "Ola Hashad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-hassan", name: "Ahmed Hassan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-hassan", name: "Mohamed Hassan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nora-hassan", name: "Nora Hassan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hamed-hassouna", name: "Hamed Hassouna", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-hatem", name: "Mohamed Hatem", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "michel-hebert", name: "Michel Hebert", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mhebert@aucegypt.edu", bio: "Michel Hebert earned his PhD from Laval University and is a professor emeritus of mathematics at AUC. His research focuses on category theory, mathematical logic, and universal algebra.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793963032/ebfdf706-25f3-4158-bc03-d02850ff02f0.png" },
    { id: "gerda-heck", name: "Gerda Heck", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "gerda.heck@aucegypt.edu", bio: "Gerda Heck is a sociologist whose work examines migration, borders, urban communities, transnational networks, religion, and citizenship. She also contributes to AUC's Center for Migration and Refugee Studies.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793877952/823d2147-1b2b-44e9-9309-23788dfbb3f2.png" },
    { id: "mostafa-hefny", name: "Mostafa Hefny", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mostafa.hefny@aucegypt.edu", bio: "Mostafa Hefny earned his PhD in political science from Columbia University. His research examines labor organization, political autonomy, revolution, democratization, and the political economy of contemporary Egypt.", image: "https://www.aucegypt.edu/sites/default/files/hefny.pic_1.jpg" },
    { id: "hesham-hegazi", name: "Hesham Hegazi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-hegazy", name: "Hanan Hegazy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-hegazy", name: "Ibrahim Hegazy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-hegazy", name: "Mohamed Hegazy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-helmy", name: "Ahmed Helmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "kamila-helmy", name: "Kamila Helmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "omneya-helmy", name: "Omneya Helmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "michelle-henry", name: "Michelle Henry", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-heshmat", name: "Dina Heshmat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "dina.heshmat@aucegypt.edu", bio: "Dina Heshmat teaches modern and contemporary Arabic literature at AUC. Her research explores how urban history and social change appear in literature and cinema, alongside gender and cultural narratives.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730743/9487dd54-2f66-474b-91d8-0e6d11852902.png" },
    { id: "rana-hindy", name: "Rana Hindy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "john-hoey", name: "John Hoey", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "John Hoey is a theatre designer and educator specializing in scenic and lighting design. His work spans stage production, visual storytelling, design practice, and collaborative theatrical performance.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805631/d88bb845-d19a-4178-bb5c-cec865e6d929.png" },
    { id: "dina-hosni", name: "Dina Hosni", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ossama-hosny", name: "Ossama Hosny", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-ibrahim", name: "Ibrahim Ibrahim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-ibrahim", name: "Mohamed Ibrahim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "youssra-ibrahim", name: "Youssra Ibrahim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "salima-ikram", name: "Salima Ikram", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "salima@aucegypt.edu", bio: "Salima Ikram is an Egyptologist whose research focuses on ancient Egyptian burial practices, mummification, archaeozoology, and cultural heritage. She combines archaeological fieldwork with museum studies and public education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801812/f9729669-8af8-4467-91bc-8b987778d7b6.png" },
    { id: "maged-iskandar", name: "Maged Iskandar", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "howaida-ismaeel", name: "Howaida Ismaeel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "samah-ismaeil", name: "Samah Ismaeil", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ayman-ismail", name: "Ayman Ismail", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "aymanism@aucegypt.edu", bio: "Ayman Ismail earned his PhD from MIT and directs entrepreneurship initiatives at AUC. His work focuses on innovation, emerging-market ventures, entrepreneurial ecosystems, venture capital, and economic development.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730182/eab80d96-d68f-44d6-8ddc-b234713594ff.png" },
    { id: "mohamed-ismail", name: "Mohamed Ismail", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yehea-ismail", name: "Yehea Ismail", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-kais", name: "Amr Kais", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "andreas-kakarougkas", name: "Andreas Kakarougkas", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "a.kakarougkas@aucegypt.edu", bio: "Andreas Kakarougkas is a molecular and cellular biologist whose research investigates DNA damage and repair, cancer biology, and the effects of environmental stressors on cells.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730132/40e5103b-afad-4016-94d0-c117aacad711.png" },
    { id: "laila-kamal", name: "Laila Kamal", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "abeer-kamel", name: "Abeer Kamel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "bassel-kamel", name: "Bassel Kamel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "omar-kandeel", name: "Omar Kandeel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "aly-kandil", name: "Aly Kandil", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nariman-kandil", name: "Nariman Kandil", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-karkouti", name: "Ibrahim Karkouti", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "ibrahim.karkouti@aucegypt.edu", bio: "Ibrahim Karkouti researches higher education, social justice, diversity, and support for students and educators. His work explores educational policy, technology, refugee experiences, and equitable learning environments.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793731977/e184ede7-658e-4704-bb38-a2c9e1765115.png" },
    { id: "fotna-kassabgy", name: "Fotna Kassabgy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maye-kassem", name: "Maye Kassem", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mayekasm@aucegypt.edu", bio: "Maye Kassem earned her PhD from SOAS, University of London. Her comparative politics research focuses on Egyptian governance, authoritarianism, democratization, political Islam, and Middle Eastern political systems.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793962732/89a5206e-56c0-49fa-812c-0f4eb1364ca5.png" },
    { id: "evette-khair", name: "Evette Khair", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "lobna-khairy", name: "Lobna Khairy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amany-khalifa", name: "Amany Khalifa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "moustafa-khalil", name: "Moustafa Khalil", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "gurusewak-khalsa", name: "Gurusewak Khalsa", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "g.khalsa@aucegypt.edu", bio: "Gurusewak Khalsa earned his doctorate in counseling psychology from the University of Northern Colorado. His work focuses on cross-cultural mental health, psychotherapy, resilience, and psychological adaptation.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793719534/de2e371d-fcd8-4a03-a966-c5c49a8cc6a6.png" },
    { id: "ahmad-khan", name: "Ahmad Khan", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmad.khan@aucegypt.edu", bio: "Ahmad Khan earned his doctorate from the University of Oxford. His research examines Islamic intellectual history, Sunni religious traditions, Islamic jurisprudence, Qur'anic commentary, and medieval Islamic scholarship.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793649232/tzb5lmbtaprwcggkwgvg.png" },
    { id: "safwan-khedr", name: "Safwan Khedr", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "abdelaziz-khlaifat", name: "Abdelaziz Khlaifat", department: "Petroleum Engineering", displayDepartment: "PENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "abdelaziz.khlaifat@aucegypt.edu", bio: "Abdelaziz Khlaifat earned his PhD in chemical engineering from Illinois Institute of Technology. His research focuses on petroleum reservoir engineering, enhanced oil recovery, porous media, and carbon sequestration.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801521/9026c223-5881-47ca-a449-77c0a5a982be.png" },
    { id: "hanan-kholoussy", name: "Hanan Kholoussy", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hkholoussy@aucegypt.edu", bio: "Hanan Kholoussy earned her PhD in history and Middle Eastern studies from New York University. Her research examines modern Egypt, marriage, gender relations, social history, and Islamic legal institutions.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793719674/e0d43298-f40c-43d3-a1ae-35c02dbaebf3.png" },
    { id: "malek-khouri", name: "Malek Khouri", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mkhouri@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-kotb", name: "Heba Kotb", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hebakotb@aucegypt.edu", bio: "Heba Kotb earned her doctorate in education and teaches psychology at AUC. Her work spans child development, inclusive education, parenting programs, and training caregivers for children without parental care.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793731611/d4074f57-eb98-425d-99d9-2f8660b137bc.png" },
    { id: "susy-kotit", name: "Susy Kotit", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sean-lee", name: "Sean Lee", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sean.lee@aucegypt.edu", bio: "Sean Lee earned his PhD in political science from Northwestern University. His research examines minority communities during conflict, comparative politics, ethnicity, and political dynamics in Lebanon and Syria.", image: "https://www.aucegypt.edu/sites/default/files/2019-08/oib.jpg" },
    { id: "tamara-maatouk", name: "Tamara Maatouk", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "tamara.maatouk@aucegypt.edu", bio: "Tamara Maatouk earned her PhD in history from the City University of New York. Her research examines Egyptian cinema, socialism, public filmmaking, and film as cultural and social history.", image: "https://www.aucegypt.edu/sites/default/files/2025-09/Tamara%20Maatouk.jpg" },
    { id: "tarek-madkour", name: "Tarek Madkour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-mahmoud", name: "Dina Mahmoud", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "dina-mahmoud@aucegypt.edu", bio: "Dina Mahmoud earned her PhD in computer and communication sciences from EPFL. Her research focuses on hardware security, FPGA-based systems, secure computing architectures, fault injection, and system reliability.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805516/419f647a-8b43-4e30-b40f-9b4f81306321.png" },
    { id: "mostafa-mahmoud", name: "Mostafa Mahmoud", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sanaa-makhlouf", name: "Sanaa Makhlouf", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-makhlouf", name: "Sherif Makhlouf", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "habib-maki", name: "Maki Habib", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "maki@aucegypt.edu", bio: "Maki Habib earned his doctorate in intelligent and autonomous robotics from the University of Tsukuba. His research and teaching focus on robotics, mechatronics, intelligent systems, and engineering applications.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730878/7062d2fa-26db-43a0-beee-ca97d9307b56.png" },
    { id: "wael-mamdouh", name: "Wael Mamdouh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohy-mansour", name: "Mohy Mansour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mariam-marei", name: "Mariam Marei", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "islam-mashaly", name: "Islam Mashaly", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "islammashaly@aucegypt.edu", bio: "Islam Mashaly earned his PhD in architecture and the built environment from Queensland University of Technology. His work explores sustainable buildings, daylighting, energy efficiency, building information modeling, and digital twins.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793802115/1986e621-32a5-4706-beb1-d361ed6d6440.png" },
    { id: "joseph-massad", name: "Joseph Massad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "joseph.massad@aucegypt.edu", bio: "Joseph Massad earned his PhD from Columbia University and studies identity and culture. His scholarship explores nationalism, sexuality, race, religion, settler colonialism, and modern Arab intellectual history.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732788/f9ea9a19-69a2-4935-bff3-50d77b811608.png" },
    { id: "javed-maswood", name: "Javed Maswood", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-matbouli", name: "Heba Matbouli", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "reda-mazloum", name: "Reda Mazloum", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "william-melaney", name: "William Melaney", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hakim-meshriki", name: "Hakim Meshreki", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hmeshreki@aucegypt.edu", bio: "Hakim Meshreki is a marketing professor whose research examines consumer behavior, branding, international marketing, country-of-origin effects, entrepreneurship, and family businesses. His professional experience includes business management and consulting.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730992/c1229096-bcf2-412e-92ba-b3ebfca5f2f1.png" },
    { id: "michael-messiha", name: "Michael Messiha", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "euan-metz", name: "Euan Metz", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "euan.metz@aucegypt.edu", bio: "Euan Metz earned his doctorate in philosophy from the University of Reading. His research focuses on normativity, practical reasons, metaethics, the philosophy of action, and ethical obligations.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793560986/f912336a-beac-489d-87d5-594405c19c17.png" },
    { id: "mikhail-mikhail", name: "Mikhail Mikhail", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mikhail@aucegypt.edu", bio: "Mikhail Mikhail founded AUC's computer science department and pioneered its computer science degree in 1985. His academic work includes numerical analysis, computing education, and engineering program development.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793826625/895714eb-78a1-467c-80e3-46a36711aa1a.png" },
    { id: "daria-mizza", name: "Daria Mizza", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "daria.mizza@aucegypt.edu", bio: "Daria Mizza researches curriculum, teaching methodology, and educational technology. Her scholarship emphasizes instructional design, blended language learning, universal design, and innovative teaching across schools and higher education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730567/0a7bac9f-06ae-4fba-98b6-a1dfdf27b5ba.png" },
    { id: "abeer-mohamed", name: "Abeer Mohamed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nabil-mohareb", name: "Nabil Mohareb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-mohib", name: "Ahmed Mohib", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "martin-moraw", name: "Martin Moraw", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maggie-morgan", name: "Maggie Morgan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ian-morrison", name: "Ian Morrison", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "imorrison@aucegypt.edu", bio: "Ian Morrison earned his PhD in sociology from York University. His research examines nationalism, identity, religion, political subjectivity, psychoanalytic theory, and critical thought across the Global South.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793731862/a968cff7-9d84-474f-9baa-9c59ab783667.png" },
    { id: "ola-morsy", name: "Ola Morsy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-mostafa", name: "Ahmed Mostafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "magda-mostafa", name: "Magda Mostafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "salwa-mostafa", name: "Salwa Mostafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "youssef-mostafa", name: "Youssef Mostafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "lobna-mourad", name: "Lobna Mourad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maha-mourad", name: "Maha Mourad", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "m_mourad@aucegypt.edu", bio: "Maha Mourad earned her PhD from the University of Nottingham and teaches marketing at AUC. Her research focuses on brand equity, services, innovation marketing, and higher education marketing.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793733426/33e5427b-00ce-4c50-bc03-7201f6547bc3.png" },
    { id: "hanan-moussa", name: "Hanan Moussa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Hanan Moussa studies information systems, software engineering, requirements management, digital transformation, and project estimation. Her academic research draws on extensive professional experience in IT delivery and quality management.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805568/49c91689-66bd-44d1-9765-332fda861666.png" },
    { id: "ahmed-moustafa", name: "Ahmed Moustafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "amoustafa@aucegypt.edu", bio: "Ahmed Moustafa earned his PhD in genetics from the University of Iowa. His bioinformatics research uses genomics and machine learning to study human genetics, microbiomes, health, and disease.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805473/nnfua4zvlrtkurjrfti7.jpg" },
    { id: "rida-moustafa", name: "Rida Moustafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mark-muehlhaeusler", name: "Mark Muehlhaeusler", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "isabel-muller", name: "Isabel Müller", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "isabel.muller@aucegypt.edu", bio: "Isabel Müller earned her PhD in mathematics from the University of Münster. Her work focuses on mathematical logic, model theory, infinite permutation groups, homogeneous structures, and geometric group theory.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732120/f094c3e0-6c2e-4775-99c4-459990310e78.png" },
    { id: "maha-muttardi", name: "Maha Muttardi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "peter-nasr", name: "Peter Nasr", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khalid-nassar", name: "Khalid Nassar", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ashraf-nassef", name: "Ashraf Nassef", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "nassef@aucegypt.edu", bio: "Ashraf Nassef is a professor of mechanical engineering at AUC. His research explores structural and topology optimization, evolutionary algorithms, manufacturing systems, and computational approaches to engineering design.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730371/4c8f6981-af76-428d-8b07-08052f308ec0.png" },
    { id: "haytham-nawar", name: "Haytham Nawar", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "Haytham.nawar@aucegypt.edu", bio: "Haytham Nawar is an artist, designer, and scholar of visual communication. He has led AUC's arts department and founded Cairotronica, a festival dedicated to electronic and new media arts.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793802078/fa8b1303-4e79-498a-86ef-0a3db5ef303b.png" },
    { id: "ahmed-nawara", name: "Ahmed Nawara", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maya-nicolas", name: "Maya Nicolas", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "maya.nicolas@aucegypt.edu", bio: "Maya Nicolas earned her PhD in biomedical sciences from KU Leuven. Her research examines molecular genetics, neural development and regeneration, Alzheimer's disease, Parkinson's disease, and scientific education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793879550/bc49f83b-cf26-4ad7-a2be-f05b35b8d8e2.png" },
    { id: "mohamed-noaman", name: "Mohamed Noaman", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "bernard-o-kane", name: "Bernard O'Kane", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "bokane@aucegypt.edu", bio: "Bernard O'Kane researches Islamic art and architecture, especially Egypt and Iran. His scholarship covers historic mosques, epigraphy, tilework, photography, and the monumental inscriptions of Cairo.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793560796/465356fd-4c1f-408b-bdb9-95cf14443e16.png" },
    { id: "iman-omary", name: "Iman Omary", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-orabi", name: "Mohamed Orabi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "moustafa-oraby", name: "Moustafa Oraby", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-radwan", name: "Ahmed Radwan", department: "Construction Engineering", displayDepartment: "CENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahosney@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "basma-rady", name: "Basma Rady", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-rafea", name: "Ahmed Rafea", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "rafea@aucegypt.edu", bio: "Ahmed Rafea earned his PhD in computer science from Paul Sabatier University. His research develops artificial intelligence, expert systems, knowledge engineering, data mining, and machine translation applications.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793729565/3f3fb875-b3ca-46bb-a750-4db77c6e02e9.png" },
    { id: "david-rafferty", name: "David Rafferty", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "david.rafferty@aucegypt.edu", bio: "David Rafferty earned his doctorate in music from McGill University. His work combines composition and technology, including audio processing, spatial sound, digital performance, recording, and music technology education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793560887/f1eb633e-cd5d-46a4-9ac3-8b7453b3c041.png" },
    { id: "youssef-ragheb", name: "Youssef Ragheb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherine-ramzy", name: "Sherine Ramzy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-rashwan", name: "Mohamed Rashwan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-rateb", name: "Dina Rateb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "elizabeth-rauh", name: "Elizabeth Rauh", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "elizabeth.rauh@aucegypt.edu", bio: "Elizabeth Rauh researches modern art and visual cultures of Iraq, Iran, and the Persian Gulf. Her scholarship examines Islamic artistic traditions, image-making technologies, and environmental art practices.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793649353/b4jmn5aslmihjz0xjty3.png" },
    { id: "rasha-reda", name: "Rasha Reda", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalia-refaat", name: "Dalia Refaat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-refai", name: "Ahmed Refai", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "areej-remah", name: "Areej Remah", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "h-rizzo", name: "H. Rizzo", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hrizzo@aucegypt.edu", bio: "Helen Rizzo is a sociologist whose research examines gender inequality, women's rights, public opinion, and democratization. Her work also explores activism against sexual harassment and gender-based violence in Egypt.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793561165/c605ba76-bb09-4485-80ff-3284e20b8e8f.png" },
    { id: "elena-romeo", name: "Elena Romeo", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "thomas-rule", name: "Thomas Rule", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Thomas Rule earned his PhD in philosophy from the University of California, Santa Cruz. His research examines existential meaning, philosophical anthropology, ethics, and thinkers including Heidegger and Nietzsche.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786375436/thomas_rule_iicyfh.jpg" },
    { id: "abd-elnasser-saad", name: "Abd-Elnasser Saad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "noha-saada", name: "Noha Saada", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-saafan", name: "Ahmed Saafan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-sabea", name: "Hanan Sabea", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hsabea@aucegypt.edu", bio: "Hanan Sabea is an anthropologist whose research explores land, labor, history, and political economy in Africa. Her work also examines decolonization, knowledge production, migration, and social transformation.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793731232/bdf4b188-c1dc-4f3f-90aa-58456ca46d05.png" },
    { id: "nouran-sabry", name: "Nouran Sabry", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "wafaa-sabry", name: "Wafaa Sabry", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-sadek", name: "Amr Sadek", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sara-sadek", name: "Sara Sadek", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "suzanne-safwat", name: "Suzanne Safwat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nermine-said", name: "Nermine Said", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Nermine Said is a costume designer and educator whose work spans theatre, cinema, and installations. Her research explores costume history, character psychology, visual symbolism, and performative design.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793806384/365d363d-9981-4774-b933-d400323009f5.png" },
    { id: "fayrouz-sakr-ashour", name: "Fayrouz Sakr-Ashour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "fayrouz.ashour@aucegypt.edu", bio: "Fayrouz Sakr-Ashour earned public health qualifications from Johns Hopkins and studies nutrition in vulnerable populations. Her research explores food insecurity, child undernutrition, aging, social isolation, and food policy.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730927/c18d2a65-8c11-4181-af30-26f81dc931f6.png" },
    { id: "rana-salah-eldeen", name: "Rana Salah Eldeen", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasmine-salah-el-din", name: "Yasmine Salah El-Din", department: "English Language Instruction", displayDepartment: "ELI", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "yasmine@aucegypt.edu", bio: "Yasmine Salah El-Din teaches academic English and linguistics at AUC. Her research examines sociolinguistics, discourse analysis, corrective feedback, reading and writing assessment, and service-learning pedagogy.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793802754/9750d996-8247-48bd-945d-9d08c96fbf32.png" },
    { id: "steven-salaita", name: "Steven Salaita", department: "English and Comparative Literature", displayDepartment: "ECLT", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-salama", name: "Ahmed Salama", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "cherif-salama", name: "Cherif Salama", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "cherif.salama@aucegypt.edu", bio: "Cherif Salama earned his PhD in computer science from Rice University. His research covers computer architecture, hardware description languages, programming languages, computer-aided design, parallel computing, and artificial intelligence.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730447/807bc24b-f417-443d-abc7-cd701d0865d6.png" },
    { id: "mohamed-salama", name: "Mohamed Salama", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-saleh", name: "Dina Saleh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khaled-saleh", name: "Khaled Saleh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nesma-saleh", name: "Nesma Saleh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanadi-salem", name: "Hanadi Salem", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hgsalem@aucegypt.edu", bio: "Hanadi Salem earned her PhD in mechanical engineering from Texas A&M University. Her academic work focuses on materials and manufacturing, and she has held engineering and university leadership positions.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793731177/761ba0bb-ff18-4743-b209-e955243a791a.png" },
    { id: "maram-salem", name: "Maram Salem", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-sallam", name: "Ahmed Sallam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khaled-samaha", name: "Khaled Samaha", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "ksamaha@aucegypt.edu", bio: "Khaled Samaha earned his PhD from Manchester Business School. His research and teaching address financial reporting, international accounting standards, auditing, accounting regulation, and corporate financial transparency.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793733022/829b75f8-de51-471d-b8d7-796a38bfb784.png" },
    { id: "naglaa-samir", name: "Naglaa Samir", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rania-samir", name: "Rania Samir", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmad-saqfalhait", name: "Ahmad Saqfalhait", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmad.saqfalhait@aucegypt.edu", bio: "Ahmad Saqfalhait earned his MFA in graphic design from Tama Art University in Japan. His work explores cross-cultural visual communication, experience design, Arabic posters, game design, and design education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793729230/1e233fae-dfb8-471b-b560-2ea009993df6.png" },
    { id: "ezzeldin-sayed-ahmed", name: "Ezzeldin Sayed-Ahmed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ariane-schneck", name: "Ariane Schneck", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Ariane Schneck earned her PhD in philosophy from Humboldt University Berlin. Her research examines early modern thought, Descartes, Elisabeth of Bohemia, free will, feminist philosophy, and emotions.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718405/d5443166-7029-4cfa-8c26-7c1cc6278d39.png" },
    { id: "olivier-schouteden", name: "Olivier Schouteden", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "olivier.schouteden@aucegypt.edu", bio: "Olivier Schouteden earned his PhD in world history from Northeastern University. His research explores European imperialism, travel and exploration, French colonialism in Indochina, and global historical connections.", image: "https://www.aucegypt.edu/sites/default/files/2025-01/20190910-_dsc4926-2_0.jpg" },
    { id: "manuel-schwab", name: "Manuel Schwab", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "manuel.schwab@aucegypt.edu", bio: "Manuel Schwab earned his PhD from Columbia University. His anthropological research examines value, humanitarian aid, military power, economic subjectivities, and experiences of violence and displacement in Sudan.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793878819/c3bc410c-c855-486c-ab81-038a02c65da7.png" },
    { id: "sherif-sedky", name: "Sherif Sedky", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "brenda-segone", name: "Brenda M. Segone", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Brenda Segone is an art historian, writer, and artist whose research explores Egyptian modern art, postcolonial identities, intercultural representation, creativity, and connections between painting, literature, and cinema.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793730599/5eee419a-5ad5-4fed-a86c-e0b1af79e652.png" },
    { id: "aya-selim", name: "Aya Selim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalia-selim", name: "Dalia Selim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "miral-selim", name: "Miral Selim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "engy-serag", name: "Engy Serag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-serag", name: "Mohamed Serag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Mohamed Serag is a professor emeritus of Islamic law. His scholarship examines Islamic legal theory, contracts, inheritance, trusts, banking, and jurisprudence across historical and contemporary contexts.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805759/2ca2d759-ed45-4a0b-8de7-7b4e8810aade.png" },
    { id: "mohamed-serry", name: "Mohamed Serry", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Mohamed Serry earned his PhD in mechanical and industrial engineering from the University of Toronto. His research focuses on microfabrication, nanosensors, MEMS technologies, graphene, and biomedical sensing.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793805788/c5742058-796f-4d1c-bd70-4249f50b35dd.png" },
    { id: "sherif-sewiha", name: "Sherif Sewiha", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-shaarawi", name: "Amr Shaarawi", department: "Physics", displayDepartment: "PHYS", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "shaarawi@aucegypt.edu", bio: "Amr Shaarawi earned his doctorate from Virginia Tech and has served as AUC's provost. His physics research examines photonic bandgap materials, pulsed electromagnetic beams, and broadband wave propagation.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793729990/40288fc1-f3ba-4e1f-98a1-381df41b2a8e.png" },
    { id: "hesham-shafick", name: "Hesham Shafick", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "reem-shaheed", name: "Reem Shaheed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmad-shahin", name: "Ahmad Shahin", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "irene-shaker", name: "Irene Shaker", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ismail-shaker", name: "Ismail Shaker", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "may-shalaby", name: "May Shalaby", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-shalan", name: "Mohamed Shalan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hamed-shamma", name: "Hamed Shamma", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hossam-sharara", name: "Hossam Sharara", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hossam.sharara@aucegypt.edu", bio: "Hossam Sharara earned his PhD in computer science from the University of Maryland. His research focuses on relational machine learning, data mining, social networks, and large-scale analytics.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732019/105262d0-4c46-4c9a-bf2b-e237a11824ec.png" },
    { id: "tarek-shawki", name: "Tarek Shawki", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Tarek Shawki is a mechanical engineering professor and former AUC engineering dean. His work spans fracture mechanics, dynamic plasticity, and information technology in science and mathematics education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801960/9d0967ff-fef0-4f39-b843-8a4c77252b89.png" },
    { id: "nermeen-shehata", name: "Nermeen Shehata", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nader-shenouda", name: "Nader Shenouda", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-sherif", name: "Ahmed Sherif", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nagwa-sherif", name: "Nagwa Sherif", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shahdan-sherif", name: "Shahdan Sherif", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amro-shetta", name: "Amro Shetta", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hania-sholkamy", name: "Hania Sholkamy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hanias@aucegypt.edu", bio: "Hania Sholkamy earned her PhD in anthropology from the London School of Economics. Her research focuses on poverty, social protection, women's empowerment, reproductive health, and gender-responsive welfare policy.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793801859/45ad174c-2f07-4eed-a51a-37ac765d8244.png" },
    { id: "marwah-siam", name: "Marwah Siam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sarah-smierciak", name: "Sarah Smierciak", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sarah.smierciak@aucegypt.edu", bio: "Sarah Smierciak earned her PhD in Middle East studies from the University of Oxford. Her research examines development, inequality, corruption, political economy, and business-state relations in Egypt.", image: "https://www.aucegypt.edu/sites/default/files/2023-10/20230905-_dsc2079%20%281%29.jpg" },
    { id: "ezzeldin-soliman", name: "Ezzeldin Soliman", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "marwa-soliman", name: "Marwa Soliman", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "marwasol@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-swillam", name: "Mohamed Swillam", department: "Physics", displayDepartment: "PHYS", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "m.swillam@aucegypt.edu", bio: "Mohamed Swillam earned his PhD from McMaster University. His research develops nanophotonic and plasmonic devices, silicon photonics, optical systems, metamaterials, and technologies for biomedical and energy applications.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793802035/e052515f-d6ad-4acd-b6b7-f7b2b10a9a5a.png" },
    { id: "robert-switzer", name: "Robert Switzer", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "switzer@aucegypt.edu", bio: "Robert Switzer earned his PhD from Pennsylvania State University. His philosophical interests include the history of philosophy, continental thought, economic development ethics, and the philosophy of music.", image: "https://www.aucegypt.edu/sites/default/files/2024-03/Robert%20Switzer%20-%20Low%20res%20240%20kb%20%281231x2000%29.jpeg" },
    { id: "maryam-taghavi", name: "Maryam Taghavi", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "maryam.taghavi@aucegypt.edu", bio: "Maryam Taghavi is an interdisciplinary artist and educator whose work combines painting, sculpture, installation, and performance. Her practice explores language, perception, cultural memory, calligraphy, and abstraction.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793879328/1fec9da9-8ddf-4e4a-8722-7958567b7e8c.png" },
    { id: "adam-talib", name: "Adam Talib", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "atalib@aucegypt.edu", bio: "Adam Talib earned his doctorate from the University of Oxford. His research explores classical Arabic poetry, literary history, comparative literary traditions, rhetoric, philology, and translation.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793560521/19723afa-0308-433b-8d8a-41d00b33575e.png" },
    { id: "hatem-tallima", name: "Hatem Tallima", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Hatem Tallima earned his PhD in biochemistry from Cairo University before joining AUC. His work focuses on medicinal chemistry, drug development, vaccines, tropical diseases, and cancer research.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793731567/400cf43d-65c1-40d4-8b96-14cfacfc57cd.png" },
    { id: "imane-tarkhan", name: "Imane Tarkhan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "islam-tharwat", name: "Ismaeel Tharwat", department: "Economics", displayDepartment: "ECON", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Ismaeel Tharwat earned his PhD in economics from Paris-Saclay University before joining AUC. His work focuses on innovation, trade, development, entrepreneurship, and sports economics.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793732232/9b9481ab-48d0-424d-ac7a-da7dd8d6b70b.png" },
    { id: "ahmed-tolba", name: "Ahmed Tolba", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmedtolba@aucegypt.edu", bio: "Ahmed Tolba earned his PhD from George Washington University before joining AUC. His work focuses on branding, innovation, online marketing, social marketing, and entrepreneurship.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793717666/ce8175d2-f34b-4b2a-969c-7d73b20f62ab.png" },
    { id: "alessandro-topa", name: "Alessandro Topa", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "a.topa@aucegypt.edu", bio: "Alessandro Topa earned his PhD in philosophy from the University of Bonn before joining AUC in 2009. His work focuses on Kant, Peirce, semiotics, logic, and practical philosophy.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793559770/90a70470-6bf5-4541-a256-181a5df5ee44.png" },
    { id: "rabab-wahba", name: "Rabab Wahba", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dahlia-wahdan", name: "Dahlia Wahdan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rasha-wahieb", name: "Rasha Wahieb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "martena-william", name: "Martena William", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shahira-yacout", name: "Shahira Yacout", department: "Arabic Language Instruction", displayDepartment: "ALI", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "yacout@aucegypt.edu", bio: "Shahira Yacout earned her MA in teaching Arabic as a foreign language from AUC. Her work focuses on Arabic instruction, curriculum development, assessment, and immersion programs.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786029228/Shahira_Yacout_hihddh.png" },
    { id: "nancy-yassa", name: "Nancy Yassa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maaly-younis", name: "Maaly Younis", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mostafa-youssef", name: "Mostafa Youssef", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "MOSTAFA.YOUSSEF@aucegypt.edu", bio: "Mostafa Youssef earned his PhD from MIT before joining AUC in 2017. His work focuses on computational nuclear materials and ceramic thermodynamics.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786029047/Mostafa_Youssef_njznek.jpg" },
    { id: "moustafa-youssef", name: "Moustafa Youssef", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "moustafa-youssef@aucegypt.edu", bio: "Moustafa Youssef is a professor and founder of Egypt’s Wireless Research Center of Excellence. His work focuses on wireless networks, mobile computing, positioning, pervasive computing, and network security.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793962616/725826ae-2829-4596-95a8-a78121a3e2fe.png" },
    { id: "noha-youssef", name: "Noha Youssef", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nayoussef@aucegypt.edu", bio: "Noha Youssef earned her PhD from the London School of Economics before joining AUC in 2012. She previously worked at LSE as a research associate and teaching fellow.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786028794/Noha_Youssef_vw2ddh.png" },
    { id: "youssri-youssri-ahmed", name: "Youssri Youssri Ahmed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "malak-zaalouk", name: "Malak Zaalouk", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mz@aucegypt.edu", bio: "Malak Zaalouk is an education scholar and founding director of AUC's Middle East Institute for Higher Education. Her work promotes teacher development, educational reform, girls' education, and social equity.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793878662/795a8187-f4a4-4c5d-9de5-6aea17dabf5f.png" },
    { id: "angie-zaher", name: "Angie Zaher", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "angie.zaher@aucegypt.edu", bio: "Angie Abdel Zaher earned her PhD in accounting from Florida International University before joining AUC. Her work focuses on corporate governance, finance, and accounting education.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793718170/8c471e1b-9306-4225-b3d3-70e704ef3a20.png" },
    { id: "aida-zakaria", name: "Aida Zakaria", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nour-zaki", name: "Nour Zaki", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nourzaki@aucegypt.edu", bio: "Nour Zaki is an assistant professor of developmental psychology and director of AUC’s Attachment Lab. Her work focuses on childhood attachment, adult development, and intergenerational relationships.", image: "https://www.aucegypt.edu/sites/default/files/2025-12/dsc00069_2.jpg" },
    { id: "hassan-zaky", name: "Hassan Zaky", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hzaky@aucegypt.edu", bio: "Hassan Zaky earned his PhD from Johns Hopkins University before joining AUC. His work focuses on demography, population health, fertility, surveys, and health policy.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793878106/10a24e7f-1de1-43b9-9bee-a923d2722177.png" },
    { id: "heba-t-allah-zaky", name: "Heba T-allah Zaky", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rana-abdelaziz", name: "Rana Abdelaziz", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "ranasalah@aucegypt.edu", bio: "Rana Abdelaziz earned her doctorate in statistics from Cairo University. Her research focuses on mathematical statistics, reliability engineering, lifetime distributions, accelerated life testing, competing risks, and statistical inference.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793963956/dab27bf6-a2a2-4df8-bfc0-cf2f74e7b5bd.png" },
    { id: "anastasia-gkoliomyti", name: "Anastasia Gkoliomyti", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "anastasia.gkoliomyti@aucegypt.edu", bio: "Anastasia Gkoliomyti earned her PhD in architecture from Tokyo Institute of Technology. Her research explores urban design, material culture, vernacular dwelling, architectural knowledge, and community-based design.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793964052/f05000a6-656d-471f-84dd-99f63934f31e.png" },
    { id: "ahmed-gowida", name: "Ahmed Gowida", department: "Petroleum Engineering", displayDepartment: "PENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmed.gowida@aucegypt.edu", bio: "Ahmed Gowida earned his PhD in petroleum engineering from King Fahd University. His research focuses on intelligent drilling, AI for energy systems, sustainable drilling fluids, geothermal technologies, and low-carbon wells.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793964035/041f7ce4-f703-472a-b7bd-3c623435f76e.png" },
    { id: "sikandra-kurdi", name: "Sikandra Kurdi", department: "Public Policy and Administration", displayDepartment: "PPAD", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sikandra.kurdi@aucegypt.edu", bio: "Sikandra Kurdi earned her PhD in agricultural and resource economics from UC Berkeley. Her research examines social protection, food policy, humanitarian interventions, and development in fragile, conflict-affected settings.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793964226/004bd4b7-a05d-4a3a-868b-493881388895.png" },
    { id: "joanne-mary-rowland", name: "Joanne Mary Rowland", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "joanne.rowland@aucegypt.edu", bio: "Joanne Mary Rowland earned her PhD in archaeology from University College London. Her research explores prehistoric and early dynastic Egypt through archaeological fieldwork in the Nile Delta and Naqada region.", image: "https://res.cloudinary.com/dhtamisqn/image/upload/v1793964246/b3a8a244-a54c-4bd1-b9c2-7e97a283eafa.png" },
  ];

  window.aucAtlasProfessors = professors;

  if (!document.getElementById("professors-grid")) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .professors-browser {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 28px;
      align-items: start;
    }

    .filters-panel {
      position: sticky;
      top: 120px;
      padding: 14px;
      border-radius: 26px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.72);
      box-shadow: 0 22px 55px rgba(42, 32, 20, 0.1);
      display: grid;
      gap: 8px;
    }

    .filters-heading {
      padding: 10px 14px 6px;
      color: rgba(192, 154, 92, 0.84);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .filter-toggle {
      width: 100%;
      min-height: 48px;
      padding: 0 16px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: rgba(23, 23, 23, 0.62);
      font-family: inherit;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .filter-toggle:hover,
    .filter-item.open .filter-toggle {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .chevron {
      width: 9px;
      height: 9px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg);
      transition: transform 0.2s ease;
      font-size: 0;
    }

    .filter-content {
      display: grid;
      gap: 8px;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      padding: 0 8px;
      transition: max-height 0.42s ease, opacity 0.28s ease, padding 0.42s ease;
    }

    .filter-item.open .filter-content {
      max-height: 560px;
      opacity: 1;
      padding: 10px 8px 12px;
    }

    .filter-item.open .department-filter-content {
      max-height: 420px;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: rgba(192, 154, 92, 0.48) transparent;
    }

    .department-filter-content::-webkit-scrollbar {
      width: 6px;
    }

    .department-filter-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .department-filter-content::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: rgba(192, 154, 92, 0.48);
    }

    .filter-item.open .chevron {
      transform: rotate(225deg);
    }

    .filter-content label {
      position: relative;
      min-height: 40px;
      padding: 0 12px 0 22px;
      border-radius: 14px;
      color: rgba(23, 23, 23, 0.62);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition:
        background 0.22s ease,
        color 0.22s ease,
        transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .rating-filter-option {
      gap: 9px;
    }

    .rating-filter-stars {
      min-width: 62px;
      color: #c09a5c;
      font-size: 13px;
      letter-spacing: 1px;
      line-height: 1;
      white-space: nowrap;
    }

    .filter-content input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .filter-content label:hover,
    .filter-content label:has(input:checked) {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .filter-content label:active {
      transform: scale(0.97);
    }

    .filter-content label:has(input:checked) {
      animation: professorFilterOptionSelected 0.34s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes professorFilterOptionSelected {
      0% {
        transform: scale(1);
      }

      45% {
        transform: scale(0.97);
      }

      100% {
        transform: scale(1);
      }
    }

    .professors-search-box {
      width: min(100%, 560px);
      margin: 0 auto 24px;
    }

    .professors-search-box input {
      width: 100%;
      min-height: 52px;
      padding: 0 18px;
      border-radius: 999px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.78);
      color: #171717;
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      outline: none;
      transition:
        border-color 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;
    }

    .professors-search-box input[type="search"]::-webkit-search-cancel-button {
      filter: brightness(0);
      cursor: pointer;
    }

    .professors-search-box input:focus {
      border-color: rgba(192, 154, 92, 0.58);
      background: rgba(255, 255, 255, 0.96);
      box-shadow:
        0 0 0 4px rgba(192, 154, 92, 0.12),
        0 14px 36px rgba(42, 32, 20, 0.08);
      transform: translateY(-1px);
    }

    .professor-card {
      min-height: 350px;
      color: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }

    .professors-grid.is-filtering .professor-card,
    .professors-grid.is-filtering .professors-empty {
      animation: professorFilterResultIn 0.48s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes professorFilterResultIn {
      from {
        opacity: 0;
        transform: translateY(14px) scale(0.985);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .filter-content label:has(input:checked),
      .professors-grid.is-filtering .professor-card,
      .professors-grid.is-filtering .professors-empty {
        animation: none;
      }
    }

    .professor-card:hover,
    .professor-card:focus-visible {
      border-color: rgba(192, 154, 92, 0.34);
      box-shadow: 0 30px 80px rgba(42, 32, 20, 0.14);
      transform: translateY(-3px);
    }

    .professor-card:focus-visible {
      outline: 3px solid rgba(192, 154, 92, 0.26);
      outline-offset: 4px;
    }

    .professors-result-count {
      margin-bottom: 18px;
      color: rgba(23, 23, 23, 0.58);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .professors-empty {
      padding: 28px;
      border-radius: 24px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.72);
      color: rgba(23, 23, 23, 0.62);
      font-size: 15px;
      font-weight: 700;
    }

    .professors-view-more {
      grid-column: 1 / -1;
      justify-self: center;
      width: min(100%, 340px);
      min-height: 54px;
      padding: 0 22px;
      border: 1px solid #171717;
      border-radius: 999px;
      background: #171717;
      color: #ffffff;
      font: inherit;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
    }

    .professors-view-more span {
      color: rgba(255, 255, 255, 0.62);
      font-size: 10px;
    }

    .professors-view-more:hover,
    .professors-view-more:focus-visible {
      border-color: rgba(192, 154, 92, 0.84);
      background: rgba(192, 154, 92, 0.84);
      color: #171717;
      outline: none;
      transform: translateY(-2px);
    }

    .professors-view-more:hover span,
    .professors-view-more:focus-visible span {
      color: rgba(23, 23, 23, 0.62);
    }

    .professors-browser.professor-profile-mode {
      grid-template-columns: minmax(0, 1fr);
    }

    .professors-browser.professor-profile-mode .filters-panel,
    .professors-browser.professor-profile-mode .professors-search-box {
      display: none;
    }

    .professors-grid.professor-profile-grid {
      width: min(100%, 1380px);
      margin: 0 auto;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 400px);
      gap: 18px;
      align-items: start;
    }

    .professors-grid.professor-profile-grid .professor-profile-main {
      min-width: 0;
      display: grid;
      align-content: start;
      gap: 18px;
      grid-column: 1;
      grid-row: 1;
    }

    .professors-grid.professor-profile-grid .professor-profile-card {
      width: 100%;
      margin: 0;
      grid-column: 1;
      grid-row: 1;
    }

    .professors-grid.professor-profile-grid .professor-review-insights {
      width: 100%;
      margin: 0;
      grid-column: 2;
      grid-row: 1;
    }

    .professors-grid.professor-profile-grid .professor-reviews-section {
      width: 100%;
      margin: 0;
      grid-column: 1;
      grid-row: 2;
    }

    .professors-header.professor-profile-heading {
      width: min(100%, 1500px);
      margin: 0 auto 22px;
      align-items: center;
    }

    .professors-header.professor-profile-heading .professors-kicker {
      font-weight: 700;
    }

    .professors-header.professor-profile-heading h1 {
      font-size: clamp(30px, 3.2vw, 46px);
      font-weight: 600;
      line-height: 1.05;
    }

    .professors-header.professor-profile-heading p:not(.professors-kicker) {
      max-width: 500px;
      justify-self: end;
      font-size: 15px;
      font-weight: 400;
      line-height: 1.6;
    }

    .professor-profile-card {
      width: min(100%, 1120px);
      margin: 0 auto;
      overflow: hidden;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.78);
      box-shadow: 0 20px 54px rgba(42, 32, 20, 0.1);
      display: grid;
      grid-template-columns: minmax(250px, 300px) minmax(0, 1fr);
      align-items: start;
    }

    .professor-profile-image {
      height: 360px;
      background: rgba(23, 23, 23, 0.04);
    }

    .professor-profile-image img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      object-position: center 18%;
    }

    .professor-profile-body {
      padding: 28px;
      display: grid;
      align-content: start;
      gap: 16px;
    }

    .professor-profile-info {
      max-width: 660px;
      display: grid;
      gap: 10px;
    }

    .professor-profile-info div {
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(23, 23, 23, 0.08);
      display: grid;
      gap: 3px;
    }

    .professor-profile-info div:last-child {
      padding-bottom: 0;
      border-bottom: 0;
    }

    .professor-profile-info div > span:first-child {
      color: rgba(192, 154, 92, 0.92);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .professor-profile-value,
    .professor-profile-email {
      color: #171717;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.45;
      text-decoration: none;
    }

    .professor-profile-email.is-empty {
      color: rgba(23, 23, 23, 0.48);
    }

    .professor-profile-course-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .professor-profile-course-link {
      min-height: 32px;
      padding: 0 10px;
      border: 1px solid rgba(23, 23, 23, 0.08);
      border-radius: 999px;
      background: rgba(247, 244, 238, 0.72);
      color: rgba(23, 23, 23, 0.7);
      font-size: 12px;
      font-weight: 500;
      line-height: 1.3;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
    }

    .professor-profile-course-link:hover {
      border-color: rgba(192, 154, 92, 0.34);
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
      transform: translateY(-1px);
    }

    .professor-profile-bio {
      max-width: 660px;
      color: rgba(23, 23, 23, 0.66);
      font-size: 14px;
      line-height: 1.65;
    }

    body.review-modal-open {
      overflow: hidden;
      padding-right: var(--review-scrollbar-compensation, 0px);
    }

    .professor-review-panel {
      margin-top: 6px;
      width: fit-content;
    }

    .professor-review-panel[open] {
      position: relative;
      z-index: 1200;
    }

    .professor-review-toggle {
      width: fit-content;
      min-height: 46px;
      padding: 0 18px;
      border-radius: 999px;
      background: #171717;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      list-style: none;
      transform: translateY(0) scale(1);
      transform-origin: center;
      transition:
        transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
        background 180ms ease,
        box-shadow 180ms ease;
      -webkit-tap-highlight-color: transparent;
    }

    .professor-review-toggle:hover {
      background: #242424;
      box-shadow: 0 8px 22px rgba(23, 23, 23, 0.14);
      transform: translateY(-1px);
    }

    .professor-review-toggle:active {
      transform: translateY(0) scale(0.965);
      transition-duration: 90ms;
    }

    .professor-review-toggle:focus-visible {
      outline: 3px solid rgba(192, 154, 92, 0.28);
      outline-offset: 4px;
    }

    .professor-review-toggle::-webkit-details-marker {
      display: none;
    }

    .review-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: rgba(247, 244, 238, 0.42);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      opacity: 1;
      animation: none;
      will-change: opacity;
    }

    .professor-review-form {
      position: fixed;
      top: 50%;
      left: 50%;
      z-index: 1201;
      width: min(820px, calc(100% - 32px));
      max-height: min(82vh, 760px);
      margin: 0;
      padding: 24px;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      scrollbar-gutter: stable;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 34px 90px rgba(42, 32, 20, 0.2);
      display: grid;
      grid-template-columns: 1fr;
      gap: 18px;
      opacity: 1;
      transform: translate(-50%, -50%);
      transform-origin: center center;
      animation: none;
    }

    .review-modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 2px;
    }

    .review-modal-header span {
      color: rgba(192, 154, 92, 0.92);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .review-modal-header h2 {
      margin-top: 4px;
      color: #171717;
      font-size: 24px;
      font-weight: 500;
      line-height: 1.1;
    }

    .review-close-button {
      width: 38px;
      height: 38px;
      border: 0;
      border-radius: 999px;
      background: rgba(23, 23, 23, 0.08);
      color: #171717;
      font: inherit;
      font-size: 22px;
      font-weight: 400;
      cursor: pointer;
      display: grid;
      place-items: center;
    }

    .review-close-button:hover {
      background: rgba(23, 23, 23, 0.14);
    }

    .review-progress {
      display: grid;
      gap: 8px;
    }

    .review-progress-label {
      color: rgba(23, 23, 23, 0.54);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .review-progress-track {
      height: 6px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(23, 23, 23, 0.08);
    }

    .review-progress-fill {
      width: 33.333%;
      height: 100%;
      border-radius: inherit;
      background: rgba(192, 154, 92, 0.88);
      display: block;
      transition: width 0.24s ease;
    }

    .review-step {
      display: none;
      border: 0;
      margin: 0;
      padding: 0;
    }

    .review-step.is-active {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      animation: reviewStepIn 0.22s ease both;
    }

    .review-step-heading {
      grid-column: 1 / -1;
      display: grid;
      gap: 5px;
    }

    .review-step-heading span {
      color: rgba(192, 154, 92, 0.92);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .review-step-heading p {
      color: rgba(23, 23, 23, 0.58);
      font-size: 14px;
      line-height: 1.55;
    }

    .review-section-heading {
      grid-column: 1 / -1;
      margin-top: 10px;
      color: #a67c39;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .review-section-heading::after {
      content: "";
      height: 2px;
      flex: 1;
      border-radius: 999px;
      background: rgba(192, 154, 92, 0.28);
    }

    .review-section-heading:first-of-type {
      margin-top: 0;
    }

    .review-field {
      display: grid;
      gap: 7px;
    }

    .review-field.full {
      grid-column: 1 / -1;
    }

    .review-field label {
      color: rgba(23, 23, 23, 0.58);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .review-field input,
    .review-field select,
    .review-field textarea {
      width: 100%;
      min-height: 46px;
      padding: 0 14px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.58);
      color: #171717;
      font: inherit;
      font-size: 14px;
      font-weight: 400;
      outline: none;
    }

    .review-field select {
      appearance: none;
      background:
        linear-gradient(45deg, transparent 50%, rgba(23, 23, 23, 0.58) 50%) calc(100% - 18px) 50% / 7px 7px no-repeat,
        linear-gradient(135deg, rgba(23, 23, 23, 0.58) 50%, transparent 50%) calc(100% - 13px) 50% / 7px 7px no-repeat,
        rgba(255, 255, 255, 0.58);
    }

    .review-field select option {
      background: #fffdf8;
      color: #171717;
      font-weight: 400;
    }

    .review-native-select {
      display: none;
    }

    .review-choice {
      position: relative;
    }

    .review-choice-button {
      width: 100%;
      min-height: 46px;
      padding: 0 40px 0 14px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.58);
      color: #171717;
      font: inherit;
      font-size: 14px;
      font-weight: 400;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    }

    .review-choice-button::after {
      content: "";
      position: absolute;
      right: 16px;
      width: 8px;
      height: 8px;
      border-right: 1.5px solid rgba(23, 23, 23, 0.58);
      border-bottom: 1.5px solid rgba(23, 23, 23, 0.58);
      transform: rotate(45deg) translateY(-2px);
      pointer-events: none;
    }

    .review-choice.open .review-choice-button,
    .review-choice-button:focus-visible {
      border-color: rgba(192, 154, 92, 0.5);
      background: rgba(255, 255, 255, 0.78);
      box-shadow: 0 0 0 4px rgba(192, 154, 92, 0.1);
      outline: none;
    }

    .review-choice-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      z-index: 4;
      max-height: 230px;
      padding: 6px;
      overflow-y: auto;
      overscroll-behavior: contain;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 18px 45px rgba(42, 32, 20, 0.16);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-6px);
      transition: opacity 0.18s ease, transform 0.18s ease;
    }

    .review-choice.open .review-choice-menu {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .review-choice-search-wrap {
      position: sticky;
      top: 0;
      z-index: 1;
      padding: 0 0 6px;
      background: rgba(255, 255, 255, 0.98);
    }

    .review-choice-search {
      width: 100%;
      min-height: 38px;
      padding: 0 12px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 12px;
      background: rgba(247, 244, 238, 0.74);
      color: #171717;
      font: inherit;
      font-size: 13px;
      font-weight: 400;
      outline: none;
    }

    .review-choice-search:focus {
      border-color: rgba(192, 154, 92, 0.5);
      box-shadow: 0 0 0 3px rgba(192, 154, 92, 0.1);
    }

    .review-field[hidden],
    .review-choice-option[hidden] {
      display: none;
    }

    .review-choice-option {
      width: 100%;
      min-height: 38px;
      padding: 0 12px;
      border: 0;
      border-radius: 12px;
      background: transparent;
      color: rgba(23, 23, 23, 0.72);
      font: inherit;
      font-size: 14px;
      font-weight: 400;
      text-align: left;
      cursor: pointer;
    }

    .review-choice-option:hover,
    .review-choice-option.is-selected {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .review-field textarea {
      min-height: 112px;
      padding: 13px 14px;
      resize: vertical;
      line-height: 1.6;
    }

    .review-field input::placeholder,
    .review-field textarea::placeholder {
      color: rgba(23, 23, 23, 0.38);
    }

    .review-field input:focus,
    .review-field select:focus,
    .review-field textarea:focus {
      border-color: rgba(192, 154, 92, 0.5);
      box-shadow: 0 0 0 4px rgba(192, 154, 92, 0.1);
    }

    .review-anonymous-option {
      grid-column: 1 / -1;
      min-width: 0;
      padding: 16px 0 0;
      border-top: 1px solid rgba(23, 23, 23, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      cursor: pointer;
    }

    .review-anonymous-copy {
      min-width: 0;
      display: grid;
      gap: 4px;
    }

    .review-anonymous-copy strong {
      color: #171717;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
    }

    .review-anonymous-copy small {
      color: rgba(23, 23, 23, 0.5);
      font-size: 12px;
      font-weight: 400;
      line-height: 1.45;
    }

    .review-anonymous-option input {
      position: relative;
      width: 46px;
      height: 26px;
      margin: 0;
      flex: 0 0 46px;
      appearance: none;
      -webkit-appearance: none;
      border: 1px solid rgba(23, 23, 23, 0.13);
      border-radius: 999px;
      background: rgba(23, 23, 23, 0.12);
      box-shadow: inset 0 1px 3px rgba(23, 23, 23, 0.12);
      cursor: pointer;
      outline: none;
      transition:
        border-color 0.22s ease,
        background 0.22s ease,
        box-shadow 0.22s ease;
    }

    .review-anonymous-option input::before {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 2px 7px rgba(23, 23, 23, 0.22);
      transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .review-anonymous-option input:checked {
      border-color: rgba(154, 112, 48, 0.8);
      background: #c09a5c;
      box-shadow:
        inset 0 1px 3px rgba(90, 58, 15, 0.18),
        0 0 0 4px rgba(192, 154, 92, 0.12);
    }

    .review-anonymous-option input:checked::before {
      transform: translateX(20px);
    }

    .review-anonymous-option input:focus-visible {
      box-shadow: 0 0 0 4px rgba(192, 154, 92, 0.2);
    }

    .review-submit-button {
      width: fit-content;
      min-height: 46px;
      padding: 0 18px;
      border: 0;
      border-radius: 999px;
      background: rgba(192, 154, 92, 0.96);
      color: #171717;
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
    }

    .review-submit-button:disabled {
      opacity: 0.58;
      cursor: wait;
    }

    .review-form-message {
      grid-column: 1 / -1;
      min-height: 20px;
      color: rgba(23, 23, 23, 0.58);
      font-size: 13px;
      font-weight: 700;
      line-height: 1.5;
    }

    .review-form-message.is-success {
      color: #23613f;
    }

    .review-form-message.is-error {
      color: #9b2f2f;
    }

    .professor-review-insights {
      width: min(100%, 1120px);
      margin: 22px auto 0;
      padding: 16px;
      border: 1px solid rgba(23, 23, 23, 0.09);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.72);
      box-shadow: 0 14px 38px rgba(42, 32, 20, 0.07);
      display: grid;
      gap: 12px;
    }

    .professor-review-insights-header,
    .professor-reviews-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 14px;
    }

    .professor-review-insights-header span,
    .professor-reviews-header span {
      color: rgba(192, 154, 92, 0.92);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .professor-review-insights-header h2,
    .professor-reviews-header h2 {
      margin-top: 3px;
      color: #171717;
      font-size: 21px;
      font-weight: 700;
      line-height: 1.08;
    }

    .professor-review-insights-header p,
    .professor-reviews-header p {
      color: rgba(23, 23, 23, 0.54);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-align: right;
      text-transform: uppercase;
    }

    .professor-review-stats {
      display: grid;
      gap: 0;
    }

    .professor-review-stat-row {
      padding: 13px 0;
      border-bottom: 1px solid rgba(23, 23, 23, 0.08);
      display: grid;
      gap: 8px;
    }

    .professor-review-stat-row:first-child {
      padding-top: 4px;
    }

    .professor-review-stat-head {
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .professor-review-stat-label {
      min-width: 0;
      color: rgba(23, 23, 23, 0.58);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.1em;
      line-height: 1.3;
      text-transform: uppercase;
    }

    .professor-review-stat-value {
      min-width: 0;
      color: rgba(23, 23, 23, 0.42);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1.3;
      text-align: right;
      text-transform: uppercase;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 5px;
    }

    .professor-review-stat-value strong {
      color: #171717;
      font-size: 10px;
      font-weight: 800;
    }

    .professor-review-stat-value span:last-child {
      color: rgba(192, 154, 92, 0.96);
      font-weight: 900;
    }

    .professor-review-stat-track,
    .professor-review-stat-answer-track {
      width: 100%;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(23, 23, 23, 0.08);
    }

    .professor-review-stat-track {
      height: 7px;
    }

    .professor-review-stat-fill {
      width: var(--stat-width, 0%);
      height: 100%;
      border-radius: inherit;
      background: #c09a5c;
      display: block;
      transform: scaleX(0);
      transform-origin: left center;
      animation:
        professorReviewStatFill
        0.72s
        cubic-bezier(0.16, 1, 0.3, 1)
        var(--stat-delay, 0ms)
        forwards;
    }

    .professor-review-stat-details {
      display: grid;
      gap: 8px;
    }

    .professor-review-stat-details-toggle {
      width: fit-content;
      padding: 0;
      border: 0;
      background: transparent;
      color: rgba(23, 23, 23, 0.58);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.08em;
      line-height: 1.3;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      list-style: none;
      transition: color 0.18s ease;
    }

    .professor-review-stat-details-toggle::after {
      content: "";
      width: 5px;
      height: 5px;
      border-right: 1.4px solid currentColor;
      border-bottom: 1.4px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
      transition: transform 0.22s ease;
    }

    .professor-review-stat-details[open] .professor-review-stat-details-toggle {
      color: #171717;
    }

    .professor-review-stat-details[open] .professor-review-stat-details-toggle::after {
      transform: rotate(225deg) translate(-1px, -1px);
    }

    .professor-review-stat-details-toggle::-webkit-details-marker {
      display: none;
    }

    .professor-review-stat-details-less {
      display: none;
    }

    .professor-review-stat-details[open] .professor-review-stat-details-more {
      display: none;
    }

    .professor-review-stat-details[open] .professor-review-stat-details-less {
      display: inline;
    }

    .professor-review-stat-breakdown {
      display: grid;
      gap: 9px;
      padding: 5px 0 1px;
    }

    .professor-review-stat-total,
    .professor-review-stat-answer {
      display: grid;
      gap: 5px;
    }

    .professor-review-stat-answer-head {
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: rgba(23, 23, 23, 0.48);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.06em;
      line-height: 1.35;
      text-transform: uppercase;
    }

    .professor-review-stat-answer-head span:first-child {
      min-width: 0;
      color: rgba(23, 23, 23, 0.72);
    }

    .professor-review-stat-answer-head span:last-child {
      color: rgba(192, 154, 92, 0.96);
      text-align: right;
      white-space: nowrap;
    }

    .professor-review-stat-answer-track {
      height: 6px;
    }

    .professor-review-stat-answer-fill {
      width: var(--stat-width, 0%);
      height: 100%;
      border-radius: inherit;
      background: rgba(192, 154, 92, 0.82);
      display: block;
    }

    .professor-review-stat-total-fill {
      background: rgba(23, 23, 23, 0.22);
    }

    @keyframes professorReviewStatFill {
      to {
        transform: scaleX(1);
      }
    }

    .professor-review-insights-more {
      display: grid;
      gap: 0;
    }

    .professor-review-insights-hidden {
      order: 1;
      box-sizing: border-box;
      display: grid;
      gap: 0;
      margin-top: 0;
      overflow: hidden;
      opacity: 1;
      transition:
        height 0.28s ease,
        opacity 0.22s ease,
        transform 0.22s ease;
    }

    .professor-review-insights-more-toggle {
      order: 2;
      width: fit-content;
      margin-top: 14px;
      padding: 0;
      border: 0;
      background: transparent;
      color: #171717;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      list-style: none;
      transition: color 0.18s ease;
    }

    .professor-review-insights-more-toggle::after {
      content: "";
      width: 6px;
      height: 6px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
      transition: transform 0.22s ease;
    }

    .professor-review-insights-more[open] .professor-review-insights-more-toggle::after {
      transform: rotate(225deg) translate(-1px, -1px);
    }

    .professor-review-insights-more-toggle::-webkit-details-marker {
      display: none;
    }

    .professor-review-insights-more-less {
      display: none;
    }

    .professor-review-insights-more[open] .professor-review-insights-more-more {
      display: none;
    }

    .professor-review-insights-more[open] .professor-review-insights-more-less {
      display: inline;
    }

    @media (prefers-reduced-motion: reduce) {
      .professor-review-stat-fill {
        animation: none;
        transform: scaleX(1);
      }
    }

    .professor-reviews-section {
      width: min(100%, 720px);
      margin: 28px auto 0;
      display: grid;
      gap: 16px;
    }

    .professor-reviews-header {
      padding: 0 4px 4px;
      border-bottom: 1px solid rgba(23, 23, 23, 0.08);
    }

    .professor-reviews-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      align-items: start;
      gap: 14px;
    }

    .professor-review-card {
      min-height: 210px;
      padding: 16px;
      border: 1px solid rgba(23, 23, 23, 0.09);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.76);
      box-shadow: 0 18px 44px rgba(42, 32, 20, 0.08);
      display: grid;
      align-content: start;
      gap: 12px;
    }

    .professor-review-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .professor-review-author {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .professor-review-avatar,
    .professor-review-avatar-fallback {
      width: 44px;
      height: 44px;
      flex: 0 0 44px;
      border-radius: 999px;
      overflow: hidden;
      background: #171717;
      color: #fffdf8;
      display: grid;
      place-items: center;
      object-fit: cover;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .professor-review-author strong {
      display: block;
      color: #171717;
      font-size: 14px;
      line-height: 1.2;
    }

    .professor-review-rating {
      color: #c09a5c;
      font-size: 14px;
      font-weight: 900;
      line-height: 1;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
    }

    .professor-review-stars {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    .professor-review-star {
      color: rgba(23, 23, 23, 0.18);
    }

    .professor-review-star.is-filled {
      color: #c09a5c;
    }

    .professor-review-rating-text {
      color: rgba(23, 23, 23, 0.48);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .professor-review-context {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .professor-review-context span {
      padding: 8px 10px;
      border: 1px solid rgba(23, 23, 23, 0.08);
      border-radius: 999px;
      background: rgba(247, 244, 238, 0.72);
      color: rgba(23, 23, 23, 0.62);
      font-size: 11px;
      font-weight: 800;
    }

    .professor-review-note,
    .professor-review-empty,
    .professor-review-status {
      margin: 0;
      color: rgba(23, 23, 23, 0.68);
      font-size: 13px;
      line-height: 1.5;
    }

    .professor-review-card-actions {
      margin-top: 2px;
      padding-top: 10px;
      border-top: 1px solid rgba(23, 23, 23, 0.08);
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .professor-review-report-button {
      padding: 4px 0;
      border: 0;
      background: transparent;
      color: rgba(23, 23, 23, 0.44);
      font: inherit;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.08em;
      line-height: 1.2;
      text-transform: uppercase;
      cursor: pointer;
      transition:
        color 0.2s ease,
        opacity 0.2s ease;
    }

    .professor-review-report-button:hover,
    .professor-review-report-button:focus-visible {
      color: #9f2f2f;
      outline: none;
    }

    .professor-review-report-button:disabled {
      color: rgba(23, 23, 23, 0.38);
      cursor: default;
      opacity: 0.72;
    }

    body.content-report-open {
      overflow: hidden;
    }

    .course-report-modal {
      position: fixed;
      inset: 0;
      z-index: 3100;
      padding: 24px;
      display: grid;
      place-items: center;
      opacity: 1;
      transition:
        opacity 0.24s ease,
        display 0.24s;
      transition-behavior: allow-discrete;
      will-change: opacity;
    }

    .course-report-modal[hidden] {
      display: none;
      opacity: 0;
    }

    @starting-style {
      .course-report-modal:not([hidden]) {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .course-report-modal {
        transition: none;
      }
    }

    .course-report-backdrop {
      position: absolute;
      inset: 0;
      border: 0;
      background: rgba(247, 244, 238, 0.42);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      cursor: pointer;
      animation:
        courseReportBackdropIn
        0.24s
        ease
        both;
    }

    .course-report-dialog {
      position: relative;
      z-index: 1;
      width: min(500px, 100%);
      overflow: hidden;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 34px 90px rgba(42, 32, 20, 0.2);
      animation:
        courseReportDialogIn
        0.3s
        cubic-bezier(0.22, 1, 0.36, 1)
        both;
    }

    .course-report-header {
      padding: 24px 24px 14px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .course-report-header-copy {
      min-width: 0;
      display: grid;
      gap: 7px;
    }

    .course-report-kicker {
      margin: 0;
      color: rgba(192, 154, 92, 0.92);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      line-height: 1.3;
      text-transform: uppercase;
    }

    .course-report-header h2 {
      margin: 0;
      color: #171717;
      font-size: 24px;
      font-weight: 500;
      line-height: 1.1;
    }

    .course-report-header-copy > p:last-child {
      margin: 0;
      color: rgba(23, 23, 23, 0.58);
      font-size: 13px;
      font-weight: 600;
      line-height: 1.6;
    }

    .course-report-close {
      width: 40px;
      height: 40px;
      flex: 0 0 40px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.72);
      color: rgba(23, 23, 23, 0.82);
      font: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition:
        background 0.18s ease,
        color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;
    }

    .course-report-close:hover,
    .course-report-close:focus-visible {
      background: #171717;
      color: #ffffff;
      box-shadow: 0 8px 22px rgba(23, 23, 23, 0.14);
      outline: none;
      transform: translateY(-1px);
    }

    .course-report-form {
      padding: 0 24px 24px;
      display: grid;
      gap: 14px;
    }

    .course-report-field {
      display: grid;
      gap: 8px;
    }

    .course-report-field > span {
      color: rgba(23, 23, 23, 0.58);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .course-report-field textarea {
      width: 100%;
      min-height: 132px;
      padding: 13px 14px;
      resize: vertical;
      border: 1px solid rgba(23, 23, 23, 0.1);
      border-radius: 14px;
      outline: none;
      background: rgba(255, 255, 255, 0.58);
      color: #171717;
      font: inherit;
      font-size: 14px;
      line-height: 1.55;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;
    }

    .course-report-field textarea:focus {
      border-color: rgba(192, 154, 92, 0.56);
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(192, 154, 92, 0.12);
    }

    .course-report-status {
      min-height: 0;
      margin: 0;
      color: rgba(23, 23, 23, 0.58);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.5;
    }

    .course-report-status:empty {
      display: none;
    }

    .course-report-status.error {
      color: #9f2f2f;
    }

    .course-report-actions {
      padding-top: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }

    .course-report-cancel,
    .course-report-submit {
      min-height: 46px;
      padding: 0 18px;
      border-radius: 999px;
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition:
        background 0.18s ease,
        color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;
    }

    .course-report-cancel {
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.58);
      color: rgba(23, 23, 23, 0.68);
    }

    .course-report-cancel:hover,
    .course-report-cancel:focus-visible {
      background: #ffffff;
      color: #171717;
      box-shadow: 0 8px 22px rgba(23, 23, 23, 0.08);
      outline: none;
      transform: translateY(-1px);
    }

    .course-report-submit {
      border: 0;
      background: #171717;
      color: #ffffff;
    }

    .course-report-submit:hover:not(:disabled),
    .course-report-submit:focus-visible:not(:disabled) {
      background: #242424;
      box-shadow: 0 8px 22px rgba(23, 23, 23, 0.14);
      outline: none;
      transform: translateY(-1px);
    }

    .course-report-submit:disabled {
      cursor: wait;
      opacity: 0.58;
    }

    @keyframes courseReportBackdropIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes courseReportDialogIn {
      from {
        opacity: 0;
        transform: translateY(14px) scale(0.97);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .course-report-backdrop,
      .course-report-dialog {
        animation: none;
      }
    }

    @media (max-width: 560px) {
      .course-report-modal {
        padding: 14px;
      }

      .course-report-dialog {
        border-radius: 22px;
      }

      .course-report-header {
        padding: 20px 18px 16px;
      }

      .course-report-form {
        padding: 0 18px 18px;
      }

      .course-report-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }

      .course-report-cancel,
      .course-report-submit {
        width: 100%;
      }
    }

    .professor-review-empty,
    .professor-review-status {
      grid-column: 1 / -1;
      padding: 22px;
      border: 1px dashed rgba(23, 23, 23, 0.16);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.54);
      font-weight: 700;
      text-align: center;
    }

    @media (max-width: 720px) {
      .professor-review-insights-header,
      .professor-reviews-header,
      .professor-review-card-top {
        align-items: flex-start;
        flex-direction: column;
      }

      .professor-review-stat-labels {
        font-size: 10px;
      }
    }

    @keyframes reviewBackdropIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes reviewModalIn {
      0% {
        opacity: 0;
        transform:
          translate(-50%, calc(-50% + 18px))
          scale(0.975);
      }

      45% {
        opacity: 1;
      }

      100% {
        opacity: 1;
        transform:
          translate(-50%, -50%)
          scale(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .review-modal-backdrop,
      .professor-review-form {
        animation: none;
      }

      .professor-review-toggle {
        transition: none;
      }
    }

    @media (max-width: 980px) {
      .professors-browser {
        grid-template-columns: 1fr;
      }

      .filters-panel {
        position: static;
      }

      .professors-grid.professor-profile-grid {
        width: min(100%, 1120px);
        grid-template-columns: 1fr;
      }

      .professors-grid.professor-profile-grid .professor-profile-main {
        display: contents;
      }

      .professors-grid.professor-profile-grid .professor-review-insights {
        grid-column: 1;
        grid-row: 2;
      }

      .professors-grid.professor-profile-grid .professor-reviews-section {
        grid-column: 1;
        grid-row: 3;
      }

      .professor-profile-card {
        grid-template-columns: 1fr;
      }

      .professor-profile-image {
        height: 300px;
      }

      .professor-review-form {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      html:has(body.review-modal-open),
      body.review-modal-open {
        overflow: hidden;
        overscroll-behavior: none;
      }

      .review-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 5000;
        background: rgba(247, 244, 238, 0.46);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        overscroll-behavior: none;
        touch-action: none;
      }

      .professor-review-form {
        position: fixed;
        top: 50%;
        left: 50%;
        z-index: 5001;
        box-sizing: border-box;
        width: calc(100vw - 20px);
        height: calc(100dvh - 20px);
        max-height: calc(100dvh - 20px);
        margin: 0;
        padding:
          18px
          18px
          max(24px, env(safe-area-inset-bottom));
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
        scrollbar-gutter: auto;
        border-radius: 22px;
        transform: translate(-50%, -50%);
        animation: none;
      }

      .review-modal-header {
        position: sticky;
        top: -18px;
        z-index: 20;
        margin: -18px -18px 0;
        padding:
          max(18px, env(safe-area-inset-top))
          18px
          12px;
        border-bottom: 1px solid rgba(23, 23, 23, 0.07);
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }

      .review-close-button {
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
      }

      .review-step.is-active {
        grid-template-columns: 1fr;
      }

      .review-field,
      .review-field.full,
      .review-anonymous-option,
      .review-form-message {
        min-width: 0;
        grid-column: 1 / -1;
      }

      .review-anonymous-option {
        margin-bottom: 0;
      }

      .review-field input,
      .review-field select,
      .review-field textarea,
      .review-choice,
      .review-choice-button {
        max-width: 100%;
      }

      .review-choice-menu {
        position: static;
        display: none;
        max-height: min(260px, 36dvh);
        margin-top: 8px;
        overflow-y: auto;
        overscroll-behavior: contain;
        opacity: 1;
        pointer-events: none;
        transform: none;
        box-shadow: none;
      }

      .review-choice.open .review-choice-menu {
        display: grid;
        pointer-events: auto;
        transform: none;
      }

      .review-submit-button {
        position: static;
        width: 100%;
        min-height: 52px;
        grid-column: 1 / -1;
        margin-top: 10px;
        flex-shrink: 0;
        box-shadow:
          0 10px 26px rgba(42, 32, 20, 0.14);
      }

      .professor-review-toggle {
        width: 100%;
        justify-content: center;
      }

      .professor-profile-body,
      .professor-review-insights,
      .professor-reviews-section {
        min-width: 0;
      }
    }
  `;
  document.head.appendChild(style);

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function normalizeProfessorId(value) {
    return normalize(value)
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

function getProfessorId(professor) {
  return normalizeProfessorId(professor.id || professor.name);
}

function getCurrentProfessorId() {
  const legacyProfessorId = new URLSearchParams(
    window.location.search
  ).get("id");

  if (legacyProfessorId) {
    return normalizeProfessorId(legacyProfessorId);
  }

  const pathMatch = window.location.pathname.match(
    /^\/professors\/([^/]+)\/?$/i
  );

  if (!pathMatch) {
    return "";
  }

  return normalizeProfessorId(pathMatch[1]);
}

function getProfessorUrl(professor) {
  return (
    "/professors/" +
    encodeURIComponent(getProfessorId(professor))
  );
}

  function getCheckedValues(group) {
    return Array.from(document.querySelectorAll('[data-filter-group="' + group + '"]:checked')).map(function (input) {
      return input.value;
    });
  }

  function getProfessorDepartment(professor) {
    const department = String(
      professor && professor.department
        ? professor.department
        : ""
    ).trim();

    if (
      !department ||
      normalize(department) === "department coming soon"
    ) {
      return "Other";
    }

    return department;
  }

  function populateDepartmentFilters() {
    const container = document.getElementById(
      "department-filter-options"
    );

    if (
      !container ||
      container.dataset.departmentOptionsReady === "true"
    ) {
      return;
    }

    const departmentNames = Array.from(
      new Set(
        professors.map(function (professor) {
          return getProfessorDepartment(professor);
        })
      )
    )
      .filter(function (department) {
        return department !== "Other";
      })
      .sort(function (firstDepartment, secondDepartment) {
        return firstDepartment.localeCompare(secondDepartment);
      });

    container.innerHTML = "";

    departmentNames.forEach(function (department) {
      const label = document.createElement("label");
      const input = document.createElement("input");

      input.type = "checkbox";
      input.value = department;
      input.dataset.filterGroup = "department";

      label.appendChild(input);
      label.appendChild(
        document.createTextNode(" " + department)
      );

      container.appendChild(label);
    });

    container.dataset.departmentOptionsReady = "true";
  }

  function getProfessorRatingStatus(professor) {
    const ratingValue = parseFloat(
      String(
        professor.averageRating ||
        professor.averageStars ||
        professor.rating ||
        ""
      ).replace(",", ".")
    );

    if (!Number.isFinite(ratingValue) || ratingValue <= 0) {
      return "No ratings yet";
    }

    const roundedRating = Math.max(
      1,
      Math.min(5, Math.round(ratingValue))
    );

    return roundedRating === 1
      ? "1 star"
      : roundedRating + " stars";
  }

  function professorMatches(professor) {
    const searchInput = document.getElementById("professor-search-input");
    const query = normalize(searchInput ? searchInput.value : "");
    const departments = getCheckedValues("department");
    const statuses = getCheckedValues("status");
    const groups = getCheckedValues("group");
    const ratingStatus = getProfessorRatingStatus(professor);
    const professorDepartment =
      getProfessorDepartment(professor);

    const searchableText = normalize([
      getProfessorId(professor),
      professor.name,
      professor.department,
      professor.displayDepartment,
      professor.filterDepartment,
      professor.status,
      ratingStatus,
      professor.course,
      professor.bio,
      professor.group
    ].join(" "));
    const matchesSearch = !query || searchableText.includes(query);
    const matchesDepartment =
      !departments.length ||
      departments.includes(professorDepartment);
    const matchesStatus =
      !statuses.length ||
      statuses.includes(ratingStatus);
    const matchesGroup =
      !groups.length ||
      groups.includes(professor.group);

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesStatus &&
      matchesGroup
    );
  }

  function getReviewDateLabel(value) {
    const date = new Date(value);

    if (!value || Number.isNaN(date.getTime())) {
      return "Just now";
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function getReviewAuthorInitials(name) {
    const initials = String(name || "AUC student")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");

    return initials || "A";
  }

  function renderReviewAvatar(review) {
    const authorName = review.authorName || "AUC student";

    if (review.authorPhotoURL) {
      return '<img class="professor-review-avatar" src="' + escapeHtml(review.authorPhotoURL) + '" alt="' + escapeHtml(authorName) + ' profile photo">';
    }

    return '<span class="professor-review-avatar-fallback">' + escapeHtml(getReviewAuthorInitials(authorName)) + '</span>';
  }

  function getReviewStatRows(reviews) {
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const configs = [
      {
        key: "recommendation",
        label: "Would take again",
        options: ["Yes", "Depends", "No"],
        sentence: function (answer) {
          if (answer.value === "Yes") return answer.percent + "% of students would take this course with this professor again.";
          if (answer.value === "Depends") return answer.percent + "% of students say it depends on the course or situation.";
          return answer.percent + "% of students would not take this course with this professor again.";
        }
      },
      { key: "attendancePolicy", label: "Attendance policy", options: ["Required", "Sometimes checked", "Not important", "Not sure"], sentence: function (answer) { return answer.percent + "% of students report attendance policy is " + answer.value.toLowerCase() + "."; } },
      { key: "workload", label: "Workload", options: ["Light", "Moderate", "Heavy"], sentence: function (answer) { return answer.percent + "% of students report workload is " + answer.value.toLowerCase() + "."; } },
      { key: "lectureUsefulness", label: "Lecture usefulness", options: ["Essential", "Helpful", "Attending means less work at home", "Skippable", "Not lecture-based"], sentence: function (answer) { return answer.percent + "% of students report lecture usefulness is " + answer.value.toLowerCase() + "."; } },
      { key: "officeHours", label: "Office hours/help", options: ["Helpful", "Available but limited", "Hard to reach", "Did not use"], sentence: function (answer) { return answer.percent + "% of students report office hours/help is " + answer.value.toLowerCase() + "."; } },
      { key: "gradingStyle", label: "Grading style", options: ["Exams-heavy", "Projects-heavy", "Assignments-heavy", "Participation-heavy", "Mixed"], sentence: function (answer) { return answer.percent + "% of students report grading style is " + answer.value.replace(/-/g, " ").toLowerCase() + "."; } },
      { key: "examDifficulty", label: "Exam difficulty", options: ["Easier than class material", "Matches class material", "Harder than class material", "No exams"], sentence: function (answer) { return answer.percent + "% of students report exam difficulty is " + answer.value.toLowerCase() + "."; } },
      { key: "gradingTransparency", label: "Grading transparency", options: ["Rubric is clear", "Somewhat clear", "Unclear"], sentence: function (answer) { return answer.percent + "% of students report grading transparency is " + answer.value.toLowerCase() + "."; } },
      { key: "feedbackQuality", label: "Feedback quality", options: ["Helpful", "Minimal", "None", "Not applicable"], sentence: function (answer) { return answer.percent + "% of students report feedback quality is " + answer.value.toLowerCase() + "."; } }
    ];

    return configs.map(function (config) {
      const values = safeReviews.map(function (review) {
        return String(review[config.key] || "").trim();
      }).filter(Boolean);
      const counts = values.reduce(function (result, value) {
        result[value] = (result[value] || 0) + 1;
        return result;
      }, {});

      if (!values.length) {
        return null;
      }

      const optionValues = config.options.slice();

      Object.keys(counts).forEach(function (value) {
        if (!optionValues.includes(value)) {
          optionValues.push(value);
        }
      });

      const answers = optionValues.map(function (value, index) {
        const count = counts[value] || 0;
        const rawPercent = values.length ? (count / values.length) * 100 : 0;

        return {
          value,
          count,
          colorIndex: index,
          percent: Math.round(rawPercent),
          width: Number(rawPercent.toFixed(2))
        };
      });
      const topAnswer = answers.slice().sort(function (a, b) {
        return b.count - a.count || a.colorIndex - b.colorIndex;
      })[0];

      return {
        label: config.label,
        total: values.length,
        topAnswer,
        summary: config.sentence(topAnswer),
        answers
      };
    }).filter(function (row) {
      return row && row.topAnswer && row.topAnswer.count > 0;
    });
  }

  function renderReviewInsightSummary(summary) {
    const safeSummary = String(summary || "");
    const reportMatch = safeSummary.match(/^(\d+% of students report\s+)(.*)$/);
    const studentMatch = safeSummary.match(/^(\d+% of students\s+)(.*)$/);
    const parts = reportMatch || studentMatch;

    if (!parts) {
      return escapeHtml(safeSummary);
    }

    return escapeHtml(parts[1]) + "<strong>" + escapeHtml(parts[2]) + "</strong>";
  }

  function renderProfessorReviewStats(reviews) {
    const panel = document.getElementById("professor-review-stats");
    const statsCount = document.getElementById("professor-review-stats-count");
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const priorityLabels = ["Would take again", "Workload", "Exam difficulty", "Grading style", "Grading transparency", "Lecture usefulness", "Attendance policy", "Office hours/help", "Feedback quality"];
    const rows = getReviewStatRows(safeReviews).slice().sort(function (a, b) {
      const aPriority = priorityLabels.includes(a.label) ? priorityLabels.indexOf(a.label) : priorityLabels.length;
      const bPriority = priorityLabels.includes(b.label) ? priorityLabels.indexOf(b.label) : priorityLabels.length;

      return aPriority - bPriority || b.topAnswer.percent - a.topAnswer.percent || a.label.localeCompare(b.label);
    });

    function getCompactStatValue(value) {
      const compactValues = {
        "Matches class material": "Matches class",
        "Easier than class material": "Easier than class",
        "Harder than class material": "Harder than class",
        "Sometimes checked": "Sometimes",
        "Available but limited": "Limited",
        "Did not use": "Not used",
        "Attending means less work at home": "Worth attending",
        "Rubric is clear": "Clear rubric"
      };

      return compactValues[value] || String(value || "").replace(/-/g, " ");
    }

    function renderStatBreakdown(row) {
      const answers = Array.isArray(row.answers) ? row.answers : [];
      const answerMarkup = answers.map(function (answer) {
        const answerValue = getCompactStatValue(answer.value);
        const answerPercent = Number(answer.percent || 0);
        const answerWidth = Math.max(0, Math.min(100, Number(answer.width || 0)));
        const answerMeta = answerPercent + "%";

        return `
          <div class="professor-review-stat-answer">
            <div class="professor-review-stat-answer-head">
              <span>${escapeHtml(answerValue)}</span>
              <span>${escapeHtml(answerMeta)}</span>
            </div>

            <div
              class="professor-review-stat-answer-track"
              role="img"
              aria-label="${escapeHtml(row.label + ": " + answerValue + ", " + answerMeta)}"
            >
              <span
                class="professor-review-stat-answer-fill"
                style="--stat-width: ${escapeHtml(String(answerWidth))}%;"
              ></span>
            </div>
          </div>
        `;
      }).join("");

      return `
        <details class="professor-review-stat-details">
          <summary class="professor-review-stat-details-toggle">
            <span class="professor-review-stat-details-more">More details</span>
            <span class="professor-review-stat-details-less">Hide details</span>
          </summary>

          <div class="professor-review-stat-breakdown">
            ${answerMarkup}
          </div>
        </details>
      `;
    }

    function renderStatRow(row, index) {
      const displayValue = getCompactStatValue(row.topAnswer.value);
      const delay = Math.min(index * 55, 275);

      return `
        <div class="professor-review-stat-row">
          <div class="professor-review-stat-head">
            <span class="professor-review-stat-label">${escapeHtml(row.label)}</span>

            <div class="professor-review-stat-value">
              <strong>${escapeHtml(displayValue)}</strong>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(row.topAnswer.percent + "%")}</span>
            </div>
          </div>

          <div
            class="professor-review-stat-track"
            role="img"
            aria-label="${escapeHtml(row.label + ": " + displayValue + ", selected by " + row.topAnswer.percent + "% of responses")}"
          >
            <span
              class="professor-review-stat-fill"
              style="--stat-width: ${escapeHtml(String(row.topAnswer.width))}%; --stat-delay: ${delay}ms;"
            ></span>
          </div>

          ${renderStatBreakdown(row)}
        </div>
      `;
    }

    if (statsCount) {
      statsCount.textContent = safeReviews.length
        ? "Based on student reviews"
        : "No review choices yet";
    }

    if (!panel) {
      return;
    }

    if (!rows.length) {
      panel.innerHTML = '<p class="professor-review-status">Review stats will appear after students answer the review choices.</p>';
      return;
    }

    const visibleRows = rows.slice(0, 5);
    const hiddenRows = rows.slice(5);

    const hiddenMarkup = hiddenRows.length
      ? `
        <details class="professor-review-insights-more">
          <summary class="professor-review-insights-more-toggle">
            <span class="professor-review-insights-more-more">Show more</span>
            <span class="professor-review-insights-more-less">Show less</span>
          </summary>

          <div class="professor-review-insights-hidden">
            ${hiddenRows.map(function (row, index) {
              return renderStatRow(row, index + visibleRows.length);
            }).join("")}
          </div>
        </details>
      `
      : "";

    panel.innerHTML = visibleRows.map(renderStatRow).join("") + hiddenMarkup;

    panel
      .querySelectorAll(".professor-review-insights-more")
      .forEach(setupProfessorReviewDetailAnimation);
  }

  function setupProfessorReviewDetailAnimation(details) {
    const summary = details.querySelector("summary");
    const content = details.classList.contains("professor-review-insights-more")
      ? details.querySelector(".professor-review-insights-hidden")
      : details.querySelector(".professor-review-detail-panel");

    if (!summary || !content || details.dataset.reviewAnimationReady === "true") {
      return;
    }

    let closeTimer = null;
    details.dataset.reviewAnimationReady = "true";

    if (!details.open) {
      content.style.height = "0px";
      content.style.opacity = "0";
      content.style.transform = "translateY(-6px)";
    }

    summary.addEventListener("click", function (event) {
      event.preventDefault();

      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }

      if (details.open) {
        content.style.height = content.scrollHeight + "px";
        content.style.opacity = "1";
        content.style.transform = "translateY(0)";

        window.requestAnimationFrame(function () {
          content.style.height = "0px";
          content.style.opacity = "0";
          content.style.transform = "translateY(-6px)";
        });

        closeTimer = window.setTimeout(function () {
          details.open = false;
        }, 280);

        return;
      }

      details.open = true;
      content.style.height = "0px";
      content.style.opacity = "0";
      content.style.transform = "translateY(-6px)";

      window.requestAnimationFrame(function () {
        content.style.height = content.scrollHeight + "px";
        content.style.opacity = "1";
        content.style.transform = "translateY(0)";
      });
    });

    content.addEventListener("transitionend", function (event) {
      if (
        event.propertyName === "height" &&
        details.open &&
        content.style.height !== "0px"
      ) {
        content.style.height = "auto";
        content.style.opacity = "";
        content.style.transform = "";
      }
    });
  }

  function renderReviewStars(rating) {
    const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));

    if (!safeRating) {
      return '<span class="professor-review-rating-text">Not rated</span>';
    }

    const stars = Array.from({ length: 5 }, function (_, index) {
      return '<span class="professor-review-star' + (index < safeRating ? ' is-filled' : '') + '">&#9733;</span>';
    }).join("");

    return '<span class="professor-review-stars" aria-label="' + safeRating + ' out of 5 stars">' + stars + '</span>';
  }

  function getReviewedProfessorCourses(reviews) {
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const availableCourses = Array.isArray(window.aucAtlasCourses)
      ? window.aucAtlasCourses
      : [];
    const coursesByCode = new Map();
    const reviewedCourses = new Map();

    availableCourses.forEach(function (course) {
      const courseCode = String(course && course.code ? course.code : "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

      if (courseCode) {
        coursesByCode.set(courseCode, course);
      }
    });

    safeReviews.forEach(function (review) {
      const courseCode = String(review.courseCode || review.courseTaken || "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
      const course = coursesByCode.get(courseCode);

      if (course) {
        reviewedCourses.set(courseCode, course);
      }
    });

    return Array.from(reviewedCourses.values()).sort(function (firstCourse, secondCourse) {
      return firstCourse.code.localeCompare(secondCourse.code);
    });
  }

  function renderProfessorCourses(reviews) {
    const row = document.getElementById("professor-teaches-row");
    const list = document.getElementById("professor-teaches-list");

    if (!row || !list) {
      return;
    }

    const reviewedCourses = getReviewedProfessorCourses(reviews);

    row.hidden = !reviewedCourses.length;

    if (!reviewedCourses.length) {
      list.textContent = "";
      return;
    }

    list.textContent = reviewedCourses.map(function (course) {
      return course.title || course.code;
    }).join(", ");
  }

  function submitProfessorReviewReport(
    button
  ) {
    const targetId =
      button.dataset.reportReview;
    const targetLabel =
      button.dataset.reportLabel ||
      "this review";

    if (!targetId) {
      return;
    }

    let modal = document.getElementById(
      "professor-review-report-modal"
    );

    if (!modal) {
      modal = document.createElement("div");
      modal.className = "course-report-modal";
      modal.id = "professor-review-report-modal";
      modal.hidden = true;
      modal.innerHTML = `
        <button
          class="course-report-backdrop"
          type="button"
          aria-label="Close report panel"
          data-close-professor-review-report
        ></button>

        <section
          class="course-report-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="professor-review-report-title"
        >
          <header class="course-report-header">
            <div class="course-report-header-copy">
              <p class="course-report-kicker">Content moderation</p>
              <h2 id="professor-review-report-title">Report review</h2>
              <p id="professor-review-report-copy">
                Tell us what is wrong with this review. Our moderators will review your report.
              </p>
            </div>

            <button
              class="course-report-close"
              type="button"
              aria-label="Close report panel"
              data-close-professor-review-report
            >×</button>
          </header>

          <form
            class="course-report-form"
            id="professor-review-report-form"
          >
            <label class="course-report-field">
              <span>Reason for report</span>
              <textarea
                id="professor-review-report-reason"
                name="reason"
                maxlength="1000"
                placeholder="Describe the issue with this review..."
                required
              ></textarea>
            </label>

            <p
              class="course-report-status"
              id="professor-review-report-status"
              aria-live="polite"
            ></p>

            <div class="course-report-actions">
              <button
                class="course-report-cancel"
                type="button"
                data-close-professor-review-report
              >Cancel</button>

              <button
                class="course-report-submit"
                id="professor-review-report-submit"
                type="submit"
              >Submit report</button>
            </div>
          </form>
        </section>
      `;

      document.body.appendChild(modal);
    }

    const form = document.getElementById(
      "professor-review-report-form"
    );
    const copy = document.getElementById(
      "professor-review-report-copy"
    );
    const reasonInput = document.getElementById(
      "professor-review-report-reason"
    );
    const status = document.getElementById(
      "professor-review-report-status"
    );
    const submitButton = document.getElementById(
      "professor-review-report-submit"
    );

    if (
      !form ||
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
          "[data-close-professor-review-report]"
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
                  targetType: "review",
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
    modal.dataset.targetId = targetId;

    copy.textContent =
      "Tell us what is wrong with " +
      targetLabel +
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

  function setupProfessorReviewReports(
    list
  ) {
    if (
      !list ||
      list.dataset.reportReady ===
        "true"
    ) {
      return;
    }

    list.dataset.reportReady = "true";

    list.addEventListener(
      "click",
      function (event) {
        const button =
          event.target.closest(
            "[data-report-review]"
          );

        if (
          !button ||
          !list.contains(button)
        ) {
          return;
        }

        submitProfessorReviewReport(
          button
        );
      }
    );
  }

  function renderProfessorReviews(reviews) {
    const list = document.getElementById("professor-reviews-list");
    const count = document.getElementById("professor-reviews-count");
    const safeReviews = Array.isArray(reviews) ? reviews : [];

    renderProfessorReviewStats(safeReviews);
    renderProfessorCourses(safeReviews);

    if (!list) {
      return;
    }

    setupProfessorReviewReports(
      list
    );

    if (count) {
      count.textContent = safeReviews.length + " " + (safeReviews.length === 1 ? "review" : "reviews");
    }

    if (!safeReviews.length) {
      list.innerHTML = '<p class="professor-review-empty">No reviews yet. Be the first to leave one.</p>';
      return;
    }

    list.innerHTML = safeReviews.map(function (review) {
      const rating = Number(review.rating || 0);
      const reviewId = escapeHtml(review.id || "");
      const reportLabel = escapeHtml(
        [
          review.professorName ||
            "professor review",
          review.courseTaken ||
            review.courseCode
        ]
          .filter(Boolean)
          .join(" · ")
      );
      const reportButton = reviewId
        ? `
          <div class="professor-review-card-actions">
            <button
              class="professor-review-report-button"
              type="button"
              data-report-review="${reviewId}"
              data-report-label="${reportLabel}"
            >Report</button>
          </div>
        `
        : "";

      return `
        <article class="professor-review-card">
          <div class="professor-review-card-top">
            <div class="professor-review-author">
              ${renderReviewAvatar(review)}
              <div>
                <strong>${escapeHtml(review.authorName || "AUC student")}</strong>
              </div>
            </div>

            <div class="professor-review-rating">${renderReviewStars(rating)}</div>
          </div>

          <div class="professor-review-context">
            <span>${escapeHtml(review.courseTaken || "Course not listed")}</span>
            <span>${escapeHtml(review.semesterTaken || "Semester not listed")}</span>
          </div>

          <p class="professor-review-note">${escapeHtml(review.studentNote || "No written note.")}</p>

          ${reportButton}
        </article>
      `;
    }).join("");
  }

  async function loadProfessorReviews(professorId) {
    const list = document.getElementById("professor-reviews-list");
    const count = document.getElementById("professor-reviews-count");
    const stats = document.getElementById("professor-review-stats");

    if (list) {
      list.innerHTML = '<p class="professor-review-status">Loading reviews...</p>';
    }

    if (count) {
      count.textContent = "Loading reviews...";
    }

    if (stats) {
      stats.innerHTML = '<p class="professor-review-status">Loading review stats...</p>';
    }

    try {
      const response = await fetch("/api/professor-reviews?professorId=" + encodeURIComponent(professorId), {
        credentials: "same-origin"
      });
      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        throw new Error(data.error || "Could not load reviews.");
      }

      renderProfessorReviews(data.reviews || []);
    } catch (error) {
      if (count) {
        count.textContent = "Reviews unavailable";
      }

      if (list) {
        list.innerHTML = '<p class="professor-review-status">Could not load reviews right now.</p>';
      }

      if (stats) {
        stats.innerHTML = '<p class="professor-review-status">Could not load review stats right now.</p>';
      }
    }
  }

  function renderProfessorProfile(grid, professor) {
    document.title = professor.name + " | AUC Atlas";

    const professorEmail = professor.email || "";
    const professorEmailMarkup = professorEmail
      ? '<span class="professor-profile-email">' + escapeHtml(professorEmail) + '</span>'
      : '<span class="professor-profile-email is-empty">Email coming soon</span>';
    const pageHeader = document.querySelector(".professors-header");

    if (pageHeader) {
      pageHeader.classList.add("professor-profile-heading");
      pageHeader.innerHTML = `
        <div>
          <h1>${escapeHtml(professor.name)}</h1>
        </div>

        <p>
          Check contact details, read the current short bio, and leave a course-specific review.
        </p>
      `;
    }

    grid.innerHTML = `
      <div class="professor-profile-main">
      <article class="professor-profile-card">
        <div class="professor-profile-image">
          <img src="${escapeHtml(professor.image || "user.png")}" alt="${escapeHtml(professor.name)}">
        </div>
        <div class="professor-profile-body">
          <div class="professor-profile-info">
            <div>
              <span>Department</span>
              <span class="professor-profile-value">${escapeHtml(professor.department || "Department coming soon")}</span>
            </div>

            <div>
              <span>Email</span>
              ${professorEmailMarkup}
            </div>

            <div id="professor-teaches-row" hidden>
              <span>Teaches</span>
              <span class="professor-profile-value professor-profile-course-list" id="professor-teaches-list"></span>
            </div>
          </div>

          <p class="professor-profile-bio">${escapeHtml(professor.bio || "Bio coming soon.")}</p>

          <details class="professor-review-panel">
            <summary class="professor-review-toggle">Leave a review</summary>

            <div class="review-modal-backdrop" onclick="this.closest('details').removeAttribute('open')"></div>

            <form class="professor-review-form" aria-label="Professor review form">
              <div class="review-modal-header">
                <div>
                  <span>Professor review</span>
                  <h2>Leave a review</h2>
                </div>
                <button class="review-close-button" type="button" aria-label="Close review form" onclick="this.closest('details').removeAttribute('open')">&times;</button>
              </div>

              <input type="hidden" name="professorId" value="${escapeHtml(getProfessorId(professor))}">
              <input type="hidden" name="professorName" value="${escapeHtml(professor.name)}">

              <div class="review-section-heading">Course context</div>

              <div class="review-field">
                <label for="review-course">Course taken</label>
                <select id="review-course" name="courseTaken" required>
                  <option value="" selected disabled>Choose course</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-semester">Semester taken</label>
                <select id="review-semester" name="semesterTaken" required>
                  <option value="" selected disabled>Choose semester</option>
                  <option>Fall 2026</option>
                  <option>Summer 2026</option>
                  <option>Spring 2026</option>
                  <option>Winter 2026</option>
                  <option>Fall 2025</option>
                  <option>Summer 2025</option>
                  <option>Spring 2025</option>
                  <option>Winter 2025</option>
                  <option>Fall 2024</option>
                  <option>Summer 2024</option>
                  <option>Spring 2024</option>
                  <option>Winter 2024</option>
                  <option>Fall 2023</option>
                  <option>Summer 2023</option>
                  <option>Spring 2023</option>
                  <option>Winter 2023</option>
                  <option>Fall 2022</option>
                  <option>Summer 2022</option>
                  <option>Spring 2022</option>
                  <option>Winter 2022</option>
                  <option>Fall 2021</option>
                  <option>Summer 2021</option>
                  <option>Spring 2021</option>
                  <option>Winter 2021</option>
                  <option>Fall 2020</option>
                  <option>Summer 2020</option>
                  <option>Spring 2020</option>
                  <option>Winter 2020</option>
                  <option>Fall 2019</option>
                  <option>Summer 2019</option>
                  <option>Spring 2019</option>
                  <option>Winter 2019</option>
                  <option>Fall 2018</option>
                  <option>Summer 2018</option>
                  <option>Spring 2018</option>
                  <option>Winter 2018</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-rating">Overall rating</label>
                <select id="review-rating" name="rating" required>
                  <option value="" selected disabled>Choose rating</option>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-recommend">Would you recommend for this course?</label>
                <select id="review-recommend" name="recommendation">
                  <option value="" selected>Choose recommendation</option>
                  <option>Yes</option>
                  <option>Depends</option>
                  <option>No</option>
                </select>
              </div>

              <div class="review-field full" data-depends-reason hidden>
                <label for="review-recommend-reason">If your answer depends, what does it depend on?</label>
                <input id="review-recommend-reason" name="recommendationReason" type="text" maxlength="220" placeholder="Example: Great for lectures, harder for exams">
              </div>

              <div class="review-section-heading">Class experience</div>

              <div class="review-field">
                <label for="review-attendance">Attendance policy</label>
                <select id="review-attendance" name="attendancePolicy">
                  <option value="" selected>Choose attendance policy</option>
                  <option>Required</option>
                  <option>Sometimes checked</option>
                  <option>Not important</option>
                  <option>Not sure</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-workload">Workload</label>
                <select id="review-workload" name="workload">
                  <option value="" selected>Choose workload</option>
                  <option>Light</option>
                  <option>Moderate</option>
                  <option>Heavy</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-lecture">Lecture usefulness</label>
                <select id="review-lecture" name="lectureUsefulness">
                  <option value="" selected>Choose lecture usefulness</option>
                  <option>Essential</option>
                  <option>Helpful</option>
                  <option>Skippable</option>
                  <option>Not lecture-based</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-office-hours">Office hours/help</label>
                <select id="review-office-hours" name="officeHours">
                  <option value="" selected>Choose an option</option>
                  <option>Helpful</option>
                  <option>Available but limited</option>
                  <option>Hard to reach</option>
                  <option>Did not use</option>
                </select>
              </div>

              <div class="review-section-heading">Grading and advice</div>

              <div class="review-field">
                <label for="review-grading-style">Grading style</label>
                <select id="review-grading-style" name="gradingStyle">
                  <option value="" selected>Choose grading style</option>
                  <option>Exams-heavy</option>
                  <option>Projects-heavy</option>
                  <option>Assignments-heavy</option>
                  <option>Participation-heavy</option>
                  <option>Mixed</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-exam-difficulty">Exam difficulty</label>
                <select id="review-exam-difficulty" name="examDifficulty">
                  <option value="" selected>Choose exam difficulty</option>
                  <option>Easier than class material</option>
                  <option>Matches class material</option>
                  <option>Harder than class material</option>
                  <option>No exams</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-transparency">Grading transparency</label>
                <select id="review-transparency" name="gradingTransparency">
                  <option value="" selected>Choose grading transparency</option>
                  <option>Rubric is clear</option>
                  <option>Somewhat clear</option>
                  <option>Unclear</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-feedback">Feedback quality</label>
                <select id="review-feedback" name="feedbackQuality">
                  <option value="" selected>Choose feedback quality</option>
                  <option>Helpful</option>
                  <option>Minimal</option>
                  <option>None</option>
                  <option>Not applicable</option>
                </select>
              </div>

              <div class="review-field full">
                <label for="review-note">Additional comments (optional)</label>
                <textarea id="review-note" name="studentNote" maxlength="5000"></textarea>
              </div>

              <label class="review-anonymous-option">
                <span class="review-anonymous-copy">
                  <strong>Post anonymously</strong>
                  <small>Your name and profile photo won’t appear with this review.</small>
                </span>
                <input name="isAnonymous" type="checkbox" value="true">
              </label>

              <button class="review-submit-button" type="submit">Submit Review</button>
              <p class="review-form-message" aria-live="polite"></p>
            </form>
          </details>
        </div>
      </article>

      <section class="professor-reviews-section" aria-label="Student reviews for ${escapeHtml(professor.name)}">
        <div class="professor-reviews-header">
          <div>
            <span>Student reviews</span>
            <h2>What students said</h2>
          </div>
          <p id="professor-reviews-count">Loading reviews...</p>
        </div>

        <div class="professor-reviews-list" id="professor-reviews-list">
          <p class="professor-review-status">Loading reviews...</p>
        </div>
      </section>
      </div>

      <section class="professor-review-insights" aria-label="Review stats for ${escapeHtml(professor.name)}">
        <div class="professor-review-insights-header">
          <div>
            <h2>Class patterns</h2>
          </div>
          <p id="professor-review-stats-count">Based on review choices</p>
        </div>

        <div class="professor-review-stats" id="professor-review-stats">
          <p class="professor-review-status">Loading review stats...</p>
        </div>
      </section>
    `;

    setupReviewModalBehavior(grid);
    loadProfessorReviews(getProfessorId(professor));
  }

  function populateReviewCourseSelect(form) {
    const select = form.querySelector("#review-course");
    const courses = Array.isArray(window.aucAtlasCourses) ? window.aucAtlasCourses : [];

    if (!select || select.dataset.courseOptionsReady === "true") {
      return;
    }

    const currentValue = select.value;
    const placeholder = document.createElement("option");

    select.dataset.courseOptionsReady = "true";
    select.innerHTML = "";
    placeholder.value = "";
    placeholder.textContent = "Choose course";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    courses.forEach(function (course) {
      const code = String(course && course.code ? course.code : "").trim();
      const title = String(course && course.title ? course.title : "").trim();

      if (!code) {
        return;
      }

      const option = document.createElement("option");

      option.value = code;
      option.textContent = code + (title ? " - " + title : "");
      select.appendChild(option);
    });

    if (currentValue) {
      select.value = currentValue;
    }
  }

  function setupReviewDependsField(form) {
    const select = form.querySelector("#review-recommend");
    const field = form.querySelector("[data-depends-reason]");
    const input = form.querySelector("#review-recommend-reason");

    if (!select || !field || field.dataset.dependsReady === "true") {
      return;
    }

    field.dataset.dependsReady = "true";

    function syncDependsField() {
      const shouldShow = select.value === "Depends";

      field.hidden = !shouldShow;

      if (!shouldShow && input) {
        input.value = "";
      }
    }

    select.addEventListener("change", syncDependsField);
    syncDependsField();
  }

  function setupReviewChoiceMenus(form) {
    function resetChoiceSearch(choice) {
      const searchInput = choice.querySelector(".review-choice-search");

      if (searchInput) {
        searchInput.value = "";
      }

      choice.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
        optionButton.hidden = false;
      });
    }

    function closeChoices(exceptChoice) {
      form.querySelectorAll(".review-choice.open").forEach(function (choice) {
        if (choice !== exceptChoice) {
          choice.classList.remove("open");
          resetChoiceSearch(choice);
        }
      });
    }

    form.querySelectorAll("select").forEach(function (select) {
      if (select.dataset.reviewChoiceReady === "true") {
        return;
      }

      select.dataset.reviewChoiceReady = "true";
      select.classList.add("review-native-select");

      const choice = document.createElement("div");
      const button = document.createElement("button");
      const label = document.createElement("span");
      const menu = document.createElement("div");
      const isSearchable = select.id === "review-course";
      let searchInput = null;

      choice.className = "review-choice";
      button.className = "review-choice-button";
      button.type = "button";
      label.className = "review-choice-label";
      menu.className = "review-choice-menu";

      function syncLabel() {
        const selectedOption = select.options[select.selectedIndex];
        label.textContent = selectedOption ? selectedOption.textContent : "";
      }

      function syncSelectedOption() {
        menu.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
          optionButton.classList.toggle("is-selected", optionButton.dataset.choiceValue === select.value);
        });
      }

      function filterChoiceOptions(query) {
        const terms = String(query || "")
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        menu.querySelectorAll(".review-choice-option").forEach(function (optionButton) {
          const searchText = optionButton.dataset.choiceSearchText || "";
          const hasValue = Boolean(optionButton.dataset.choiceValue);
          const matches = !terms.length || (hasValue && terms.every(function (term) {
            return searchText.indexOf(term) !== -1;
          }));

          optionButton.hidden = !matches;
        });
      }

      if (isSearchable) {
        const searchWrap = document.createElement("div");

        searchInput = document.createElement("input");
        searchInput.type = "search";
        searchInput.className = "review-choice-search";
        searchInput.placeholder = "Search courses";
        searchInput.setAttribute("aria-label", "Search courses");
        searchInput.setAttribute("autocomplete", "new-password");
        searchInput.setAttribute("autocorrect", "off");
        searchInput.setAttribute("autocapitalize", "none");
        searchInput.setAttribute("spellcheck", "false");

        searchWrap.className = "review-choice-search-wrap";
        searchWrap.appendChild(searchInput);
        menu.appendChild(searchWrap);

        searchInput.addEventListener("input", function () {
          filterChoiceOptions(searchInput.value);
        });

        searchInput.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            event.preventDefault();
            resetChoiceSearch(choice);
            choice.classList.remove("open");
          }
        });
      }

      Array.from(select.options).forEach(function (option) {
        const optionButton = document.createElement("button");

        optionButton.className = "review-choice-option";
        optionButton.type = "button";
        optionButton.disabled = option.disabled;
        optionButton.dataset.choiceValue = option.value;
        optionButton.dataset.choiceSearchText = (option.value + " " + option.textContent).toLowerCase();
        optionButton.textContent = option.textContent;
        menu.appendChild(optionButton);
      });

      button.appendChild(label);
      choice.appendChild(button);
      choice.appendChild(menu);
      select.insertAdjacentElement("afterend", choice);
      syncLabel();
      syncSelectedOption();

      button.addEventListener("click", function (event) {
        const willOpen = !choice.classList.contains("open");

        event.stopPropagation();
        closeChoices(choice);
        choice.classList.toggle("open", willOpen);

        if (willOpen && searchInput) {
          window.setTimeout(function () {
            searchInput.focus();
          }, 0);
        } else {
          resetChoiceSearch(choice);
        }
      });

      menu.addEventListener("click", function (event) {
        const optionButton = event.target.closest("[data-choice-value]");

        if (!optionButton || optionButton.disabled) {
          return;
        }

        select.value = optionButton.dataset.choiceValue;
        syncLabel();
        syncSelectedOption();
        choice.classList.remove("open");
        resetChoiceSearch(choice);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      select.addEventListener("change", function () {
        syncLabel();
        syncSelectedOption();
      });
    });

    form.addEventListener("click", function (event) {
      if (!event.target.closest(".review-choice")) {
        closeChoices();
      }
    });
  }

  async function submitProfessorReview(form, panel) {
    const submitButton = form.querySelector(".review-submit-button");
    const message = form.querySelector(".review-form-message");
    const formData = new FormData(form);
    const payload = {};

    formData.forEach(function (value, key) {
      payload[key] = value;
    });

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    if (message) {
      message.className = "review-form-message";
      message.textContent = "";
    }

    try {
      const response = await fetch("/api/professor-reviews", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        throw new Error(data.error || "Could not save your review. Please log in and try again.");
      }

      if (Array.isArray(data.reviews)) {
        renderProfessorReviews(data.reviews);
      } else {
        await loadProfessorReviews(payload.professorId);
      }

      if (message) {
        message.className = "review-form-message is-success";
        message.textContent = "Review submitted. Thanks for helping other students.";
      }

      window.setTimeout(function () {
        panel.dispatchEvent(
          new CustomEvent("review-request-close")
        );
      }, 900);
    } catch (error) {
      if (message) {
        message.className = "review-form-message is-error";
        message.textContent = error.message || "Could not save your review. Please try again.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Review";
      }
    }
  }

  function setupReviewModalBehavior(grid) {
    const panel = grid.querySelector(".professor-review-panel");
    const form = grid.querySelector(".professor-review-form");
    const backdrop = grid.querySelector(".review-modal-backdrop");
    const reviewToggle = panel
      ? panel.querySelector(".professor-review-toggle")
      : null;
    const closeButton = form
      ? form.querySelector(".review-close-button")
      : null;
    const mobileViewport = window.matchMedia(
      "(max-width: 640px)"
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let mobilePortalActive = false;
    let formAnimation = null;
    let backdropAnimation = null;
    let closing = false;

    if (!panel || !form || !reviewToggle) {
      return;
    }

    populateReviewCourseSelect(form);
    setupReviewChoiceMenus(form);
    setupReviewDependsField(form);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitProfessorReview(form, panel);
    });

    function cancelModalAnimations() {
      if (formAnimation) {
        formAnimation.cancel();
        formAnimation = null;
      }

      if (backdropAnimation) {
        backdropAnimation.cancel();
        backdropAnimation = null;
      }
    }

    function mountMobileReviewModal() {
      if (
        !mobileViewport.matches ||
        mobilePortalActive
      ) {
        return;
      }

      if (backdrop) {
        document.body.appendChild(backdrop);
      }

      document.body.appendChild(form);
      mobilePortalActive = true;
    }

    function restoreReviewModal() {
      if (!mobilePortalActive) {
        return;
      }

      if (backdrop) {
        panel.appendChild(backdrop);
      }

      panel.appendChild(form);
      mobilePortalActive = false;
    }

    function clearOpenChoices() {
      form
        .querySelectorAll(".review-choice.open")
        .forEach(function (choice) {
          choice.classList.remove("open");
        });
    }

    function syncReviewModalLock() {
      document.body.classList.toggle(
        "review-modal-open",
        panel.open
      );

      if (panel.open) {
        if (mobileViewport.matches) {
          mountMobileReviewModal();
        }

        return;
      }

      clearOpenChoices();
      restoreReviewModal();

      document.body.style.removeProperty(
        "--review-scrollbar-compensation"
      );
    }

    function getOriginTransform() {
      return {
        transform:
          "translate(-50%, calc(-50% + 10px)) scale(0.985)",
        radius:
          window.getComputedStyle(form)
            .borderRadius || "24px"
      };
    }

    function openReviewModal() {
      if (panel.open || closing) {
        return;
      }

      const triggerRect =
        reviewToggle.getBoundingClientRect();

      const scrollbarWidth = Math.max(
        0,
        window.innerWidth -
          document.documentElement.clientWidth
      );

      document.body.style.setProperty(
        "--review-scrollbar-compensation",
        scrollbarWidth + "px"
      );

      form.style.opacity = "0";

      if (backdrop) {
        backdrop.style.opacity = "0";
      }

      panel.setAttribute("open", "");
      syncReviewModalLock();

      form.scrollTop = 0;

      if (reducedMotion.matches) {
        form.style.opacity = "";

        if (backdrop) {
          backdrop.style.opacity = "";
        }

        return;
      }

      const origin =
        getOriginTransform(triggerRect);
      const targetRadius =
        window.getComputedStyle(form)
          .borderRadius || "24px";

      cancelModalAnimations();

      form.style.opacity = "";

      if (backdrop) {
        backdrop.style.opacity = "";
      }

      formAnimation = form.animate(
        [
          {
            opacity: 0,
            transform: origin.transform,
            borderRadius: origin.radius
          },
          {
            opacity: 0.55,
            offset: 0.16
          },
          {
            opacity: 1,
            transform:
              "translate(-50%, -50%) scale(1)",
            borderRadius: targetRadius
          }
        ],
        {
          duration: 560,
          easing:
            "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both"
        }
      );

      if (backdrop) {
        backdropAnimation = backdrop.animate(
          [
            { opacity: 0 },
            { opacity: 1 }
          ],
          {
            duration: 360,
            easing:
              "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both"
          }
        );
      }

      formAnimation.finished
        .then(function () {
          if (
            !panel.open ||
            closing ||
            !formAnimation
          ) {
            return;
          }

          formAnimation.cancel();
          formAnimation = null;
        })
        .catch(function () {});

      if (backdropAnimation) {
        backdropAnimation.finished
          .then(function () {
            if (!backdropAnimation) {
              return;
            }

            backdropAnimation.cancel();
            backdropAnimation = null;
          })
          .catch(function () {});
      }
    }

    function finishClosingReviewModal() {
      cancelModalAnimations();

      panel.removeAttribute("open");
      closing = false;

      form.style.opacity = "";
      form.style.transform = "";
      form.style.borderRadius = "";

      if (backdrop) {
        backdrop.style.opacity = "";
      }

      syncReviewModalLock();

      try {
        reviewToggle.focus({
          preventScroll: true
        });
      } catch (error) {
        reviewToggle.focus();
      }
    }

    function closeReviewModal() {
      if (!panel.open || closing) {
        return;
      }

      closing = true;
      clearOpenChoices();

      if (reducedMotion.matches) {
        finishClosingReviewModal();
        return;
      }

      const triggerRect =
        reviewToggle.getBoundingClientRect();
      const origin =
        getOriginTransform(triggerRect);
      const computedForm =
        window.getComputedStyle(form);

      const currentOpacity =
        parseFloat(computedForm.opacity) || 1;
      const currentTransform =
        computedForm.transform === "none"
          ? "translate(-50%, -50%) scale(1)"
          : computedForm.transform;
      const currentRadius =
        computedForm.borderRadius || "24px";

      cancelModalAnimations();

      formAnimation = form.animate(
        [
          {
            opacity: currentOpacity,
            transform: currentTransform,
            borderRadius: currentRadius
          },
          {
            opacity: 0,
            transform: origin.transform,
            borderRadius: origin.radius
          }
        ],
        {
          duration: 340,
          easing:
            "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "both"
        }
      );

      if (backdrop) {
        const currentBackdropOpacity =
          parseFloat(
            window.getComputedStyle(backdrop)
              .opacity
          ) || 1;

        backdropAnimation = backdrop.animate(
          [
            {
              opacity:
                currentBackdropOpacity
            },
            {
              opacity: 0
            }
          ],
          {
            duration: 260,
            easing: "ease",
            fill: "both"
          }
        );
      }

      formAnimation.finished
        .then(finishClosingReviewModal)
        .catch(function () {
          finishClosingReviewModal();
        });
    }

    reviewToggle.addEventListener(
      "click",
      function (event) {
        event.preventDefault();

        if (panel.open) {
          closeReviewModal();
        } else {
          openReviewModal();
        }
      }
    );

    if (backdrop) {
      backdrop.onclick = null;

      backdrop.addEventListener(
        "click",
        closeReviewModal
      );

      backdrop.addEventListener(
        "wheel",
        function (event) {
          event.preventDefault();
        },
        { passive: false }
      );
    }

    if (closeButton) {
      closeButton.onclick = null;

      closeButton.addEventListener(
        "click",
        closeReviewModal
      );
    }

    panel.addEventListener(
      "review-request-close",
      closeReviewModal
    );

    panel.addEventListener(
      "toggle",
      syncReviewModalLock
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key === "Escape" &&
          panel.open
        ) {
          event.preventDefault();
          closeReviewModal();
        }
      }
    );

    if (
      typeof mobileViewport.addEventListener ===
      "function"
    ) {
      mobileViewport.addEventListener(
        "change",
        function () {
          if (!panel.open) {
            return;
          }

          if (mobileViewport.matches) {
            mountMobileReviewModal();
          } else {
            restoreReviewModal();
          }
        }
      );
    }

    syncReviewModalLock();
  }

  function renderProfessorNotFound(grid, professorId) {
    document.title = "Professor Not Found | AUC Atlas";
    grid.innerHTML = `
      <div class="professors-empty">
        Professor "${escapeHtml(professorId)}" was not found. <a href="professors.html">Back to all professors</a>.
      </div>
    `;
  }

  const professorPageSize = 30;
  let professorVisibleLimit = professorPageSize;
  let professorFilterAnimationTimer = 0;
  let professorReviewSummariesLoaded = false;
  let professorReviewSummariesFailed = false;
  let professorReviewSummariesPromise = null;

  function getProfessorCardImageUrl(imageURL) {
    const safeImageURL =
      String(imageURL || "user.png").trim() ||
      "user.png";

    if (
      safeImageURL.includes("res.cloudinary.com") &&
      safeImageURL.includes("/image/upload/")
    ) {
      return safeImageURL.replace(
        "/image/upload/",
        "/image/upload/f_auto,q_auto:good,c_fill,g_auto,w_720,h_456/"
      );
    }

    return safeImageURL;
  }

  function getProfessorCardRatingLabel(professor) {
    const reviewCount = Math.max(
      0,
      Number(professor.reviewCount || 0)
    );
    const averageRating = Number(
      professor.averageRating || 0
    );

    if (
      !reviewCount ||
      !Number.isFinite(averageRating) ||
      averageRating <= 0
    ) {
      return "No Stars Yet";
    }

    const filledStars = Math.max(
      1,
      Math.min(5, Math.round(averageRating))
    );

    return (
      "★".repeat(filledStars) +
      " " +
      averageRating.toFixed(1)
    );
  }

  function getProfessorListingPriority(professor) {
    const hasPhoto = Boolean(
      professor.image &&
      String(professor.image).trim() !== "user.png"
    );
    const hasReviews = Number(professor.reviewCount || 0) > 0;

    if (hasPhoto && hasReviews) return 0;
    if (hasPhoto) return 1;
    if (hasReviews) return 2;
    return 3;
  }

  function loadProfessorReviewSummaries() {
    if (professorReviewSummariesLoaded) {
      return Promise.resolve();
    }

    if (professorReviewSummariesPromise) {
      return professorReviewSummariesPromise;
    }

    professorReviewSummariesPromise = fetch(
      "/api/professor-reviews?summaries=true",
      {
        credentials: "same-origin"
      }
    )
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            if (!response.ok) {
              throw new Error(
                data.error ||
                "Could not load professor ratings."
              );
            }

            return data;
          });
      })
      .then(function (data) {
        const summaries =
          data &&
          data.summaries &&
          typeof data.summaries === "object"
            ? data.summaries
            : {};

        professors.forEach(function (professor) {
          const summary =
            summaries[getProfessorId(professor)] ||
            {};
          const reviewCount = Math.max(
            0,
            Math.floor(
              Number(summary.reviewCount || 0)
            )
          );
          const averageRating = Number(
            summary.averageRating || 0
          );

          professor.reviewCount = reviewCount;
          professor.averageRating =
            Number.isFinite(averageRating) &&
            averageRating > 0
              ? averageRating
              : 0;
          professor.averageStars =
            getProfessorCardRatingLabel(professor);
        });

        professorReviewSummariesLoaded = true;
        renderProfessors(false, false);
      })
      .catch(function () {
        professorReviewSummariesFailed = true;
        professorReviewSummariesLoaded = true;
        renderProfessors(false, false);
      });

    return professorReviewSummariesPromise;
  }

  function renderProfessors(animateResults, resetVisibleLimit) {
    const grid = document.getElementById("professors-grid");
    const browser = document.querySelector(".professors-browser");
    const currentProfessorId = getCurrentProfessorId();

    if (!grid) {
      return;
    }

    grid.classList.toggle("professor-profile-grid", Boolean(currentProfessorId));

    if (browser) {
      browser.classList.toggle("professor-profile-mode", Boolean(currentProfessorId));
    }

    if (currentProfessorId) {
      const professor = professors.find(function (item) {
        return getProfessorId(item) === currentProfessorId;
      });

      if (professor) {
        renderProfessorProfile(grid, professor);
      } else {
        renderProfessorNotFound(grid, currentProfessorId);
      }

      return;
    }

    document.title = "Professors | AUC Atlas";

    // Wait for review summaries before showing the first directory.
    // Otherwise the cards appear with zero reviews, then reshuffle.
    if (!professorReviewSummariesLoaded) {
      grid.innerHTML =
        '<p class="professors-empty" role="status" aria-live="polite">Loading professors and reviews...</p>';
      return;
    }

    if (resetVisibleLimit) {
      professorVisibleLimit = professorPageSize;
    }

    const matchingProfessors = professors
      .filter(professorMatches)
      .sort(function (firstProfessor, secondProfessor) {
        const priorityDifference =
          getProfessorListingPriority(firstProfessor) -
          getProfessorListingPriority(secondProfessor);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        const reviewDifference =
          Number(secondProfessor.reviewCount || 0) -
          Number(firstProfessor.reviewCount || 0);

        if (reviewDifference !== 0) {
          return reviewDifference;
        }

        return firstProfessor.name.localeCompare(secondProfessor.name);
      });

    const visibleProfessors = matchingProfessors.slice(
      0,
      professorVisibleLimit
    );

    grid.innerHTML = visibleProfessors.map(function (professor, index) {
      const shouldLoadImmediately = index < 8;
      const reviewCount = Number(professor.reviewCount || 0);
      const reviewLabel = professorReviewSummariesFailed
        ? "Reviews unavailable"
        : reviewCount + " " + (reviewCount === 1 ? "Review" : "Reviews");
      const ratingLabel = professorReviewSummariesFailed
        ? "Ratings unavailable"
        : professor.averageStars || "No Stars Yet";

      return `
        <a class="professor-card" href="${escapeHtml(getProfessorUrl(professor))}" aria-label="Open ${escapeHtml(professor.name)} profile">
          <div class="professor-card-image">
            <img
              src="${escapeHtml(getProfessorCardImageUrl(professor.image))}"
              alt="${escapeHtml(professor.name)}"
              width="720"
              height="456"
              loading="${shouldLoadImmediately ? "eager" : "lazy"}"
              decoding="async"
              fetchpriority="${index < 4 ? "high" : "auto"}"
            >
          </div>
          <div class="professor-card-body">
            <h2>${escapeHtml(professor.name)}</h2>
            <div class="professor-meta">
              <span>${escapeHtml(professor.displayDepartment || professor.department)}</span>
              <span>${escapeHtml(reviewLabel)}</span>
              <span>${escapeHtml(ratingLabel)}</span>
            </div>
          </div>
        </a>
      `;
    }).join("");

    if (!matchingProfessors.length) {
      grid.innerHTML = '<p class="professors-empty">No professors match those filters.</p>';
    } else if (matchingProfessors.length > professorVisibleLimit) {
      const remainingProfessorCount =
        matchingProfessors.length -
        professorVisibleLimit;
      const nextBatchSize = Math.min(
        professorPageSize,
        remainingProfessorCount
      );

      grid.insertAdjacentHTML(
        "beforeend",
        `
          <button
            class="professors-view-more"
            id="professors-view-more"
            type="button"
            aria-label="Show ${nextBatchSize} more professors"
          >
            View ${nextBatchSize} more
            <span>${remainingProfessorCount} remaining</span>
          </button>
        `
      );

      const viewMoreButton =
        document.getElementById("professors-view-more");

      if (viewMoreButton) {
        viewMoreButton.addEventListener("click", function () {
          professorVisibleLimit += professorPageSize;
          renderProfessors(false, false);
        });
      }
    }

    if (animateResults) {
      window.clearTimeout(professorFilterAnimationTimer);
      grid.classList.remove("is-filtering");
      void grid.offsetWidth;
      grid.classList.add("is-filtering");

      professorFilterAnimationTimer = window.setTimeout(function () {
        grid.classList.remove("is-filtering");
      }, 520);
    }
  }

  function setupProfessorFilters() {
    populateDepartmentFilters();

    document.querySelectorAll(".filter-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        button.closest(".filter-item").classList.toggle("open");
      });
    });

    document.querySelectorAll("#professor-filters input").forEach(function (input) {
      input.addEventListener("change", function () {
        renderProfessors(true, true);
      });
    });

    const searchInput = document.getElementById("professor-search-input");

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        renderProfessors(true, true);
      });
    }

    renderProfessors(false, true);

    if (!getCurrentProfessorId()) {
      loadProfessorReviewSummaries();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupProfessorFilters);
  } else {
    setupProfessorFilters();
  }
})();
