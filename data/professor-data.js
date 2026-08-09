(function () {
  const professors = [
    { id: "eslam-badr", name: "Eslam Badr", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Calculus 1, Linear Algebra", group: "A-F", email: "eslammath@aucegypt.edu", bio: "Eslam Badr earned his PhD from UAB before joining AUC. His work focuses on algebraic geometry and arithmetic, including plane curves, moduli spaces, automorphism groups, twisting theory, quadratic points, and Weierstrass points.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785248610/ChatGPT_Image_Jul_28_2026_05_23_19_PM_xfec1d.png" },
    { id: "kate-ellis", name: "Kate Ellis", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "kate.ellis@aucegypt.edu", bio: "Kate Ellis is an associate professor and clinical psychologist at AUC. Her work focuses on refugees, trauma, youth exposed to violence, and accessible mental health interventions for conflict-affected communities.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765918/Kate_Ellis_dhynm1.png" },
    { id: "aya-musmar", name: "Aya Musmar", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "aya.musmar@aucegypt.edu", bio: "Aya Musmar is an assistant professor of humanities in architecture at AUC. Her work focuses on forced displacement, refugee camps, injustice, climate change, heritage, and architecture as a form of testimony.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765917/Aya_Musmar_fistv7.png" },
    { id: "tamir-el-khouly", name: "Tamir El-Khouly", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "t.el-khouly@aucegypt.edu", bio: "Tamir El-Khouly earned his PhD in the built environment from UCL before joining AUC. His work focuses on architectural computing, BIM, machine learning, design thinking, and parametric design.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765913/Tamir_El-Khouly_r80cnx.png" },
    { id: "wael-el-mahallawy", name: "Wael El Mahallawy", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "wfawzy@aucegypt.edu", bio: "Wael El Mahallawy is an associate professor and music program director at AUC. His work focuses on Arab music theory, qanoun performance, sound engineering, and music technology.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765912/Wael_El-Mahallawy_ajg1rj.png" },
    { id: "addison-ellis", name: "Addison Ellis", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", bio: "Addison Ellis earned his PhD from the University of Illinois before joining AUC. His work focuses on Kant, post-Kantian philosophy, Heidegger, self-consciousness, and spontaneity.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785765912/Addison_Ellis_ivh2fn.png" },
    { id: "daoud-siniora", name: "Daoud Siniora", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "daoud.siniora@aucegypt.edu", bio: "Daoud Siniora is an assistant professor of mathematics at AUC. His work focuses on pure mathematics, model theory, and mathematical logic.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764421/Daoud_Siniora_wfvvfr.png" },
    { id: "tamer-el-leithy", name: "Tamer El-Leithy", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", bio: "Tamer El-Leithy studied economics and philosophy at AUC before specializing in medieval history. His work focuses on Coptic conversion, Arabization, and religious change in medieval Egypt.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764419/Tamer_El-Leithy_d25vt8.png" },
    { id: "peter-barsoum", name: "Peter Barsoum", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "pbarsoum@aucegypt.edu", bio: "Peter Barsoum has lived, studied, and taught across Southeast Europe, the Middle East, Africa, and Asia. He most recently taught writing at Samarkand State University in Uzbekistan.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764419/Peter_Barsoum_fbvgzf.png" },
    { id: "maha-bali", name: "Maha Bali", department: "Center for Learning and Teaching", displayDepartment: "CLT", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "bali@aucegypt.edu", bio: "Maha Bali earned her PhD in education from the University of Sheffield before joining AUC. Her work focuses on equitable, open, and connected learning, academic inclusion, and community-building.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764415/Maha_Bali_oep3n4.png" },
    { id: "mohamed-aly", name: "Mohamed Aly", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mfawzyaly@aucegypt.edu", bio: "Mohamed Fawzy Aly earned his PhD in mechanical engineering from McMaster University before joining AUC in 2010. His work focuses on advanced manufacturing, design optimization, and topology optimization.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764414/Mohamed_Aly_jiacih.png" },
    { id: "karim-banawan", name: "Karim Banawan", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "karim.banawan@aucegypt.edu", bio: "Karim A. Banawan earned his PhD in electrical engineering from the University of Maryland before joining AUC. His work focuses on information theory, wireless communications, network security, private information retrieval, and machine learning.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764413/Karim_Banawan_v87oii.png" },
    { id: "karim-seddik", name: "Karim Seddik", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "kseddik@aucegypt.edu", bio: "Karim G. Seddik earned his PhD in electrical engineering from the University of Maryland before joining AUC. His work focuses on machine learning, wireless networks, intelligent reflecting surfaces, and backscatter communications.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764413/Karim_Seddik_mncy4y.png" },
    { id: "suher-zada", name: "Suher Zada", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "suzada@aucegypt.edu", bio: "Suher Zada is a professor of biology and immunology at AUC. Her work focuses on infectious diseases and immune-system research using biotechnology, nanotechnology, and computational methods.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764408/Suher_Zada_osz83q.png" },
    { id: "karim-addas", name: "Karim Addas", department: "Physics", displayDepartment: "PHYS", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "kaddas@aucegypt.edu", bio: "Karim Addas earned his PhD in physics from Indiana University before joining AUC. His work focuses on microrheology and the behavior of semiflexible biological materials.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764408/Karim_Addas_vq799y.png" },
    { id: "tamer-elbatt", name: "Tamer ElBatt", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "tamer.elbatt@aucegypt.edu", bio: "Tamer ElBatt earned his PhD in electronics and communications engineering from the University of Maryland before joining AUC. His work focuses on wireless, mobile, and IoT networks.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764407/Tamer_ElBatt_xvnauy.png" },
    { id: "hani-henry", name: "Hani Henry", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hhenry@aucegypt.edu", bio: "Hani Henry earned his PhD in clinical psychology from Miami University before joining AUC. His work focuses on culture, marginalized communities, psychotherapy, counseling, and cross-cultural psychology.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764405/Hani_Henry_yqg7ui.png" },
    { id: "yasmine-motawy", name: "Yasmine Motawy", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "ymotawy@aucegypt.edu", bio: "Yasmine Motawy teaches rhetoric and composition at AUC. Her work focuses on children’s literature, translation, criticism, editing, and contemporary Egyptian society.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764405/Yasmine_Motawy_ewzf4j.png" },
    { id: "catarina-belo", name: "Catarina Belo", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "cbelo@aucegypt.edu", bio: "Catarina Belo is an associate professor of philosophy at AUC. Her work focuses on Islamic philosophy, medieval Christian thought, Hegel, religion, and virtue ethics.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764402/Catarina_Belo_jlc7xl.png" },
    { id: "yasmine-ahmed", name: "Yasmine Ahmed", department: "Core Curriculum", displayDepartment: "CORE", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "yasminemoataz@aucegypt.edu", bio: "Yasmine Moataz Ahmed earned her PhD in social anthropology from the University of Cambridge before joining AUC. Her work focuses on the state, citizenship, rural Egypt, agriculture, environment, and labor.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764398/Yasmine_Ahmed_g1ohx6.png" },
    { id: "nihal-nagi", name: "Nihal Nagi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764398/Nihal_Nagi_dgdper.png" },
    { id: "salah-al-agha", name: "Salah Al-Agha", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "salah.alagha@aucegypt.edu", bio: "Salah Al-Agha earned his MSc and PhD from Purdue University after completing his BSc at AUC. His work focuses on operations research, decision-making, lean practices, simulation, and engineering education.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764397/Salah_Al-Agha_usycvk.png" },
    { id: "richard-fincham", name: "Richard Fincham", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "rfincham@aucegypt.edu", bio: "Richard Fincham earned his PhD from the University of Warwick before joining AUC. His work focuses on Kant, German philosophy, Humean skepticism, and transcendental idealism.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785764397/Richard_Fincham_dciqqm.png" },
    { id: "ehab-elsawy", name: "Ehab ElSawy", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "A-F", email: "ehab.elsawy@aucegypt.edu", bio: "Ehab El Sawy earned his PhD in physical chemistry at the University of Calgary before joining AUC in 2017. His work focuses on nano-electrochemistry, fuel cells, hydrogen production, batteries, sensors, and corrosion protection.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785249148/Ehab_ElSawy_ifg2np.png" },
    { id: "nageh-allam", name: "Nageh Allam", department: "Physics", displayDepartment: "PHYS", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", email: "nageh.allam@aucegypt.edu", bio: "Nageh Allam earned his PhD in materials science and engineering from Penn State before joining AUC in 2011. His work focuses on nanomaterials for energy, sensors, desalination, biomaterials, and computational materials science.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785249240/Nageh_Allam_wfaser.png" },
    { id: "tamer-shoeib", name: "Tamer Shoeib", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", email: "t.shoeib@aucegypt.edu", bio: "Tamer Shoeib earned his PhD in chemistry from York University before conducting postdoctoral research in Canada. His work focuses on analytical and biophysical chemistry, molecular structure, mass spectrometry, and metal-containing biomolecules.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785249461/Tamer_Shoeib_qmcccs.png" },
    { id: "hassan-azazy", name: "Hassan Azazy", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "hazzazy@aucegypt.edu", bio: "Hassan Azzazy earned his PhD from the University of North Texas Health Science Center before joining AUC. His work focuses on diagnostics, biosensors, nanobiotechnology, drug delivery, and clinical laboratory medicine.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785286932/Hassan_Azazy_frfg0s.png" },
    { id: "ibrahim-abotaleb", name: "Ibrahim Abotaleb", department: "Construction Engineering", displayDepartment: "CENG", filterDepartment: "Engineering", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "ibrahimsalah@aucegypt.edu", bio: "Ibrahim Abotaleb earned his PhD from the University of Tennessee before joining AUC. His work focuses on AI in construction, sustainability, project control, risk, optimization, and contract management.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785287149/Ibrahim_Abotaleb_awad4c.png" },
    { id: "arthur-bos", name: "Arthur Bos", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "A-F", email: "arbos@aucegypt.edu", bio: "Arthur Bos earned his PhD in coastal zone management and fish biology from Hamburg University before joining AUC in 2011. His work focuses on reef fish, marine protected areas, invertebrates, seagrass ecology, and habitat restoration.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785288244/Arthur_Bos_tegujk.png" },
    { id: "walid-fouad", name: "Walid Fouad", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", email: "wfouad@aucegypt.edu", bio: "Walid Fouad earned his PhD in plant molecular and cellular biology from the University of Florida before joining AUC. His work focuses on plant biotechnology, crop improvement, stress tolerance, algae, biofuels, and sustainable agriculture.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785288250/Walid_Fouad_khxyvf.png" },
    { id: "mohamed-badran", name: "Mohamed Badran", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "mobadran@aucegypt.edu", bio: "Mohamed Badran earned his PhD in engineering systems and computing from the University of Guelph before joining AUC. His work focuses on operations research, optimization, autonomous vehicles, and BioMEMS sensors and actuators.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785288787/Mohamed_Badran_ssh771.png" },
    { id: "ahmed-abdellatif", name: "Ahmed Abdellatif", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "A-F", email: "ahmed.abdellatif@aucegypt.edu", bio: "Ahmed Abdellatif earned his MSc and PhD in anatomical sciences and neurobiology from the University of Louisville before joining AUC. His work focuses on tissue repair, diabetes, aging, dementia, and neurodegenerative diseases.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785288910/Ahmed_Abdellatif_elvz21.png" },
    { id: "wafik-lotfallah", name: "Wafik Lotfallah", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", email: "lotfallah@aucegypt.edu", bio: "Wafik Lotfallah earned his PhD from the University of Wisconsin-Madison before joining AUC in 2009. His work focuses on finite model theory, descriptive complexity, fuzzy logic, and mathematical modeling.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785326069/Wafik_Lotfallah_to4w8v.png" },
    { id: "laila-elserty", name: "Laila ElSerty", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "G-M", bio: "Laila ElSerty earned her MA in TEFL from AUC and is pursuing a PhD in discourse analysis. Her work focuses on academic writing, linguistics, curriculum design, and teacher training.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344850/Laila_ElSerty_gf6bkr.png" },
    { id: "mariah-fairley", name: "Mariah Fairley", department: "English Language Instruction", displayDepartment: "ELI", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "mariah@aucegypt.edu", bio: "Mariah J. Fairley is an English language educator with over 20 years of experience. Her work focuses on social justice, humanizing pedagogy, academic writing, identity, and TESOL.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344851/Mariah_Fairley_h9ykwv.png" },
    { id: "gretchen-mccullough", name: "Gretchen McCullough", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "gretchen@aucegypt.edu", bio: "Gretchen McCullough earned her MFA in creative writing from the University of Alabama. Her work focuses on fiction, essays, literary translation, and expatriate life in Cairo.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344851/Gretchen_McCullough_ktotfl.png" },
    { id: "kathleen-saville", name: "Kathleen Saville", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "ksaville@aucegypt.edu", bio: "Kathleen Saville is a senior instructor and department chair at AUC. Her work focuses on writing, curriculum development, teacher education, adult literacy, and creative nonfiction.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344856/Kathleen_Saville_hz1cgi.png" },
    { id: "fikry-boutros", name: "Fikry Boutros", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "A-F", email: "fsb@aucegypt.edu", bio: "Fikry Boutros earned his PhD in TESOL from the University of Nicosia before joining AUC. His work focuses on second-language pragmatics, politeness, apologies, and email communication.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344856/Fikry_Boutros_gbqnkt.png" },
    { id: "mostafa-abbas", name: "Mostafa Abbas", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hala-abd-alhak", name: "Hala Abd Alhak", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "areeg-abdalla", name: "Areeg Abdalla", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hassan-abdalla", name: "Hassan Abdalla", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nadine-abdalla", name: "Nadine Abdalla", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nadine.abdalla@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786232440/Nadine_Abdalla_hxnvwb.png" },
    { id: "wael-abdallah", name: "Wael Abdallah", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "wael.mostafa@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786199112/Wael_Abdallah_nxhjof.jpg" },
    { id: "mohamed-abdallah", name: "Mohamed Abdallah", department: "Construction Engineering", displayDepartment: "CENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mohamed-abdallah@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786232525/Mohamed_Abdallah_odj06s.png" },
    { id: "s-abdel-azeem", name: "Sherif Abdel Azeem", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "shazeem@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786232652/Sherif_Abdel_Azeem_dgckli.png" },
    { id: "omar-abdelaziz", name: "Omar Abdelaziz", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Omar Abdelaziz earned his PhD in mechanical engineering from the University of Maryland. His work focuses on thermofluids, energy-efficient buildings, sustainable energy, HVAC&R, and low-GWP refrigerants.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786018326/Omar_Abdelaziz_nnnnjd.png" },
    { id: "rehab-abdel-aziz", name: "Rehab Abdel-Aziz", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "youssef-abdel-aziz", name: "Youssef Abdel Aziz", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-abdel-kawi", name: "Amr Abdelkawi", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "akawi@aucegypt.edu", bio: "Amr Abdelkawi studied architecture in the United States before joining AUC in 2010. His work focuses on architecture, design management, furniture, publishing, and vocational education.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786018323/Amr_Abdelkawi_lup953.png" },
    { id: "tarek-abdel-kawi", name: "Tarek Abdel Kawi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-abdel-meguid", name: "Ahmed Abdelmeguid", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "a_meguid@aucegypt.edu", bio: "Ahmed Abdel-Meguid earned his PhD in accounting from Syracuse University before joining AUC. His work focuses on auditing, audit quality, corporate governance, and earnings quality.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786018323/Ahmed_Abdelmeguid_vj2o7l.png" },
    { id: "sherif-abdel-mohsen", name: "Sherif Abdelmohsen", department: "Architecture", displayDepartment: "ARCH", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sherifmorad@aucegypt.edu", bio: "Sherif Morad Abdelmohsen earned his PhD in architecture from Georgia Tech before joining AUC. His work focuses on computational design, digital fabrication, robotics, BIM, and virtual reality.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786018329/Sherif_Abdelmohsen_wlbl66.png" },
    { id: "mohamed-abdel-mooty", name: "Mohamed Abdel Mooty", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "anwar-abd-elnaser", name: "Anwar Abd ElNaser", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "anwar.abdelnaser@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786199647/Anwar_Abd_ElNaser_z1j9z3.png" },
    { id: "shahinaz-abdel-rahman", name: "Shahinaz Abdel Rahman", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ashraf-abdelraouf", name: "Ashraf Abdelraouf", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "alaa-abdel-salam", name: "Alaa Abdel Salam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "laila-abdel-salam", name: "Laila Abdel Salam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-abdel-wahab", name: "Ahmed Abdel Wahab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalal-abo-el-seoud", name: "Dalal Abo El Seoud", department: "Arabic Language Instruction", displayDepartment: "ALIN", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "dalalas@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786232787/Dalal_Abo_El_Seoud_ddc6qf.png" },
    { id: "walid-aboelsoud", name: "Walid Aboelsoud", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "walid.aboelsoud@aucegypt.edu", bio: "Biography coming soon.", image: "https://eng.asu.edu.eg/ar/download?sid=uttCRzZ4WPD66gdEtHWNnUylxj9yA4MhweVnfGulUjs%3D" },
    { id: "mohamed-abotera", name: "Mohamed Abotera", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-abou-auf", name: "Ahmed Abou-Auf", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "aabouauf@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786199876/Ahmed_Abou-Auf_citwhy.png" },
    { id: "tarek-abou-el-seoud", name: "Tarek Abou El Seoud", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "essam-abou-el-zahab", name: "Essam Abou El-Zahab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hend-abou-ghaly", name: "Hend Abou Ghaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "noha-abou-khatwa", name: "Noha Abou-Khatwa", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nkhatwa@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786199957/Noha_Abou-Khatwa_cf0x24.jpg" },
    { id: "nidaa-aboulhosn", name: "Nidaa Aboulhosn", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nidaa.aboulhosn@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786199993/Nidaa_Aboulhosn_mtr9ny.jpg" },
    { id: "mohamed-abou-zeid", name: "Mohamed Abou-Zeid", department: "Construction Engineering", displayDepartment: "CENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mnagiba@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786232916/Mohamed_Abou-Zeid_q4rsmj.png" },
    { id: "reham-abou-zeid", name: "Reham Abou-Zeid", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-abozaied", name: "Hanan Abozaied", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-abu-el-kheir", name: "Mohamed Abu El Kheir", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-abu-helw", name: "Amr Abu Helw", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nayera-abusetit", name: "Nayera Abusetit", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-adly", name: "Amr Adly", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "amradly82@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233063/Amr_Adly_eg2wzk.png" },
    { id: "reem-ahmed", name: "Reem Ahmed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "samah-ahmed", name: "Samah Ahmed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "firas-al-atraqshi", name: "Firas Al-Atraqchi", department: "Journalism and Mass Communication", displayDepartment: "JRMC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "falatraqchi@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233150/Firas_Al-Atraqchi_takumk.png" },
    { id: "eman-al-ayyat", name: "Eman Al-Ayyat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-alhalaby", name: "Mohamed Alhalaby", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ramy-ali", name: "Ramy Ali", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "aya-alkholy", name: "Aya Alkholy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "salma-al-saady", name: "Salma Al-Saady", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-al-sahouly", name: "Ibrahim Al-Sahouly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ramy-aly", name: "Ramy Aly", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "ramy.aly@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786200416/Ramy_Aly_aqc1ti.jpg" },
    { id: "sherif-aly", name: "Sherif Aly", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sgamal@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233239/Sherif_Aly_k20ux4.png" },
    { id: "hassanein-amer", name: "Hassanein Amer", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hamer@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233339/Hassanein_Amer_wl2duo.png" },
    { id: "mona-amer", name: "Mona Amer", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "monaamer@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2023-02/Copy%20of%20IMG_3682.jpg" },
    { id: "ayatalla-amin", name: "Ayatalla Amin", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-amin", name: "Dina Amin", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "dina.a@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786200878/Department_of_the_Arts_brb7mo.jpg" },
    { id: "khaled-amin", name: "Khaled Amin", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "asma-amleh", name: "Asma Amleh", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "aamleh@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233544/Asma_Amleh_ijci1b.png" },
    { id: "mohamed-anany", name: "Mohamed Anany", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohab-anis", name: "Mohab Anis", department: "Electronics and Communications Engineering", displayDepartment: "ECE", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "manis@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233672/Mohab_Anis_fnhe53.png" },
    { id: "marina-apaydin", name: "Marina Apaydin", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201117/Marina_Apaydin_pc3t5i.jpg" },
    { id: "mustafa-arafa", name: "Mustafa Arafa", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mharafa@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201162/Mustafa_Arafa_pzyoei.jpg" },
    { id: "maher-asham", name: "Maher Asham", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "iman-ashmawy", name: "Iman Ashmawy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yara-ashour", name: "Yara Ashour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ali-atef", name: "Ali Atef", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sara-attawiya", name: "Sara Attawiya", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ali-awni", name: "Ali Awni", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahawni@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201247/Ali_Awni_jqocs3.jpg" },
    { id: "mariam-ayad", name: "Mariam Ayad", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "m.ayad@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201339/Mariam_Ayad_acyy5a.jpg" },
    { id: "mina-ayad", name: "Mina Ayad", department: "Economics", displayDepartment: "ECON", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mina_sami@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233750/Mina_Ayad_zoghy4.png" },
    { id: "maysa-ayoub", name: "Maysa Ayoub", department: "Center for Migration and Refugee Studies", displayDepartment: "CMRS", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "maysa@aucegypt.edu", bio: "Biography coming soon.", image: "https://gssc.uni-koeln.de/sites/gssc/_processed_/5/e/csm_maysa_ayoub_600x900_bw_3df52cf4e9.jpg" },
    { id: "nahed-azab", name: "Nahed Azab", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nazab@aucegypt.edu", bio: "Biography coming soon.", image: "https://menaobservatory.ai/storage/ad44c57d9a38ac815b437302719823a4.jpg" },
    { id: "khalid-azzouz", name: "Khalid Azzouz", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nesrine-badawi", name: "Nesrine Badawi", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nbadawi@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201449/Nesrine_Badawi_apyijm.jpg" },
    { id: "mohga-badran", name: "Mohga Badran", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mabadran@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/mohga_badran_1.jpg" },
    { id: "roba-bairakdar", name: "Roba Bairakdar", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233838/Roba_Bairakdar_lkkgij.png" },
    { id: "mohamed-baitie", name: "Mohamed Baitie", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "may-bakr", name: "May Bakr", department: "Biology", displayDepartment: "BIOL", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "may.bakr@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201605/May_Bakr_etssmi.png" },
    { id: "yousra-bakr", name: "Yousra Bakr", department: "Journalism and Mass Communication", displayDepartment: "JRMC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786233958/Yousra_Bakr_qbqarn.png" },
    { id: "christopher-barker", name: "Chris Barker", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "chris.barker@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234048/Chris_Barker_urc5ad.png" },
    { id: "ghada-barsoum", name: "Ghada Barsoum", department: "Public Policy and Administration", displayDepartment: "PPAD", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "gbarsoum@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201726/Ghada_Barsoum_yednhd.jpg" },
    { id: "reem-bassiouney", name: "Reem Bassiouney", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "reem.bassiouney@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201805/Reem_Bassiouney_sry5re.jpg" },
    { id: "dina-bassiouni", name: "Dina Bassiouni", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "dbassiouni@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234225/Dina_Bassiouni_vv2skv.png" },
    { id: "mohamed-basuony", name: "Mohamed Basuony", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mohamed.basuony@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201925/Mohamed_Basuony_vxheb5.jpg" },
    { id: "nizar-becheikh", name: "Nizar Becheikh", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nbecheikh@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786201978/Nizar_Becheikh_ysujiw.jpg" },
    { id: "teklu-bekele", name: "Teklu Bekele", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "teklu.abate@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234309/Teklu_Bekele_zvvqiz.png" },
    { id: "shahjahan-bhuiyan", name: "Shahjahan Bhuiyan", department: "Public Policy and Administration", displayDepartment: "PPAD", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sbhuiyan@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786202121/Shahjahan_Bhuiyan_lec2fw.jpg" },
    { id: "mohammed-bouaddi", name: "Mohammed Bouaddi", department: "Economics", displayDepartment: "ECON", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "m.bouaddi@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786202174/Mohammed_Bouaddi_rbtgg3.jpg" },
    { id: "kamal-boutros", name: "Kamal Boutros", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "jochen-braun", name: "Jochen Braun", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "jochen.braun@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234477/Jochen_Braun_ca9g2z.png" },
    { id: "heather-browne", name: "Heather Browne", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rodrigo-brum", name: "Rodrigo Brum", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Rodrigo Brum holds an MA in philosophy and an MFA in film and new media. His work focuses on filmmaking, media installation, speculative design, and documentary production.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786027912/Rodrigo_Brum_szl4mi.jpg" },
    { id: "melanie-carter", name: "Melanie Carter", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mcarter@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "rim-cherif", name: "Rim Cherif", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234576/Rim_Cherif_cp0spq.png" },
    { id: "sungsoo-chun", name: "Sungsoo Chun", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234650/Sungsoo_Chun_ypxogd.png" },
    { id: "amira-dabour", name: "Amira Dabour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khaled-dahawy", name: "Khaled Dahawy", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "dahawy@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234713/Khaled_Dahawy_fh7zbd.png" },
    { id: "lubna-dairanieh", name: "Lubna Dairanieh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "moataz-darwish", name: "Moataz Darwish", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "moataz.darwish@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786234818/Moataz_Darwish_zazgne.png" },
    { id: "mohamed-darwish", name: "Mohamed Darwish", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mark-deets", name: "Mark Deets", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mark.deets@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786202548/Mark_Deets_nnymnd.jpg" },
    { id: "reem-deif", name: "Reem Deif", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "veronica-del-puerto", name: "Veronica Del Puerto", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nabil-diab", name: "Nabil Diab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khairy-doma", name: "Khairy Doma", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "el-khayam-dorra", name: "El Khayam Dorra", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-ebeid", name: "Dina Ebeid", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "d.makramebeid@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786235191/Dina_Ebeid_zrwpzb.png" },
    { id: "yasmine-eissa", name: "Yasmine Eissa", department: "Economics", displayDepartment: "ECON", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "yasmeen_rida@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786202729/Yasmine_Eissa_yia24f.jpg" },
    { id: "hadeel-el-ahraf", name: "Hadeel El-Ahraf", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maha-el-ashram", name: "Maha El-Ashram", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ashraf-el-assaly", name: "Ashraf El Assaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amira-el-ayouty", name: "Amira El Ayouty", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-elbanbi", name: "Ahmed ElBanbi", department: "Petroleum and Energy Engineering", displayDepartment: "PENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmed.elbanbi@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786235263/Ahmed_ElBanbi_ar5do5.png" },
    { id: "dina-el-baradie", name: "Dina El-baradie", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-el-basiouny", name: "Dina El-Bassiouny", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786235408/Dina_El-Bassiouny_z9wa1t.png" },
    { id: "dina-elbawab", name: "Dina Elbawab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-elbayoumi", name: "Ahmed Elbayoumi", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmed.elbayoumi@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786235505/Ahmed_Elbayoumi_ebblcb.png" },
    { id: "maha-el-bedaiwy", name: "Maha El-Bedaiwy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "randa-elbedawy", name: "Randa El Bedawy", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "rbedawy@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786235612/Randa_El_Bedawy_ybip6w.png" },
    { id: "amina-el-bindary", name: "Amina El-Bindary", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "abendary@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-03/amina_elbendary-2.jpeg" },
    { id: "alia-el-bolock", name: "Alia El Bolock", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "alaa-el-butch", name: "Alaa El Butch", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-el-dabaa", name: "Sherif El-Dabaa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "marwa-el-daly", name: "Marwa El Daly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "seif-eldawlatly", name: "Seif Eldawlatly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-el-deeb", name: "Heba El Deeb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-el-deghaidy", name: "Heba El-Deghaidy", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "h.eldeghaidy@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786236690/Heba_El-Deghaidy_anxydf.png" },
    { id: "reem-el-degwi", name: "Reem El Degwi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "lameese-eldesouky", name: "Lameese Eldesouky", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "lameese.eldesouky@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786236750/Lameese_Eldesouky_ierwnd.jpg" },
    { id: "lobna-el-dessouky", name: "Lobna El-Dessouky", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "tarek-el-domiaty", name: "Tarek El Domiaty", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nellie-el-enany", name: "Nellie El-Enany", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "raghda-el-essawi", name: "Raghda El Essawi", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "ressawi@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786236836/Raghda_El_Essawi_ymgzcp.png" },
    { id: "ashraf-el-fiqi", name: "Ashraf El Fiqi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nadia-el-gamel", name: "Nadia El Gamel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amani-el-gammal", name: "Amani El-Gammal", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-el-gayar", name: "Mohamed El Gayar", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ingy-el-gazzar", name: "Ingy El Gazzar", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-el-gendy", name: "Ahmed El-Gendy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasmeen-el-ghazaly", name: "Yasmeen El-Ghazaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-el-hadidi", name: "Mohamed El-Hadidi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "salah-el-haggar", name: "Salah El Haggar", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "moataz-el-helaly", name: "Moataz El Helaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-el-kadi", name: "Amr El-Kadi", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "elkadi@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786236572/Amr_El-Kadi_eydnbk.jpg" },
    { id: "mohamed-elkaramany", name: "Mohamed Elkaramany", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "soha-elkassas", name: "Soha ElKassas", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khalil-elkhodary", name: "Khalil Elkhodary", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rasha-el-kholy", name: "Rasha El Kholy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hoda-el-kolaly", name: "Hoda El Kolaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rehab-el-maghraby", name: "Rehab El-Maghraby", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "rehabelmaghraby@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "rabab-el-mahdi", name: "Rabab El Mahdi", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "relmahdi@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786236933/Rabab_El_Mahdi_wfis4f.png" },
    { id: "hanan-el-malla", name: "Hanan El Malla", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "reham-el-morally", name: "Reham El Morally", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-el-morsi", name: "Mohamed El Morsi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-el-mougy", name: "Amr El Mougy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "seham-elmrayed", name: "Seham Elmrayed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mahmoud-el-nably", name: "Mahmoud El Nably", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-el-naghy", name: "Hanan El Naghy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shaymaa-el-nawawy", name: "Shaymaa El Nawawy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "waleed-el-nemr", name: "Waleed El-Nemr", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-elnur", name: "Ibrahim Elnur", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mona-elrakhawy", name: "Mona Elrakhawy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mona-el-roby-saleh", name: "Mona El Roby Saleh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "tamer-el-said", name: "Tamer El Said", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-el-sayed", name: "Ahmed El Sayed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mayyada-el-sayed", name: "Mayyada El-Sayed", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mayyada@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786237675/Mayyada_El-Sayed_x7evwx.png" },
    { id: "salma-el-sayeh", name: "Salma El Sayeh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalia-el-serafy", name: "Dalia El Serafy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "walaa-el-sharkawy", name: "Walaa El Sharkawy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasser-el-shayeb", name: "Yasser El Shayeb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-el-sheemy", name: "Sherif El-Sheemy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "omar-el-shenety", name: "Omar El-Shenety", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maha-el-shinnawy", name: "Maha ElShinnawy", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mshinnawy@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786237153/Maha_ElShinnawy_xgpizd.png" },
    { id: "ahmed-el-sonbaty", name: "Ahmed El Sonbaty", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ghalia-el-srakbi", name: "Ghalia El Srakbi", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "ghalia.s@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786237057/Ghalia_Elsrakbi_zxvziz.png" },
    { id: "asmaa-el-taher", name: "Asmaa El-Taher", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yomna-el-taweel", name: "Yomna El Taweel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-el-turky", name: "Dina El Turky", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amira-elwaan", name: "Amira Elwaan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherwat-elwan", name: "Sherwat Elwan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rehab-emad-el-din", name: "Rehab Emad El din", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "waled-emam", name: "Waled Emam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "aly-erfan", name: "Aly Erfan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amal-esawi", name: "Amal Esawi", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "a_esawi@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/styles/banner/public/2022-05/amal_esawi_pic.jpg?itok=_PeH7kGF" },
    { id: "ahmed-essam", name: "Ahmed Essam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "abdelmaged-essawey", name: "Abdelmaged Essawey", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "magdy-eteiba", name: "Magdy Eteiba", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-ezeldin", name: "Ahmed Ezeldin", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "abdel-ezz-el-arab", name: "Abdel Ezz El-Arab", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ezelarab@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2020-12/unnamed_1.png" },
    { id: "hagar-fadlallah", name: "Hagar Fadlallah", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-faheem", name: "Ahmed Faheem", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-fahmy", name: "Mohamed Fahmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shahira-fahmy", name: "Shahira Fahmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-fahmy", name: "Sherif Fahmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-fakher", name: "Sherif Fakher", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mahmoud-farag", name: "Mahmoud Farag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasmin-farag", name: "Yasmin Farag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "karim-farahat", name: "Karim Farahat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "marian-fares", name: "Marian Fares", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "noah-farhadi", name: "Noah Farhadi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shadi-farid", name: "Shadi Farid", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalia-farouk", name: "Dalia Farouk", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-fathelbab", name: "Heba Fathelbab", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-fayed", name: "Ahmed Fayed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ashraf-fouad", name: "Ashraf Fouad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-fouad", name: "Dina Fouad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "jasmin-fouad", name: "Jasmin Fouad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mai-fouad", name: "Mai Fouad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rania-fouad", name: "Rania Fouad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasser-gadallah", name: "Yasser Gadallah", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "aya-galal", name: "Aya Galal", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "galal-galal-edeen", name: "Galal Galal-Edeen", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "alexandra-gazis", name: "Alexandra Gazis", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "atta-gebril", name: "Atta Gebril", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "agebril@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-04/atta_gebril.jpg" },
    { id: "seham-ghalwash", name: "Seham Ghalwash", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "pascale-ghazaleh", name: "Pascale Ghazaleh", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "ghazaleh@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-04/pascale_ghazaleh-2.jpg" },
    { id: "dina-gomaa", name: "Dina Gomaa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-goubran", name: "Sherif Goubran", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "alexander-grechenko", name: "Alexander Grechenko", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "elena-grechenko", name: "Elena Grechenko", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "chelsea-green", name: "Chelsea Green", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "cgreen@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-02/chelsea_green.jpg" },
    { id: "minas-guirguis", name: "Minas Guirguis", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ali-hadi", name: "Ali Hadi", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahadi@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2021-12/dsc_7430.jpg" },
    { id: "may-haggag", name: "May Haggag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "fouad-halbouni", name: "Fouad Halbouni", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maryam-hamdy", name: "Maryam Hamdy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ola-hamdy", name: "Ola Hamdy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-hamed", name: "Ahmed Hamed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-hanafy", name: "Heba Hanafy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nelly-hanna", name: "Nelly Hanna", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nhanna@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2023-10/nelly_hanna.jpg" },
    { id: "john-harris", name: "John Harris", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ola-hashad", name: "Ola Hashad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-hassan", name: "Ahmed Hassan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-hassan", name: "Mohamed Hassan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nora-hassan", name: "Nora Hassan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hamed-hassouna", name: "Hamed Hassouna", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-hatem", name: "Mohamed Hatem", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "michel-hebert", name: "Michel Hebert", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mhebert@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2021-04/michel2014chisinau4.jpg" },
    { id: "gerda-heck", name: "Gerda Heck", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "gerda.heck@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/gerda_heck.jpg" },
    { id: "mostafa-hefny", name: "Mostafa Hefny", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mostafa.hefny@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/hefny.pic_1.jpg" },
    { id: "hesham-hegazi", name: "Hesham Hegazi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-hegazy", name: "Hanan Hegazy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-hegazy", name: "Ibrahim Hegazy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-hegazy", name: "Mohamed Hegazy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-helmy", name: "Ahmed Helmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "kamila-helmy", name: "Kamila Helmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "omneya-helmy", name: "Omneya Helmy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "michelle-henry", name: "Michelle Henry", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-heshmat", name: "Dina Heshmat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rana-hindy", name: "Rana Hindy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "john-hoey", name: "John Hoey", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-hosni", name: "Dina Hosni", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ossama-hosny", name: "Ossama Hosny", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-ibrahim", name: "Ibrahim Ibrahim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-ibrahim", name: "Mohamed Ibrahim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "youssra-ibrahim", name: "Youssra Ibrahim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "salima-ikram", name: "Salima Ikram", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maged-iskandar", name: "Maged Iskandar", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "howaida-ismaeel", name: "Howaida Ismaeel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "samah-ismaeil", name: "Samah Ismaeil", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ayman-ismail", name: "Ayman Ismail", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-ismail", name: "Mohamed Ismail", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yehea-ismail", name: "Yehea Ismail", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-kais", name: "Amr Kais", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "andreas-kakarougkas", name: "Andreas Kakarougkas", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "laila-kamal", name: "Laila Kamal", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "abeer-kamel", name: "Abeer Kamel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "bassel-kamel", name: "Bassel Kamel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "omar-kandeel", name: "Omar Kandeel", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "aly-kandil", name: "Aly Kandil", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nariman-kandil", name: "Nariman Kandil", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ibrahim-karkouti", name: "Ibrahim Karkouti", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "ibrahim.karkouti@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2023-10/karkoutis_photo.jpeg" },
    { id: "fotna-kassabgy", name: "Fotna Kassabgy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maye-kassem", name: "Maye Kassem", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mayekasm@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2023-10/img-20190110-wa0000%20%281%29.jpg" },
    { id: "evette-khair", name: "Evette Khair", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "lobna-khairy", name: "Lobna Khairy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amany-khalifa", name: "Amany Khalifa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "moustafa-khalil", name: "Moustafa Khalil", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "gurusewak-khalsa", name: "Gurusewak Khalsa", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "g.khalsa@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2022-08/picture1_1.png" },
    { id: "ahmad-khan", name: "Ahmad Khan", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmad.khan@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-03/Ahmed%20Khan%20-%20Low%20res%20235%20kb%20%281334x2000%29.jpeg" },
    { id: "safwan-khedr", name: "Safwan Khedr", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "abdelaziz-khlaifat", name: "Abdelaziz Khlaifat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-kholoussy", name: "Hanan Kholoussy", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hkholoussy@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2025-10/photo.kholoussy.jpg" },
    { id: "malek-khouri", name: "Malek Khouri", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mkhouri@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-kotb", name: "Heba Kotb", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hebakotb@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-05/heba_kotb-2.jpg" },
    { id: "susy-kotit", name: "Susy Kotit", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sean-lee", name: "Sean Lee", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sean.lee@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2019-08/oib.jpg" },
    { id: "tamara-maatouk", name: "Tamara Maatouk", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "tamara.maatouk@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2025-09/Tamara%20Maatouk.jpg" },
    { id: "tarek-madkour", name: "Tarek Madkour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-mahmoud", name: "Dina Mahmoud", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mostafa-mahmoud", name: "Mostafa Mahmoud", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sanaa-makhlouf", name: "Sanaa Makhlouf", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-makhlouf", name: "Sherif Makhlouf", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "habib-maki", name: "Habib Maki", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "wael-mamdouh", name: "Wael Mamdouh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohy-mansour", name: "Mohy Mansour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mariam-marei", name: "Mariam Marei", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "islam-mashaly", name: "Islam Mashaly", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "joseph-massad", name: "Joseph Massad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "javed-maswood", name: "Javed Maswood", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "heba-matbouli", name: "Heba Matbouli", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "reda-mazloum", name: "Reda Mazloum", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "william-melaney", name: "William Melaney", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hakim-meshriki", name: "Hakim Meshriki", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "michael-messiha", name: "Michael Messiha", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "euan-metz", name: "Euan Metz", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "euan.metz@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-04/euan_metz-2.jpg" },
    { id: "mikhail-mikhail", name: "Mikhail Mikhail", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mikhail@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "daria-mizza", name: "Daria Mizza", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "daria.mizza@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "abeer-mohamed", name: "Abeer Mohamed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nabil-mohareb", name: "Nabil Mohareb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-mohib", name: "Ahmed Mohib", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "martin-moraw", name: "Martin Moraw", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maggie-morgan", name: "Maggie Morgan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ian-morrison", name: "Ian Morrison", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "imorrison@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2020-07/ian_ny_pic.jpg" },
    { id: "ola-morsy", name: "Ola Morsy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-mostafa", name: "Ahmed Mostafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "magda-mostafa", name: "Magda Mostafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "salwa-mostafa", name: "Salwa Mostafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "youssef-mostafa", name: "Youssef Mostafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "lobna-mourad", name: "Lobna Mourad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maha-mourad", name: "Maha Mourad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-moussa", name: "Hanan Moussa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-moustafa", name: "Ahmed Moustafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rida-moustafa", name: "Rida Moustafa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mark-muehlhaeusler", name: "Mark Muehlhaeusler", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "isabel-muller", name: "Isabel Muller", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "isabel.muller@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2021-06/fotowebpage.jpg" },
    { id: "maha-muttardi", name: "Maha Muttardi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "peter-nasr", name: "Peter Nasr", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khalid-nassar", name: "Khalid Nassar", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ashraf-nassef", name: "Ashraf Nassef", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "haytham-nawar", name: "Haytham Nawar", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "Haytham.nawar@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-nawara", name: "Ahmed Nawara", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maya-nicolas", name: "Maya Nicolas", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-noaman", name: "Mohamed Noaman", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "bernard-o-kane", name: "Bernard O'Kane", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "bokane@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-04/bernard-2.jpg" },
    { id: "iman-omary", name: "Iman Omary", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-orabi", name: "Mohamed Orabi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "moustafa-oraby", name: "Moustafa Oraby", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-radwan", name: "Ahmed Radwan", department: "Construction Engineering", displayDepartment: "CENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahosney@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "basma-rady", name: "Basma Rady", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-rafea", name: "Ahmed Rafea", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "david-rafferty", name: "David Rafferty", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "david.rafferty@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-02/david_rafferty.jpg" },
    { id: "youssef-ragheb", name: "Youssef Ragheb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherine-ramzy", name: "Sherine Ramzy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-rashwan", name: "Mohamed Rashwan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-rateb", name: "Dina Rateb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "elizabeth-rauh", name: "Elizabeth Rauh", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "elizabeth.rauh@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2025-11/elizabeth_rauh.jpg" },
    { id: "rasha-reda", name: "Rasha Reda", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalia-refaat", name: "Dalia Refaat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-refai", name: "Ahmed Refai", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "areej-remah", name: "Areej Remah", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "h-rizzo", name: "H. Rizzo", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hrizzo@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-02/helen_rizzo.jpg" },
    { id: "elena-romeo", name: "Elena Romeo", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "thomas-rule", name: "Thomas Rule", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-02/thomas_rule.jpg" },
    { id: "abd-elnasser-saad", name: "Abd-Elnasser Saad", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "noha-saada", name: "Noha Saada", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-saafan", name: "Ahmed Saafan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanan-sabea", name: "Hanan Sabea", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hsabea@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-07/20220306-_dsc9515-2.jpg" },
    { id: "nouran-sabry", name: "Nouran Sabry", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "wafaa-sabry", name: "Wafaa Sabry", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-sadek", name: "Amr Sadek", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sara-sadek", name: "Sara Sadek", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "suzanne-safwat", name: "Suzanne Safwat", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nermine-said", name: "Nermine Said", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "fayrouz-sakr-ashour", name: "Fayrouz Sakr Ashour", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rana-salah-eldeen", name: "Rana Salah Eldeen", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "yasmine-salah-el-din", name: "Yasmine Salah El-Din", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "steven-salaita", name: "Steven Salaita", department: "English and Comparative Literature", displayDepartment: "ECLT", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-salama", name: "Ahmed Salama", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "cherif-salama", name: "Cherif Salama", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-salama", name: "Mohamed Salama", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dina-saleh", name: "Dina Saleh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khaled-saleh", name: "Khaled Saleh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nesma-saleh", name: "Nesma Saleh", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hanadi-salem", name: "Hanadi Salem", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maram-salem", name: "Maram Salem", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-sallam", name: "Ahmed Sallam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "khaled-samaha", name: "Khaled Samaha", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "naglaa-samir", name: "Naglaa Samir", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rania-samir", name: "Rania Samir", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmad-saqfalhait", name: "Ahmad Saqfalhait", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmad.saqfalhait@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2025-11/saqfalhait_portrait_2024-square_copy.jpeg" },
    { id: "ezzeldin-sayed-ahmed", name: "Ezzeldin Sayed-Ahmed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ariane-schneck", name: "Ariane Schneck", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2025-09/ariane_schneck.jpg" },
    { id: "olivier-schouteden", name: "Olivier Schouteden", department: "History", displayDepartment: "HIST", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "olivier.schouteden@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2025-01/20190910-_dsc4926-2_0.jpg" },
    { id: "manuel-schwab", name: "Manuel Schwab", department: "Sociology, Egyptology and Anthropology", displayDepartment: "SEA", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "manuel.schwab@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2023-10/man_0.jpg" },
    { id: "sherif-sedky", name: "Sherif Sedky", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "brenda-segone", name: "Brenda Segone", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "aya-selim", name: "Aya Selim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dalia-selim", name: "Dalia Selim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "miral-selim", name: "Miral Selim", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "engy-serag", name: "Engy Serag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-serag", name: "Mohamed Serag", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-serry", name: "Mohamed Serry", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sherif-sewiha", name: "Sherif Sewiha", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amr-shaarawi", name: "Amr Shaarawi", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hesham-shafick", name: "Hesham Shafick", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "reem-shaheed", name: "Reem Shaheed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmad-shahin", name: "Ahmad Shahin", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "irene-shaker", name: "Irene Shaker", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ismail-shaker", name: "Ismail Shaker", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "may-shalaby", name: "May Shalaby", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-shalan", name: "Mohamed Shalan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hamed-shamma", name: "Hamed Shamma", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hossam-sharara", name: "Hossam Sharara", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "tarek-shawki", name: "Tarek Shawki", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nermeen-shehata", name: "Nermeen Shehata", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nader-shenouda", name: "Nader Shenouda", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "ahmed-sherif", name: "Ahmed Sherif", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nagwa-sherif", name: "Nagwa Sherif", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shahdan-sherif", name: "Shahdan Sherif", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "amro-shetta", name: "Amro Shetta", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "hania-sholkamy", name: "Hania Sholkamy", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "marwah-siam", name: "Marwah Siam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "sarah-smierciak", name: "Sarah Smierciak", department: "Political Science", displayDepartment: "POLS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "sarah.smierciak@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2023-10/20230905-_dsc2079%20%281%29.jpg" },
    { id: "ezzeldin-soliman", name: "Ezzeldin Soliman", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "marwa-soliman", name: "Marwa Soliman", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "marwasol@aucegypt.edu", bio: "Biography coming soon.", image: "user.png" },
    { id: "mohamed-swillam", name: "Mohamed Swillam", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "robert-switzer", name: "Robert Switzer", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "switzer@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2024-03/Robert%20Switzer%20-%20Low%20res%20240%20kb%20%281231x2000%29.jpeg" },
    { id: "maryam-taghavi", name: "Maryam Taghavi", department: "Arts", displayDepartment: "ARTS", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "maryam.taghavi@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2025-09/maryam_taghavi.jpg" },
    { id: "adam-talib", name: "Adam Talib", department: "Arab and Islamic Civilizations", displayDepartment: "ARIC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "atalib@aucegypt.edu", bio: "Biography coming soon.", image: "https://www.aucegypt.edu/sites/default/files/2023-10/selected_20220913-_dsc5557_0.jpg" },
    { id: "hatem-tallima", name: "Hatem Tallima", department: "Chemistry", displayDepartment: "CHEM", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Hatem Tallima earned his PhD in biochemistry from Cairo University before joining AUC. His work focuses on medicinal chemistry, drug development, vaccines, tropical diseases, and cancer research.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786030281/Hatem_Tallima_b8jtsm.png" },
    { id: "imane-tarkhan", name: "Imane Tarkhan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "islam-tharwat", name: "Ismaeel Tharwat", department: "Economics", displayDepartment: "ECON", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Ismaeel Tharwat earned his PhD in economics from Paris-Saclay University before joining AUC. His work focuses on innovation, trade, development, entrepreneurship, and sports economics.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786029898/Ismaeel_Tharwat_u7xf8h.png" },
    { id: "ahmed-tolba", name: "Ahmed Tolba", department: "Management", displayDepartment: "MGMT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "ahmedtolba@aucegypt.edu", bio: "Ahmed Tolba earned his PhD from George Washington University before joining AUC. His work focuses on branding, innovation, online marketing, social marketing, and entrepreneurship.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786029631/Ahmed_Tolba_g7xqlm.png" },
    { id: "alessandro-topa", name: "Alessandro Topa", department: "Philosophy", displayDepartment: "PHIL", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "a.topa@aucegypt.edu", bio: "Alessandro Topa earned his PhD in philosophy from the University of Bonn before joining AUC in 2009. His work focuses on Kant, Peirce, semiotics, logic, and practical philosophy.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786029490/Alessandro_Topa_wvdnbf.jpg" },
    { id: "rabab-wahba", name: "Rabab Wahba", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "dahlia-wahdan", name: "Dahlia Wahdan", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "rasha-wahieb", name: "Rasha Wahieb", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "martena-william", name: "Martena William", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "shahira-yacout", name: "Shahira Yacout", department: "Arabic Language Instruction", displayDepartment: "ALI", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "yacout@aucegypt.edu", bio: "Shahira Yacout earned her MA in teaching Arabic as a foreign language from AUC. Her work focuses on Arabic instruction, curriculum development, assessment, and immersion programs.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786029228/Shahira_Yacout_hihddh.png" },
    { id: "nancy-yassa", name: "Nancy Yassa", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "maaly-younis", name: "Maaly Younis", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "mostafa-youssef", name: "Mostafa Youssef", department: "Mechanical Engineering", displayDepartment: "MENG", filterDepartment: "Engineering", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "MOSTAFA.YOUSSEF@aucegypt.edu", bio: "Mostafa Youssef earned his PhD from MIT before joining AUC in 2017. His work focuses on computational nuclear materials and ceramic thermodynamics.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786029047/Mostafa_Youssef_njznek.jpg" },
    { id: "moustafa-youssef", name: "Moustafa Youssef", department: "Computer Science and Engineering", displayDepartment: "CSCE", filterDepartment: "Computer Science", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "moustafa-youssef@aucegypt.edu", bio: "Moustafa Youssef is a professor and founder of Egypt’s Wireless Research Center of Excellence. His work focuses on wireless networks, mobile computing, positioning, pervasive computing, and network security.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786028978/Moustafa_Youssef_fmhupb.png" },
    { id: "noha-youssef", name: "Noha Youssef", department: "Mathematics and Actuarial Science", displayDepartment: "MACT", filterDepartment: "Sciences", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nayoussef@aucegypt.edu", bio: "Noha Youssef earned her PhD from the London School of Economics before joining AUC in 2012. She previously worked at LSE as a research associate and teaching fellow.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786028794/Noha_Youssef_vw2ddh.png" },
    { id: "youssri-youssri-ahmed", name: "Youssri Youssri Ahmed", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "malak-zaalouk", name: "Malak Zaalouk", department: "Applied Linguistics and Educational Studies", displayDepartment: "ALES", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "mz@aucegypt.edu", bio: "Biography coming soon.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786028506/Malak_Zaalouk_qpydeb.jpg" },
    { id: "angie-zaher", name: "Angie Zaher", department: "Accounting", displayDepartment: "ACCT", filterDepartment: "Business", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "angie.zaher@aucegypt.edu", bio: "Angie Abdel Zaher earned her PhD in accounting from Florida International University before joining AUC. Her work focuses on corporate governance, finance, and accounting education.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1786028347/Angie_Zaher_irj8yi.jpg" },
    { id: "aida-zakaria", name: "Aida Zakaria", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "A-F", email: "", bio: "Biography coming soon.", image: "user.png" },
    { id: "nour-zaki", name: "Nour Zaki", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "N-Z", email: "nourzaki@aucegypt.edu", bio: "Nour Zaki is an assistant professor of developmental psychology and director of AUC’s Attachment Lab. Her work focuses on childhood attachment, adult development, and intergenerational relationships.", image: "https://www.aucegypt.edu/sites/default/files/2025-12/dsc00069_2.jpg" },
    { id: "hassan-zaky", name: "Hassan Zaky", department: "Psychology", displayDepartment: "PSYC", filterDepartment: "Humanities", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "hzaky@aucegypt.edu", bio: "Hassan Zaky earned his PhD from Johns Hopkins University before joining AUC. His work focuses on demography, population health, fertility, surveys, and health policy.", image: "https://www.aucegypt.edu/sites/default/files/2023-10/zaky_2013.jpg" },
    { id: "heba-t-allah-zaky", name: "Heba T-allah Zaky", department: "Department coming soon", displayDepartment: "AUC", filterDepartment: "Other", status: "No ratings yet", course: "Courses coming soon", group: "G-M", email: "", bio: "Biography coming soon.", image: "user.png" },
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

    .professors-search-box input:focus {
      border-color: rgba(192, 154, 92, 0.58);
      background: rgba(255, 255, 255, 0.96);
      box-shadow:
        0 0 0 4px rgba(192, 154, 92, 0.12),
        0 14px 36px rgba(42, 32, 20, 0.08);
      transform: translateY(-1px);
    }

    .professor-card {
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
      grid-row: 1 / span 2;
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
      will-change: transform, opacity, border-radius;
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
      transform: translateY(0);
      transition:
        height 0.28s ease,
        opacity 0.22s ease,
        transform 0.22s ease;
      will-change: height, opacity, transform;
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
    }

    .course-report-modal[hidden] {
      display: none;
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

      .professors-grid.professor-profile-grid .professor-review-insights,
      .professors-grid.professor-profile-grid .professor-reviews-section {
        grid-column: auto;
        grid-row: auto;
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
    return normalizeProfessorId(new URLSearchParams(window.location.search).get("id"));
  }

  function getProfessorUrl(professor) {
    return "professors.html?id=" + encodeURIComponent(getProfessorId(professor));
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

    function getResponseLabel(count) {
      return Number(count) === 1
        ? "1 response"
        : count + " responses";
    }

    function renderStatBreakdown(row) {
      const answers = Array.isArray(row.answers) ? row.answers : [];
      const total = Number(row.total || 0);
      const totalLabel = getResponseLabel(total);
      const answerMarkup = answers.map(function (answer) {
        const answerValue = getCompactStatValue(answer.value);
        const answerCount = Number(answer.count || 0);
        const answerPercent = Number(answer.percent || 0);
        const answerWidth = Math.max(0, Math.min(100, Number(answer.width || 0)));
        const answerMeta = answerCount + " of " + total + " · " + answerPercent + "%";

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
            <div class="professor-review-stat-total">
              <div class="professor-review-stat-answer-head">
                <span>Total responses</span>
                <span>${escapeHtml(totalLabel)}</span>
              </div>

              <div
                class="professor-review-stat-answer-track"
                role="img"
                aria-label="${escapeHtml(row.label + ": " + totalLabel + " answered this question")}"
              >
                <span
                  class="professor-review-stat-answer-fill professor-review-stat-total-fill"
                  style="--stat-width: 100%;"
                ></span>
              </div>
            </div>

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
      const authorUserId = review.authorUserId || review.authorUid || "";
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
        <article class="professor-review-card" data-author-user-id="${escapeHtml(authorUserId)}">
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
                <label for="review-note">Additional comments</label>
                <textarea id="review-note" name="studentNote" maxlength="360" required></textarea>
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

      <section class="professor-review-insights" aria-label="Review stats for ${escapeHtml(professor.name)}">
        <div class="professor-review-insights-header">
          <div>
            <span>Review stats</span>
            <h2>Class patterns</h2>
          </div>
          <p id="professor-review-stats-count">Based on review choices</p>
        </div>

        <div class="professor-review-stats" id="professor-review-stats">
          <p class="professor-review-status">Loading review stats...</p>
        </div>
      </section>

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
      "☆".repeat(5 - filledStars) +
      " " +
      averageRating.toFixed(1)
    );
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
        credentials: "same-origin",
        cache: "no-store"
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
        professorReviewSummariesPromise = null;
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

    if (resetVisibleLimit) {
      professorVisibleLimit = professorPageSize;
    }

    const matchingProfessors = professors.filter(professorMatches);
    const visibleProfessors = matchingProfessors.slice(
      0,
      professorVisibleLimit
    );

    grid.innerHTML = visibleProfessors.map(function (professor, index) {
      const shouldLoadImmediately = index < 8;

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
            <p class="professor-bio">${escapeHtml(professor.bio || "Bio coming soon.")}</p>
            <div class="professor-meta">
              <span>${escapeHtml(professor.displayDepartment || professor.department)}</span>
              <span>${escapeHtml((professor.reviewCount || 0) + " " + ((professor.reviewCount || 0) === 1 ? "Review" : "Reviews"))}</span>
              <span>${escapeHtml(professor.averageStars || "No Stars Yet")}</span>
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
