'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createUserProfile } from '@/services/userService';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';

// Success Modal Component
function SuccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md mx-4">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 rounded-full p-3">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Account Created Successfully!</h3>
        <p className="text-gray-600 text-center mb-6">
          Your account has been created and you are now logged in.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, googleSignIn, facebookSignIn, twitterSignIn } = useAuth();

  // Check if email is already in use
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return;

    try {
      setIsCheckingEmail(true);
      const auth = getAuth();
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length > 0) {
        setEmailError('This email is already in use. Please try a different one or login.');
      } else {
        setEmailError('');
      }
    } catch (err) {
      return null;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Debounced email check
  useEffect(() => {
    if (email) {
      const timer = setTimeout(() => {
        checkEmailExists(email);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [email]);

  // Check if passwords match
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  }, [password, confirmPassword]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (emailError) {
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Register the user with Firebase
      const userCredential = await register(email, password);

      if (userCredential && userCredential.user) {
        // Create user profile with additional information
        await createUserProfile({
          id: userCredential.user.uid,
          email: userCredential.user.email || email,
          name: name
        });

        // Show success modal
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setError('Failed to create an account: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/');
  };

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setLoading(true);
      const userCredential = await googleSignIn();

      if (userCredential && userCredential.user) {
        // Create user profile with additional information
        await createUserProfile({
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || ''
        });

        // Show success modal
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      // Don't show error for user-closed popup
      if (!err.message?.includes('auth/popup-closed-by-user')) {
        setError('Failed to sign up with Google: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
    try {
      setError('');
      setLoading(true);
      const userCredential = await facebookSignIn();

      if (userCredential && userCredential.user) {
        // Create user profile with additional information
        await createUserProfile({
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || ''
        });

        // Show success modal
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      // Don't show error for user-closed popup
      if (!err.message?.includes('auth/popup-closed-by-user')) {
        setError('Failed to sign up with Facebook: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwitterSignUp = async () => {
    try {
      setError('');
      setLoading(true);
      const userCredential = await twitterSignIn();

      if (userCredential && userCredential.user) {
        // Create user profile with additional information
        await createUserProfile({
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || ''
        });

        // Show success modal
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      // Don't show error for user-closed popup
      if (!err.message?.includes('auth/popup-closed-by-user')) {
        setError('Failed to sign up with X: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${emailError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                />
                {isCheckingEmail && <p className="mt-1 text-sm text-gray-500">Checking email...</p>}
                {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${passwordError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                />
                {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-purple-600 hover:text-purple-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-purple-600 hover:text-purple-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !!emailError || !!passwordError}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or sign up with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                Sign up with Google
              </button>

              <button
                onClick={handleFacebookSignUp}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Sign up with Facebook
              </button>

              <button
                onClick={handleTwitterSignUp}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="#000000">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Sign up with X
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal isOpen={showSuccessModal} onClose={handleSuccessModalClose} />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white py-24 px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Loading...
          </h2>
          <div className="animate-pulse w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}