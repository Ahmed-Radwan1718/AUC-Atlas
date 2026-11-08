/** FAQ wording retained from the original faq.html. */
export type FaqAnswerPart = { type: "text"; text: string } | { type: "link"; text: string; href: string };
export interface FaqItem { id: string; question: string; answer: FaqAnswerPart[]; }
export const faqItems: FaqItem[] = [
  {
    "id": "faq-answer-1",
    "question": "What can I use AUC Atlas for?",
    "answer": [
      {
        "type": "text",
        "text": "AUC Atlas brings several student resources into one place. You can browse professors and courses, read student reviews, find shared course materials, calculate your GPA, track degree progress, and search across the site without jumping between separate tools."
      }
    ]
  },
  {
    "id": "faq-answer-2",
    "question": "Is AUC Atlas an official AUC website?",
    "answer": [
      {
        "type": "text",
        "text": "No. AUC Atlas is an independent student resource and is not operated by or officially affiliated with The American University in Cairo. For registration, grades, degree requirements, university policies, deadlines, and other official matters, always rely on AUC's official systems and communications."
      }
    ]
  },
  {
    "id": "faq-answer-3",
    "question": "Do I need an account to use the site?",
    "answer": [
      {
        "type": "text",
        "text": "You can browse many parts of AUC Atlas without an account. Features connected to your identity or saved activity, such as submitting professor reviews, uploading course materials, reporting content, or saving academic progress, may require you to sign in."
      }
    ]
  },
  {
    "id": "faq-answer-4",
    "question": "How should I use professor reviews?",
    "answer": [
      {
        "type": "text",
        "text": "Use reviews as one source of information rather than a final verdict on a professor. Teaching style, workload, grading, attendance expectations, and course structure can vary between semesters and students. Looking at several reviews is usually more useful than relying on a single rating or comment."
      }
    ]
  },
  {
    "id": "faq-answer-5",
    "question": "Can professor reviews be anonymous?",
    "answer": [
      {
        "type": "text",
        "text": "Yes. When the anonymous option is available and selected, your name and profile photo are not displayed publicly with the review. AUC Atlas may still retain an internal link to the submitting account for moderation, abuse prevention, review controls, and account management."
      }
    ]
  },
  {
    "id": "faq-answer-6",
    "question": "What should I include in a useful professor review?",
    "answer": [
      {
        "type": "text",
        "text": "Focus on information that could genuinely help another student understand the course experience: teaching clarity, workload, attendance expectations, office hours, grading style, feedback, exams, assignments, and how useful lectures were. Keep reviews factual and based on your own experience rather than personal attacks or unrelated complaints."
      }
    ]
  },
  {
    "id": "faq-answer-7",
    "question": "What course materials can I upload?",
    "answer": [
      {
        "type": "text",
        "text": "Upload materials that are genuinely useful to other students and that you have permission to share, such as your own notes, summaries, review sheets, study guides, practice material, or other appropriate academic resources. Adding the correct course, professor, semester, and material type makes the file much easier for others to find."
      }
    ]
  },
  {
    "id": "faq-answer-8",
    "question": "What should I never upload?",
    "answer": [
      {
        "type": "text",
        "text": "Do not upload copyrighted books or paid material, private messages, personal information, identification documents, malware, files you do not have permission to distribute, or exams and other restricted academic material that you are not allowed to share. Remove unnecessary names, student IDs, emails, and other personal information before uploading a file."
      }
    ]
  },
  {
    "id": "faq-answer-9",
    "question": "Are the GPA calculator results official?",
    "answer": [
      {
        "type": "text",
        "text": "No. The GPA calculator is a planning tool designed to help you estimate your GPA from the information you enter. Your official GPA is the one recorded by AUC, so use university records whenever an exact or official figure matters."
      }
    ]
  },
  {
    "id": "faq-answer-10",
    "question": "Can I rely on the degree progression tracker for graduation?",
    "answer": [
      {
        "type": "text",
        "text": "Use the degree progression tracker as a planning aid, not as an official degree audit. Programs, prerequisites, substitutions, catalog requirements, and individual student circumstances can differ. Confirm your graduation requirements through official AUC records and your academic adviser."
      }
    ]
  },
  {
    "id": "faq-answer-11",
    "question": "What if professor or course information is wrong or outdated?",
    "answer": [
      {
        "type": "text",
        "text": "Academic information can change, and AUC Atlas may occasionally contain incomplete or outdated information. For anything that affects registration, prerequisites, degree requirements, or academic decisions, verify the information through official AUC sources. Content that is clearly inaccurate may also be corrected or removed."
      }
    ]
  },
  {
    "id": "faq-answer-12",
    "question": "What should I do if I find an inappropriate review or file?",
    "answer": [
      {
        "type": "text",
        "text": "Use the available reporting feature on the relevant content. Reports can be reviewed for issues such as harassment, personal information, copyright concerns, spam, unsafe files, irrelevant material, or other violations. Report content because there is a genuine problem with it, not simply because you disagree with an opinion."
      }
    ]
  },
  {
    "id": "faq-answer-13",
    "question": "Can reviews or uploaded materials be removed?",
    "answer": [
      {
        "type": "text",
        "text": "Yes. Content may be removed, hidden, or otherwise moderated when necessary, including when it is inaccurate, unsafe, abusive, private, copyrighted, spam, irrelevant, or otherwise unsuitable for AUC Atlas."
      }
    ]
  },
  {
    "id": "faq-answer-14",
    "question": "How does AUC Atlas handle my personal information?",
    "answer": [
      {
        "type": "text",
        "text": "The information processed depends on how you use the site. Account details, authentication information, reviews, uploads, reports, saved academic progress, and certain technical or security information may be processed when necessary to provide those features. For the full explanation of what is collected, why it is used, and your available rights, read the "
      },
      {
        "type": "link",
        "text": "Privacy Notice",
        "href": "https://aucatlas.com/privacy.html"
      },
      {
        "type": "text",
        "text": "."
      }
    ]
  },
  {
    "id": "faq-answer-15",
    "question": "Can I delete my account or request deletion of my data?",
    "answer": [
      {
        "type": "text",
        "text": "Account and personal-data controls are subject to the options available through AUC Atlas and any information that must be retained for legitimate security, moderation, legal, or compliance purposes. The "
      },
      {
        "type": "link",
        "text": "Privacy Notice",
        "href": "https://aucatlas.com/privacy.html"
      },
      {
        "type": "text",
        "text": " explains the applicable access, correction, deletion, objection, and other data-protection procedures in more detail."
      }
    ]
  },
  {
    "id": "faq-answer-16",
    "question": "Where can I find the full rules for using AUC Atlas?",
    "answer": [
      {
        "type": "text",
        "text": "Read the "
      },
      {
        "type": "link",
        "text": "Terms of Service",
        "href": "https://aucatlas.com/terms.html"
      },
      {
        "type": "text",
        "text": " for the rules governing use of AUC Atlas and the "
      },
      {
        "type": "link",
        "text": "Privacy Notice",
        "href": "https://aucatlas.com/privacy.html"
      },
      {
        "type": "text",
        "text": " for information about personal-data processing. Those documents provide the detailed rules behind the shorter explanations on this page."
      }
    ]
  }
];
