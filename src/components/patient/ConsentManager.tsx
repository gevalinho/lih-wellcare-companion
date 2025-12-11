import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
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

  const handleGrantAccess = async () => {
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
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="px-4 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-1">Data Sharing & Privacy</h2>
        <p className="text-sm sm:text-base text-gray-600">Manage who can access your health data</p>
      </div>

      {/* Privacy Notice */}
      <div className="px-4 sm:px-0">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-base sm:text-lg">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              Your Privacy is Protected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-blue-900">
            <ul className="space-y-1.5 sm:space-y-2">
              <li>• Your health data is encrypted and securely stored</li>
              <li>• Only people you explicitly grant access can view your data</li>
              <li>• You can revoke access at any time</li>
              <li>• All data access is logged for transparency</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Grant Access Section */}
      <div className="px-4 sm:px-0">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Shared Access
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  People who can view your health data
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" size="default">
                    <Plus className="w-4 h-4 mr-2" />
                    Grant Access
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-lg mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Grant Access to Your Health Data</DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="text-xs sm:text-sm">
                    Grant access to your caregiver or doctor so they can help monitor your health
                  </DialogDescription>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="granteeEmail" className="text-sm">Email Address *</Label>
                      <Input
                        id="granteeEmail"
                        type="email"
                        placeholder="doctor@example.com"
                        value={newConsent.granteeEmail}
                        onChange={(e) => setNewConsent({ ...newConsent, granteeEmail: e.target.value })}
                        className="text-sm sm:text-base"
                      />
                      <p className="text-xs text-gray-500">
                        Enter the email address of your caregiver or doctor (they must be registered in WellCare)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Access Level *</Label>
                      <RadioGroup 
                        value={newConsent.accessLevel} 
                        onValueChange={(value) => setNewConsent({ ...newConsent, accessLevel: value })}
                      >
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="view" id="view" />
                          <Label htmlFor="view" className="flex-1 cursor-pointer">
                            <div>
                              <div className="text-sm font-medium">View Only</div>
                              <div className="text-xs text-gray-500">Can view your vitals, medications, and alerts</div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="full" id="full" />
                          <Label htmlFor="full" className="flex-1 cursor-pointer">
                            <div>
                              <div className="text-sm font-medium">Full Access</div>
                              <div className="text-xs text-gray-500">Can view all data and receive alerts</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button onClick={handleGrantAccess} className="w-full">Grant Access</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : consents.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <UserCheck className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-500 mb-2 sm:mb-4">No shared access granted yet</p>
                <p className="text-xs sm:text-sm text-gray-400 px-4">
                  Grant access to your caregiver or doctor so they can help monitor your health
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {consents.map((consent) => (
                  <div key={consent.id} className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full shrink-0 mt-0.5 sm:mt-0">
                        <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs sm:text-base break-all">{consent.granteeEmail}</div>
                        <div className="text-[10px] sm:text-sm text-gray-500 mt-0.5">
                          Granted on {formatDate(consent.grantedAt)}
                        </div>
                        <div className="mt-1.5 sm:hidden">
                          <Badge 
                            variant={consent.accessLevel === 'full' ? 'default' : 'secondary'}
                            className="text-[10px] px-2 py-0.5"
                          >
                            {consent.accessLevel === 'full' ? 'Full Access' : 'View Only'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                      <Badge 
                        variant={consent.accessLevel === 'full' ? 'default' : 'secondary'}
                        className="hidden sm:inline-flex text-xs"
                      >
                        {consent.accessLevel === 'full' ? 'Full Access' : 'View Only'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeAccess(consent.granteeEmail)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Export & Deletion */}
      <div className="px-4 sm:px-0">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Data Management</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Export or delete your health data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
              <div>
                <div className="font-medium text-sm sm:text-base">Export Your Data</div>
                <div className="text-xs sm:text-sm text-gray-500">Download all your health records as CSV</div>
              </div>
              <Button variant="outline" size="default" className="w-full sm:w-auto">Export</Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg border-red-200 bg-red-50">
              <div>
                <div className="font-medium text-sm sm:text-base text-red-900">Delete All Data</div>
                <div className="text-xs sm:text-sm text-red-700">Permanently delete your health records</div>
              </div>
              <Button variant="destructive" size="default" className="w-full sm:w-auto">Delete</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}