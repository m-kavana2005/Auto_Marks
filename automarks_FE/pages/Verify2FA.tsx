import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { endpoints } from '../api/client';
import { useAuth } from '../context/AuthContext';

const Verify2FA = () => {
  const [code, setCode] = useState('');
  const [setupData, setSetupData] = useState<{ qr_code_base64: string; secret: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const email = location.state?.email;
  const requiresSetup = location.state?.requiresSetup;

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }

    if (requiresSetup && !setupData) {
      setIsLoading(true);
      endpoints.adminSetup2FA(email)
        .then(setSetupData)
        .catch(err => setError(err.message || 'Failed to initialize 2FA setup.'))
        .finally(() => setIsLoading(false));
    }
  }, [email, requiresSetup, navigate, setupData]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await endpoints.adminVerify2FA(email, code);
      login(res.access_token, res.role, email);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid authenticator code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-8 font-bold transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </button>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={32} />
            </div>
          </div>

          <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2">Two-Factor Authentication</h2>
          <p className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">
            {requiresSetup 
              ? "Scan the QR code below with your Authenticator app" 
              : `Enter the 6-digit code from your app for ${email}`}
          </p>

          {requiresSetup && setupData && (
            <div className="mb-8 flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-500">
              <img 
                src={`data:image/png;base64,${setupData.qr_code_base64}`} 
                alt="2FA QR Code" 
                className="w-48 h-48 rounded-xl shadow-lg mb-4"
              />
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Manual Entry Secret</div>
              <code className="text-xs font-mono font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                {setupData.secret}
              </code>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Authenticator Code</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <KeyRound size={20} />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-black text-2xl tracking-[0.5em] text-slate-900 dark:text-white"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold text-center animate-in shake duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Verify Administrator
                  <ShieldCheck size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            This verification is required for all administrative actions including batch result processing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Verify2FA;
