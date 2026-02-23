import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    fetchContacts,
    updateProfile,
    updateContacts,
    fetchExperiences,
    deleteExperiences,
    insertExperiences,
    uploadAvatar,
} from '../lib/profile.service';
import type { Contact, Experience, OnboardingAcademics, OnboardingCourse, OnboardingExchange } from '../types/database.types';
import { BOCCONI_DEGREES, ALL_DEGREES } from '../types/database.types';
import './Profile.css';

// ── Toast helper ──────────────────────────────────────
type Toast = { type: 'success' | 'error'; message: string } | null;

function useToast() {
    const [toast, setToast] = useState<Toast>(null);
    const show = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };
    return { toast, show };
}

// ── Section wrapper ───────────────────────────────────
function Section({
    icon,
    title,
    subtitle,
    defaultOpen = false,
    children,
}: {
    icon: string;
    title: string;
    subtitle: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="profile-section">
            <div className="section-header" onClick={() => setOpen(!open)}>
                <div className="section-header-left">
                    <div className="section-icon">{icon}</div>
                    <div>
                        <h3>{title}</h3>
                        <p>{subtitle}</p>
                    </div>
                </div>
                <span className={`section-chevron ${open ? 'open' : ''}`}>▼</span>
            </div>
            {open && (
                <>
                    <div className="section-divider" />
                    <div className="section-body">{children}</div>
                </>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════
// Profile Page
// ═════════════════════════════════════════════════════
export default function Profile() {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();

    // ── Local state for each section ─────────────────
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');

    // Photo
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Password
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');

    // Contacts
    const [phone, setPhone] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [visibility, setVisibility] = useState<'private' | 'all_verified'>('private');

    // Academics
    const [academics, setAcademics] = useState<OnboardingAcademics>({
        currentDegree: '',
        otherDegrees: [],
        courses: [],
        exchange: { enabled: false, level: '', destination: '', semester: '' },
    });
    const [courseInput, setCourseInput] = useState<OnboardingCourse>({ courseName: '', courseCode: '' });

    // Loading / saving flags
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingExperiences, setLoadingExperiences] = useState(true);
    const [savingIdentity, setSavingIdentity] = useState(false);
    const [savingPhoto, setSavingPhoto] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [savingContacts, setSavingContacts] = useState(false);
    const [savingAcademics, setSavingAcademics] = useState(false);

    // Toasts
    const identityToast = useToast();
    const photoToast = useToast();
    const passwordToast = useToast();
    const contactsToast = useToast();
    const academicsToast = useToast();

    // ── Pre-fill from profile context ────────────────
    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name ?? '');
            setLastName(profile.last_name ?? '');
            setBio(profile.bio ?? '');
            setPhotoPreview(profile.avatar_url ?? null);
            setAcademics((a) => ({ ...a, currentDegree: profile.current_degree ?? '' }));
        }
    }, [profile]);

    // ── Fetch contacts ───────────────────────────────
    useEffect(() => {
        if (!user) return;
        fetchContacts(user.id).then((c) => {
            if (c) {
                setPhone(c.phone ?? '');
                setLinkedinUrl(c.linkedin_url ?? '');
                setVisibility(c.visibility ?? 'private');
            }
            setLoadingContacts(false);
        });
    }, [user]);

    // ── Fetch experiences → derive academics ─────────
    const hydrateAcademics = useCallback((experiences: Experience[]) => {
        const otherDegrees = experiences
            .filter((e) => e.exp_type === 'degree')
            .map((e) => e.role ?? '');

        const courses: OnboardingCourse[] = experiences
            .filter((e) => e.exp_type === 'course')
            .map((e) => ({ courseName: e.organization ?? '', courseCode: e.code ?? '' }));

        const exchangeExp = experiences.find((e) => e.exp_type === 'exchange');
        const exchange: OnboardingExchange = exchangeExp
            ? {
                enabled: true,
                level: (exchangeExp.level as OnboardingExchange['level']) || '',
                destination: exchangeExp.organization ?? '',
                semester: (exchangeExp.semester as OnboardingExchange['semester']) || '',
            }
            : { enabled: false, level: '', destination: '', semester: '' };

        setAcademics((a) => ({ ...a, otherDegrees, courses, exchange }));
    }, []);

    useEffect(() => {
        if (!user) return;
        fetchExperiences(user.id).then((exps) => {
            hydrateAcademics(exps);
            setLoadingExperiences(false);
        });
    }, [user, hydrateAcademics]);

    // ── Handlers: Identity ──────────────────────────
    const handleSaveIdentity = async () => {
        if (!user) return;
        setSavingIdentity(true);
        const { error } = await updateProfile(user.id, {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            bio: bio.trim() || null,
        });
        setSavingIdentity(false);
        if (error) return identityToast.show('error', error);
        await refreshProfile();
        identityToast.show('success', 'Saved');
    };

    // ── Handlers: Photo ─────────────────────────────
    const handlePhotoFile = (file: File | undefined) => {
        if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSavePhoto = async () => {
        if (!user) return;
        setSavingPhoto(true);
        if (photoFile) {
            const { url, error } = await uploadAvatar(user.id, photoFile);
            if (error) { setSavingPhoto(false); return photoToast.show('error', error); }
            const res = await updateProfile(user.id, { avatar_url: url });
            if (res.error) { setSavingPhoto(false); return photoToast.show('error', res.error); }
        }
        setSavingPhoto(false);
        setPhotoFile(null);
        await refreshProfile();
        photoToast.show('success', 'Photo updated');
    };

    const handleRemovePhoto = async () => {
        if (!user) return;
        setSavingPhoto(true);
        const res = await updateProfile(user.id, { avatar_url: null });
        setSavingPhoto(false);
        if (res.error) return photoToast.show('error', res.error);
        setPhotoFile(null);
        setPhotoPreview(null);
        await refreshProfile();
        photoToast.show('success', 'Photo removed');
    };

    // ── Handlers: Password ──────────────────────────
    const handleSavePassword = async () => {
        if (password.length < 8) return passwordToast.show('error', 'Min 8 characters');
        if (password !== confirmPw) return passwordToast.show('error', 'Passwords do not match');
        setSavingPassword(true);
        const { error } = await supabase.auth.updateUser({ password });
        setSavingPassword(false);
        if (error) return passwordToast.show('error', error.message);
        setPassword('');
        setConfirmPw('');
        passwordToast.show('success', 'Password changed');
    };

    // ── Handlers: Contacts ──────────────────────────
    const handleSaveContacts = async () => {
        if (!user) return;
        setSavingContacts(true);
        const { error } = await updateContacts(user.id, {
            phone: phone.trim() || null,
            linkedin_url: linkedinUrl.trim() || null,
            visibility,
        });
        setSavingContacts(false);
        if (error) return contactsToast.show('error', error);
        contactsToast.show('success', 'Saved');
    };

    // ── Handlers: Academics ─────────────────────────
    const updateAcademicsField = (updates: Partial<OnboardingAcademics>) => {
        setAcademics((a) => ({ ...a, ...updates }));
    };

    const updateExchange = (updates: Partial<OnboardingExchange>) => {
        setAcademics((a) => ({ ...a, exchange: { ...a.exchange, ...updates } }));
    };

    const addOtherDegree = (degree: string) => {
        if (degree && !academics.otherDegrees.includes(degree)) {
            updateAcademicsField({ otherDegrees: [...academics.otherDegrees, degree] });
        }
    };

    const removeOtherDegree = (degree: string) => {
        updateAcademicsField({ otherDegrees: academics.otherDegrees.filter((d) => d !== degree) });
    };

    const addCourse = () => {
        if (courseInput.courseName.trim()) {
            updateAcademicsField({ courses: [...academics.courses, { ...courseInput }] });
            setCourseInput({ courseName: '', courseCode: '' });
        }
    };

    const removeCourse = (index: number) => {
        updateAcademicsField({ courses: academics.courses.filter((_, i) => i !== index) });
    };

    const availableDegrees = ALL_DEGREES.filter(
        (d) => d !== academics.currentDegree && !academics.otherDegrees.includes(d)
    );

    const handleSaveAcademics = async () => {
        if (!user) return;
        setSavingAcademics(true);

        // 1. Update current_degree on profile
        const profileRes = await updateProfile(user.id, { current_degree: academics.currentDegree || null });
        if (profileRes.error) { setSavingAcademics(false); return academicsToast.show('error', profileRes.error); }

        // 2. Delete old experiences, re-insert
        const delRes = await deleteExperiences(user.id);
        if (delRes.error) { setSavingAcademics(false); return academicsToast.show('error', delRes.error); }

        const rows: Omit<Experience, 'id' | 'user_id' | 'created_at'>[] = [];

        for (const degree of academics.otherDegrees) {
            const isUG = degree.startsWith('Bachelor') || degree === 'World Bachelor in Business';
            rows.push({
                exp_type: 'degree', organization: 'Bocconi University', role: degree,
                level: isUG ? 'UG' : 'MSc', start_date: null, end_date: null, semester: null, code: null,
            });
        }

        for (const c of academics.courses) {
            if (c.courseName.trim()) {
                rows.push({
                    exp_type: 'course', organization: c.courseName.trim(), role: null,
                    level: null, start_date: null, end_date: null, semester: null, code: c.courseCode.trim() || null,
                });
            }
        }

        if (academics.exchange.enabled && academics.exchange.destination.trim()) {
            rows.push({
                exp_type: 'exchange', organization: academics.exchange.destination.trim(), role: null,
                level: academics.exchange.level || null, start_date: null, end_date: null,
                semester: academics.exchange.semester || null, code: null,
            });
        }

        const insRes = await insertExperiences(user.id, rows);
        setSavingAcademics(false);
        if (insRes.error) return academicsToast.show('error', insRes.error);
        await refreshProfile();
        academicsToast.show('success', 'Saved');
    };

    // ── Sign out ────────────────────────────────────
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    };

    // ── Render helpers ──────────────────────────────
    const renderToast = (t: Toast) =>
        t ? <span className={`save-toast ${t.type}`}>{t.type === 'success' ? '✓' : '⚠'} {t.message}</span> : null;

    const isLoading = loadingContacts || loadingExperiences;

    if (isLoading) {
        return (
            <div className="profile">
                <div className="bg-glow" />
                <div className="profile-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <span className="spinner" /> Loading profile…
                </div>
            </div>
        );
    }

    return (
        <div className="profile">
            <div className="bg-glow" />
            <div className="profile-container">
                {/* Top bar */}
                <div className="profile-topbar">
                    <h1>Settings</h1>
                    <button className="btn-ghost profile-back" onClick={() => navigate('/dashboard')}>
                        ← Dashboard
                    </button>
                </div>

                {/* Header card */}
                <div className="profile-header card">
                    <div className="profile-header-avatar">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Avatar" />
                        ) : (
                            <div className="avatar-placeholder">👤</div>
                        )}
                    </div>
                    <div className="profile-header-info">
                        <h2>{firstName || 'Your Name'} {lastName}</h2>
                        <span className="profile-email">
                            <span className="lock-icon">🔒</span>
                            {user?.email}
                        </span>
                    </div>
                </div>

                {/* ── Identity Section ─────────────────── */}
                <Section icon="👤" title="Identity" subtitle="Name and bio" defaultOpen>
                    <div className="step-fields">
                        <div className="field-row">
                            <div className="field-group">
                                <label htmlFor="prf-fname" className="field-label">First name *</label>
                                <input
                                    id="prf-fname"
                                    type="text"
                                    placeholder="Mario"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className="field-group">
                                <label htmlFor="prf-lname" className="field-label">Last name *</label>
                                <input
                                    id="prf-lname"
                                    type="text"
                                    placeholder="Rossi"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="field-group">
                            <label htmlFor="prf-bio" className="field-label">Bio</label>
                            <textarea
                                id="prf-bio"
                                placeholder="Write a short bio…"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="section-footer">
                        {renderToast(identityToast.toast)}
                        <button
                            className="btn btn-save"
                            onClick={handleSaveIdentity}
                            disabled={savingIdentity || !firstName.trim() || !lastName.trim()}
                        >
                            {savingIdentity ? <><span className="spinner" /> Saving…</> : 'Save'}
                        </button>
                    </div>
                </Section>

                {/* ── Photo Section ────────────────────── */}
                <Section icon="📷" title="Profile Photo" subtitle="Change or remove your avatar">
                    <div className="step-fields">
                        <div
                            className={`profile-upload-area ${photoPreview ? 'has-preview' : ''}`}
                            onClick={() => photoInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); handlePhotoFile(e.dataTransfer.files[0]); }}
                        >
                            {photoPreview ? (
                                <>
                                    <img src={photoPreview} alt="Preview" className="profile-upload-preview" />
                                    <p className="text-sm text-accent">Click to change photo</p>
                                </>
                            ) : (
                                <>
                                    <div className="upload-icon">📷</div>
                                    <p className="upload-text">Click to upload or drag and drop</p>
                                    <p className="upload-hint">JPG, PNG or WebP — max 5 MB</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                        />
                        {photoPreview && (
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={handleRemovePhoto}
                                disabled={savingPhoto}
                                style={{ width: '100%' }}
                            >
                                Remove photo
                            </button>
                        )}
                    </div>
                    <div className="section-footer">
                        {renderToast(photoToast.toast)}
                        <button
                            className="btn btn-save"
                            onClick={handleSavePhoto}
                            disabled={savingPhoto || !photoFile}
                        >
                            {savingPhoto ? <><span className="spinner" /> Uploading…</> : 'Save Photo'}
                        </button>
                    </div>
                </Section>

                {/* ── Password Section ─────────────────── */}
                <Section icon="🔑" title="Password" subtitle="Change your login password">
                    <div className="step-fields">
                        <div className="field-group">
                            <label htmlFor="prf-email" className="field-label">Email (read-only)</label>
                            <div className="input-readonly">
                                <span className="lock-icon">🔒</span> {user?.email}
                            </div>
                        </div>
                        <div className="field-group">
                            <label htmlFor="prf-pw" className="field-label">New password</label>
                            <input
                                id="prf-pw"
                                type="password"
                                placeholder="Min 8 characters"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {password.length > 0 && password.length < 8 && (
                                <p className="text-xs text-error" style={{ marginTop: 'var(--space-xs)' }}>
                                    {8 - password.length} more character{8 - password.length > 1 ? 's' : ''} needed
                                </p>
                            )}
                        </div>
                        <div className="field-group">
                            <label htmlFor="prf-pw-confirm" className="field-label">Confirm password</label>
                            <input
                                id="prf-pw-confirm"
                                type="password"
                                placeholder="Re-enter your password"
                                autoComplete="new-password"
                                value={confirmPw}
                                onChange={(e) => setConfirmPw(e.target.value)}
                            />
                            {confirmPw.length > 0 && password !== confirmPw && (
                                <p className="text-xs text-error" style={{ marginTop: 'var(--space-xs)' }}>
                                    Passwords do not match
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="section-footer">
                        {renderToast(passwordToast.toast)}
                        <button
                            className="btn btn-save"
                            onClick={handleSavePassword}
                            disabled={savingPassword || password.length < 8 || password !== confirmPw}
                        >
                            {savingPassword ? <><span className="spinner" /> Changing…</> : 'Change Password'}
                        </button>
                    </div>
                </Section>

                {/* ── Contacts Section ─────────────────── */}
                <Section icon="📱" title="Contacts" subtitle="Phone, socials, and visibility">
                    <div className="step-fields">
                        <div className="field-group">
                            <label htmlFor="prf-phone" className="field-label">Phone number</label>
                            <input
                                id="prf-phone"
                                type="tel"
                                placeholder="+39 xxx xxx xxxx"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="prf-linkedin" className="field-label">LinkedIn</label>
                            <input
                                id="prf-linkedin"
                                type="text"
                                placeholder="linkedin.com/in/yourname"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                            />
                        </div>
                        <div className="visibility-toggle">
                            <div className="visibility-info">
                                <h4>Visible to verified students</h4>
                                <p>
                                    {visibility === 'all_verified'
                                        ? 'Other Bocconi students can see your contacts'
                                        : 'Only you can see your contacts'}
                                </p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={visibility === 'all_verified'}
                                    onChange={(e) => setVisibility(e.target.checked ? 'all_verified' : 'private')}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>
                    <div className="section-footer">
                        {renderToast(contactsToast.toast)}
                        <button className="btn btn-save" onClick={handleSaveContacts} disabled={savingContacts}>
                            {savingContacts ? <><span className="spinner" /> Saving…</> : 'Save'}
                        </button>
                    </div>
                </Section>

                {/* ── Academics Section ────────────────── */}
                <Section icon="🎓" title="Academics" subtitle="Degree, courses, and exchange">
                    <div className="step-fields">
                        {/* Current Degree */}
                        <div className="field-group">
                            <label htmlFor="prf-degree" className="field-label">Current degree *</label>
                            <select
                                id="prf-degree"
                                value={academics.currentDegree}
                                onChange={(e) => updateAcademicsField({ currentDegree: e.target.value })}
                            >
                                <option value="">Select your degree…</option>
                                <optgroup label="Undergraduate">
                                    {BOCCONI_DEGREES.UG.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Master of Science">
                                    {BOCCONI_DEGREES.MSC.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Other Degrees */}
                        <div className="field-group">
                            <label htmlFor="prf-other-degrees" className="field-label">Other Bocconi degrees</label>
                            <select
                                id="prf-other-degrees"
                                value=""
                                onChange={(e) => addOtherDegree(e.target.value)}
                            >
                                <option value="">Add a degree…</option>
                                <optgroup label="Undergraduate">
                                    {BOCCONI_DEGREES.UG.filter((d) => availableDegrees.includes(d)).map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Master of Science">
                                    {BOCCONI_DEGREES.MSC.filter((d) => availableDegrees.includes(d)).map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </optgroup>
                            </select>
                            {academics.otherDegrees.length > 0 && (
                                <div className="tags-container">
                                    {academics.otherDegrees.map((d) => (
                                        <span key={d} className="tag">
                                            {d}
                                            <button type="button" className="tag-remove" onClick={() => removeOtherDegree(d)} aria-label={`Remove ${d}`}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Courses */}
                        <div className="field-group">
                            <label className="field-label">Courses</label>
                            <div className="repeatable-row">
                                <input
                                    type="text"
                                    placeholder="Course name"
                                    value={courseInput.courseName}
                                    onChange={(e) => setCourseInput((c) => ({ ...c, courseName: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCourse(); } }}
                                />
                                <input
                                    type="text"
                                    placeholder="Code"
                                    style={{ maxWidth: '120px' }}
                                    value={courseInput.courseCode}
                                    onChange={(e) => setCourseInput((c) => ({ ...c, courseCode: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCourse(); } }}
                                />
                                <button type="button" className="btn btn-icon" onClick={addCourse} disabled={!courseInput.courseName.trim()} aria-label="Add course">+</button>
                            </div>
                            {academics.courses.length > 0 && (
                                <div className="tags-container">
                                    {academics.courses.map((c, i) => (
                                        <span key={i} className="tag">
                                            {c.courseName}{c.courseCode ? ` (${c.courseCode})` : ''}
                                            <button type="button" className="tag-remove" onClick={() => removeCourse(i)} aria-label={`Remove ${c.courseName}`}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Exchange */}
                        <div className="toggle-section">
                            <div className="toggle-header" onClick={() => updateExchange({ enabled: !academics.exchange.enabled })}>
                                <div>
                                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>Exchange experience</strong>
                                    <p className="text-xs text-muted" style={{ marginTop: '2px' }}>Did you go on exchange?</p>
                                </div>
                                <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={academics.exchange.enabled}
                                        onChange={(e) => updateExchange({ enabled: e.target.checked })}
                                    />
                                    <span className="toggle-slider" />
                                </label>
                            </div>
                            {academics.exchange.enabled && (
                                <div className="toggle-body">
                                    <div className="field-group">
                                        <label className="field-label">When did you go?</label>
                                        <div className="radio-group">
                                            {(['UG', 'MSc', 'Free Mover'] as const).map((lvl) => (
                                                <div key={lvl} className="radio-option">
                                                    <input
                                                        type="radio" id={`prf-exlvl-${lvl}`} name="prf-exchange-level"
                                                        value={lvl} checked={academics.exchange.level === lvl}
                                                        onChange={() => updateExchange({ level: lvl })}
                                                    />
                                                    <label htmlFor={`prf-exlvl-${lvl}`}>{lvl}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="field-group">
                                        <label htmlFor="prf-exchange-dest" className="field-label">Where?</label>
                                        <input
                                            id="prf-exchange-dest" type="text" placeholder="University or city"
                                            value={academics.exchange.destination}
                                            onChange={(e) => updateExchange({ destination: e.target.value })}
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Which semester?</label>
                                        <div className="radio-group">
                                            {(['1st', '2nd'] as const).map((sem) => (
                                                <div key={sem} className="radio-option">
                                                    <input
                                                        type="radio" id={`prf-exsem-${sem}`} name="prf-exchange-semester"
                                                        value={sem} checked={academics.exchange.semester === sem}
                                                        onChange={() => updateExchange({ semester: sem })}
                                                    />
                                                    <label htmlFor={`prf-exsem-${sem}`}>{sem} Semester</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="section-footer">
                        {renderToast(academicsToast.toast)}
                        <button className="btn btn-save" onClick={handleSaveAcademics} disabled={savingAcademics}>
                            {savingAcademics ? <><span className="spinner" /> Saving…</> : 'Save'}
                        </button>
                    </div>
                </Section>

                {/* Sign Out */}
                <div className="profile-signout">
                    <button className="btn-danger" onClick={handleSignOut} style={{ width: '100%' }}>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
