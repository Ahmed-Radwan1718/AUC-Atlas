import type { FirebaseOptions } from "firebase/app";

export type AccountPanel = "details" | "security" | "reviews";
export type ActivityTab = "reviews" | "uploads";
export type MessageState = { text: string; type: "" | "error" | "success" };

export type TwoFactorState = {
  appEnabled: boolean;
  emailEnabled: boolean;
};

export type AccountUser = {
  uid?: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  fullName?: string;
  photoURL?: string;
  firstName?: string;
  major?: string;
  aucId?: string;
  aucIdLookupKey?: string;
  authProvider?: string;
  twoFactor?: Partial<TwoFactorState>;
  displayNameLastChangedAt?: string | { seconds?: number; _seconds?: number } | null;
  usernameLastChangedAt?: string | { seconds?: number; _seconds?: number } | null;
  aucIdLastChangedAt?: string | { seconds?: number; _seconds?: number } | null;
};

export type AccountSession = {
  id?: string;
  current?: boolean;
  browserKey?: string;
  browserName?: string;
  browserLabel?: string;
  platformLabel?: string;
  osName?: string;
  deviceLabel?: string;
  ipAddress?: string;
  createdAt?: string;
  lastSeenAt?: string;
};

export type AccountReview = {
  id?: string;
  professorId?: string;
  professorName?: string;
  courseTaken?: string;
  courseCode?: string;
  semesterTaken?: string;
  rating?: number;
  recommendation?: string;
  recommendationReason?: string;
  attendancePolicy?: string;
  workload?: string;
  lectureUsefulness?: string;
  officeHours?: string;
  gradingStyle?: string;
  examDifficulty?: string;
  gradingTransparency?: string;
  feedbackQuality?: string;
  studentNote?: string;
  createdAt?: string;
};

export type AccountMaterial = {
  id?: string;
  courseCode?: string;
  courseTitle?: string;
  professor?: string;
  semester?: string;
  materialType?: string;
  title?: string;
  fileName?: string;
  downloadUrl?: string;
  size?: number;
  fileType?: string;
  status?: string;
  createdAt?: string;
};

export type CatalogCourse = {
  code: string;
  title: string;
};

export type CatalogProfessor = {
  id: string;
  name: string;
  image?: string;
};

export type CatalogData = {
  courses?: CatalogCourse[];
  professors?: CatalogProfessor[];
};

export type AccountResponse = {
  success?: boolean;
  signedIn?: boolean;
  user?: AccountUser | null;
  error?: string;
};

export type SessionsResponse = {
  success?: boolean;
  currentSignedOut?: boolean;
  sessions?: AccountSession[];
  error?: string;
};

export type ReviewsResponse = {
  success?: boolean;
  reviews?: AccountReview[];
  error?: string;
};

export type MaterialsResponse = {
  success?: boolean;
  materials?: AccountMaterial[];
  error?: string;
};

export type AuthenticatorResponse = {
  success?: boolean;
  error?: string;
  code?: string;
  secret?: string;
  qrDataUrl?: string;
  twoFactor?: Partial<TwoFactorState>;
  securityAccessRequired?: boolean;
  securityAccessToken?: string;
  securityAccessExpiresAt?: string;
};

export type GoogleAccountResponse = {
  success?: boolean;
  error?: string;
  firebase?: FirebaseOptions;
  customToken?: string;
  connected?: boolean;
  googleEmail?: string;
};

export type ProfilePhotoSignature = {
  success?: boolean;
  error?: string;
  cloudName?: string;
  apiKey?: string;
  timestamp?: string;
  publicId?: string;
  overwrite?: string;
  invalidate?: string;
  allowedFormats?: string;
  uploadPreset?: string;
  signature?: string;
};

export const MAJORS = [
  "Accounting",
  "Actuarial Science",
  "Anthropology",
  "Arabic Studies",
  "Architecture",
  "Biology",
  "Business and Entrepreneurship",
  "Business in Finance",
  "Business in Marketing",
  "Chemistry",
  "Communication and Media Arts",
  "Computer Engineering",
  "Computer Science",
  "Construction Engineering",
  "Data Science",
  "Dual Degree: Political Science and International Human Rights Law",
  "Economics",
  "Egyptology",
  "Electronics and Communications Engineering",
  "English and Comparative Literature",
  "Film",
  "Graphic Design",
  "History",
  "Honors Program in Political Science",
  "Integrated Marketing Communication",
  "Management of Information and Communication Technology",
  "Mathematics",
  "Mechanical Engineering",
  "Middle East Studies",
  "Multimedia Communication and Journalism",
  "Music",
  "Petroleum Engineering",
  "Philosophy",
  "Physics",
  "Political Science",
  "Psychology",
  "Sociology",
  "Theatre",
  "Visual Arts",
] as const;

export const SEMESTERS = [
  "Fall 2026", "Summer 2026", "Spring 2026", "Winter 2026",
  "Fall 2025", "Summer 2025", "Spring 2025", "Winter 2025",
  "Fall 2024", "Summer 2024", "Spring 2024", "Winter 2024",
  "Fall 2023", "Summer 2023", "Spring 2023", "Winter 2023",
  "Fall 2022", "Summer 2022", "Spring 2022", "Winter 2022",
  "Fall 2021", "Summer 2021", "Spring 2021", "Winter 2021",
  "Fall 2020", "Summer 2020", "Spring 2020", "Winter 2020",
  "Fall 2019", "Summer 2019", "Spring 2019", "Winter 2019",
  "Fall 2018", "Summer 2018", "Spring 2018", "Winter 2018",
] as const;

export const MATERIAL_TYPES = [
  "Notes",
  "Slides",
  "Syllabus",
  "Past exam",
  "Practice sheet",
  "Lab file",
  "Past assignments",
  "Review sheet",
] as const;
