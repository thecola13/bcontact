import type { OnboardingIdentity } from '../../types/database.types';

interface StepIdentityProps {
    data: OnboardingIdentity;
    onChange: (updates: Partial<OnboardingIdentity>) => void;
}

export default function StepIdentity({ data, onChange }: StepIdentityProps) {
    return (
        <>
            <div className="step-header">
                <h2 className="step-title">Let's get to know you</h2>
                <p className="step-description">
                    Start with the basics — your name as you'd like it to appear to other Bocconiani.
                </p>
            </div>

            <div className="step-fields">
                <div className="field-row">
                    <div className="field-group">
                        <label htmlFor="onb-name" className="field-label">First name *</label>
                        <input
                            id="onb-name"
                            type="text"
                            placeholder="Mario"
                            value={data.firstName}
                            onChange={(e) => onChange({ firstName: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div className="field-group">
                        <label htmlFor="onb-surname" className="field-label">Last name *</label>
                        <input
                            id="onb-surname"
                            type="text"
                            placeholder="Rossi"
                            value={data.lastName}
                            onChange={(e) => onChange({ lastName: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
