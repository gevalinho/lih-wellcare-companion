import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { medicationsAPI } from '../../utils/api';
import { Pill, Plus, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface MedicationTrackerProps {
  onUpdate: () => void;
}

export function MedicationTracker({ onUpdate }: MedicationTrackerProps) {
  const [medications, setMedications] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    schedule: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [medsResponse, logsResponse] = await Promise.all([
        medicationsAPI.getList(),
        medicationsAPI.getLogs(),
      ]);
      setMedications(medsResponse.medications || []);
      setLogs(logsResponse.logs || []);
    } catch (error: any) {
      console.error('Error loading medications:', error);
      toast.error('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMed.name || !newMed.dosage) {
      toast.error('Name and dosage are required');
      return;
    }

    try {
      await medicationsAPI.add(newMed);
      toast.success('Medication added successfully');
      setNewMed({ name: '', dosage: '', schedule: '', notes: '' });
      setDialogOpen(false);
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error('Error adding medication:', error);
      toast.error(error.message || 'Failed to add medication');
    }
  };

  const handleLogDose = async (medicationId: string, taken: boolean = true) => {
    try {
      await medicationsAPI.logDose({
        medicationId,
        taken,
        timestamp: new Date().toISOString(),
      });
      toast.success(taken ? 'Dose logged' : 'Dose marked as missed');
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error('Error logging dose:', error);
      toast.error('Failed to log dose');
    }
  };

  const getLastLog = (medId: string) => {
    const medLogs = logs.filter(log => log.medicationId === medId);
    if (medLogs.length === 0) return null;
    return medLogs[0]; // Logs are sorted by timestamp descending
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    return date.toLocaleDateString();
  };

  const activeMedications = medications.filter(m => m.active);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Medication Tracker</h2>
          <p className="text-gray-600">Manage and log your medications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMedication} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medName">Medication Name *</Label>
                <Input
                  id="medName"
                  placeholder="e.g., Lisinopril"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  placeholder="e.g., 10mg"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Input
                  id="schedule"
                  placeholder="e.g., Once daily with breakfast"
                  value={newMed.schedule}
                  onChange={(e) => setNewMed({ ...newMed, schedule: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medNotes">Notes</Label>
                <Textarea
                  id="medNotes"
                  placeholder="Additional information..."
                  value={newMed.notes}
                  onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">Add Medication</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Medications List */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-8 text-gray-400">
            Loading medications...
          </CardContent>
        </Card>
      ) : activeMedications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No medications added yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMedications.map((med) => {
            const lastLog = getLastLog(med.id);
            return (
              <Card key={med.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-lg">{med.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{med.dosage}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {med.schedule && (
                    <div className="text-sm text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {med.schedule}
                    </div>
                  )}
                  
                  {med.notes && (
                    <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                      {med.notes}
                    </div>
                  )}

                  {lastLog && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Last logged: {formatDate(lastLog.timestamp)}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => handleLogDose(med.id, true)}
                      className="flex-1"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Taken
                    </Button>
                    <Button 
                      onClick={() => handleLogDose(med.id, false)}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      Missed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Medication Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.slice(0, 10).map((log) => {
                const med = medications.find(m => m.id === log.medicationId);
                if (!med) return null;
                
                return (
                  <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${log.taken ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="flex-1">
                      <div className="text-sm">{med.name} - {med.dosage}</div>
                      <div className="text-xs text-gray-500">
                        {log.taken ? 'Taken' : 'Missed'} • {formatDate(log.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
