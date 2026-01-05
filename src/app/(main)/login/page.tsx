"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const router = useRouter();
  const { currentUser, signInWithGoogle, signInWithEmail, registerWithEmail } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const validatePassword = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 6) return 'weak';
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 'strong';
    return 'medium';
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    if (isRegistering && pwd) {
      setPasswordStrength(validatePassword(pwd));
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name) throw new Error('Name is required');
        if (!email) throw new Error('Email is required');
        if (!password) throw new Error('Password is required');
        if (password !== confirmPassword) throw new Error('Passwords do not match');

        await registerWithEmail(email, password, name);
        router.push('/');
      } else {
        if (!identifier) throw new Error('Email is required');
        if (!password) throw new Error('Password is required');

        await signInWithEmail(identifier, password);
        router.push('/');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return '';
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
    }
  };

  const getPasswordStrengthWidth = () => {
    if (!passwordStrength) return '0%';
    switch (passwordStrength) {
      case 'weak': return '33%';
      case 'medium': return '66%';
      case 'strong': return '100%';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isRegistering ? 'Join WNC Times community' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!isRegistering && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {password && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: getPasswordStrengthWidth() }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Password strength: <span className="font-medium capitalize">{passwordStrength}</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {password && confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle size={14} /> Passwords match
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                  Forgot password?
                </Link>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {isRegistering ? (
              <>Already have an account? <span className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">Sign In</span></>
            ) : (
              <>Don&apos;t have an account? <span className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">Sign Up</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
