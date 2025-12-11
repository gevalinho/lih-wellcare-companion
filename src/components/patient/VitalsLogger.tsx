import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { vitalsAPI } from '../../utils/api';
import { Heart, Activity, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface VitalsLoggerProps {
  onSuccess: () => void;
}

export function VitalsLogger({ onSuccess }: VitalsLoggerProps) {
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    pulse: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.systolic || !formData.diastolic) {
      toast.error('Systolic and diastolic values are required');
      return;
    }

    const systolic = parseInt(formData.systolic);
    const diastolic = parseInt(formData.diastolic);

    if (systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150) {
      toast.error('Please enter valid blood pressure values');
      return;
    }

    setLoading(true);

    try {
      const response = await vitalsAPI.add({
        systolic,
        diastolic,
        pulse: formData.pulse ? parseInt(formData.pulse) : null,
        notes: formData.notes,
      });

      if (response.alert) {
        toast.warning(response.alert.message, {
          description: 'Your caregiver and doctor have been notified.',
        });
      } else {
        toast.success('Blood pressure recorded successfully');
      }

      // Reset form
      setFormData({
        systolic: '',
        diastolic: '',
        pulse: '',
        notes: '',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error adding vital:', error);
      toast.error(error.message || 'Failed to record vital signs');
    } finally {
      setLoading(false);
    }
  };

  const getBPGuidance = () => {
    if (!formData.systolic || !formData.diastolic) return null;
    
    const systolic = parseInt(formData.systolic);
    const diastolic = parseInt(formData.diastolic);

    if (systolic >= 180 || diastolic >= 120) {
      return {
        level: 'Hypertensive Crisis',
        color: 'red',
        message: 'Seek emergency medical attention immediately',
        icon: AlertCircle
      };
    } else if (systolic >= 140 || diastolic >= 90) {
      return {
        level: 'High Blood Pressure',
        color: 'orange',
        message: 'Consult with your healthcare provider',
        icon: AlertCircle
      };
    } else if (systolic >= 130 || diastolic >= 85) {
      return {
        level: 'Elevated',
        color: 'yellow',
        message: 'Consider lifestyle changes and monitor regularly',
        icon: AlertCircle
      };
    } else if (systolic >= 90 && diastolic >= 60) {
      return {
        level: 'Normal',
        color: 'green',
        message: 'Your blood pressure is in a healthy range',
        icon: Heart
      };
    } else {
      return {
        level: 'Low',
        color: 'blue',
        message: 'Your blood pressure may be low, consult your doctor if you have symptoms',
        icon: AlertCircle
      };
    }
  };

  const guidance = getBPGuidance();

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 shrink-0" />
            Log Blood Pressure Reading
          </CardTitle>
          <CardDescription className="text-sm">
            Record your current blood pressure and vital signs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Blood Pressure Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systolic" className="text-sm sm:text-base">Systolic (Top Number) *</Label>
                <div className="relative">
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={formData.systolic}
                    onChange={(e) => handleInputChange('systolic', e.target.value)}
                    required
                    min="50"
                    max="250"
                    className="h-11 sm:h-10 text-base sm:text-sm pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    mmHg
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diastolic" className="text-sm sm:text-base">Diastolic (Bottom Number) *</Label>
                <div className="relative">
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={formData.diastolic}
                    onChange={(e) => handleInputChange('diastolic', e.target.value)}
                    required
                    min="30"
                    max="150"
                    className="h-11 sm:h-10 text-base sm:text-sm pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    mmHg
                  </span>
                </div>
              </div>
            </div>

            {/* Pulse Input */}
            <div className="space-y-2">
              <Label htmlFor="pulse" className="text-sm sm:text-base">Pulse Rate (optional)</Label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="pulse"
                  type="number"
                  placeholder="72"
                  value={formData.pulse}
                  onChange={(e) => handleInputChange('pulse', e.target.value)}
                  min="40"
                  max="200"
                  className="pl-10 h-11 sm:h-10 text-base sm:text-sm pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  bpm
                </span>
              </div>
            </div>

            {/* Guidance Display */}
            {guidance && (
              <div className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                guidance.color === 'red' ? 'bg-red-50 border-red-200' :
                guidance.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                guidance.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                guidance.color === 'green' ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-2 sm:gap-3">
                  <guidance.icon className={`w-5 h-5 mt-0.5 shrink-0 ${
                    guidance.color === 'red' ? 'text-red-600' :
                    guidance.color === 'orange' ? 'text-orange-600' :
                    guidance.color === 'yellow' ? 'text-yellow-600' :
                    guidance.color === 'green' ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base">{guidance.level}</div>
                    <div className="text-xs sm:text-sm mt-1 break-words">{guidance.message}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm sm:text-base">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="How are you feeling? Any symptoms or observations..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="text-base sm:text-sm resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1 h-11 sm:h-10 text-base sm:text-sm">
                {loading ? 'Recording...' : 'Record Reading'}
              </Button>
            </div>

            {/* Information Box */}
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg text-xs sm:text-sm">
              <div className="font-medium mb-2">Blood Pressure Guidelines:</div>
              <ul className="space-y-1 text-xs">
                <li>• Normal: Less than 120/80 mmHg</li>
                <li>• Elevated: 120-129 systolic and less than 80 diastolic</li>
                <li>• High Blood Pressure (Stage 1): 130-139/80-89 mmHg</li>
                <li>• High Blood Pressure (Stage 2): 140/90 mmHg or higher</li>
                <li>• Hypertensive Crisis: Higher than 180/120 mmHg</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}