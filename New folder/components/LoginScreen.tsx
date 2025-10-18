import React, { useState, FormEvent } from 'react';
import Logo from './Logo';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('admin@example.com');
  const [password, setPassword] = useState<string>('111111');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock login logic
    setTimeout(() => {
      if (email === 'admin@example.com' && password) {
        const user: User = {
          id: 'local-admin-1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
        };
        onLoginSuccess(user);
      } else if (email && password) {
         const user: User = {
          id: 'local-employee-1',
          username: 'employee',
          email: email,
          role: 'employee',
        };
        onLoginSuccess(user);
      }
      else {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <Logo className="mx-auto mb-6" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 mb-4"
              placeholder="البريد الإلكتروني"
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="كلمة المرور"
            />
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'دخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;