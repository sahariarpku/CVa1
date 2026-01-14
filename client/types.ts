
export enum View {
  LOGIN = 'LOGIN',
  ONBOARDING = 'ONBOARDING',
  DISCOVER = 'DISCOVER',
  APPLICATIONS = 'APPLICATIONS',
  CV_BUILDER = 'CV_BUILDER',
  SETTINGS = 'SETTINGS',
  TRACKER = 'TRACKER'
}

export interface Job {
  id: string;
  title: string;
  institution?: string;
  department?: string;
  salary?: string;
  deadline?: string;
  type?: string;
  location?: string;
  matchScore?: number;
  matchReason?: string;
  missingSkills?: string[];
  imageUrl?: string;
  employer?: string; // Added from backend
  link?: string;     // Added from backend
  source?: string;   // Added from backend

  savedDate?: string;
  status?: string;
}

export interface Application {
  id: string;
  jobTitle: string;
  institution: string;
  location: string;
  status: 'INTERVIEWING' | 'SUBMITTED' | 'DRAFT' | 'REJECTED';
  dateApplied: string;
  cvTailored: boolean;
  clGenerated: boolean;
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  thesis?: string;
  courses?: string;
  notes?: string;
}

export interface Experience {
  id?: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface Award {
  id?: string;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface Publication {
  id?: string;
  title: string;
  authors?: string;
  venue?: string; // Journal or Conference
  date?: string;
  link?: string;
  doi?: string;
  description?: string;
}

export interface CustomSection {
  id?: string;
  title: string;
  content: string; // Markdown or text
}

export interface PersonalDetails {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github?: string;
  portfolio?: string;
  summary?: string;
  address: string;
  city?: string;
  postcode?: string;
}

export interface CVProfile {
  personal: PersonalDetails;
  education: Education[];
  experience: Experience[];
  skills: string[];
  projects: any[]; // Keeping generic or define it too? Let's use any for now as it wasn't requested to change, but good to be safe.
  publications: Publication[];
  awards: Award[];
  references: any[];
  custom: CustomSection[];
}
