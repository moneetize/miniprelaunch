import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { consumeOAuthNextPath, handleOAuthCallback } from '../services/authService';
import { completeScratchTeaserFlow } from '../utils/flowManager';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const completeOAuth = async () => {
      const result = await handleOAuthCallback();

      if (cancelled) return;

      if (!result.success) {
        setError(result.error || 'Unable to complete social sign-in.');
        return;
      }

      const nextPath = consumeOAuthNextPath();
      const fallbackPath = nextPath || '/profile-screen';

      if (fallbackPath === '/profile-screen') {
        completeScratchTeaserFlow();
      }

      navigate(fallbackPath, { replace: true });
    };

    void completeOAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        {error ? (
          <>
            <h1 className="text-2xl font-bold mb-3">Sign-in needs attention</h1>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full rounded-full bg-white px-5 py-3 font-semibold text-black"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <h1 className="text-2xl font-bold mb-3">Completing secure sign-in</h1>
            <p className="text-white/70">We are connecting your Moneetize account now.</p>
          </>
        )}
      </div>
    </div>
  );
}
