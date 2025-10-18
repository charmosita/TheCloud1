import React, { useState, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLoginSuccess = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <main className="flex-grow">
        {currentUser ? (
          <Dashboard user={currentUser} onLogout={handleLogout} />
        ) : (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        جميع الحقوق محفوظة © احمد رعد الصالحي 2026
      </footer>
    </div>
  );
};

export default App;