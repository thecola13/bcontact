import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    updateProfile,
    updateContacts,
    insertExperiences,
    uploadAvatar,
} from '../lib/profile.service';
import type {
    OnboardingData,
    Experience,
} from '../types/database.types';
import { INITIAL_ONBOARDING_DATA } from '../types/database.types';
import StepPassword from './onboarding/StepPassword';
import StepIdentity from './onboarding/StepIdentity';
import StepAcademics from './onboarding/StepAcademics';
import StepPhoto from './onboarding/StepPhoto';
import StepContacts from './onboarding/StepContacts';
import './Onboarding.css';

const STEPS = ['Password', 'Identity', 'Academics', 'Photo', 'Contacts'] as const;

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();

    // ── Step Navigation ─────────────────────────────────
    const canGoNext = (): boolean => {
        // Step 0 (Password) has its own submit — handled by StepPassword
        if (step === 1) {
            return data.identity.firstName.trim() !== '' && data.identity.lastName.trim() !== '';
        }
        if (step === 2) {
            return data.academics.currentDegree !== '';
        }
        return true; // Steps 3 & 4 are optional
    };

    const next = () => {
        if (canGoNext() && step < STEPS.length - 1) {
            setStep((s) => s + 1);
        }
    };

    const back = () => {
        // Don't go back to step 0 (password) once completed
        if (step > 1) setStep((s) => s - 1);
    };

    // ── Updaters ────────────────────────────────────────
    const updateIdentity = (updates: Partial<OnboardingData['identity']>) => {
        setData((d) => ({ ...d, identity: { ...d.identity, ...updates } }));
    };

    const updateAcademics = (updates: Partial<OnboardingData['academics']>) => {
        setData((d) => ({ ...d, academics: { ...d.academics, ...updates } }));
    };

    const updatePhoto = (updates: Partial<OnboardingData['photo']>) => {
        setData((d) => ({ ...d, photo: { ...d.photo, ...updates } }));
    };

    const updateContactsData = (updates: Partial<OnboardingData['contacts']>) => {
        setData((d) => ({ ...d, contacts: { ...d.contacts, ...updates } }));
    };

    // ── Submit ──────────────────────────────────────────
    const handleComplete = async () => {
        if (!user) return;
        setSubmitting(true);
        setError(null);

        try {
            // 1. Upload avatar if provided
            let avatarUrl: string | null = null;
            if (data.photo.file) {
                const result = await uploadAvatar(user.id, data.photo.file);
                if (result.error) throw new Error(result.error);
                avatarUrl = result.url;
            }

            // 2. Update profile
            const profileResult = await updateProfile(user.id, {
                first_name: data.identity.firstName.trim(),
                last_name: data.identity.lastName.trim(),
                current_degree: data.academics.currentDegree,
                avatar_url: avatarUrl,
                onboarding_completed: true,
            });
            if (profileResult.error) throw new Error(profileResult.error);

            // 3. Update contacts
            const contactsResult = await updateContacts(user.id, {
                phone: data.contacts.phone.trim() || null,
                linkedin_url: data.contacts.linkedinUrl.trim() || null,
                visibility: data.contacts.visibility,
            });
            if (contactsResult.error) throw new Error(contactsResult.error);

            // 4. Build experience rows
            const experiences: Omit<Experience, 'id' | 'user_id' | 'created_at'>[] = [];

            // Other degrees
            for (const degree of data.academics.otherDegrees) {
                const isUG = degree.startsWith('Bachelor') || degree === 'World Bachelor in Business';
                experiences.push({
                    exp_type: 'degree',
                    organization: 'Bocconi University',
                    role: degree,
                    level: isUG ? 'UG' : 'MSc',
                    start_date: null,
                    end_date: null,
                    semester: null,
                    code: null,
                });
            }

            // Courses
            for (const course of data.academics.courses) {
                if (course.courseName.trim()) {
                    experiences.push({
                        exp_type: 'course',
                        organization: course.courseName.trim(),
                        role: null,
                        level: null,
                        start_date: null,
                        end_date: null,
                        semester: null,
                        code: course.courseCode.trim() || null,
                    });
                }
            }

            // Exchange
            if (data.academics.exchange.enabled && data.academics.exchange.destination.trim()) {
                experiences.push({
                    exp_type: 'exchange',
                    organization: data.academics.exchange.destination.trim(),
                    role: null,
                    level: data.academics.exchange.level || null,
                    start_date: null,
                    end_date: null,
                    semester: data.academics.exchange.semester || null,
                    code: null,
                });
            }

            // Insert all experiences
            const expResult = await insertExperiences(user.id, experiences);
            if (expResult.error) throw new Error(expResult.error);

            // 5. Refresh context and navigate
            await refreshProfile();
            navigate('/dashboard', { replace: true });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setSubmitting(false);
        }
    };

    // ── Render ──────────────────────────────────────────
    const isPasswordStep = step === 0;

    return (
        <div className="onboarding">
            <div className="bg-glow" />
            <div className="onboarding-container">
                {/* Progress Bar */}
                <div className="onboarding-progress">
                    {STEPS.map((label, i) => (
                        <div
                            key={label}
                            className={`progress-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
                        >
                            <div className="progress-dot">
                                {i < step ? '✓' : i + 1}
                            </div>
                            <span className="progress-label">{label}</span>
                        </div>
                    ))}
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
                    />
                </div>

                {/* Step Content */}
                <div className="onboarding-card card">
                    <div className="step-content" key={step}>
                        {step === 0 && (
                            <StepPassword onComplete={() => setStep(1)} />
                        )}
                        {step === 1 && (
                            <StepIdentity data={data.identity} onChange={updateIdentity} />
                        )}
                        {step === 2 && (
                            <StepAcademics data={data.academics} onChange={updateAcademics} />
                        )}
                        {step === 3 && (
                            <StepPhoto data={data.photo} onChange={updatePhoto} />
                        )}
                        {step === 4 && (
                            <StepContacts data={data.contacts} onChange={updateContactsData} />
                        )}
                    </div>

                    {error && (
                        <div className="onboarding-error" role="alert">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Navigation — hidden on password step (it has its own button) */}
                    {!isPasswordStep && (
                        <div className="onboarding-nav">
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={back}
                                disabled={step <= 1 || submitting}
                            >
                                ← Back
                            </button>

                            {step < STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={next}
                                    disabled={!canGoNext()}
                                >
                                    Continue →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={handleComplete}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner" /> Saving…
                                        </>
                                    ) : (
                                        'Complete Setup ✓'
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
