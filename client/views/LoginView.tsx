import React, { useState } from 'react';
import { auth, googleProvider } from '../src/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        // Firebase automatically signs in after creation
        onLogin();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onLogin();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'linkedin') => {
    try {
      if (provider === 'google') {
        await signInWithPopup(auth, googleProvider);
        onLogin();
      } else {
        alert("LinkedIn sign-in is not configured yet. Please use Google.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col academic-pattern">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px] bg-white dark:bg-[#192233] rounded-xl shadow-2xl border border-gray-200 dark:border-[#324467] overflow-hidden">
          <div className="pt-10 pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <span className="material-symbols-outlined text-primary text-3xl">school</span>
              </div>
            </div>
            <h1 className="text-gray-900 dark:text-white tracking-light text-[32px] font-bold leading-tight px-4 text-center font-display">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-500 dark:text-[#92a4c9] text-base font-normal leading-normal pt-1 px-8 text-center">
              {isSignUp ? 'Join the academic community today.' : 'Enter your details to access your academic dashboard.'}
            </p>
          </div>

          <form className="px-8 pb-8 space-y-4" onSubmit={handleAuth}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="flex flex-col w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium leading-normal pb-2">Email Address</p>
                <input
                  className="form-input flex w-full min-w-0 rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-[#324467] bg-white dark:bg-[#111722] h-14 placeholder:text-gray-400 dark:placeholder:text-[#92a4c9] px-4 text-base font-normal"
                  placeholder="name@university.edu"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <label className="flex flex-col w-full">
                <div className="flex justify-between items-center pb-2">
                  <p className="text-gray-700 dark:text-white text-sm font-medium leading-normal">Password</p>
                  {!isSignUp && <a className="text-primary text-xs font-semibold hover:underline" href="#">Forgot?</a>}
                </div>
                <div className="relative flex w-full items-stretch">
                  <input
                    className="form-input flex w-full min-w-0 rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-[#324467] bg-white dark:bg-[#111722] h-14 placeholder:text-gray-400 dark:placeholder:text-[#92a4c9] px-4 text-base font-normal"
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#92a4c9] hover:text-primary transition-colors" type="button">
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </label>
            </div>
            <div className="pt-4">
              <button
                className="w-full flex cursor-pointer items-center justify-center rounded-lg h-14 px-4 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </div>
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-200 dark:border-[#324467]"></div>
              <span className="flex-shrink mx-4 text-gray-400 dark:text-[#92a4c9] text-xs font-medium uppercase tracking-wider">or continue with</span>
              <div className="flex-grow border-t border-gray-200 dark:border-[#324467]"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-2 rounded-lg h-12 px-4 border border-gray-300 dark:border-[#324467] bg-white dark:bg-[#111722] text-gray-700 dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-primary/10 transition-colors"
                type="button"
              >
                <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN9HEzOWJ6SAeEzDsPEkpeA-BOqLl2ZMA3NSuc42PzJznyoZPbLFqjVINqPsmwXTk4dkzXa_Oj15_0i-Q1Ml9XGYUoPOg32muNwxVw2PWkPOSm146wW5AOyVmzc1O21LvlKGoV-YG3dVvt-qvZpnuhl3PjLxh24CNZjC-5v03veM9Wcjb2kAarqPl8dYTojkydTDNIWiDVbOTahqkZhD0jWnecVgkZGCDELJFYSSRIgzcXw0xe_IsFe4imuiM7qsguDaQJdxOBGawa" />
                <span>Google</span>
              </button>
              <button
                onClick={() => handleOAuth('linkedin')}
                className="flex items-center justify-center gap-2 rounded-lg h-12 px-4 border border-gray-300 dark:border-[#324467] bg-white dark:bg-[#111722] text-gray-700 dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-primary/10 transition-colors"
                type="button"
              >
                <svg className="w-5 h-5 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
                <span>LinkedIn</span>
              </button>
            </div>
            <div className="pt-6 text-center">
              <p className="text-gray-500 dark:text-[#92a4c9] text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary font-bold hover:underline ml-1"
                >
                  {isSignUp ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </main>
      <footer className="py-8 px-4 flex flex-col items-center gap-4 text-gray-400 dark:text-[#92a4c9] text-xs">
        <div className="flex gap-6">
          <a className="hover:text-primary" href="#">Privacy Policy</a>
          <a className="hover:text-primary" href="#">Terms of Service</a>
          <a className="hover:text-primary" href="#">Help Center</a>
        </div>
        <p>© 2024 Academic Jobs Inc. Empowering research & education.</p>
      </footer>
    </div>
  );
};

export default LoginView;
