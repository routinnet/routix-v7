import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface AuthPanelProps {
  onLogin?: (email: string, password: string) => void;
  onSignup?: (email: string, password: string, name: string) => void;
  onSocialLogin?: (provider: 'google' | 'github' | 'discord') => void;
  onForgotPassword?: (email: string) => void;
}

export function AuthPanel({
  onLogin,
  onSignup,
  onSocialLogin,
  onForgotPassword,
}: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      onLogin?.(email, password);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      onSignup?.(email, password, name);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      onForgotPassword?.(email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {mode === 'login' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-playfair font-bold text-center">Welcome Back</h2>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <button
            onClick={() => setMode('forgot')}
            className="text-sm text-blue-500 hover:underline"
          >
            Forgot password?
          </button>
          <div className="text-center text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => setMode('signup')}
              className="text-blue-500 hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>
      )}

      {mode === 'signup' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-playfair font-bold text-center">Create Account</h2>
          <Input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
          <Button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
          <div className="text-center text-sm">
            Already have an account?{' '}
            <button
              onClick={() => setMode('login')}
              className="text-blue-500 hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      )}

      {mode === 'forgot' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-playfair font-bold text-center">Reset Password</h2>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
          <Button
            onClick={handleForgotPassword}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <button
            onClick={() => setMode('login')}
            className="text-sm text-blue-500 hover:underline"
          >
            Back to login
          </button>
        </div>
      )}

      {/* Social Login */}
      <div className="mt-6 pt-6 border-t">
        <p className="text-center text-sm text-gray-600 mb-4">Or continue with</p>
        <div className="flex gap-2">
          <Button
            onClick={() => onSocialLogin?.('google')}
            variant="outline"
            className="flex-1"
          >
            Google
          </Button>
          <Button
            onClick={() => onSocialLogin?.('github')}
            variant="outline"
            className="flex-1"
          >
            GitHub
          </Button>
          <Button
            onClick={() => onSocialLogin?.('discord')}
            variant="outline"
            className="flex-1"
          >
            Discord
          </Button>
        </div>
      </div>
    </div>
  );
}
