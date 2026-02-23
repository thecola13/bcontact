import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useSearch, type FilterType } from '../app/useSearch';
import UserCard from '../components/UserCard';
import './Dashboard.css';

// ── Filter chip definitions ──────────────────────────
const FILTERS: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All Students', icon: '👥' },
    { key: 'degree', label: 'Degree', icon: '🎓' },
    { key: 'course', label: 'Courses', icon: '📚' },
    { key: 'exchange', label: 'Exchange', icon: '✈️' },
];

// ── Skeleton loading cards ───────────────────────────
function SkeletonCards() {
    return (
        <div className="skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-header">
                        <div className="skeleton-avatar" />
                        <div className="skeleton-lines">
                            <div className="skeleton-line" />
                            <div className="skeleton-line short" />
                        </div>
                    </div>
                    <div className="skeleton-badges">
                        <div className="skeleton-badge" />
                        <div className="skeleton-badge" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// Dashboard Page
// ═══════════════════════════════════════════════════════
export default function Dashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const { query, setQuery, filter, setFilter, results, loading, hasMore, loadMore } = useSearch(user?.id);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    };

    // Avatar initials
    const initials = ((profile?.first_name?.[0] ?? '') + (profile?.last_name?.[0] ?? '')).toUpperCase() || '?';

    return (
        <div className="dashboard">
            <div className="bg-glow" />

            {/* ── Top Bar ──────────────────────────── */}
            <header className="dash-topbar">
                <div className="dash-topbar-left">
                    <h1>BContact</h1>
                </div>
                <div className="dash-topbar-right">
                    <button
                        className="dash-avatar-btn"
                        onClick={() => navigate('/profile')}
                        title="Profile settings"
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" />
                        ) : (
                            <span>{initials}</span>
                        )}
                    </button>
                    <button className="btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--font-size-sm)' }} onClick={handleSignOut}>
                        Sign Out
                    </button>
                </div>
            </header>

            {/* ── Search Area ──────────────────────── */}
            <div className="dash-search-area">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search students by name, degree, course…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="filter-chips">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.icon} {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Results ──────────────────────────── */}
            <div className="dash-results">
                {loading && results.length === 0 ? (
                    <SkeletonCards />
                ) : results.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            {query.trim() ? '🔍' : '👋'}
                        </div>
                        <h3>
                            {query.trim()
                                ? 'No students found'
                                : 'Start searching'}
                        </h3>
                        <p>
                            {query.trim()
                                ? 'Try a different name, degree, or filter'
                                : 'Type a name or select a filter to browse Bocconiani'}
                        </p>
                    </div>
                ) : (
                    <>
                        <p className="results-count">
                            {results.length} student{results.length !== 1 ? 's' : ''} found
                            {filter !== 'all' && ` · Filtered by ${FILTERS.find((f) => f.key === filter)?.label}`}
                        </p>

                        <div className="results-grid">
                            {results.map((r) => (
                                <UserCard
                                    key={r.profile.id}
                                    profile={r.profile}
                                    experiences={r.experiences}
                                />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="load-more-wrapper">
                                <button
                                    className="btn-load-more"
                                    onClick={loadMore}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><span className="spinner" /> Loading…</>
                                    ) : (
                                        'Load more'
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}