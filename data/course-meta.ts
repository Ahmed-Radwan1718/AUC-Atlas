// Original AUC Atlas course prerequisites and subject labels.
export const coursePrerequisites: Record<string, string> = {
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
      "Senior Standing",
    "BIOL 2150":
      "BIOL 1010 or BIOL 1011\nConcurrent: BIOL 2151 for biology major only.",
    "BIOL 2151":
      "None listed.\nConcurrent: Concurrent with BIOL 2150 for biology major.",
    "BIOL 2160":
      "BIOL 1011 or BIOL 1012",
    "BIOL 2230":
      "BIOL 2150\nConcurrent: BIOL 2231 for biology majors.",
    "BIOL 2231":
      "BIOL 2151\nConcurrent: BIOL 2230 for Biology Majors.",
    "BIOL 2340":
      "BIOL 1011 (or BIOL 1010) and BIOL 1012",
    "BIOL 3130":
      "BIOL 2230",
    "BIOL 3310":
      "BIOL 2230",
    "BIOL 3326":
      "BIOL 2230\nConcurrent: Biology Majors must take this course concurrently with BIOL 3327.",
    "BIOL 3327":
      "BIOL 2230\nConcurrent: BIOL 3326 for Biology major.",
    "BIOL 3510":
      "BIOL 1012",
    "BIOL 4980":
      "Senior standing in biology.",
    "BIOL 4981":
      "BIOL 4980",
    "BIOL 3600":
      "BIOL 1010 or BIOL 1011 or the instructor’s consent.",
    "BIOL 3710":
      "BIOL 2150 or BIOL 2230",
    "BIOL 3750":
      "BIOL 2150 or BIOL 2230",
    "BIOL 4150":
      "BIOL 2230 and CHEM 2003 or co-requisite.",
    "BIOL 3601":
      "BIOL 3600",
    "BIOL 4170":
      "BIOL 2230",
    "BIOL 4230":
      "BIOL 2230 and CHEM 1005",
    "BIOL 4330":
      "BIOL 2230 and BIOL 2150",
    "BIOL 4930":
      "Consent of the instructor.",
    "BIOL 3540":
      "BIOL 1012 or instructor’s consent.",
    "BIOL 4540":
      "BIOL 1012 and BIOL 3510",
    "BIOL 4541":
      "BIOL 3510",
    "BIOL 3341":
      "BIOL 1011 or BIOL 1098",
    "BIOL 4360":
      "BIOL 1011 or BIOL 2150\nConcurrent: BIOL 4361 for Biology major.",
    "BIOL 3320":
      "PHYS 1011",
    "BIOL 3321":
      "PHYS 1012, (BIOL 3320 or concurrent)",
    "BIOL 3370":
      "BIOL 2230",
    "BIOL 4098":
      "BIOL 1011 or BIOL 1098 or PSYC 3800",
    "BIOL 4160":
      "PSYC 3800",
    "BIOL 4361":
      "BIOL 1011 or BIOL 2151\nConcurrent: BIOL 4360 for biology major.",
    "BIOL 4950":
      "A minimum of 16 credits of Biology courses\nOverall GPA 2.5 or higher at the time of application\nApproval of the student’s advisor and the department chair",
    "MACT 4323":
      "MACT 4322",
    "ECON 2011":
      "None listed.",
    "ECON 2021":
      "None listed.",
    "ECON 3011":
      "For Economics students ECON 2011 and ECON 3061\nFor Actuarial science students ECON 2011 and (MACT 2132 or ECON 3061)",
    "ECON 3021":
      "ECON 2021 and (ECON 2061 or MACT 1121).",
    "FINC 3201":
      "FINC 2101",
    "ACCT 2002":
      "ACCT 2001",
    "ECON 3041":
      "FINC 2101 plus ECON 2021 and ECON 2011",
    "ECON 3081":
      "(ECON 2081 or (MACT 3211 and MACT 3223)) and (ECON 3061)",
    "ECON 4031":
      "ECON 3021 and ECON 3011",
    "FINC 3401":
      "FINC 2101",
    "FINC 3501":
      "FINC 2101",
    "FINC 4204":
      "FINC 3201",
    "FINC 4301":
      "FINC 2101",
    "MGMT 3201":
      "None listed.",
    "MGMT 4202":
      "MGMT 3201 or BADM 2001",
    "MKTG 3201":
      "MKTG 2101 AND (MACT 3224 or MACT 2222)",
    "MACT 2222":
      "None listed.",
    "BADM 3002":
      "MGMT 3201 or BADM 2001 along with MKTG 2101",
    "BADM 3003":
      "BADM 2001 or MGMT 3201",
    "BADM 4001":
      "Graduating senior standing and MKTG 2101, FINC 2101, OPMG 3201",
    "BADM 4900":
      "All Business Core courses and graduating senior standing",
    "BADM 4999":
      "Junior standing",
    "ENTR 4302":
      "ENTR 3102 or instructor approval.",
    "ENTR 4503":
      "ENTR 3102",
    "MGMT 3301":
      "BADM 2001 - Introduction to Business (3 cr.) or MGMT 3201 - Management Fundamentals (3 cr.)",
    "MGMT 4203":
      "BADM 2001",
    "MKTG 4602":
      "MKTG 3201 , FINC 2101 and Senior standing.",
    "MOIS 3301":
      "MOIS 2101",
    "OPMG 3201":
      "ECON 2061 or MACT 2222",
    "OPMG 4301":
      "OPMG 3201 and Senior standing",
    "BUSC 4000":
      "Junior standing and consent of the course instructor.",
    "ENTR 3201":
      "FINC 2101 or instructor approval.",
    "ENTR 4301":
      "ENTR 3102",
    "ENTR 4303":
      "Junior standing",
    "ENTR 4501":
      "ENTR 3102",
    "ENTR 4502":
      "Junior standing",
    "ENTR 4970":
      "Consent of Instructor.",
    "MOIS 4202":
      "MOIS 3201",
    "MOIS 4704":
      "MOIS 3201 , MACT 2222, and CSCE 1101",
    "MOIS 4999":
      "MOIS 4202 and MOIS 3301",
    "CSCE 3422":
      "CSCE 1101 .",
    "CSCE 3421":
      "CSCE 1001",
    "MOIS 3401":
      "MOIS 2101",
    "MOIS 3501":
      "MOIS 2101",
    "MOIS 3801":
      "MOIS 2101",
    "MOIS 4701":
      "MOIS 4202",
    "MOIS 4702":
      "MOIS 3201",
    "MOIS 4703":
      "MOIS 3201",
    "MOIS 4705":
      "MOIS 4202",
    "MOIS 4970":
      "Prerequisite: Consent of Instructor.",
    "ARTV 2113":
      "None listed.",
    "ARTV 2200":
      "None listed.",
    "ARTV 2214":
      "None listed.",
    "ARTV 3115":
      "ARTV 2113",
    "ARTV 3311":
      "ARTV 2201 - Introduction to Drawing (3 cr.) or ARTV 2202 - Introduction to Painting (3 cr.)",
    "ARTV 3312":
      "ARTV 2200, ARTV 2201",
    "ARTV 3313":
      "ARTV 2200",
    "ARTV 3314":
      "ARTV 2200",
    "ARTV 3316":
      "ARTV 2214 or ARTV 2113",
    "ARTV 4269":
      "None listed.",
    "ARTV 4270":
      "ARTV 4269",
    "ARTV 2201":
      "None listed.",
    "ARTV 2202":
      "ARTV 2201",
    "ARTV 2203":
      "ARTV 2200",
    "ARTV 2204":
      "None listed.",
    "ARTV 2207":
      "None listed.",
    "ARTV 2208":
      "Visual Arts major declaration.",
    "ARTV 2230":
      "None listed.",
    "ARTV 3270":
      "None listed.",
    "ARTV 5110":
      "None listed.",
    "DSGN 2250":
      "None listed.",
    "PSYC 1000":
      "None listed.",
    "PSYC 2000":
      "None listed.",
    "PSYC 2100":
      "PSYC 1000 and PSYC 2000",
    "PSYC 3003":
      "PSYC 1000",
    "PSYC 3040":
      "PSYC 1000 .",
    "PSYC 3080":
      "PSYC 2100",
    "PSYC 3130":
      "None listed.",
    "PSYC 3270":
      "PSYC 1000",
    "PSYC 3420":
      "PSYC 1000",
    "PSYC 3800":
      "BIOL 1011 or BIOL 1098/PSYC 1098 and PSYC 1000",
    "PSYC 4030":
      "Junior or senior standing and 15 hours of psychology.",
    "PSYC 4150":
      "PSYC 1000, PSYC 2000, and PSYC 2100",
    "ANTH 2101":
      "None listed.",
    "POLS 4030":
      "RHET 1020 and 6 credits at 3000 level in POLS",
    "POLS 4640":
      "RHET 1020 and POLS 3620",
    "POLS 5130":
      "Junior standing, RHET 1020, 6 credits at the 3000 level in POLS (if taken towards fulfillment of an undergraduate degree).",
    "POLS 5140":
      "RHET 1020, POLS 3620, Junior standing (if taken towards fulfilment of an undergraduate degree).",
    "POLS 2003":
      "ENGL 0210",
    "POLS 2104":
      "POLS 1001 or POLS 2003, RHET 1010",
    "POLS 2405":
      "RHET 1010",
    "POLS 3201":
      "RHET 1020, POLS 1001 or POLS 2003",
    "POLS 3202":
      "RHET 1020, POLS 1001 or POLS 2003",
    "POLS 3401":
      "POLS 1001 or POLS 2003, RHET 1010",
    "POLS 3408":
      "POLS 1001 or POLS 2003, RHET 1020",
    "POLS 3510":
      "POLS 1001 or POLS 2003, RHET 1020",
    "POLS 3550":
      "POLS 1001 or POLS 2003, ECON 2021 and RHET 1010",
    "POLS 3620":
      "POLS 1001 or POLS 2003, RHET 1010, POLS 2405",
    "POLS 4371":
      "RHET 1020 and POLS 3620",
    "POLS 4608":
      "RHET 1020 and POLS 3620",
    "POLS 4609":
      "RHET 1020 and POLS 3620",
    "POLS 4610":
      "RHET 1020 and POLS 3620",
    "POLS 4611":
      "RHET 1020, POLS 3620",
    "POLS 4605":
      "RHET 1020 and POLS 3620",
    "POLS 4614":
      "RHET 1020 and POLS 4611",
    "POLS 4615":
      "RHET 1020 and POLS 4611",
    "POLS 4435":
      "RHET 1020, POLS 3401, 3 credits at the 3000 level in POLS.\nConsent of Instructor.",
    "POLS 4403":
      "POLS 1001 or POLS 2003, RHET 1020, POLS 3401 or instructor approval for non political science majors.",
    "POLS 4405":
      "POLS 1001 or POLS 2003, RHET 1020, POLS 3401 (or instructor approval for non political science majors who have not taken POLS 3401)",
    "POLS 4420":
      "RHET 1020 and POLS 3401",
    "POLS 4423":
      "POLS 1001 or POLS 2003, RHET 1020, POLS 3401 (or instructor approval for non political science majors)",
    "POLS 4424":
      "POLS 1001 or POLS 2003, RHET 1020, POLS 3401 (or instructor approval for non political science majors)",
    "POLS 4425":
      "POLS 1001 or POLS 2003, RHET 1020, POLS 3401 (or instructor approval for non political science majors)",
    "POLS 4432":
      "RHET 1020, POLS 3401",
    "POLS 4437":
      "POLS 1001 or POLS 2003, RHET 1020, POLS 3401 or instructor approval for non political science majors",
    "POLS 4438":
      "RHET 1020, POLS 3401, 3 credits at the 3000 level in POLS.\nConsent of Instructor.",
    "POLS 4439":
      "POLS 1001 / POLS 2003, RHET 1020, POLS 3401, 3 credits at the 3000 level in POLS.\nConsent of Instructor.",
    "POLS 4444":
      "POLS 1001 or POLS 2003, RHET 1020, POLS 3401 or instructor approval for non political science majors",
    "POLS 4480":
      "RHET 1020, POLS 3401 and 3 credits at 3000 level in POLS.\nConsent of Instructor.",
    "ARIC 5142":
      "Prerequisite: consent of instructor.",
    "POLS 4372":
      "RHET 1020 and POLS 4371",
    "POLS 4375":
      "RHET 1020, 6 credits at the 3000 level in POLS\nPOLS 3408\nConsent of Instructor",
    "POLS 4377":
      "RHET 1020, POLS 3510 and POLS 4371",
    "POLS 4422":
      "RHET 1020, POLS 3401, 3 credits at the 3000 level in POLS (or instructor approval for non political science majors)",
    "POLS 4525":
      "RHET 1020, POLS 3620, POLS 3550",
    "POLS 4526":
      "RHET 1020, POLS 3510 and POLS 3550",
    "POLS 4551":
      "RHET 1020, POLS 3550",
    "POLS 4502":
      "RHET 1020, POLS 3510, POLS 3550",
    "POLS 4513":
      "RHET 1020, ECON 2021, POLS 3620, POLS 3550",
    "POLS 4523":
      "RHET 1020, POLS 3510, POLS 3550",
    "POLS 4542":
      "RHET 1020, POLS 3550, one 3000 level Political Science Course.\nConsent of Instructor.",
    "POLS 4378":
      "RHET 1020",
    "HIST 2204":
      "None listed.",
    "HIST 2301":
      "None listed.",
    "HIST 2502":
      "None listed.",
    "HIST 3207":
      "None listed.",
    "HIST 3208":
      "None listed.",
    "HIST 3214":
      "None listed.",
    "HIST 3288":
      "None listed.",
    "HIST 3302":
      "None listed.",
    "HIST 4107":
      "None listed.",
    "HIST 4188":
      "None listed.",
    "HIST 4216":
      "None listed.",
    "HIST 4217":
      "None listed.",
    "HIST 4219":
      "HIST 3213 or HIST 3214 or equivalent background.",
    "HIST 4288":
      "None listed.",
    "HIST 4290":
      "Consent of Instructor.",
    "HIST 4303":
      "None listed.",
    "HIST 4488":
      "None listed.",
    "HIST 4588":
      "None listed.",
    "PHIL 5101":
      "None listed.",
    "PHIL 5104":
      "None listed.",
    "PHIL 5112":
      "Prerequisites For Undergraduates: PHIL 3010 or consent of instructor.",
    "PHIL 5119":
      "None listed.",
    "PHIL 2010":
      "None listed.",
    "PHIL 3101":
      "None listed.",
    "PHIL 3102":
      "None listed.",
    "PHIL 2111":
      "None listed.",
    "PHIL 2112":
      "None listed.",
    "PHIL 2113":
      "None listed.",
    "PHIL 2117":
      "None listed.",
    "PHIL 3010":
      "None listed.",
    "PHIL 3017":
      "None listed.",
    "PHIL 3104":
      "None listed.",
    "PHIL 5117":
      "None listed.",
    "PHIL 5121":
      "None listed.",
    "PHIL 5122":
      "None listed.",
    "PHIL 5123":
      "None listed.",
    "PHIL 5124":
      "None listed.",
    "PHIL 2200":
      "None listed.",
    "PHIL 3014":
      "None listed.",
    "PHIL 3015":
      "HIST 2203 or ARIC/HIST 3210 or consent of instructor.",
    "PHIL 3016":
      "None listed.",
    "PHIL 3200":
      "None listed.",
    "PHIL 5100":
      "None listed.",
    "PHIL 5120":
      "None listed.",
    "PHIL 5125":
      "Senior level, graduate level, or consent of instructor.",
    "PHIL 5130":
      "None listed.",
    "PHIL 5150":
      "Students other than Philosophy majors must take FILM 3130 Film Theory prior to registering for this course.",
    "PHIL 5151":
      "Senior level, graduate level, or consent of instructor.",
    "PHIL 5199":
      "Senior level, graduate level, or consent of instructor.",
    "MUSC 1805":
      "None listed.",
    "MUSC 2200":
      "None listed.",
    "MUSC 2300":
      "None listed.",
    "MUSC 2400":
      "MUSC 1805 Or a passing grade on the MUSC 1805 exemption exam.\nConcurrent: MUSC 2401",
    "MUSC 2401":
      "MUSC 1805 or a passing grade on the MUSC 1805 exemption exam.\nConcurrent: MUSC 2400",
    "MUSC 2450":
      "MUSC 1805 or a passing grade on the MUSC 1805 exemption exam.\nConcurrent: MUSC 2451",
    "MUSC 2451":
      "MUSC 1805 or a passing grade on the MUSC 1805 exemption exam.\nConcurrent: MUSC 2450",
    "MUSC 3400":
      "MUSC 2400 and MUSC 2401\nConcurrent: MUSC 3401",
    "MUSC 3401":
      "MUSC 2400 and MUSC 2401\nConcurrent: MUSC 3400",
    "MUSC 3450":
      "MUSC 2450 and MUSC 2451\nConcurrent: MUSC 3451",
    "MUSC 3451":
      "MUSC 2450 and MUSC 2451\nConcurrent: MUSC 3450",
    "MUSC 3200":
      "MUSC 1805 or MUSC 2400",
    "MUSC 3250":
      "None listed.",
    "MUSC 3300":
      "MUSC 1805 or MUSC 2400",
    "MUSC 2850":
      "MUSC 1805 (Maybe taken concurrently)\nConcurrent: MUSC 1805",
    "MUSC 2851":
      "MUSC 2850",
    "MUSC 2301":
      "None listed.",
    "MUSC 4309":
      "MUSC 2200 ,MUSC 2300 and MUSC 2301",
    "MUSC 2303":
      "MUSC 2300 and MUSC 2301",
    "MUSC 3302":
      "MUSC 2300",
    "MUSC 3304":
      "MUSC 2200 MUSC 2300 and MUSC 2301",
    "MUSC 3306":
      "MUSC 2301",
    "MUSC 4900":
      "Prerequisite: Consent of the instructor.",
    "MUSC 1800":
      "MUSC 1805\nStudents with prior knowledge of music theory and notation may take a MUSC 1805 exemption exam in the first week of the semester. Those who pass are exempted from taking MUSC 1805. Contact the Academic Registration Specialist in the Department of the Arts and/or the Music Program Director to learn more.\nConcurrent: MUSC 1805",
    "MUSC 3099":
      "Prerequisite: consent of the instructor.",
    "MUSC 3110":
      "At least two semesters of MUSC 1800, or permission of the instructor.",
    "MUSC 3150":
      "MUSC 1805 or a passing grade on the MUSC 1805 exemption exam.",
    "MUSC 3308":
      "MUSC 2300.",
    "MUSC 4308":
      "MUSC 2300 and MUSC 2301",
    "MUSC 4400":
      "MUSC 3400 and MUSC 3401\nConcurrent: MUSC 4401",
    "MUSC 4401":
      "MUSC 3400 and MUSC 3401\nConcurrent: MUSC 4400",
    "JRMC 2200":
      "None listed.",
    "JRMC 2201":
      "Acceptance into the major",
    "JRMC 2202":
      "JRMC 2201",
    "JRMC 2203":
      "None listed.",
    "JRMC 2208":
      "JRMC 2200",
    "JRMC 2270":
      "None listed.",
    "JRMC 2230":
      "None listed.",
    "JRMC 3303":
      "None listed.",
    "JRMC 3312":
      "JRMC 2202",
    "JRMC 3320":
      "Junior standing.",
    "JRMC 3337":
      "JRMC 2202",
    "JRMC 3360":
      "None listed.",
    "JRMC 3380":
      "JRMC 2202",
    "JRMC 3390":
      "JRMC 2200",
    "JRMC 4406":
      "Junior standing.",
    "JRMC 4420":
      "Junior standing.",
    "JRMC 4441":
      "JRMC 2202",
    "JRMC 4444":
      "JRMC 2203, Junior standing",
    "JRMC 4480":
      "JRMC 3380, JRMC 4460, JRMC 4441",
    "JRMC 4482":
      "JRMC 3320, JRMC 4420 and JRMC 4444",
    "JRMC 2205":
      "None listed.",
    "JRMC 2250":
      "None listed.",
    "JRMC 2280":
      "JRMC 2202",
    "JRMC 3305":
      "JRMC 2201",
    "JRMC 3307":
      "JRMC 2201 - Media Writing (3 cr.)\nJRMC 2202 - Multimedia Writing and Production (3 cr.)",
    "JRMC 3310":
      "None listed.",
    "JRMC 3339":
      "JRMC 3337",
    "JRMC 3330":
      "JRMC 2230",
    "JRMC 3333":
      "JRMC 3312",
    "JRMC 4403":
      "JRMC 2202",
    "JRMC 4412":
      "JRMC 3312",
    "JRMC 4460":
      "JRMC 2202 and junior standing.",
    "ANTH 3301":
      "3 hours of Social Sciences.",
    "ARIC 2346":
      "None listed.",
    "ECON 2051":
      "None listed.",
    "HIST 3213":
      "None listed.",
    "ARIC 3321":
      "None listed.",
    "ARIC 3343":
      "None listed.",
    "ARIC 3353":
      "None listed.",
    "ANTH 4030":
      "9 hours of Social Sciences and Junior or Senior standing.",
    "ARIC 5133":
      "ARIC 3343 or ARIC 2346 or consent of instructor.",
    "ECON 4051":
      "ECON 2021 or Consent of Instructor.",
    "MEST 4301":
      "None listed.",
    "JRMC 3315":
      "JRMC 2202",
    "JRMC 3355":
      "JRMC 3315",
    "JRMC 3366":
      "Junior Standing",
    "JRMC 4405":
      "JRMC 3305",
    "JRMC 4415":
      "JRMC 2202 and JRMC 3315",
    "JRMC 4425":
      "JRMC 3315, JRMC 3320, JRMC 3366\nConcurrent: JRMC 4415 Can be taken concurrently",
    "JRMC 4430":
      "JRMC 3315 - Introduction to Advertising (3 cr.)\nJRMC 3320 - Mass Communication Research (3 cr.)",
    "MKTG 3202":
      "MKTG 2101",
    "DSGN 2260":
      "DSGN 2210",
    "DSGN 3117":
      "DSGN 2113",
    "DSGN 3265":
      "DSGN 2210 and DSGN 2250",
    "HIST 4111":
      "None listed.",
    "HIST 4113":
      "None listed.",
    "HIST 4215":
      "None listed.",
    "HIST 1000":
      "None listed.",
    "HIST 2000":
      "None listed.",
    "HIST 4801":
      "Prerequisite: To be taken in senior year",
    "DSGN 2113":
      "None listed.",
    "DSGN 2115":
      "DSGN 2113",
    "DSGN 2200":
      "None listed.",
    "DSGN 2201":
      "DSGN 2200",
    "DSGN 2210":
      "DSGN 2200",
    "DSGN 2240":
      "None listed.",
    "DSGN 3220":
      "DSGN 2210, DSGN 2250",
    "DSGN 4269":
      "1. Completion of all 2000 and 3000 level of concentration courses.\n2\\. Completion of at least four studio courses.\n3\\. Completion of at least two technical courses (Senior Standing).",
    "DSGN 4270":
      "DSGN 4269",
    "DSGN 2300":
      "DSGN 2113 or DSGN 2200",
    "DSGN 3202":
      "DSGN 2201 , DSGN 2115, DSGN 2210 and DSGN 2250",
    "DSGN 3203":
      "DSGN 2115, DSGN 2201, DSGN 3220",
    "DSGN 3204":
      "DSGN 2201 DSGN 2115 DSGN 2210 and DSGN 2250",
    "DSGN 3205":
      "DSGN 2201. The instructor’s approval is required.",
    "DSGN 3210":
      "DSGN 2115, DSGN 2201, DSGN 3220",
    "DSGN 3213":
      "DSGN 3250",
    "DSGN 3230":
      "DSGN 3220",
    "DSGN 3266":
      "DSGN 2250 and DSGN 2210",
    "DSGN 3270":
      "Consent of Instructor.",
    "DSGN 4200":
      "Completion of at least two “Professional Practice” courses.",
    "DSGN 2245":
      "None listed.",
    "DSGN 3235":
      "DSGN 2250",
    "DSGN 3250":
      "DSGN 2250",
    "DSGN 3260":
      "None listed.",
    "DSGN 3300":
      "None listed.",
    "DSGN 4210":
      "Completion of all major courses.",
    "ARIC 3268":
      "None listed.",
    "DSGN 3118":
      "None listed.",
    "DSGN 5115":
      "DSGN 2115",
    "FILM 2120":
      "None listed.",
    "FILM 2121":
      "None listed.",
    "FILM 2123":
      "None listed.",
    "FILM 3110":
      "FILM 2120",
    "FILM 3130":
      "FILM 2120",
    "FILM 3132":
      "FILM 2120",
    "ANTH 3070":
      "Three hours of Social Sciences.",
    "ARIC 3106":
      "None listed.",
    "ECLT 3030":
      "None listed.",
    "FILM 3070":
      "None listed.",
    "FILM 3115":
      "None listed.",
    "FILM 3120":
      "None listed.",
    "FILM 3125":
      "None listed.",
    "FILM 3150":
      "None listed.",
    "FILM 3160":
      "None listed.",
    "FILM 4402":
      "This course is restricted to senior level students in the Film Major or Minor. Departmental approval required.",
    "FILM 3201":
      "FILM 3252 , FILM 3254 , and at least TWO courses of the Film Studies Required Courses: FILM 3110, FILM 3130, and FILM 3132",
    "FILM 3252":
      "FILM 2121 and FILM 2123",
    "FILM 3254":
      "FILM 2121 and FILM 2123 or consent of the Director of the Film Program.",
    "FILM 3402":
      "FILM 3252 , FILM 3254, and at least TWO courses of the Film Studies Required Courses: FILM 3110, FILM 3130, and FILM 3132",
    "FILM 3071":
      "FILM 2121\nFILM 2123",
    "FILM 3253":
      "FILM 2123 and FILM 2121",
    "FILM 3255":
      "FILM 2123, FILM 2121 and FILM 3252",
    "FILM 3355":
      "FILM 3201, FILM 3252, FILM 3254, FILM 3402, or consent of the Director of the Film Program.",
    "FILM 5170":
      "Fourth-year Film majors only, or consent of the instructor.",
    "FILM 4250":
      "FILM 3252, FILM 3254, FILM 3201, FILM 3402 + 2 courses of level 3000 from the Film Production Electives.",
    "FILM 4260":
      "FILM 4250 + completing 2 courses of level 3000 from the Film Production Electives.",
    "ECLT 2010":
      "None listed.",
    "ECLT 2011":
      "None listed.",
    "ECLT 3001":
      "None listed.",
    "ECLT 5106":
      "None listed.",
    "ECLT 3002":
      "None listed.",
    "ECLT 3005":
      "None listed.",
    "ECLT 3006":
      "None listed.",
    "ECLT 3008":
      "None listed.",
    "ECLT 3048":
      "None listed.",
    "ECLT 3010":
      "None listed.",
    "ECLT 3011":
      "None listed.",
    "ECLT 5108":
      "None listed.",
    "ECLT 5109":
      "None listed.",
    "ECLT 2019":
      "None listed.",
    "ECLT 3032":
      "None listed.",
    "ECLT 3033":
      "None listed.",
    "ECLT 3045":
      "None listed.",
    "ECLT 3046":
      "None listed.",
    "ECLT 3052":
      "None listed.",
    "ECLT 3053":
      "None listed.",
    "ECLT 3070":
      "None listed.",
    "ECLT 3099":
      "None listed.",
    "ECLT 4099":
      "None listed.",
    "EGPT 2250":
      "None listed.",
    "EGPT 2251":
      "None listed.",
    "EGPT 2252":
      "EGPT 2251",
    "EGPT 3201":
      "EGPT 2020 or consent of instructor.",
    "EGPT 3202":
      "EGPT 2020 or consent of instructor.",
    "EGPT 3211":
      "None listed.",
    "EGPT 3212":
      "None listed.",
    "EGPT 5100":
      "Consent of instructor.",
    "EGPT 5130":
      "Consent of instructor.",
    "EGPT 5144":
      "Instructor’s permission.",
    "EGPT 5151":
      "EGPT 2252",
    "EGPT 5153":
      "EGPT 5151 .",
    "EGPT 2020":
      "None listed.",
    "EGPT 2210":
      "None listed.",
    "EGPT 3010":
      "Instructor’s consent",
    "EGPT 4030":
      "None listed.",
    "EGPT 5110":
      "EGPT 3211 and EGPT 3212 , or instructor’s consent.",
    "EGPT 5120":
      "EGPT 3211 and EGPT 3212 , or instructor’s consent.",
    "EGPT 5140":
      "Consent of instructor.",
    "EGPT 5150":
      "EGPT 2252",
    "EGPT 5152":
      "EGPT 2252",
    "EGPT 5160":
      "None listed.",
    "EGPT 5170":
      "Consent of instructor.",
    "EGPT 5191":
      "Permission of instructor.",
    "EGPT 5199":
      "Junior standing and/or consent of instructor.",
    "ECON 2061":
      "MACT 1111 or equivalent.",
    "ECON 2081":
      "MACT 2222 or DSCI 1411",
    "ECON 3053":
      "ECON 2021 and ECON 2011",
    "ECON 3061":
      "MACT 1121 or ECON 2061",
    "ECON 3071":
      "ECON 2021 and ECON 2011",
    "ECON 3082":
      "None listed.\nConcurrent: ECON 3081",
    "ECON 4091":
      "ECON 2021 and ECON 2011",
    "ECON 3054":
      "ECON 2021 and ECON 2011",
    "ECON 3055":
      "ECON 2021",
    "ECON 3099":
      "Pre-requisites vary depending on the topic of the course.",
    "ECON 4012":
      "ECON 2011 and ECON 2021",
    "ECON 4013":
      "ECON 2011",
    "ECON 4014":
      "ECON 2021 and ECON 2011",
    "ECON 4015":
      "ECON 3081",
    "ECON 4041":
      "ECON 2081, ECON 3011 and FINC 2101 .",
    "ECON 4050":
      "Minimum junior standing.",
    "ECON 4061":
      "ECON 3061",
    "ECON 4081":
      "ECON 3081 and concurrent with ECON 4082",
    "ECON 4094":
      "ECON 2021 and ECON 2011 . Junior standing or higher.",
    "ECON 4099":
      "Pre-requisites vary depending on the topic of the course",
    "ECON 5241":
      "ECON 4061 and consent of instructor",
    "ANTH 4020":
      "9 hours of social science",
    "ANTH 4065":
      "9 hours of social sciences and junior or senior standing.",
    "ANTH 4099":
      "Prerequisites: 9 hours of social sciences, and junior or senior standing.",
    "ANTH 3104":
      "ANTH 3102 or consent of instructor.",
    "ANTH 3105":
      "ANTH 2101 and 6 credit hours of social sciences.",
    "ANTH 3302":
      "Three hours of Social Sciences.",
    "ANTH 2005":
      "RHET 1020 or concurrent.",
    "ANTH 2006":
      "None listed.",
    "ANTH 2007":
      "None listed.",
    "ANTH 2099":
      "None listed.",
    "ANTH 2201":
      "None listed.",
    "ANTH 3015":
      "Three hours of Social Sciences.",
    "ANTH 3075":
      "Three hours of Social Sciences.",
    "ANTH 3080":
      "Three hours of Social Sciences.",
    "ANTH 3090":
      "Three hours of Social Sciences.",
    "ANTH 3095":
      "Three hours of social sciences.",
    "ANTH 3305":
      "Three hours of Social Sciences.",
    "ANTH 4070":
      "9 hours of Social Sciences and Junior or Senior standing.",
    "ANTH 4075":
      "9 hours of Social Sciences and Junior or Senior standing.",
    "ANTH 4085":
      "None listed.",
    "ANTH 4405":
      "Prerequisites: a minimum B average, consent of the instructor, and approval by the unit head and the department chair.",
    "ARCH 3231":
      "ARCH 2231",
    "ARCH 3422":
      "ARCH 4532",
    "ARCH 4422":
      "ARCH 3422",
    "CENG 2115":
      "None listed.",
    "ARCH 1511":
      "None listed.",
    "ARCH 1521":
      "None listed.",
    "ARCH 2512":
      "None listed.",
    "ARCH 2551":
      "ARCH 1521 - Digital Representation Tools for Architects (2 cr.)\nARCH 2512 - Foundations of 3-Dimensional Design (2 cr.)\nARCH 1511 - Engineering Drawing & Visual Representation for Architects (2 cr.)",
    "ARCH 2411":
      "MACT 1121",
    "ARCH 2552":
      "ARCH 2221 - Human Aspects in Architectural Design (3 cr.) , ARCH 2551 - Introduction to Architectural Design (3 cr.)",
    "ARCH 3522":
      "ARCH 3554",
    "ARCH 3553":
      "ARCH 2211, ARCH 2552",
    "ARCH 3554":
      "ARCH 3231 and ARCH 3553",
    "ARCH 4532":
      "ARCH 2411, ARCH 3553",
    "ARCH 4541":
      "ARCH 2551 or (ARCH 1521 and DSGN 2201)",
    "ARCH 4561":
      "ARCH 2212, ARCH 3554, ARCH 4532, CENG 3151",
    "ARCH 4562":
      "ARCH 3321, ARCH 3422, ARCH 4421, ARCH 4561, CENG 3152",
    "ARCH 4980":
      "ARCH 3522, ARCH 4312, ARCH 4541, ARCH 4562",
    "ARCH 4981":
      "ARCH 4801, ARCH 4802, ARCH 4803, ARCH 4980, A minimum of three credits from the concentration elective stream.",
    "ARCH 2211":
      "None listed.",
    "ARCH 2212":
      "ARCH 2211",
    "ARCH 2221":
      "ARCH 1521, ARCH 1511",
    "ARCH 2231":
      "PHYS 1011, MACT 1121 and ARCH 2551",
    "ARCH 3311":
      "ARCH 2552, CENG 2115, CENG 2252",
    "ARCH 3321":
      "ARCH 3311",
    "ARCH 3331":
      "CENG 2115",
    "ARCH 3950":
      "CENG 2115, CENG 2252",
    "ARCH 4312":
      "ARCH 3321, ARCH 3331, CENG 3152",
    "ARCH 4421":
      "ARCH 3554",
    "ARCH 4423":
      "ARCH 4421",
    "ARCH 4951":
      "ARCH 3311",
    "CENG 2252":
      "None listed.",
    "CENG 3151":
      "CENG 2115 or CENG 3112",
    "CENG 3152":
      "CENG 3151",
    "ARCH 4801":
      "ARCH 4562",
    "ARCH 2501":
      "None listed.",
    "ARCH 4932":
      "None listed.",
    "ARCH 4936":
      "ARCH 4541 - Introduction to Interior Design (3 cr.)",
    "ARCH 4942":
      "Senior Standing.",
    "ARCH 4943":
      "Senior Standing.",
    "ARCH 4971":
      "Senior standing",
    "ARCH 4802":
      "ARCH 4562",
    "ARCH 4937":
      "ARCH 3553 - Architectural Design Studio II (4 cr.)",
    "ARCH 4939":
      "ARCH 3522",
    "ARCH 4972":
      "Senior standing",
    "ARCH 4803":
      "ARCH 4562",
    "ARCH 4931":
      "None listed.",
    "ARCH 4933":
      "None listed.",
    "ARCH 4934":
      "None listed.",
    "ARCH 4935":
      "None listed.",
    "ARCH 4938":
      "ARCH 4532",
    "ARCH 4973":
      "Senior standing",
    "ARIC 3272":
      "None listed.",
    "ARIC 5124":
      "ARIC 2270 or consent of instructor.",
    "ACCT 3001":
      "ACCT 2001",
    "ACCT 3002":
      "ACCT 3001",
    "ACCT 3003":
      "ACCT 3002",
    "ACCT 3004":
      "ACCT 2002",
    "ACCT 3005":
      "ACCT 3002",
    "ACCT 3006":
      "ACCT 3002 - Intermediate Accounting II (3 cr.)",
    "ACCT 4000":
      "MOIS 2101 and ACCT 3002",
    "ACCT 4001":
      "ACCT 3005",
    "ACCT 4002":
      "ACCT 3006",
    "ACCT 4004":
      "ACCT 3002 and FINC 3201",
    "ACCT 4005":
      "Graduating Senior."
};
export const subjectLabels: Record<string, string> = {
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
