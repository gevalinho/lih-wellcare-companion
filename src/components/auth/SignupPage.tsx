import { useState } from 'react';
import { authAPI } from '../../utils/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Heart, User, Mail, Lock, Calendar, Phone } from 'lucide-react';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

export function SignupPage({ onSignupSuccess, onNavigateToLogin }: SignupPageProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'patient',
    // Patient-specific
    age: '',
    sex: '',
    conditions: '',
    emergencyContact: '',
    emergencyPhone: '',
    // Caregiver/Doctor-specific
    relationship: '',
    specialization: '',
    verificationCode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.name || !formData.role) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData: any = {};
      
      if (formData.role === 'patient') {
        profileData.age = formData.age;
        profileData.sex = formData.sex;
        profileData.conditions = formData.conditions;
        profileData.emergencyContact = formData.emergencyContact;
        profileData.emergencyPhone = formData.emergencyPhone;
      } else if (formData.role === 'caregiver') {
        profileData.relationship = formData.relationship;
      } else if (formData.role === 'doctor') {
        profileData.specialization = formData.specialization;
      }

      await authAPI.signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        profileData,
      });

      toast.success('Account created successfully! Please sign in.');
      setTimeout(() => {
        onNavigateToLogin();
      }, 1000);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-2 p-4 sm:p-6">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Create Your WellCare Account</CardTitle>
          <CardDescription className="text-sm">
            {step === 1 ? 'Step 1: Basic Information' : 'Step 2: Profile Details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSignup}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="pl-10 h-11 sm:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="pl-10 h-11 sm:h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className="pl-10 h-11 sm:h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                        className="pl-10 h-11 sm:h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>I am a *</Label>
                  <RadioGroup value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <RadioGroupItem value="patient" id="patient" />
                      <Label htmlFor="patient" className="flex-1 cursor-pointer">
                        <div>
                          <div className="text-sm sm:text-base">Patient</div>
                          <div className="text-xs sm:text-sm text-gray-500">Track my own health data</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <RadioGroupItem value="caregiver" id="caregiver" />
                      <Label htmlFor="caregiver" className="flex-1 cursor-pointer">
                        <div>
                          <div className="text-sm sm:text-base">Caregiver</div>
                          <div className="text-xs sm:text-sm text-gray-500">Help care for a patient</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <RadioGroupItem value="doctor" id="doctor" />
                      <Label htmlFor="doctor" className="flex-1 cursor-pointer">
                        <div>
                          <div className="text-sm sm:text-base">Doctor / Healthcare Provider</div>
                          <div className="text-xs sm:text-sm text-gray-500">Monitor patient health records</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full h-11 sm:h-10">
                  Next
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {formData.role === 'patient' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="35"
                          value={formData.age}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          className="h-11 sm:h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sex">Sex</Label>
                        <select
                          id="sex"
                          value={formData.sex}
                          onChange={(e) => handleInputChange('sex', e.target.value)}
                          className="w-full h-11 sm:h-10 px-3 rounded-md border border-gray-300 bg-white text-sm sm:text-base"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conditions">Existing Conditions (optional)</Label>
                      <Textarea
                        id="conditions"
                        placeholder="e.g., Hypertension, Diabetes"
                        value={formData.conditions}
                        onChange={(e) => handleInputChange('conditions', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                      <Input
                        id="emergencyContact"
                        placeholder="Jane Doe"
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        className="h-11 sm:h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="emergencyPhone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.emergencyPhone}
                          onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                          className="pl-10 h-11 sm:h-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.role === 'caregiver' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="relationship">Relationship to Patient</Label>
                      <Input
                        id="relationship"
                        placeholder="e.g., Spouse, Child, Friend"
                        value={formData.relationship}
                        onChange={(e) => handleInputChange('relationship', e.target.value)}
                        className="h-11 sm:h-10"
                      />
                    </div>
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg text-xs sm:text-sm">
                      <p>After registration, patients can grant you access to their health data by entering your email address.</p>
                    </div>
                  </div>
                )}

                {formData.role === 'doctor' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        placeholder="e.g., Cardiology, General Practice"
                        value={formData.specialization}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                        className="h-11 sm:h-10"
                      />
                    </div>
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg text-xs sm:text-sm">
                      <p>After registration, patients can grant you access to their health data by entering your email address.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 sm:h-10">
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 h-11 sm:h-10">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center pt-4 border-t mt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}