import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { vitalsAPI, medicationsAPI, alertsAPI } from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Download, AlertTriangle, Activity, Pill, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface HistoryAnalyticsProps {
  profile: any;
}

export function HistoryAnalytics({ profile }: HistoryAnalyticsProps) {
  const [vitals, setVitals] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vitalsRes, medsRes, logsRes, alertsRes] = await Promise.all([
        vitalsAPI.getHistory(),
        medicationsAPI.getList(),
        medicationsAPI.getLogs(),
        alertsAPI.getList(),
      ]);
      
      setVitals(vitalsRes.vitals || []);
      setMedications(medsRes.medications || []);
      setLogs(logsRes.logs || []);
      setAlerts(alertsRes.alerts || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    return vitals
      .slice()
      .reverse()
      .slice(-30) // Last 30 readings
      .map((vital) => ({
        date: new Date(vital.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        systolic: vital.systolic,
        diastolic: vital.diastolic,
        pulse: vital.pulse || 0,
      }));
  };

  const calculateAdherence = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentLogs = logs.filter(log => new Date(log.timestamp) >= last30Days);
    const takenLogs = recentLogs.filter(log => log.taken);
    
    if (recentLogs.length === 0) return 0;
    return Math.round((takenLogs.length / recentLogs.length) * 100);
  };

  const getBPTrend = () => {
    if (vitals.length < 5) return 'Insufficient data';
    
    const recent = vitals.slice(0, 5);
    const older = vitals.slice(5, 10);
    
    if (older.length === 0) return 'Building history...';
    
    const recentAvg = recent.reduce((sum, v) => sum + v.systolic, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v.systolic, 0) / older.length;
    
    if (recentAvg < olderAvg - 5) return 'Improving';
    if (recentAvg > olderAvg + 5) return 'Increasing';
    return 'Stable';
  };

  const handleExport = () => {
    // Create CSV content
    let csvContent = 'WellCare Companion - Health Report\n\n';
    csvContent += `Patient: ${profile.name}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csvContent += 'Blood Pressure History\n';
    csvContent += 'Date,Time,Systolic,Diastolic,Pulse,Notes\n';
    vitals.forEach(v => {
      const date = new Date(v.timestamp);
      csvContent += `${date.toLocaleDateString()},${date.toLocaleTimeString()},${v.systolic},${v.diastolic},${v.pulse || ''},${v.notes || ''}\n`;
    });
    
    csvContent += '\n\nMedication Log\n';
    csvContent += 'Date,Time,Medication,Status\n';
    logs.forEach(log => {
      const med = medications.find(m => m.id === log.medicationId);
      if (med) {
        const date = new Date(log.timestamp);
        csvContent += `${date.toLocaleDateString()},${date.toLocaleTimeString()},${med.name} ${med.dosage},${log.taken ? 'Taken' : 'Missed'}\n`;
      }
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wellcare-health-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Health report exported successfully');
  };

  const chartData = prepareChartData();
  const adherence = calculateAdherence();
  const trend = getBPTrend();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Health History & Analytics</h2>
          <p className="text-gray-600">Track your progress over time</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl">{vitals.length}</div>
              <div className="text-sm text-gray-500">BP Readings</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl">{trend}</div>
              <div className="text-sm text-gray-500">BP Trend</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Pill className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl">{adherence}%</div>
              <div className="text-sm text-gray-500">Adherence (30d)</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl">{alerts.length}</div>
              <div className="text-sm text-gray-500">Total Alerts</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="vitals">Vitals History</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blood Pressure Trends (Last 30 Readings)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
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
                <div className="text-center py-12 text-gray-400">
                  No data available yet. Start logging your blood pressure!
                </div>
              )}
            </CardContent>
          </Card>

          {chartData.some(d => d.pulse > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Pulse Rate Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData.filter(d => d.pulse > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[40, 120]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pulse" stroke="#10b981" name="Pulse (bpm)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Vitals History Tab */}
        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle>Blood Pressure History</CardTitle>
            </CardHeader>
            <CardContent>
              {vitals.length > 0 ? (
                <div className="space-y-2">
                  {vitals.map((vital) => {
                    const status = vital.systolic >= 140 || vital.diastolic >= 90 ? 'high' : 
                                 vital.systolic >= 130 || vital.diastolic >= 85 ? 'elevated' : 'normal';
                    return (
                      <div key={vital.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{vital.systolic}/{vital.diastolic} mmHg</span>
                            <Badge variant={status === 'high' ? 'destructive' : status === 'elevated' ? 'secondary' : 'default'}>
                              {status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(vital.timestamp).toLocaleString()}
                            {vital.pulse && ` • Pulse: ${vital.pulse} bpm`}
                          </div>
                          {vital.notes && (
                            <div className="text-sm text-gray-600 mt-1">{vital.notes}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">No vitals recorded yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle>Medication Adherence Log</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.map((log) => {
                    const med = medications.find(m => m.id === log.medicationId);
                    if (!med) return null;
                    
                    return (
                      <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${log.taken ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span>{med.name}</span>
                            <Badge variant="outline">{med.dosage}</Badge>
                            <Badge variant={log.taken ? 'default' : 'secondary'}>
                              {log.taken ? 'Taken' : 'Missed'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">No medication logs yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alerts History</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map((alert) => (
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
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">No alerts recorded</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
