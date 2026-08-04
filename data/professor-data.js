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
    { id: "laila-elserty", name: "Laila ElSerty", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344850/Laila_ElSerty_gf6bkr.png" },
    { id: "mariah-fairley", name: "Mariah Fairley", department: "English Language Instruction", displayDepartment: "ELI", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "mariah@aucegypt.edu", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344851/Mariah_Fairley_h9ykwv.png" },
    { id: "gretchen-mccullough", name: "Gretchen McCullough", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "gretchen@aucegypt.edu", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344851/Gretchen_McCullough_ktotfl.png" },
    { id: "kathleen-saville", name: "Kathleen Saville", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", email: "ksaville@aucegypt.edu", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344856/Kathleen_Saville_hz1cgi.png" },
    { id: "fikry-boutros", name: "Fikry Boutros", department: "Rhetoric and Composition", displayDepartment: "RHET", filterDepartment: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "A-F", email: "fsb@aucegypt.edu", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344856/Fikry_Boutros_gbqnkt.png" },
    ...[
      "Mostafa Abbas", "Hala Abd Alhak", "Areeg Abdalla", "Hassan Abdalla", "Nadine Abdalla", "Wael Abdallah", "Mohamed Abdallah", "S Abdel Azeem",
      "Omar Abdelaziz", "Rehab Abdel-Aziz", "Youssef Abdel Aziz", "Amr Abdel_Kawi", "Tarek Abdel Kawi", "Ahmed Abdel-Meguid", "Sherif Abdel Mohsen", "Mohamed Abdel Mooty",
      "Anwar Abd Elnaser", "Shahinaz Abdel Rahman", "Ashraf Abdelraouf", "Alaa Abdel Salam", "Laila Abdel Salam", "Ahmed Abdel Wahab", "Dalal Abo El Seoud", "Walid Aboelsoud",
      "Mohamed Abotera", "Ahmed Abou-Auf", "Tarek Abou El Seoud", "Essam Abou El-Zahab", "Hend Abou Ghaly", "Noha Abou-Khatwa", "Nidaa Aboulhosn", "Mohamed Abou Zeid",
      "Reham Abou-Zeid", "Hanan Abozaied", "Mohamed Abu El Kheir", "Amr Abu Helw", "Nayera Abusetit", "Amr Adly", "Reem Ahmed",
      "Samah Ahmed", "Firas Al Atraqshi", "Eman Al-Ayyat", "Mohamed Alhalaby", "Ramy Ali", "Aya Alkholy",
      "Salma Al-Saady", "Ibrahim Al-Sahouly", "Ramy Aly", "Sherif Aly", "Hassanein Amer", "Mona Amer", "Ayatalla Amin",
      "Dina Amin", "Khaled Amin", "Asma Amleh", "Mohamed Anany", "Mohab Anis", "Marina Apaydin", "Mustafa Arafa", "Maher Asham",
      "Iman Ashmawy", "Yara Ashour", "Ali Atef", "Sara Attawiya", "Ali Awni", "Mariam Ayad", "Mina Ayad", "Maysa Ayoub",
      "Nahed Azab", "Khalid Azzouz", "Nesrine Badawi", "Mohga Badran", "Roba Bairakdar", "Mohamed Baitie", "May Bakr", "Yousra Bakr",
      "Christopher Barker", "Ghada Barsoum", "Reem Bassiouney", "Dina Bassiouni", "Mohamed Basuony", "Nizar Becheikh",
      "Teklu Bekele", "Shahjahan Bhuiyan", "Mohammed Bouaddi", "Kamal Boutros", "Jochen Braun", "Heather Browne", "Rodrigo Brum",
      "Melanie Carter", "Rim Cherif", "Sungsoo Chun", "Amira Dabour", "Khaled Dahawy", "Lubna Dairanieh", "Moataz Darwish", "Mohamed Darwish",
      "Mark Deets", "Reem Deif", "Veronica Del Puerto", "Nabil Diab", "Khairy Doma", "El Khayam Dorra", "Dina Ebeid", "Yasmine Eissa",
      "Hadeel El-Ahraf", "Maha El-Ashram", "Ashraf El Assaly", "Amira El Ayouty", "Ahmed ElBanbi", "Dina El-baradie", "Dina El Basiouny",
      "Dina Elbawab", "Ahmed Elbayoumi", "Maha El-Bedaiwy", "Randa Elbedawy", "Amina El-Bindary", "Alia El Bolock", "Alaa El Butch", "Sherif El-Dabaa",
      "Marwa El Daly", "Seif Eldawlatly", "Heba El Deeb", "Heba El-Deghaidy", "Reem El Degwi", "Lameese Eldesouky", "Lobna El-Dessouky", "Tarek El Domiaty",
      "Nellie El-Enany", "Raghda El Essawi", "Ashraf El Fiqi", "Nadia El Gamel", "Amani El-Gammal", "Mohamed El Gayar", "Ingy El Gazzar", "Ahmed El-Gendy",
      "Yasmeen El-Ghazaly", "Mohamed El-Hadidi", "Salah El Haggar", "Moataz El Helaly", "Amr El Kadi", "Mohamed Elkaramany", "Soha ElKassas", "Khalil Elkhodary",
      "Rasha El Kholy", "Hoda El Kolaly", "Rehab El-Maghraby",
      "Rabab El Mahdi", "Hanan El Malla", "Reham El Morally", "Mohamed El Morsi", "Amr El Mougy", "Seham Elmrayed", "Mahmoud El Nably", "Hanan El Naghy",
      "Shaymaa El Nawawy", "Waleed El-Nemr", "Ibrahim Elnur", "Mona Elrakhawy", "Mona El Roby Saleh", "Tamer El Said", "Ahmed El Sayed", "Mayyada El-Sayed",
      "Salma El Sayeh", "Dalia El Serafy", "Walaa El Sharkawy", "Yasser El Shayeb", "Sherif El-Sheemy", "Omar El-Shenety", "Maha El-Shinnawy", "Ahmed El Sonbaty",
      "Ghalia El Srakbi", "Asmaa El-Taher", "Yomna El Taweel", "Dina El Turky", "Amira Elwaan", "Sherwat Elwan", "Rehab Emad El din", "Waled Emam",
      "Aly Erfan", "Amal Esawi", "Ahmed Essam", "Abdelmaged Essawey", "Magdy Eteiba", "Ahmed Ezeldin", "Abdel Ezz El-Arab", "Hagar Fadlallah",
      "Ahmed Faheem", "Mohamed Fahmy", "Shahira Fahmy", "Sherif Fahmy", "Sherif Fakher", "Mahmoud Farag", "Yasmin Farag", "Karim Farahat",
      "Marian Fares", "Noah Farhadi", "Shadi Farid", "Dalia Farouk", "Heba Fathelbab", "Ahmed Fayed", "Ashraf Fouad", "Dina Fouad",
      "Jasmin Fouad", "Mai Fouad", "Rania Fouad", "Yasser Gadallah", "Aya Galal", "Galal Galal-Edeen", "Alexandra Gazis", "Atta Gebril",
      "Seham Ghalwash", "Pascale Ghazaleh", "Dina Gomaa", "Sherif Goubran", "Alexander Grechenko", "Elena Grechenko", "Chelsea Green", "Minas Guirguis",
      "Ali Hadi", "May Haggag", "Fouad Halbouni", "Maryam Hamdy", "Ola Hamdy", "Ahmed Hamed", "Heba Hanafy", "Nelly Hanna",
      "John Harris", "Ola Hashad", "Ahmed Hassan", "Mohamed Hassan", "Nora Hassan", "Hamed Hassouna", "Mohamed Hatem", "Michel Hebert",
      "Gerda Heck", "Mostafa Hefny", "Hesham Hegazi", "Hanan Hegazy", "Ibrahim Hegazy", "Mohamed Hegazy", "Ahmed Helmy", "Kamila Helmy",
      "Omneya Helmy", "Michelle Henry", "Dina Heshmat", "Rana Hindy", "John Hoey", "Dina Hosni", "Ossama Hosny",
      "Ibrahim Ibrahim", "Mohamed Ibrahim", "Youssra Ibrahim", "Salima Ikram", "Maged Iskandar", "Howaida Ismaeel", "Samah Ismaeil", "Ayman Ismail",
      "Mohamed Ismail", "Yehea Ismail", "Amr Kais", "Andreas Kakarougkas", "Laila Kamal", "Abeer Kamel", "Bassel Kamel", "Omar Kandeel",
      "Aly Kandil", "Nariman Kandil", "Ibrahim Karkouti", "Fotna Kassabgy", "Maye Kassem", "Evette Khair", "Lobna Khairy", "Amany Khalifa",
      "Moustafa Khalil", "Gurusewak Khalsa", "Ahmad Khan", "Safwan Khedr", "Abdelaziz Khlaifat", "Hanan Kholoussy", "Malek Khouri", "Heba Kotb",
      "Susy Kotit", "Sean Lee", "Tamara Maatouk", "Tarek Madkour", "Dina Mahmoud", "Mostafa Mahmoud", "Sanaa Makhlouf", "Sherif Makhlouf",
      "Habib Maki", "Wael Mamdouh", "Mohy Mansour", "Mariam Marei", "Islam Mashaly", "Joseph Massad", "Javed Maswood", "Heba Matbouli",
      "Reda Mazloum", "William Melaney", "Hakim Meshriki", "Michael Messiha", "Euan Metz", "Mikhail Mikhail", "Daria Mizza", "Abeer Mohamed",
      "Nabil Mohareb", "Ahmed Mohib", "Martin Moraw", "Maggie Morgan", "Ian Morrison", "Ola Morsy", "Ahmed Mostafa", "Magda Mostafa",
      "Salwa Mostafa", "Youssef Mostafa", "Lobna Mourad", "Maha Mourad", "Hanan Moussa", "Ahmed Moustafa", "Rida Moustafa",
      "Mark Muehlhaeusler", "Isabel Muller", "Maha Muttardi", "Peter Nasr", "Khalid Nassar", "Ashraf Nassef", "Haytham Nawar",
      "Ahmed Nawara", "Maya Nicolas", "Mohamed Noaman", "Bernard O'Kane", "Iman Omary", "Mohamed Orabi", "Moustafa Oraby", "Ahmed Radwan",
      "Basma Rady", "Ahmed Rafea", "David Rafferty", "Youssef Ragheb", "Sherine Ramzy", "Mohamed Rashwan", "Dina Rateb", "Elizabeth Rauh",
      "Rasha Reda", "Dalia Refaat", "Ahmed Refai", "Areej Remah", "H. Rizzo", "Elena Romeo", "Thomas Rule", "Abd-Elnasser Saad",
      "Noha Saada", "Ahmed Saafan", "Hanan Sabea", "Nouran Sabry", "Wafaa Sabry", "Amr Sadek", "Sara Sadek", "Suzanne Safwat",
      "Nermine Said", "Fayrouz Sakr Ashour", "Rana Salah Eldeen", "Yasmine Salah El-Din", "Steven Salaita", "Ahmed Salama", "Cherif Salama", "Mohamed Salama",
      "Dina Saleh", "Khaled Saleh", "Nesma Saleh", "Hanadi Salem", "Maram Salem", "Ahmed Sallam", "Khaled Samaha", "Naglaa Samir",
      "Rania Samir", "Ahmad Saqfalhait", "Ezzeldin Sayed-Ahmed", "Ariane Schneck", "Olivier Schouteden", "Manuel Schwab", "Sherif Sedky",
      "Brenda Segone", "Aya Selim", "Dalia Selim", "Miral Selim", "Engy Serag", "Mohamed Serag", "Mohamed Serry", "Sherif Sewiha",
      "Amr Shaarawi", "Hesham Shafick", "Reem Shaheed", "Ahmad Shahin", "Irene Shaker", "Ismail Shaker", "May Shalaby", "Mohamed Shalan",
      "Hamed Shamma", "Hossam Sharara", "Tarek Shawki", "Nermeen Shehata", "Nader Shenouda", "Ahmed Sherif", "Nagwa Sherif", "Shahdan Sherif",
      "Amro Shetta", "Hania Sholkamy", "Marwah Siam", "Sarah Smierciak", "Ezzeldin Soliman", "Marwa Soliman", "Mohamed Swillam",
      "Robert Switzer", "Maryam Taghavi", "Adam Talib", "Hatem Tallima", "Imane Tarkhan", "Islam Tharwat", "Ahmed Tolba", "Alessandro Topa",
      "Rabab Wahba", "Dahlia Wahdan", "Rasha Wahieb", "Martena William", "Shahira Yacout", "Nancy Yassa", "Maaly Younis", "Mostafa Youssef",
      "Moustafa Youssef", "Noha Youssef", "Youssri Youssri Ahmed", "Malak Zaalouk", "Angie Zaher", "Aida Zakaria", "Nour Zaki",
      "Hassan Zaky", "Heba T-allah Zaky"
    ].map(function (name) {
      const firstLetter = name.trim().charAt(0).toUpperCase();
      const group = firstLetter >= "A" && firstLetter <= "F" ? "A-F" : firstLetter >= "G" && firstLetter <= "M" ? "G-M" : "N-Z";

      return {
        id: name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        name,
        department: "Department coming soon",
        displayDepartment: "AUC",
        filterDepartment: "Other",
        status: "No ratings yet",
        course: "Courses coming soon",
        group,
        image: "user.png"
      };
    })
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

    .professors-search-box {
      max-width: 560px;
      margin-bottom: 18px;
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
    }

    .professors-search-box input:focus {
      border-color: rgba(192, 154, 92, 0.58);
      box-shadow: 0 0 0 4px rgba(192, 154, 92, 0.12);
    }

    .professor-card {
      color: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
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
      animation: reviewBackdropIn 0.24s ease both;
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
      animation: reviewModalIn 0.28s ease both;
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
      margin-top: 4px;
      color: rgba(192, 154, 92, 0.86);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .review-section-heading::after {
      content: "";
      height: 1px;
      flex: 1;
      background: rgba(23, 23, 23, 0.08);
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
      gap: 8px;
    }

    .professor-review-insights-more {
      display: grid;
      gap: 8px;
    }

    .professor-review-insights-hidden {
      order: 1;
      box-sizing: border-box;
      display: grid;
      gap: 8px;
      margin-top: 0;
      overflow: hidden;
      opacity: 1;
      transform: translateY(0);
      transition: height 0.28s ease, opacity 0.22s ease, transform 0.22s ease;
      will-change: height, opacity, transform;
    }

    .professor-review-insights-more-toggle {
      order: 2;
      width: fit-content;
      margin-top: 2px;
      padding: 0;
      border: 0;
      background: transparent;
      color: #171717;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      list-style: none;
      transition: color 0.18s ease, transform 0.18s ease;
    }

    .professor-review-insights-more-toggle::after {
      content: "";
      width: 6px;
      height: 6px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
      transition: transform 0.18s ease;
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

    .professor-review-insight-card {
      padding: 11px 12px;
      border: 1px solid rgba(23, 23, 23, 0.08);
      border-radius: 16px;
      background: rgba(247, 244, 238, 0.5);
      display: grid;
      gap: 8px;
    }

    .professor-review-insight-main {
      display: grid;
      gap: 6px;
    }

    .professor-review-insight-main span {
      color: rgba(192, 154, 92, 0.92);
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .professor-review-insight-main p {
      margin: 0;
      color: rgba(23, 23, 23, 0.66);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.35;
    }

    .professor-review-insight-main p strong {
      color: #171717;
      font-weight: 900;
    }

    .professor-review-detail-toggle {
      width: fit-content;
      min-height: auto;
      padding: 0;
      border-radius: 0;
      background: transparent;
      color: #171717;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      list-style: none;
    }

    .professor-review-detail-toggle::after {
      content: "";
      width: 6px;
      height: 6px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
      transition: transform 0.18s ease;
    }

    .professor-review-detail[open] .professor-review-detail-toggle::after {
      transform: rotate(225deg) translate(-1px, -1px);
    }

    .professor-review-detail-toggle::-webkit-details-marker {
      display: none;
    }

    .professor-review-detail-panel {
      box-sizing: border-box;
      padding-top: 10px;
      display: grid;
      gap: 8px;
      overflow: hidden;
      opacity: 1;
      transform: translateY(0);
      transition: height 0.28s ease, opacity 0.22s ease, transform 0.22s ease;
      will-change: height, opacity, transform;
    }

    .professor-review-detail-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 42px;
      gap: 8px;
      align-items: center;
    }

    .professor-review-detail-row > span {
      color: rgba(23, 23, 23, 0.7);
      font-size: 11px;
      font-weight: 800;
      line-height: 1.25;
    }

    .professor-review-detail-row > strong {
      color: #171717;
      font-size: 11px;
      font-weight: 900;
      text-align: right;
    }

    .professor-review-detail-track {
      grid-column: 1 / -1;
      height: 6px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(23, 23, 23, 0.08);
    }

    .professor-review-detail-track span {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, rgba(192, 154, 92, 0.96), #171717);
      display: block;
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
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes reviewModalIn {
      from {
        opacity: 0;
        transform: translate(-50%, -46%) scale(0.96);
      }

      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
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

  function professorMatches(professor) {
    const searchInput = document.getElementById("professor-search-input");
    const query = normalize(searchInput ? searchInput.value : "");
    const departments = getCheckedValues("department");
    const statuses = getCheckedValues("status");
    const groups = getCheckedValues("group");

    const searchableText = normalize([getProfessorId(professor), professor.name, professor.department, professor.displayDepartment, professor.filterDepartment, professor.status, professor.course, professor.bio, professor.group].join(" "));
    const matchesSearch = !query || searchableText.includes(query);
    const professorFilterDepartment = professor.filterDepartment || professor.displayDepartment || professor.department;
    const matchesDepartment = !departments.length || departments.includes(professorFilterDepartment);
    const matchesStatus = !statuses.length || statuses.includes(professor.status);
    const matchesGroup = !groups.length || groups.includes(professor.group);

    return matchesSearch && matchesDepartment && matchesStatus && matchesGroup;
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

    function renderInsightCard(row) {
      return `
        <article class="professor-review-insight-card">
          <div class="professor-review-insight-main">
            <span>${escapeHtml(row.label)}</span>
            <p>${renderReviewInsightSummary(row.summary)}</p>
          </div>

          <details class="professor-review-detail">
            <summary class="professor-review-detail-toggle">View more details</summary>
            <div class="professor-review-detail-panel">
              ${row.answers.map(function (answer) {
                return `
                  <div class="professor-review-detail-row">
                    <span>${escapeHtml(answer.value.replace(/-/g, " "))}</span>
                    <strong>${escapeHtml(answer.percent + "%")}</strong>
                    <div class="professor-review-detail-track">
                      <span style="width: ${escapeHtml(String(answer.width))}%;"></span>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </details>
        </article>
      `;
    }

    if (statsCount) {
      statsCount.textContent = safeReviews.length ? "Top patterns from reviews" : "No review choices yet";
    }

    if (!panel) {
      return;
    }

    if (!rows.length) {
      panel.innerHTML = '<p class="professor-review-status">Review stats will appear after students answer the review choices.</p>';
      return;
    }

    const visibleRows = rows.slice(0, 3);
    const hiddenRows = rows.slice(3);
    const hiddenMarkup = hiddenRows.length
      ? `
        <details class="professor-review-insights-more">
          <summary class="professor-review-insights-more-toggle">
            <span class="professor-review-insights-more-more">Show more</span>
            <span class="professor-review-insights-more-less">Show less</span>
          </summary>

          <div class="professor-review-insights-hidden">
            ${hiddenRows.map(renderInsightCard).join("")}
          </div>
        </details>
      `
      : "";

    panel.innerHTML = visibleRows.map(renderInsightCard).join("") + hiddenMarkup;
    panel.querySelectorAll(".professor-review-detail, .professor-review-insights-more").forEach(setupProfessorReviewDetailAnimation);
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
      if (event.propertyName === "height" && details.open) {
        content.style.height = "auto";
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

  function renderProfessorReviews(reviews) {
    const list = document.getElementById("professor-reviews-list");
    const count = document.getElementById("professor-reviews-count");
    const safeReviews = Array.isArray(reviews) ? reviews : [];

    renderProfessorReviewStats(safeReviews);
    renderProfessorCourses(safeReviews);

    if (!list) {
      return;
    }

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
          <p class="professors-kicker">Professor profile</p>
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
                  <option>Required</option>
                  <option>Sometimes checked</option>
                  <option>Not important</option>
                  <option>Not sure</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-workload">Workload</label>
                <select id="review-workload" name="workload">
                  <option>Light</option>
                  <option>Moderate</option>
                  <option>Heavy</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-lecture">Lecture usefulness</label>
                <select id="review-lecture" name="lectureUsefulness">
                  <option>Essential</option>
                  <option>Helpful</option>
                  <option>Skippable</option>
                  <option>Not lecture-based</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-office-hours">Office hours/help</label>
                <select id="review-office-hours" name="officeHours">
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
                  <option>Easier than class material</option>
                  <option>Matches class material</option>
                  <option>Harder than class material</option>
                  <option>No exams</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-transparency">Grading transparency</label>
                <select id="review-transparency" name="gradingTransparency">
                  <option>Rubric is clear</option>
                  <option>Somewhat clear</option>
                  <option>Unclear</option>
                </select>
              </div>

              <div class="review-field">
                <label for="review-feedback">Feedback quality</label>
                <select id="review-feedback" name="feedbackQuality">
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
        panel.removeAttribute("open");
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

    if (!panel || !form) {
      return;
    }

    populateReviewCourseSelect(form);
    setupReviewChoiceMenus(form);
    setupReviewDependsField(form);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitProfessorReview(form, panel);
    });

    function syncReviewModalLock() {
      document.body.classList.toggle("review-modal-open", panel.open);

      if (!panel.open) {
        form.querySelectorAll(".review-choice.open").forEach(function (choice) {
          choice.classList.remove("open");
        });
      }
    }

    panel.addEventListener("toggle", syncReviewModalLock);

    if (backdrop) {
      backdrop.addEventListener("wheel", function (event) {
        event.preventDefault();
      }, { passive: false });
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

  function renderProfessors() {
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

    const visibleProfessors = professors.filter(professorMatches);

    grid.innerHTML = visibleProfessors.map(function (professor) {
      return `
        <a class="professor-card" href="${escapeHtml(getProfessorUrl(professor))}" aria-label="Open ${escapeHtml(professor.name)} profile">
          <div class="professor-card-image">
            <img src="${escapeHtml(professor.image)}" alt="${escapeHtml(professor.name)}">
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

    if (!visibleProfessors.length) {
      grid.innerHTML = '<p class="professors-empty">No professors match those filters.</p>';
    }
  }

  function setupProfessorFilters() {
    document.querySelectorAll(".filter-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        button.closest(".filter-item").classList.toggle("open");
      });
    });

    document.querySelectorAll("#professor-filters input").forEach(function (input) {
      input.addEventListener("change", renderProfessors);
    });

    const searchInput = document.getElementById("professor-search-input");

    if (searchInput) {
      searchInput.addEventListener("input", renderProfessors);
    }

    renderProfessors();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupProfessorFilters);
  } else {
    setupProfessorFilters();
  }
})();
