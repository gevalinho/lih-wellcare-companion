import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { consentAPI, vitalsAPI, medicationsAPI, alertsAPI, notificationsAPI } from '../../utils/api';
import { Heart, Users, LogOut, Bell, Activity, Pill, AlertTriangle, TrendingUp } from 'lucide-react';
import { authAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CaregiverDashboardProps {
  profile: any;
  onLogout: () => void;
}

export function CaregiverDashboard({ profile, onLogout }: CaregiverDashboardProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientVitals, setPatientVitals] = useState<any[]>([]);
  const [patientMeds, setPatientMeds] = useState<any[]>([]);
  const [patientAlerts, setPatientAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
    loadNotifications();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientData(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      const response = await consentAPI.getPatients();
      setPatients(response.patients || []);
      if (response.patients && response.patients.length > 0) {
        setSelectedPatient(response.patients[0]);
      }
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patient list');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientData = async (patientId: string) => {
    try {
      const [vitalsRes, medsRes, alertsRes] = await Promise.all([
        vitalsAPI.getHistory(patientId),
        medicationsAPI.getList(patientId),
        alertsAPI.getList(patientId),
      ]);
      
      setPatientVitals(vitalsRes.vitals || []);
      setPatientMeds(medsRes.medications || []);
      setPatientAlerts(alertsRes.alerts || []);
    } catch (error: any) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient data');
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getList();
      setNotifications(response.notifications || []);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const prepareChartData = () => {
    return patientVitals
      .slice()
      .reverse()
      .slice(-20)
      .map((vital) => ({
        date: new Date(vital.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        systolic: vital.systolic,
        diastolic: vital.diastolic,
      }));
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl">WellCare Companion</h1>
                <p className="text-sm text-gray-600">Caregiver Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4" />
                  {unreadNotifications.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </Button>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-2xl mb-1">Welcome, {profile.name}</h2>
          <p className="text-gray-600">Monitor and support your patients' health</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="text-center py-12 text-gray-400">
              Loading...
            </CardContent>
          </Card>
        ) : patients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No Patients Yet</h3>
              <p className="text-gray-500 mb-4">
                You don't have access to any patient data yet.
              </p>
              <p className="text-sm text-gray-400">
                Patients can grant you access by adding your email address ({profile.email}) in their Data Sharing settings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Patient List Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">My Patients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedPatient?.id === patient.id
                          ? 'bg-purple-100 border-2 border-purple-300'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-xs text-gray-500">
                        {patient.age && `${patient.age} years`}
                        {patient.conditions && ` • ${patient.conditions.split(',')[0]}`}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {patient.accessLevel === 'full' ? 'Full Access' : 'View Only'}
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Notifications */}
              {unreadNotifications.length > 0 && (
                <Card className="mt-4 border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-orange-900">
                      <Bell className="w-4 h-4" />
                      Notifications ({unreadNotifications.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {unreadNotifications.slice(0, 5).map((notif) => (
                      <div key={notif.id} className="p-2 bg-white rounded text-sm">
                        <div>{notif.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(notif.timestamp)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Patient Details */}
            {selectedPatient && (
              <div className="lg:col-span-3 space-y-6">
                {/* Patient Header */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl mb-1">{selectedPatient.name}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          {selectedPatient.age && <div>Age: {selectedPatient.age}</div>}
                          {selectedPatient.sex && <div>Sex: {selectedPatient.sex}</div>}
                          {selectedPatient.conditions && (
                            <div>Conditions: {selectedPatient.conditions}</div>
                          )}
                          {selectedPatient.emergencyContact && (
                            <div>Emergency Contact: {selectedPatient.emergencyContact} ({selectedPatient.emergencyPhone})</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Activity className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <div className="text-2xl">{patientVitals.length}</div>
                        <div className="text-sm text-gray-500">BP Readings</div>
                        {patientVitals[0] && (
                          <div className="text-xs text-gray-400 mt-1">
                            Latest: {patientVitals[0].systolic}/{patientVitals[0].diastolic}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Pill className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl">{patientMeds.filter(m => m.active).length}</div>
                        <div className="text-sm text-gray-500">Active Medications</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <div className="text-2xl">{patientAlerts.filter(a => !a.read).length}</div>
                        <div className="text-sm text-gray-500">Active Alerts</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs for Different Views */}
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    {/* BP Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Blood Pressure Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {prepareChartData().length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={prepareChartData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis domain={[40, 200]} />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic" strokeWidth={2} />
                              <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolic" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center py-12 text-gray-400">No data available</div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {patientVitals.slice(0, 5).map((vital) => (
                          <div key={vital.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Activity className="w-5 h-5 text-red-500" />
                            <div className="flex-1">
                              <div className="text-sm">BP: {vital.systolic}/{vital.diastolic} mmHg</div>
                              <div className="text-xs text-gray-500">{formatDate(vital.timestamp)}</div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="vitals">
                    <Card>
                      <CardHeader>
                        <CardTitle>Vital Signs History</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {patientVitals.map((vital) => (
                          <div key={vital.id} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{vital.systolic}/{vital.diastolic} mmHg</span>
                              {(vital.systolic >= 140 || vital.diastolic >= 90) && (
                                <Badge variant="destructive">High</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {formatDate(vital.timestamp)}
                              {vital.pulse && ` • Pulse: ${vital.pulse} bpm`}
                            </div>
                            {vital.notes && (
                              <div className="text-sm text-gray-600 mt-2">{vital.notes}</div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="medications">
                    <Card>
                      <CardHeader>
                        <CardTitle>Medications List</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {patientMeds.filter(m => m.active).map((med) => (
                          <div key={med.id} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{med.name}</span>
                              <Badge variant="outline">{med.dosage}</Badge>
                            </div>
                            {med.schedule && (
                              <div className="text-sm text-gray-600 mt-1">Schedule: {med.schedule}</div>
                            )}
                            {med.notes && (
                              <div className="text-sm text-gray-500 mt-1">{med.notes}</div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="alerts">
                    <Card>
                      <CardHeader>
                        <CardTitle>Alerts & Warnings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {patientAlerts.map((alert) => (
                          <div key={alert.id} className={`p-4 rounded-lg border-2 ${
                            alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                          }`}>
                            <div className="flex items-start gap-3">
                              <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                                alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                              }`} />
                              <div className="flex-1">
                                <div className="font-medium">{alert.message}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {formatDate(alert.timestamp)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
