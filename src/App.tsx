/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Collection } from './components/Collection';
import { GameNight } from './components/GameNight';
import { Profile } from './components/Profile';
import { HomeSetup } from './components/HomeSetup';
import { Landing } from './components/Landing';

function Main() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="animate-pulse text-stone-400 font-serif italic text-2xl">Meeple Home...</div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  if (!profile?.activeHomeId) {
    return <HomeSetup />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Navbar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {currentView === 'dashboard' && <Dashboard setView={setCurrentView} />}
          {currentView === 'collection' && <Collection />}
          {currentView === 'gamenight' && <GameNight />}
          {currentView === 'households' && <HomeSetup />}
          {currentView === 'profile' && <Profile />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}
