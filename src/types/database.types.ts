// ─── Database Types ──────────────────────────────────────
// Mirrors the Supabase tables. Keep in sync with .antigravity/database/schema.md

export interface Profile {
    user_id: string;
    name: string | null;
    surname: string | null;
    bio: string | null;
    avatar_url: string | null;
    current_degree: string | null;
    onboarding_completed: boolean;
    created_at?: string;
}

export interface Contact {
    user_id: string;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    instagram: string | null;
    visibility: 'private' | 'all_verified';
}

export type ExperienceType = 'degree' | 'course' | 'exchange' | 'internship';

export interface Experience {
    id?: string;
    user_id: string;
    type: ExperienceType;
    organization: string;       // host: university, company, course name
    role: string | null;        // job title, degree name, etc.
    start_date: string | null;
    end_date: string | null;
    level: string | null;       // UG / MSc / Free Mover
    semester: string | null;    // 1st / 2nd
    code: string | null;        // course code
}

// ─── Onboarding Form State ──────────────────────────────

export interface OnboardingIdentity {
    name: string;
    surname: string;
}

export interface OnboardingCourse {
    courseName: string;
    courseCode: string;
}

export interface OnboardingExchange {
    enabled: boolean;
    level: 'UG' | 'MSc' | 'Free Mover' | '';
    destination: string;
    semester: '1st' | '2nd' | '';
}

export interface OnboardingAcademics {
    currentDegree: string;
    otherDegrees: string[];
    courses: OnboardingCourse[];
    exchange: OnboardingExchange;
}

export interface OnboardingPhoto {
    file: File | null;
    previewUrl: string | null;
}

export interface OnboardingContacts {
    phone: string;
    linkedin: string;
    instagram: string;
    visibility: 'private' | 'all_verified';
}

export interface OnboardingData {
    identity: OnboardingIdentity;
    academics: OnboardingAcademics;
    photo: OnboardingPhoto;
    contacts: OnboardingContacts;
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
    identity: { name: '', surname: '' },
    academics: {
        currentDegree: '',
        otherDegrees: [],
        courses: [],
        exchange: { enabled: false, level: '', destination: '', semester: '' },
    },
    photo: { file: null, previewUrl: null },
    contacts: { phone: '', linkedin: '', instagram: '', visibility: 'private' },
};

// ─── Bocconi Degree Lists ───────────────────────────────

export const BOCCONI_DEGREES = {
    UG: [
        'Economic and Social Sciences',
        'Economics and Management for Arts, Culture and Communication',
        'Economics, Management and Computer Science',
        'International Economics and Finance',
        'International Economics and Management',
        'International Politics and Government',
        'Mathematical and Computing Sciences for Artificial Intelligence',
        'World Bachelor in Business',
        'Bachelor in Global Law',
    ],
    MSC: [
        'Accounting and Financial Management',
        'Artificial Intelligence',
        'Cyber Risk Strategy and Governance',
        'Data Analytics and Artificial Intelligence in Health Sciences',
        'Data Science and Business Analytics',
        'Economic and Social Sciences',
        'Economics and Management in Arts, Culture, Media and Entertainment',
        'Economics and Management of Government and International Organizations',
        'Finance',
        'Innovation, Technology and Entrepreneurship',
        'International Management',
        'Marketing Management',
        'Politics and Policy Analysis',
        'Transformative Sustainability',
        'Giurisprudenza',
    ],
} as const;

export const ALL_DEGREES = [...BOCCONI_DEGREES.UG, ...BOCCONI_DEGREES.MSC];
