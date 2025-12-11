import { useEffect, useState } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { authAPI } from './utils/api';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await authAPI.getSession();
      if (session) {
        const { profile } = await authAPI.getProfile();
        setUserProfile(profile);
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState('unauthenticated');
    }
  };

  const handleLoginSuccess = async () => {
    await checkAuth();
  };

  const handleLogout = () => {
    setUserProfile(null);
    setAuthState('unauthenticated');
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WellCare Companion...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <>
        {authView === 'login' ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignup={() => setAuthView('signup')}
          />
        ) : (
          <SignupPage
            onSignupSuccess={handleLoginSuccess}
            onNavigateToLogin={() => setAuthView('login')}
          />
        )}
        <Toaster />
      </>
    );
  }

  // Render appropriate dashboard based on user role
  return (
    <>
      {userProfile?.role === 'patient' && (
        <PatientDashboard profile={userProfile} onLogout={handleLogout} />
      )}
      {userProfile?.role === 'caregiver' && (
        <CaregiverDashboard profile={userProfile} onLogout={handleLogout} />
      )}
      {userProfile?.role === 'doctor' && (
        <DoctorDashboard profile={userProfile} onLogout={handleLogout} />
      )}
      <Toaster />
    </>
  );
}
