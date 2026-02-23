import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const UNIVERSITY_DOMAIN = '@studbocconi.it';

type ResetState = 'request' | 'loading' | 'sent' | 'new-password' | 'saving' | 'done';

export default function ResetPassword() {
    const [state, setState] = useState<ResetState>('request');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // If user is already authenticated via the recovery link, show password form
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setState('new-password');
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // ── Request Reset ───────────────────────────────────
    const handleRequestReset = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setError('Email is required');
            return;
        }
        if (!trimmed.endsWith(UNIVERSITY_DOMAIN)) {
            setError(`Only ${UNIVERSITY_DOMAIN} emails are allowed`);
            return;
        }

        setState('loading');
        setError(null);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
            redirectTo: `${window.location.origin}/bcontact/reset-password`,
        });

        if (resetError) {
            setError(resetError.message);
            setState('request');
            return;
        }

        setState('sent');
    };

    // ── Set New Password ────────────────────────────────
    const handleSetPassword = async () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        setState('saving');
        setError(null);

        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
            setError(updateError.message);
            setState('new-password');
            return;
        }

        setState('done');
    };

    // ── Done State ──────────────────────────────────────
    if (state === 'done') {
        return (
            <div className="page-center">
                <div className="bg-glow" />
                <div className="login-card card text-center">
                    <div className="login-success-icon">✅</div>
                    <h1 className="login-title">Password updated</h1>
                    <p className="login-subtitle">
                        Your new password is set. You can now sign in.
                    </p>
                    <button
                        type="button"
                        className="btn"
                        style={{ width: '100%', marginTop: 'var(--space-lg)' }}
                        onClick={() => navigate('/login', { replace: true })}
                    >
                        Go to Sign In
                    </button>
                </div>
            </div>
        );
    }

    // ── Sent State ──────────────────────────────────────
    if (state === 'sent') {
        return (
            <div className="page-center">
                <div className="bg-glow" />
                <div className="login-card card text-center">
                    <div className="login-success-icon">✉️</div>
                    <h1 className="login-title">Check your inbox</h1>
                    <p className="login-subtitle">
                        We sent a password reset link to{' '}
                        <strong className="text-accent">{email}</strong>
                    </p>
                    <p className="login-hint text-sm text-muted">
                        Click the link in the email to set a new password.
                    </p>
                    <button
                        type="button"
                        className="btn-ghost login-back-btn"
                        onClick={() => navigate('/login', { replace: true })}
                    >
                        ← Back to Sign In
                    </button>
                </div>
            </div>
        );
    }

    // ── New Password Form ───────────────────────────────
    if (state === 'new-password' || state === 'saving') {
        return (
            <div className="page-center">
                <div className="bg-glow" />
                <div className="login-card card">
                    <div className="login-header text-center">
                        <h1 className="login-title">Set new password</h1>
                        <p className="login-subtitle">
                            Choose a new password for your account.
                        </p>
                    </div>

                    <div className="login-form">
                        <div className="login-field">
                            <label htmlFor="reset-password" className="login-label">
                                New password
                            </label>
                            <input
                                id="reset-password"
                                type="password"
                                placeholder="Min 8 characters"
                                autoComplete="new-password"
                                autoFocus
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                                disabled={state === 'saving'}
                            />
                        </div>

                        <div className="login-field">
                            <label htmlFor="reset-confirm" className="login-label">
                                Confirm password
                            </label>
                            <input
                                id="reset-confirm"
                                type="password"
                                placeholder="Re-enter password"
                                autoComplete="new-password"
                                value={confirm}
                                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                                disabled={state === 'saving'}
                            />
                        </div>

                        {error && (
                            <div className="login-api-error" role="alert">
                                <span className="login-api-error-icon">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="button"
                            className="login-submit-btn"
                            onClick={handleSetPassword}
                            disabled={state === 'saving' || password.length < 8 || password !== confirm}
                        >
                            {state === 'saving' ? (
                                <><span className="spinner" /> Saving…</>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Request Reset Form ──────────────────────────────
    return (
        <div className="page-center">
            <div className="bg-glow" />
            <div className="login-card card">
                <div className="login-header text-center">
                    <h1 className="login-title">Reset your password</h1>
                    <p className="login-subtitle">
                        Enter your university email and we'll send you a reset link.
                    </p>
                </div>

                <div className="login-form">
                    <div className="login-field">
                        <label htmlFor="reset-email" className="login-label">
                            University Email
                        </label>
                        <input
                            id="reset-email"
                            type="email"
                            placeholder={`name${UNIVERSITY_DOMAIN}`}
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(null); }}
                            disabled={state === 'loading'}
                        />
                    </div>

                    {error && (
                        <div className="login-api-error" role="alert">
                            <span className="login-api-error-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="button"
                        className="login-submit-btn"
                        onClick={handleRequestReset}
                        disabled={state === 'loading'}
                    >
                        {state === 'loading' ? (
                            <><span className="spinner" /> Sending…</>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>

                    <button
                        type="button"
                        className="btn-ghost"
                        style={{ width: '100%' }}
                        onClick={() => navigate('/login', { replace: true })}
                    >
                        ← Back to Sign In
                    </button>
                </div>
            </div>
        </div>
    );
}
