import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
    const { user, isOnboarded } = useAuth();

    return (
        <div className="home">
            <div className="bg-glow" />

            {/* ── Hero ─────────────────────────────── */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Connect with fellow
                        <br />
                        <span className="hero-accent">Bocconiani</span>
                    </h1>
                    <p className="hero-subtitle">
                        Discover classmates, share contacts privately, and find
                        alumni from your courses, exchanges, and internships —
                        all in one place.
                    </p>
                    <div className="hero-actions">
                        {user ? (
                            <Link
                                to={isOnboarded ? '/dashboard' : '/onboarding'}
                                className="btn hero-cta"
                            >
                                Go to Dashboard →
                            </Link>
                        ) : (
                            <Link to="/login" className="btn hero-cta">
                                Get Started →
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Features ─────────────────────────── */}
            <section className="features">
                <div className="features-grid">
                    <div className="feature-card card">
                        <div className="feature-icon">🎓</div>
                        <h3>Find Classmates</h3>
                        <p>
                            Search by degree, course, or exchange to discover
                            students with shared academic paths.
                        </p>
                    </div>
                    <div className="feature-card card">
                        <div className="feature-icon">🔒</div>
                        <h3>Privacy First</h3>
                        <p>
                            Your contact info is private by default. You choose
                            exactly what to share and with whom.
                        </p>
                    </div>
                    <div className="feature-card card">
                        <div className="feature-icon">🌍</div>
                        <h3>Exchange & Internship Network</h3>
                        <p>
                            Connect with students who've been where you're going —
                            exchanges, internships, and more.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Privacy Callout ──────────────────── */}
            <section className="privacy-callout">
                <div className="privacy-callout-inner card">
                    <h2>Built for privacy</h2>
                    <p>
                        BContact is restricted to verified <strong className="text-accent">@studbocconi.it</strong> emails.
                        No public profiles, no data exposure. Your information stays within the Bocconi community.
                    </p>
                </div>
            </section>

            {/* ── Footer ──────────────────────────── */}
            <footer className="home-footer text-xs text-muted">
                <p>BContact — A privacy-first platform for Bocconi students.</p>
            </footer>
        </div>
    );
}