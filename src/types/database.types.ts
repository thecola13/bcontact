// ─── Database Types ──────────────────────────────────────
// Mirrors the Supabase tables. Keep in sync with .antigravity/database/schema.md

export interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    current_degree: string | null;
    onboarding_completed: boolean;
    created_at?: string;
}

export interface Contact {
    id: string;
    user_id: string;
    personal_email: string | null;
    phone: string | null;
    linkedin_url: string | null;
    visibility: 'private' | 'all_verified';
    updated_at: string | null;
    linkedin: string | null;
    instagram: string | null;
}

export type ExperienceType = 'degree' | 'course' | 'exchange' | 'internship';

export interface Experience {
    id: string;
    user_id: string;
    exp_type: string;
    organization: string | null;
    role: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string | null;
    level: string | null;
    semester: string | null;
    code: string | null;
}

// ─── Onboarding Form State ──────────────────────────────

export interface OnboardingIdentity {
    firstName: string;
    lastName: string;
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
    identity: { firstName: '', lastName: '' },
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
