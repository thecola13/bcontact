import type { Profile, Experience } from '../types/database.types';

interface UserCardProps {
    profile: Profile;
    experiences: Experience[];
}

// ── Helpers ──────────────────────────────────────────
function getInitials(p: Profile): string {
    const f = p.first_name?.[0] ?? '';
    const l = p.last_name?.[0] ?? '';
    return (f + l).toUpperCase() || '?';
}

function badgeLabel(exp: Experience): string {
    switch (exp.exp_type) {
        case 'degree':
            return exp.role ?? 'Degree';
        case 'course':
            return exp.organization ? `${exp.organization}${exp.code ? ` (${exp.code})` : ''}` : 'Course';
        case 'exchange':
            return exp.organization ? `📍 ${exp.organization}` : 'Exchange';
        default:
            return exp.exp_type;
    }
}

function badgeClass(exp: Experience): string {
    switch (exp.exp_type) {
        case 'degree': return 'badge-degree';
        case 'course': return 'badge-course';
        case 'exchange': return 'badge-exchange';
        default: return '';
    }
}

// ── Component ────────────────────────────────────────
export default function UserCard({ profile, experiences }: UserCardProps) {
    // Show at most 4 badges
    const visibleExps = experiences.slice(0, 4);
    const extraCount = experiences.length - visibleExps.length;

    return (
        <div className="user-card">
            <div className="user-card-header">
                {profile.avatar_url ? (
                    <img
                        className="user-card-avatar"
                        src={profile.avatar_url}
                        alt={`${profile.first_name} ${profile.last_name}`}
                    />
                ) : (
                    <div className="user-card-avatar-placeholder">
                        {getInitials(profile)}
                    </div>
                )}
                <div className="user-card-info">
                    <h3 className="user-card-name">
                        {profile.first_name} {profile.last_name}
                    </h3>
                    {profile.current_degree && (
                        <p className="user-card-degree">{profile.current_degree}</p>
                    )}
                </div>
            </div>

            {profile.bio && (
                <p className="user-card-bio">{profile.bio}</p>
            )}

            {visibleExps.length > 0 && (
                <div className="user-card-badges">
                    {visibleExps.map((exp) => (
                        <span key={exp.id} className={`user-badge ${badgeClass(exp)}`}>
                            {badgeLabel(exp)}
                        </span>
                    ))}
                    {extraCount > 0 && (
                        <span className="user-badge badge-more">+{extraCount}</span>
                    )}
                </div>
            )}
        </div>
    );
}
