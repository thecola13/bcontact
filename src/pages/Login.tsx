import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Login.css';

// ── Config ──────────────────────────────────────────────
const UNIVERSITY_DOMAIN = '@studbocconi.it';

// ── Validation Schema ───────────────────────────────────
const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .refine(
            (email) => email.toLowerCase().endsWith(UNIVERSITY_DOMAIN),
            `Only ${UNIVERSITY_DOMAIN} emails are allowed`
        ),
});

type LoginFormData = z.infer<typeof loginSchema>;

type FormState = 'idle' | 'loading' | 'sent';

// ── Component ───────────────────────────────────────────
export default function Login() {
    const [formState, setFormState] = useState<FormState>('idle');
    const [apiError, setApiError] = useState<string | null>(null);
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<LoginFormData>({
        defaultValues: { email: '' },
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (!loading && user) {
            navigate('/onboarding', { replace: true });
        }
    }, [user, loading, navigate]);

    const onSubmit = async (data: LoginFormData) => {
        setFormState('loading');
        setApiError(null);

        const { error } = await supabase.auth.signInWithOtp({
            email: data.email.toLowerCase(),
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
    };

    // Validate manually since we're not using a zod resolver
    const validateAndSubmit = handleSubmit(async (data) => {
        const result = loginSchema.safeParse(data);
        if (!result.success) {
            setApiError(result.error.issues[0].message);
            return;
        }
        await onSubmit(result.data);
    });

    // ── Sent State ──────────────────────────────────────
    if (formState === 'sent') {
        return (
            <div className="page-center">
                <div className="bg-glow" />
                <div className="login-card card text-center">
                    <div className="login-success-icon">✉️</div>
                    <h1 className="login-title">Check your inbox</h1>
                    <p className="login-subtitle">
                        We sent a magic link to{' '}
                        <strong className="text-accent">{getValues('email')}</strong>
                    </p>
                    <p className="login-hint text-sm text-muted">
                        Click the link in the email to sign in. Don't forget to check your spam folder.
                    </p>
                    <button
                        type="button"
                        className="btn-ghost login-back-btn"
                        onClick={() => setFormState('idle')}
                    >
                        ← Use a different email
                    </button>
                </div>
            </div>
        );
    }

    // ── Idle / Loading State ────────────────────────────
    return (
        <div className="page-center">
            <div className="bg-glow" />
            <div className="login-card card">
                <div className="login-header text-center">
                    <h1 className="login-title">Welcome to BContact</h1>
                    <p className="login-subtitle">
                        Sign in with your <strong className="text-accent">Bocconi</strong> university email
                    </p>
                </div>

                <form onSubmit={validateAndSubmit} className="login-form" noValidate>
                    <div className="login-field">
                        <label htmlFor="login-email" className="login-label">
                            University Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder={`name${UNIVERSITY_DOMAIN}`}
                            autoComplete="email"
                            autoFocus
                            disabled={formState === 'loading'}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                            {...register('email', {
                                required: 'Email is required',
                                validate: (value) => {
                                    const result = loginSchema.safeParse({ email: value });
                                    return result.success || result.error.issues[0].message;
                                },
                            })}
                        />
                        {errors.email && (
                            <p id="email-error" className="login-error text-sm text-error" role="alert">
                                {errors.email.message}
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
                            <>
                                <span className="spinner" />
                                Sending…
                            </>
                        ) : (
                            'Send Magic Link'
                        )}
                    </button>
                </form>

                <p className="login-footer text-xs text-muted text-center">
                    By signing in, you confirm you are a current Bocconi student.
                    <br />
                    No password needed — we'll email you a secure link.
                </p>
            </div>
        </div>
    );
}