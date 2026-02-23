import type { OnboardingContacts } from '../../types/database.types';

interface StepContactsProps {
    data: OnboardingContacts;
    onChange: (updates: Partial<OnboardingContacts>) => void;
}

export default function StepContacts({ data, onChange }: StepContactsProps) {
    return (
        <>
            <div className="step-header">
                <h2 className="step-title">Your contacts</h2>
                <p className="step-description">
                    Share your contact info with other Bocconiani. Everything is <strong>private by default</strong> — you control who can see it.
                </p>
            </div>

            <div className="step-fields">
                <div className="field-group">
                    <label htmlFor="onb-phone" className="field-label">Phone number</label>
                    <input
                        id="onb-phone"
                        type="tel"
                        placeholder="+39 xxx xxx xxxx"
                        value={data.phone}
                        onChange={(e) => onChange({ phone: e.target.value })}
                    />
                </div>

                <div className="field-group">
                    <label htmlFor="onb-linkedin" className="field-label">LinkedIn</label>
                    <input
                        id="onb-linkedin"
                        type="text"
                        placeholder="linkedin.com/in/yourname"
                        value={data.linkedin}
                        onChange={(e) => onChange({ linkedin: e.target.value })}
                    />
                </div>

                <div className="field-group">
                    <label htmlFor="onb-instagram" className="field-label">Instagram</label>
                    <input
                        id="onb-instagram"
                        type="text"
                        placeholder="@yourhandle"
                        value={data.instagram}
                        onChange={(e) => onChange({ instagram: e.target.value })}
                    />
                </div>

                {/* Visibility Toggle */}
                <div className="visibility-toggle">
                    <div className="visibility-info">
                        <h4>Visible to verified students</h4>
                        <p>
                            {data.visibility === 'all_verified'
                                ? 'Other Bocconi students can see your contacts'
                                : 'Only you can see your contacts'}
                        </p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={data.visibility === 'all_verified'}
                            onChange={(e) =>
                                onChange({ visibility: e.target.checked ? 'all_verified' : 'private' })
                            }
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>
        </>
    );
}
