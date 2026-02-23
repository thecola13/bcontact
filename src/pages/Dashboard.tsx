import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    };

    return (
        <div className="page-center">
            <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
                <div className="text-center">
                    <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-sm)' }}>
                        Dashboard
                    </h1>
                    <p>
                        Signed in as{' '}
                        <strong className="text-accent">{user?.email}</strong>
                    </p>
                    <button
                        onClick={handleSignOut}
                        className="btn-ghost"
                        style={{ marginTop: 'var(--space-xl)', width: '100%' }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}