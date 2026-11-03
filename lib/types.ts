export type Course = {
  code: string;
  title: string;
  description?: string;
  prerequisite?: string;
  subject: string;
  department: string;
  level: string;
};

export type Professor = {
  id: string;
  name: string;
  department?: string;
  displayDepartment?: string;
  filterDepartment?: string;
  status?: string;
  course?: string;
  group?: string;
  email?: string;
  bio?: string;
  image?: string;
};

export type CatalogResponse = {
  courses: Course[];
  professors: Professor[];
};

export type HomeReview = {
  professorId?: string;
  professorName?: string;
  rating?: number;
  courseCode?: string;
  createdAt?: string;
};

export type HomeMaterial = {
  title?: string;
  courseCode?: string;
  materialType?: string;
  createdAt?: string;
};

export type TopReviewedProfessor = {
  professorId?: string;
  averageRating?: number;
  reviewCount?: number;
};

export type HomepageOverview = {
  reviewCount?: number;
  latestReviews?: HomeReview[];
  latestMaterials?: HomeMaterial[];
  topReviewedProfessors?: TopReviewedProfessor[];
};
