import React, { useState } from 'react';
import { View } from './types';
import LoginView from './views/LoginView';
import OnboardingView from './views/OnboardingView';
import DiscoverView from './views/DiscoverView';
import SettingsView from './views/SettingsView';
import ApplicationsView from './views/ApplicationsView';
import TrackerView from './views/TrackerView';
import CVBuilderView from './views/CVBuilderView';
import TopNav from './components/TopNav';
import ErrorBoundary from './components/ErrorBoundary';

import { auth } from './src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { settingsService } from './services/settingsService';
import { aiService, AIProvider } from './services/aiService';

const App: React.FC = () => {
  // Initialize from localStorage or default to LOGIN
  const [currentView, setCurrentView] = useState<View>(() => {
    const saved = localStorage.getItem('currentView');
    return (saved as View) || View.LOGIN;
  });
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSession(user);
      if (user) {
        // Global Settings Sync
        settingsService.subscribeSettings(user.uid, (settings) => {
          if (settings && settings.aiConfig) {
            aiService.setConfig({
              provider: (settings.aiConfig.provider as AIProvider) || 'gemini',
              apiKey: settings.aiConfig.apiKey,
              baseUrl: settings.aiConfig.baseUrl,
              model: settings.aiConfig.model
            });
          }
        });

        // If we have a saved view, keep it, otherwise go to Discover
        const saved = localStorage.getItem('currentView') as View;
        if (!saved || saved === View.LOGIN) {
          setCurrentView(View.DISCOVER);
        }
      } else {
        setCurrentView(View.LOGIN);
        localStorage.removeItem('currentView'); // Clear on logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const navigate = (view: View) => {
    setCurrentView(view);
    localStorage.setItem('currentView', view);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-500 dark:text-slate-400">Loading...</div>;

    if (!session) {
      return <LoginView onLogin={() => {/* handled by auth state change */ }} />;
    }

    switch (currentView) {
      case View.LOGIN:
        return <LoginView onLogin={() => { }} />;
      case View.ONBOARDING:
        return <OnboardingView navigate={navigate} />;
      case View.DISCOVER:
        return <DiscoverView navigate={navigate} />;
      case View.SETTINGS:
        return <SettingsView navigate={navigate} />;
      case View.APPLICATIONS:
        return <ApplicationsView navigate={navigate} />;
      case View.TRACKER:
        return <TrackerView navigate={navigate} />;
      case View.CV_BUILDER:
        return <CVBuilderView navigate={navigate} />;
      default:
        return <DiscoverView navigate={navigate} />;
    }
  };

  const isAuthView = session && currentView !== View.LOGIN && currentView !== View.ONBOARDING;

  return (
    <div className="h-screen flex flex-col bg-[#0f1115] overflow-hidden">
      <ErrorBoundary>
        {isAuthView && <TopNav currentView={currentView} navigate={navigate} />}
        {renderView()}
      </ErrorBoundary>
    </div>
  );
};

export default App;
