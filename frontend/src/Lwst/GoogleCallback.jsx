import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function GoogleCallback({ setUser }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
            navigate('/login?error=' + error, { replace: true });
            return;
        }

        if (userParam) {
            try {
                const userData = JSON.parse(userParam);
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                navigate('/accueil', { replace: true });
            } catch {
                navigate('/login?error=google_parse_error', { replace: true });
            }
        } else {
            navigate('/login', { replace: true });
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Connexion avec Google en cours...</p>
            </div>
        </div>
    );
}

export default GoogleCallback;
