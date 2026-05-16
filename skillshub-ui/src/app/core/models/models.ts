export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; role: string; }
export interface LoginResponse {
  token: string; email: string; role: string; userId: string; expiresAt: string;
}

export interface SkillDto {
  id: number; name: string; category?: string;
  proficiencyLevel: number; yearsExperience?: number; isEndorsed: boolean;
}
export interface ExperienceDto {
  companyName: string; jobTitle: string; startDate?: string; endDate?: string;
  isCurrent: boolean; description?: string; techStack: string[];
}
export interface ProjectDto { name: string; description?: string; techStack: string[]; gitHubUrl?: string; }
export interface EducationDto { institution: string; degree?: string; fieldOfStudy?: string; graduationYear?: number; }
export interface CertificationDto { name: string; issuingOrganization?: string; credentialId?: string; credentialUrl?: string; issueDate?: string; expiryDate?: string; }

export interface ProfileResponse {
  id: string; userId: string; email: string; fullName: string;
  currentTitle?: string; department?: string; yearsOfExperience?: number;
  summary?: string; linkedInUrl?: string; location?: string; availability?: string;
  status: string; createdAt: string; updatedAt: string;
  skills: SkillDto[]; experience: ExperienceDto[];
  projects: ProjectDto[]; education: EducationDto[];
  certifications: CertificationDto[];
}

export interface SearchRequest { query: string; topK?: number; }
export interface SearchResultItem {
  rank: number; score: number; profileId: string; fullName: string;
  currentTitle?: string; department?: string; yearsOfExperience?: number;
  summary?: string; topSkills: string[]; reasoning?: string;
}
export interface SearchResponse {
  query: string; totalResults: number; results: SearchResultItem[]; searchedAt: string;
}

export interface ProfileSummary {
  id: string; userId: string; email: string; fullName: string;
  currentTitle?: string; department?: string; yearsOfExperience?: number;
  status: string; skillCount: number; updatedAt: string;
}

export interface PagedResponse<T> {
  items: T[]; totalCount: number; page: number; pageSize: number; totalPages: number;
}

export interface HRStats {
  totalProfiles: number; pendingCount: number; approvedCount: number;
  totalResumes: number; topSkills: { skillName: string; category?: string; employeeCount: number }[];
}
