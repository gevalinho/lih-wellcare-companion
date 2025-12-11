import { useState } from 'react';
import { Button } from '../ui/button';
import { PatientHome } from './PatientHome';
import { VitalsLogger } from './VitalsLogger';
import { MedicationTracker } from './MedicationTracker';
import { HistoryAnalytics } from './HistoryAnalytics';
import { ConsentManager } from './ConsentManager';
import { HealthTips } from './HealthTips';
import { Heart, Activity, Pill, TrendingUp, Users, BookOpen, Settings, LogOut } from 'lucide-react';
import { authAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';

interface PatientDashboardProps {
  profile: any;
  onLogout: () => void;
}

export function PatientDashboard({ profile, onLogout }: PatientDashboardProps) {
  const [activeView, setActiveView] = useState('home');

  const handleLogout = async () => {
    try {
      await authAPI.signout();
      toast.success('Logged out successfully');
      onLogout();
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: Heart },
    { id: 'vitals', label: 'Log Vitals', icon: Activity },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'history', label: 'History', icon: TrendingUp },
    { id: 'consent', label: 'Data Sharing', icon: Users },
    { id: 'health-tips', label: 'Health Tips', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl">WellCare Companion</h1>
                <p className="text-sm text-gray-600">Patient Portal</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeView === item.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeView === 'home' && (
              <PatientHome profile={profile} onNavigate={setActiveView} />
            )}
            {activeView === 'vitals' && (
              <VitalsLogger onSuccess={() => {
                toast.success('Vital signs recorded');
                setActiveView('home');
              }} />
            )}
            {activeView === 'medications' && (
              <MedicationTracker onUpdate={() => {}} />
            )}
            {activeView === 'history' && (
              <HistoryAnalytics profile={profile} />
            )}
            {activeView === 'consent' && (
              <ConsentManager profile={profile} />
            )}
            {activeView === 'health-tips' && (
              <HealthTips />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
