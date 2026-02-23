import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface StepPasswordProps {
    onComplete: () => void;
}

export default function StepPassword({ onComplete }: StepPasswordProps) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const isValid = password.length >= 8 && password === confirm;

    const handleSubmit = async () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase.auth.updateUser({
            password,
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        onComplete();
    };

    return (
        <>
            <div className="step-header">
                <h2 className="step-title">Set your password</h2>
                <p className="step-description">
                    Create a password for future logins. You won't need the magic link again.
                </p>
            </div>

            <div className="step-fields">
                <div className="field-group">
                    <label htmlFor="onb-password" className="field-label">Password *</label>
                    <input
                        id="onb-password"
                        type="password"
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        autoFocus
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        disabled={loading}
                    />
                    {password.length > 0 && password.length < 8 && (
                        <p className="text-xs text-error" style={{ marginTop: 'var(--space-xs)' }}>
                            {8 - password.length} more character{8 - password.length > 1 ? 's' : ''} needed
                        </p>
                    )}
                </div>

                <div className="field-group">
                    <label htmlFor="onb-confirm" className="field-label">Confirm password *</label>
                    <input
                        id="onb-confirm"
                        type="password"
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                        disabled={loading}
                    />
                    {confirm.length > 0 && password !== confirm && (
                        <p className="text-xs text-error" style={{ marginTop: 'var(--space-xs)' }}>
                            Passwords do not match
                        </p>
                    )}
                </div>

                {error && (
                    <div className="onboarding-error" role="alert">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <button
                    type="button"
                    className="btn"
                    style={{ width: '100%', marginTop: 'var(--space-md)' }}
                    onClick={handleSubmit}
                    disabled={!isValid || loading}
                >
                    {loading ? (
                        <><span className="spinner" /> Setting password…</>
                    ) : (
                        'Set Password & Continue →'
                    )}
                </button>
            </div>
        </>
    );
}
