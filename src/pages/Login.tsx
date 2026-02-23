import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Login.css';

// ── Config ──────────────────────────────────────────────
const UNIVERSITY_DOMAIN = '@studbocconi.it';

// ── Schemas ─────────────────────────────────────────────
const emailSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .refine(
            (email) => email.toLowerCase().endsWith(UNIVERSITY_DOMAIN),
            `Only ${UNIVERSITY_DOMAIN} emails are allowed`
        ),
});

const signInSchema = emailSchema.extend({
    password: z.string().min(1, 'Password is required'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type SignInFormData = z.infer<typeof signInSchema>;
type AuthTab = 'signin' | 'register';
type FormState = 'idle' | 'loading' | 'sent';

// ── Component ───────────────────────────────────────────
export default function Login() {
    const [tab, setTab] = useState<AuthTab>('signin');
    const [formState, setFormState] = useState<FormState>('idle');
    const [apiError, setApiError] = useState<string | null>(null);
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // Sign In form
    const signInForm = useForm<SignInFormData>({
        defaultValues: { email: '', password: '' },
    });

    // Register form
    const registerForm = useForm<EmailFormData>({
        defaultValues: { email: '' },
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (!loading && user) {
            navigate('/onboarding', { replace: true });
        }
    }, [user, loading, navigate]);

    // Reset state when switching tabs
    const switchTab = (newTab: AuthTab) => {
        setTab(newTab);
        setApiError(null);
        setFormState('idle');
    };

    // ── Sign In Handler ─────────────────────────────────
    const handleSignIn = signInForm.handleSubmit(async (data) => {
        const result = signInSchema.safeParse(data);
        if (!result.success) {
            setApiError(result.error.issues[0].message);
            return;
        }

        setFormState('loading');
        setApiError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email: result.data.email.toLowerCase(),
            password: result.data.password,
        });

        if (error) {
            setApiError(
                error.message === 'Invalid login credentials'
                    ? 'Wrong email or password. Check your credentials and try again.'
                    : error.message
            );
            setFormState('idle');
            return;
        }

        // Auth state listener will redirect via useEffect
    });

    // ── Register Handler ────────────────────────────────
    const handleRegister = registerForm.handleSubmit(async (data) => {
        const result = emailSchema.safeParse(data);
        if (!result.success) {
            setApiError(result.error.issues[0].message);
            return;
        }

        setFormState('loading');
        setApiError(null);

        const { error } = await supabase.auth.signInWithOtp({
            email: result.data.email.toLowerCase(),
            options: {
                emailRedirectTo: `${window.location.origin}/bcontact/onboarding`,
            },
        });

        if (error) {
            setApiError(error.message);
            setFormState('idle');
            return;
        }

        setFormState('sent');
    });

    // ── Forgot Password Handler ─────────────────────────
    const handleForgotPassword = async () => {
        const email = signInForm.getValues('email');
        if (!email) {
            setApiError('Enter your email first, then click "Forgot password?"');
            return;
        }

        const result = emailSchema.safeParse({ email });
        if (!result.success) {
            setApiError(result.error.issues[0].message);
            return;
        }

        setFormState('loading');
        setApiError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(
            result.data.email.toLowerCase(),
            { redirectTo: `${window.location.origin}/bcontact/reset-password` }
        );

        if (error) {
            setApiError(error.message);
            setFormState('idle');
            return;
        }

        setApiError(null);
        setFormState('sent');
    };

    // ── Sent State ──────────────────────────────────────
    if (formState === 'sent') {
        const isForgot = tab === 'signin';
        return (
            <div className="page-center">
                <div className="bg-glow" />
                <div className="login-card card text-center">
                    <div className="login-success-icon">✉️</div>
                    <h1 className="login-title">Check your inbox</h1>
                    <p className="login-subtitle">
                        We sent a {isForgot ? 'password reset link' : 'verification link'} to{' '}
                        <strong className="text-accent">
                            {isForgot
                                ? signInForm.getValues('email')
                                : registerForm.getValues('email')}
                        </strong>
                    </p>
                    <p className="login-hint text-sm text-muted">
                        {isForgot
                            ? 'Click the link to set a new password.'
                            : 'Click the link to verify your email and create your account.'}
                        {' '}Don't forget to check your spam folder.
                    </p>
                    <button
                        type="button"
                        className="btn-ghost login-back-btn"
                        onClick={() => { setFormState('idle'); setApiError(null); }}
                    >
                        ← Go back
                    </button>
                </div>
            </div>
        );
    }

    // ── Main Form ───────────────────────────────────────
    return (
        <div className="page-center">
            <div className="bg-glow" />
            <div className="login-card card">
                <div className="login-header text-center">
                    <h1 className="login-title">Welcome to BContact</h1>
                    <p className="login-subtitle">
                        {tab === 'signin'
                            ? 'Sign in to your account'
                            : <>Register with your <strong className="text-accent">Bocconi</strong> email</>}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="login-tabs">
                    <button
                        type="button"
                        className={`login-tab ${tab === 'signin' ? 'active' : ''}`}
                        onClick={() => switchTab('signin')}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        className={`login-tab ${tab === 'register' ? 'active' : ''}`}
                        onClick={() => switchTab('register')}
                    >
                        Register
                    </button>
                </div>

                {/* Sign In Form */}
                {tab === 'signin' && (
                    <form onSubmit={handleSignIn} className="login-form" noValidate>
                        <div className="login-field">
                            <label htmlFor="signin-email" className="login-label">
                                University Email
                            </label>
                            <input
                                id="signin-email"
                                type="email"
                                placeholder={`name${UNIVERSITY_DOMAIN}`}
                                autoComplete="email"
                                autoFocus
                                disabled={formState === 'loading'}
                                {...signInForm.register('email', {
                                    required: 'Email is required',
                                    validate: (value) => {
                                        const r = emailSchema.safeParse({ email: value });
                                        return r.success || r.error.issues[0].message;
                                    },
                                })}
                            />
                            {signInForm.formState.errors.email && (
                                <p className="login-error text-sm text-error" role="alert">
                                    {signInForm.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="login-field">
                            <label htmlFor="signin-password" className="login-label">
                                Password
                            </label>
                            <input
                                id="signin-password"
                                type="password"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={formState === 'loading'}
                                {...signInForm.register('password', {
                                    required: 'Password is required',
                                })}
                            />
                            {signInForm.formState.errors.password && (
                                <p className="login-error text-sm text-error" role="alert">
                                    {signInForm.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        {apiError && (
                            <div className="login-api-error" role="alert">
                                <span className="login-api-error-icon">⚠️</span>
                                <span>{apiError}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-submit-btn"
                            disabled={formState === 'loading'}
                        >
                            {formState === 'loading' ? (
                                <><span className="spinner" /> Signing in…</>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <button
                            type="button"
                            className="login-forgot-btn text-sm text-accent"
                            onClick={handleForgotPassword}
                            disabled={formState === 'loading'}
                        >
                            Forgot password?
                        </button>
                    </form>
                )}

                {/* Register Form */}
                {tab === 'register' && (
                    <form onSubmit={handleRegister} className="login-form" noValidate>
                        <div className="login-field">
                            <label htmlFor="register-email" className="login-label">
                                University Email
                            </label>
                            <input
                                id="register-email"
                                type="email"
                                placeholder={`name${UNIVERSITY_DOMAIN}`}
                                autoComplete="email"
                                autoFocus
                                disabled={formState === 'loading'}
                                {...registerForm.register('email', {
                                    required: 'Email is required',
                                    validate: (value) => {
                                        const r = emailSchema.safeParse({ email: value });
                                        return r.success || r.error.issues[0].message;
                                    },
                                })}
                            />
                            {registerForm.formState.errors.email && (
                                <p className="login-error text-sm text-error" role="alert">
                                    {registerForm.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        {apiError && (
                            <div className="login-api-error" role="alert">
                                <span className="login-api-error-icon">⚠️</span>
                                <span>{apiError}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-submit-btn"
                            disabled={formState === 'loading'}
                        >
                            {formState === 'loading' ? (
                                <><span className="spinner" /> Sending…</>
                            ) : (
                                'Send Verification Link'
                            )}
                        </button>
                    </form>
                )}

                <p className="login-footer text-xs text-muted text-center">
                    {tab === 'signin'
                        ? <>Don't have an account? <button type="button" className="text-accent login-link-btn" onClick={() => switchTab('register')}>Register here</button></>
                        : <>Already have an account? <button type="button" className="text-accent login-link-btn" onClick={() => switchTab('signin')}>Sign in</button></>}
                </p>
            </div>
        </div>
    );
}