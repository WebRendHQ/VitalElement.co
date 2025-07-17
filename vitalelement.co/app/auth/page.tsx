'use client';

import React, { useState, FormEvent, Suspense, useEffect } from 'react';
import { auth } from '../lib/firebase-client';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './auth.module.scss';

interface FormData {
  email: string;
  password: string;
}

interface AuthFormProps {
  onSubmit: (redirectPath: string) => Promise<void>;
  isSignUp: boolean;
  setIsSignUp?: (value: boolean) => void;
  isLoading: boolean;
  error: string;
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  redirectPath: string;
}

function AuthForm({ 
  onSubmit, 
  isSignUp,
  isLoading, 
  error, 
  formData, 
  handleInputChange,
  redirectPath
}: AuthFormProps): React.ReactElement {
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    await onSubmit(redirectPath);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <div>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={styles.input}
            placeholder="m@example.com"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            className={styles.input}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={styles.button}
      >
        {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
      </button>

      {/* Commenting out social login buttons for now
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-black text-gray-500">Or</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="w-full py-2 px-4 border border-gray-700 rounded-md flex items-center justify-center space-x-2 text-white hover:bg-gray-900"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          <span>Continue with Apple</span>
        </button>

        <button
          type="button"
          className="w-full py-2 px-4 border border-gray-700 rounded-md flex items-center justify-center space-x-2 text-white hover:bg-gray-900"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
      */}

      <p className={styles.footer}>
        By clicking continue, you agree to our{' '}
        <a href="#" className={styles.link}>Terms of Service</a> and{' '}
        <a href="#" className={styles.link}>Privacy Policy</a>
      </p>
    </form>
  );
}

// Client component that uses useSearchParams
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectPath, setRedirectPath] = useState<string>('/');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get the redirect path from URL parameters
  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectPath(redirect);
    }

    // Check if signup parameter is present
    const signupParam = searchParams.get('signup');
    if (signupParam === 'true') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleFormSubmit = async (redirectTo: string): Promise<void> => {
    setError('');
    setIsLoading(true);

    try {
      const { email, password } = formData;
      const authFunction = isSignUp ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      const userCredential = await authFunction(auth, email, password);

      const idToken = await userCredential.user.getIdToken();

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      setFormData({ email: '', password: '' });
      router.push(redirectTo);
      router.refresh();

    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (authError.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (authError.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.header}>
        <h2>Welcome to Vital Element.</h2>
        <p>
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setIsSignUp(false)}
                className={styles.switchMode}
              >
                Login
              </button>
            </>
          ) : (
            <>
              Do not have an account?{' '}
              <button
                onClick={() => setIsSignUp(true)}
                className={styles.switchMode}
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>

      <AuthForm 
        onSubmit={handleFormSubmit}
        isSignUp={isSignUp}
        isLoading={isLoading}
        error={error}
        formData={formData}
        handleInputChange={handleInputChange}
        redirectPath={redirectPath}
      />
    </div>
  );
}

export default function AuthPage(): React.ReactElement {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
        <AuthContent />
      </Suspense>
    </div>
  );
}