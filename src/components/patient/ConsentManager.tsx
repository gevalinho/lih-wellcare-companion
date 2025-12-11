import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { consentAPI } from '../../utils/api';
import { Users, Plus, Trash2, Shield, UserCheck } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ConsentManagerProps {
  profile: any;
}

export function ConsentManager({ profile }: ConsentManagerProps) {
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newConsent, setNewConsent] = useState({
    granteeEmail: '',
    accessLevel: 'view',
  });

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      setLoading(true);
      const response = await consentAPI.getGranted();
      setConsents(response.consents || []);
    } catch (error: any) {
      console.error('Error loading consents:', error);
      toast.error('Failed to load data sharing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newConsent.granteeEmail) {
      toast.error('Email is required');
      return;
    }

    if (newConsent.granteeEmail === profile.email) {
      toast.error('You cannot grant access to yourself');
      return;
    }

    try {
      await consentAPI.grant(newConsent.granteeEmail, newConsent.accessLevel);
      toast.success('Access granted successfully');
      setNewConsent({ granteeEmail: '', accessLevel: 'view' });
      setDialogOpen(false);
      loadConsents();
    } catch (error: any) {
      console.error('Error granting access:', error);
      toast.error(error.message || 'Failed to grant access. Make sure the email is registered.');
    }
  };

  const handleRevokeAccess = async (granteeEmail: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${granteeEmail}?`)) {
      return;
    }

    try {
      await consentAPI.revoke(granteeEmail);
      toast.success('Access revoked successfully');
      loadConsents();
    } catch (error: any) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl mb-1">Data Sharing & Privacy</h2>
        <p className="text-gray-600">Manage who can access your health data</p>
      </div>

      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="w-5 h-5" />
            Your Privacy is Protected
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900">
          <ul className="space-y-2">
            <li>• Your health data is encrypted and securely stored</li>
            <li>• Only people you explicitly grant access can view your data</li>
            <li>• You can revoke access at any time</li>
            <li>• All data access is logged for transparency</li>
          </ul>
        </CardContent>
      </Card>

      {/* Grant Access Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Shared Access
              </CardTitle>
              <CardDescription>
                People who can view your health data
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Grant Access
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Grant Access to Your Health Data</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGrantAccess} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="granteeEmail">Email Address *</Label>
                    <Input
                      id="granteeEmail"
                      type="email"
                      placeholder="doctor@example.com"
                      value={newConsent.granteeEmail}
                      onChange={(e) => setNewConsent({ ...newConsent, granteeEmail: e.target.value })}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Enter the email address of your caregiver or doctor (they must be registered in WellCare)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Access Level *</Label>
                    <RadioGroup 
                      value={newConsent.accessLevel} 
                      onValueChange={(value) => setNewConsent({ ...newConsent, accessLevel: value })}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="view" id="view" />
                        <Label htmlFor="view" className="flex-1 cursor-pointer">
                          <div>
                            <div>View Only</div>
                            <div className="text-sm text-gray-500">Can view your vitals, medications, and alerts</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="flex-1 cursor-pointer">
                          <div>
                            <div>Full Access</div>
                            <div className="text-sm text-gray-500">Can view all data and receive alerts</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" className="w-full">Grant Access</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : consents.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No shared access granted yet</p>
              <p className="text-sm text-gray-400">
                Grant access to your caregiver or doctor so they can help monitor your health
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {consents.map((consent) => (
                <div key={consent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{consent.granteeEmail}</div>
                      <div className="text-sm text-gray-500">
                        Granted on {formatDate(consent.grantedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={consent.accessLevel === 'full' ? 'default' : 'secondary'}>
                      {consent.accessLevel === 'full' ? 'Full Access' : 'View Only'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeAccess(consent.granteeEmail)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Export & Deletion */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or delete your health data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">Export Your Data</div>
              <div className="text-sm text-gray-500">Download all your health records as CSV</div>
            </div>
            <Button variant="outline">Export</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
            <div>
              <div className="font-medium text-red-900">Delete All Data</div>
              <div className="text-sm text-red-700">Permanently delete your health records</div>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
