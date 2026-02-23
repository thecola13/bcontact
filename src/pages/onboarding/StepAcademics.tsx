import { useState } from 'react';
import type { OnboardingAcademics, OnboardingCourse, OnboardingExchange } from '../../types/database.types';
import { BOCCONI_DEGREES, ALL_DEGREES } from '../../types/database.types';

interface StepAcademicsProps {
    data: OnboardingAcademics;
    onChange: (updates: Partial<OnboardingAcademics>) => void;
}

export default function StepAcademics({ data, onChange }: StepAcademicsProps) {
    const [courseInput, setCourseInput] = useState<OnboardingCourse>({ courseName: '', courseCode: '' });

    // ── Degree handling ─────────────────────────────────
    const availableDegrees = ALL_DEGREES.filter(
        (d) => d !== data.currentDegree && !data.otherDegrees.includes(d)
    );

    const addOtherDegree = (degree: string) => {
        if (degree && !data.otherDegrees.includes(degree)) {
            onChange({ otherDegrees: [...data.otherDegrees, degree] });
        }
    };

    const removeOtherDegree = (degree: string) => {
        onChange({ otherDegrees: data.otherDegrees.filter((d) => d !== degree) });
    };

    // ── Course handling ─────────────────────────────────
    const addCourse = () => {
        if (courseInput.courseName.trim()) {
            onChange({ courses: [...data.courses, { ...courseInput }] });
            setCourseInput({ courseName: '', courseCode: '' });
        }
    };

    const removeCourse = (index: number) => {
        onChange({ courses: data.courses.filter((_, i) => i !== index) });
    };

    // ── Exchange handling ───────────────────────────────
    const updateExchange = (updates: Partial<OnboardingExchange>) => {
        onChange({ exchange: { ...data.exchange, ...updates } });
    };

    return (
        <>
            <div className="step-header">
                <h2 className="step-title">Your academics</h2>
                <p className="step-description">
                    Tell us about your Bocconi journey — degree, courses, and exchange.
                </p>
            </div>

            <div className="step-fields">
                {/* Current Degree */}
                <div className="field-group">
                    <label htmlFor="onb-degree" className="field-label">Current degree *</label>
                    <select
                        id="onb-degree"
                        value={data.currentDegree}
                        onChange={(e) => onChange({ currentDegree: e.target.value })}
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
                    <label htmlFor="onb-other-degrees" className="field-label">
                        Other Bocconi degrees (if any)
                    </label>
                    <select
                        id="onb-other-degrees"
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
                    {data.otherDegrees.length > 0 && (
                        <div className="tags-container">
                            {data.otherDegrees.map((d) => (
                                <span key={d} className="tag">
                                    {d}
                                    <button
                                        type="button"
                                        className="tag-remove"
                                        onClick={() => removeOtherDegree(d)}
                                        aria-label={`Remove ${d}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Courses */}
                <div className="field-group">
                    <label className="field-label">Courses (optional)</label>
                    <div className="repeatable-row">
                        <input
                            type="text"
                            placeholder="Course name"
                            value={courseInput.courseName}
                            onChange={(e) => setCourseInput((c) => ({ ...c, courseName: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCourse();
                                }
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Code"
                            style={{ maxWidth: '120px' }}
                            value={courseInput.courseCode}
                            onChange={(e) => setCourseInput((c) => ({ ...c, courseCode: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCourse();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-icon"
                            onClick={addCourse}
                            disabled={!courseInput.courseName.trim()}
                            aria-label="Add course"
                        >
                            +
                        </button>
                    </div>
                    {data.courses.length > 0 && (
                        <div className="tags-container">
                            {data.courses.map((c, i) => (
                                <span key={i} className="tag">
                                    {c.courseName}{c.courseCode ? ` (${c.courseCode})` : ''}
                                    <button
                                        type="button"
                                        className="tag-remove"
                                        onClick={() => removeCourse(i)}
                                        aria-label={`Remove ${c.courseName}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Exchange */}
                <div className="toggle-section">
                    <div className="toggle-header" onClick={() => updateExchange({ enabled: !data.exchange.enabled })}>
                        <div>
                            <strong style={{ fontSize: 'var(--font-size-sm)' }}>Exchange experience</strong>
                            <p className="text-xs text-muted" style={{ marginTop: '2px' }}>
                                Did you go on exchange?
                            </p>
                        </div>
                        <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={data.exchange.enabled}
                                onChange={(e) => updateExchange({ enabled: e.target.checked })}
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    {data.exchange.enabled && (
                        <div className="toggle-body">
                            {/* Level */}
                            <div className="field-group">
                                <label className="field-label">When did you go?</label>
                                <div className="radio-group">
                                    {(['UG', 'MSc', 'Free Mover'] as const).map((lvl) => (
                                        <div key={lvl} className="radio-option">
                                            <input
                                                type="radio"
                                                id={`exchange-level-${lvl}`}
                                                name="exchange-level"
                                                value={lvl}
                                                checked={data.exchange.level === lvl}
                                                onChange={() => updateExchange({ level: lvl })}
                                            />
                                            <label htmlFor={`exchange-level-${lvl}`}>{lvl}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Destination */}
                            <div className="field-group">
                                <label htmlFor="onb-exchange-dest" className="field-label">Where?</label>
                                <input
                                    id="onb-exchange-dest"
                                    type="text"
                                    placeholder="University or city"
                                    value={data.exchange.destination}
                                    onChange={(e) => updateExchange({ destination: e.target.value })}
                                />
                            </div>

                            {/* Semester */}
                            <div className="field-group">
                                <label className="field-label">Which semester?</label>
                                <div className="radio-group">
                                    {(['1st', '2nd'] as const).map((sem) => (
                                        <div key={sem} className="radio-option">
                                            <input
                                                type="radio"
                                                id={`exchange-sem-${sem}`}
                                                name="exchange-semester"
                                                value={sem}
                                                checked={data.exchange.semester === sem}
                                                onChange={() => updateExchange({ semester: sem })}
                                            />
                                            <label htmlFor={`exchange-sem-${sem}`}>{sem} Semester</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
