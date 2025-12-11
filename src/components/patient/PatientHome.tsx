import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { vitalsAPI, medicationsAPI, alertsAPI } from '../../utils/api';
import { Activity, Heart, Pill, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface PatientHomeProps {
  profile: any;
  onNavigate: (view: string) => void;
}

export function PatientHome({ profile, onNavigate }: PatientHomeProps) {
  const [latestVital, setLatestVital] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load latest vital
      const vitalsResponse = await vitalsAPI.getHistory();
      if (vitalsResponse.vitals && vitalsResponse.vitals.length > 0) {
        setLatestVital(vitalsResponse.vitals[0]);
      }

      // Load medications
      const medsResponse = await medicationsAPI.getList();
      setMedications(medsResponse.medications || []);

      // Load alerts
      const alertsResponse = await alertsAPI.getList();
      const unreadAlerts = (alertsResponse.alerts || []).filter((a: any) => !a.read);
      setAlerts(unreadAlerts);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBPStatus = (systolic: number, diastolic: number) => {
    if (systolic >= 140 || diastolic >= 90) return { status: 'High', color: 'red' };
    if (systolic >= 130 || diastolic >= 85) return { status: 'Elevated', color: 'yellow' };
    return { status: 'Normal', color: 'green' };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl mb-2">Welcome back, {profile.name}</h1>
        <p className="text-sm sm:text-base text-gray-600">Here's your health summary for today</p>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 sm:p-6 pt-0 sm:pt-0">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm break-words">{alert.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatDate(alert.timestamp)}</div>
                </div>
              </div>
            ))}
            {alerts.length > 3 && (
              <Button variant="link" onClick={() => onNavigate('alerts')} className="w-full">
                View all {alerts.length} alerts
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Latest BP Reading */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0" />
              <span className="truncate">Latest Blood Pressure</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {latestVital ? (
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl">
                  {latestVital.systolic}/{latestVital.diastolic}
                  <span className="text-sm sm:text-base text-gray-500 ml-2">mmHg</span>
                </div>
                {latestVital.pulse && (
                  <div className="text-xs sm:text-sm text-gray-600">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                    Pulse: {latestVital.pulse} bpm
                  </div>
                )}
                <div className="text-xs text-gray-500 truncate">{formatDate(latestVital.timestamp)}</div>
                <Badge 
                  variant={getBPStatus(latestVital.systolic, latestVital.diastolic).color === 'green' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {getBPStatus(latestVital.systolic, latestVital.diastolic).status}
                </Badge>
              </div>
            ) : (
              <div className="text-gray-400 py-4 text-sm">No readings yet</div>
            )}
          </CardContent>
        </Card>

        {/* Active Medications */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
              <span className="truncate">Active Medications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-2">
              <div className="text-2xl sm:text-3xl">{medications.filter(m => m.active).length}</div>
              {medications.filter(m => m.active).slice(0, 2).map((med) => (
                <div key={med.id} className="text-xs sm:text-sm">
                  <div className="truncate">{med.name}</div>
                  <div className="text-xs text-gray-500 truncate">{med.dosage}</div>
                </div>
              ))}
              {medications.length === 0 && (
                <div className="text-gray-400 py-4 text-sm">No medications added</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-blue-50 to-green-50 transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
            <CardTitle className="text-sm sm:text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 sm:p-6 pt-0 sm:pt-0">
            <Button onClick={() => onNavigate('vitals')} className="w-full h-auto py-2.5 sm:py-2" size="sm">
              <Activity className="w-4 h-4 mr-2 shrink-0" />
              <span className="text-sm">Log BP Reading</span>
            </Button>
            <Button onClick={() => onNavigate('medications')} variant="outline" className="w-full h-auto py-2.5 sm:py-2" size="sm">
              <Pill className="w-4 h-4 mr-2 shrink-0" />
              <span className="text-sm">Log Medication</span>
            </Button>
            <Button onClick={() => onNavigate('history')} variant="outline" className="w-full h-auto py-2.5 sm:py-2" size="sm">
              <TrendingUp className="w-4 h-4 mr-2 shrink-0" />
              <span className="text-sm">View History</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-5 h-5 shrink-0" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="space-y-3">
              {latestVital && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Heart className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm break-words">Blood pressure recorded: {latestVital.systolic}/{latestVital.diastolic} mmHg</div>
                    <div className="text-xs text-gray-500 truncate">{formatDate(latestVital.timestamp)}</div>
                  </div>
                </div>
              )}
              {!latestVital && medications.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No activity yet. Start by logging your first blood pressure reading!
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}