import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  MessageSquare, 
  Camera, 
  Send, 
  Loader2, 
  AlertCircle,
  Heart,
  Droplets,
  Eye,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  X
} from 'lucide-react';

// API Configuration
const API_BASE = '/make-server-6e6f3496';

const apiRequest = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
};

// AI Chat API
const aiChatAPI = {
  sendMessage: async (message: string, sessionId?: string, symptoms?: string[], vitalsContext?: any) => {
    return apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId, symptoms, vitalsContext }),
    });
  },
  
  getHistory: async (sessionId?: string) => {
    const query = sessionId ? `?sessionId=${sessionId}` : '';
    return apiRequest(`/ai/chat/history${query}`);
  },
  
  checkSymptoms: async (symptoms: string[], duration?: string, severity?: number) => {
    return apiRequest('/ai/symptom-check', {
      method: 'POST',
      body: JSON.stringify({ symptoms, duration, severity }),
    });
  },
};

// Health Check Session API
const healthCheckAPI = {
  startSession: async () => {
    return apiRequest('/health-check/session', {
      method: 'POST',
    });
  },
  
  analyzeFace: async (imageData: string, sessionId?: string) => {
    return apiRequest('/health-check/analyze-face', {
      method: 'POST',
      body: JSON.stringify({ imageData, sessionId }),
    });
  },
  
  completeSession: async (sessionId: string) => {
    return apiRequest('/health-check/session/complete', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },
  
  getHistory: async () => {
    return apiRequest('/health-check/history');
  },
};

export function HealthTips() {
  const [activeTab, setActiveTab] = useState<'chat' | 'symptoms' | 'face'>('chat');
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Symptom checker state
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState(5);
  const [symptomAnalysis, setSymptomAnalysis] = useState<any>(null);
  const [symptomLoading, setSymptomLoading] = useState(false);
  
  // Face analysis state
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<any>(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [healthSession, setHealthSession] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle chat message send
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatLoading) return;
    
    const userMessage = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      const response = await aiChatAPI.sendMessage(userMessage, sessionId || undefined);
      setSessionId(response.sessionId);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.response,
        context: response.context 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: 'Sorry, I had trouble processing that. Please try again.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle symptom checking
  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) return;
    
    setSymptomLoading(true);
    try {
      const response = await aiChatAPI.checkSymptoms(symptoms, duration, severity);
      setSymptomAnalysis(response.analysis);
    } catch (error) {
      alert('Failed to analyze symptoms. Please try again.');
    } finally {
      setSymptomLoading(false);
    }
  };

  // Camera controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setFaceImage(imageData);
      stopCamera();
    }
  };

  const analyzeFace = async () => {
    if (!faceImage) return;
    
    setFaceLoading(true);
    try {
      // Start session if not exists
      let currentSession = healthSession;
      if (!currentSession) {
        const sessionResponse = await healthCheckAPI.startSession();
        currentSession = sessionResponse.sessionId;
        setHealthSession(currentSession);
      }
      
      const response = await healthCheckAPI.analyzeFace(faceImage, currentSession);
      setFaceAnalysis(response.analysis);
    } catch (error) {
      alert('Failed to analyze face. Please try again.');
    } finally {
      setFaceLoading(false);
    }
  };

  const getSeverityColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
      mild: 'bg-green-100 text-green-700',
      moderate: 'bg-yellow-100 text-yellow-700',
      severe: 'bg-red-100 text-red-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="px-4 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-1">AI Health Assistant</h2>
        <p className="text-sm sm:text-base text-gray-600">Get personalized health insights powered by AI</p>
      </div>

      {/* Tabs - Mobile Optimized */}
      <div className="flex gap-1 sm:gap-2 border-b overflow-x-auto scrollbar-hide px-4 sm:px-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3 sm:px-4 py-2 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
            activeTab === 'chat' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Health </span>Chat
        </button>
        <button
          onClick={() => setActiveTab('symptoms')}
          className={`px-3 sm:px-4 py-2 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
            activeTab === 'symptoms' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertCircle className="w-4 h-4 inline mr-1 sm:mr-2" />
          Symptoms
        </button>
        <button
          onClick={() => setActiveTab('face')}
          className={`px-3 sm:px-4 py-2 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
            activeTab === 'face' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Face </span>Analysis
        </button>
      </div>

      {/* AI Chat Tab */}
      {activeTab === 'chat' && (
        <div className="px-4 sm:px-0">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageSquare className="w-5 h-5" />
                <span className="hidden sm:inline">Chat with AI Health Assistant</span>
                <span className="sm:hidden">AI Health Chat</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {/* Messages - Mobile Optimized Height */}
                <div className="h-[50vh] sm:h-96 overflow-y-auto border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8">
                      <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">Start a conversation about your health</p>
                      <p className="text-xs sm:text-sm mt-2 px-4">Ask questions about your vitals, medications, or general health</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : msg.role === 'error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-white border'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border rounded-lg px-3 sm:px-4 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input - Mobile Optimized */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about your health..."
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={chatLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={chatLoading || !inputMessage.trim()}
                    size="default"
                    className="px-3 sm:px-4"
                  >
                    {chatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 px-1">
                  💡 This AI uses your health data for personalized insights. Always consult healthcare professionals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Symptom Checker Tab */}
      {activeTab === 'symptoms' && (
        <div className="space-y-4 px-4 sm:px-0">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <AlertCircle className="w-5 h-5" />
                Symptom Checker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Symptoms */}
              <div>
                <label className="block text-sm font-medium mb-2">What symptoms are you experiencing?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                    placeholder="e.g., headache, fever"
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button onClick={addSymptom} size="default" className="px-4 sm:px-6">Add</Button>
                </div>
              </div>

              {/* Symptoms List */}
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((symptom, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-sm">
                      {symptom}
                      <button
                        onClick={() => removeSymptom(symptom)}
                        className="ml-2 text-red-500 hover:text-red-700 text-lg"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2">How long have you had these symptoms?</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 2 days, 1 week"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Severity: <span className="text-blue-600 font-bold">{severity}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>
              </div>

              <Button
                onClick={analyzeSymptoms}
                disabled={symptoms.length === 0 || symptomLoading}
                className="w-full"
                size="default"
              >
                {symptomLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Symptoms'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {symptomAnalysis && (
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Severity</p>
                    <Badge className={`${getSeverityColor(symptomAnalysis.severity)} text-xs sm:text-sm`}>
                      {symptomAnalysis.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Urgency</p>
                    <Badge className={`${getSeverityColor(symptomAnalysis.urgency)} text-xs sm:text-sm`}>
                      {symptomAnalysis.urgency}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Possible Conditions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {symptomAnalysis.possibleConditions?.map((condition: string, idx: number) => (
                      <li key={idx} className="text-xs sm:text-sm text-gray-700">{condition}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {symptomAnalysis.recommendations?.map((rec: string, idx: number) => (
                      <li key={idx} className="text-xs sm:text-sm text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-yellow-800">{symptomAnalysis.disclaimer}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Face Analysis Tab */}
      {activeTab === 'face' && (
        <div className="space-y-4 px-4 sm:px-0">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Camera className="w-5 h-5" />
                Face Health Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Take a selfie to analyze stress levels, hydration, and eye health indicators.
              </p>

              {/* Camera View - Mobile Optimized */}
              {!faceImage && (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video sm:aspect-[4/3]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${cameraActive ? '' : 'hidden'}`}
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <Camera className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 text-gray-400" />
                        <Button onClick={startCamera} size="default">Start Camera</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Captured Image */}
              {faceImage && (
                <div className="relative">
                  <img src={faceImage} alt="Captured" className="w-full rounded-lg" />
                  <Button
                    onClick={() => {
                      setFaceImage(null);
                      setFaceAnalysis(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Retake
                  </Button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {/* Controls - Mobile Optimized */}
              <div className="flex gap-2">
                {cameraActive && (
                  <>
                    <Button onClick={capturePhoto} className="flex-1" size="default">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Button onClick={stopCamera} variant="outline" size="default">
                      Cancel
                    </Button>
                  </>
                )}
                {faceImage && !faceAnalysis && (
                  <Button onClick={analyzeFace} disabled={faceLoading} className="flex-1" size="default">
                    {faceLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Analyze Face
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {faceAnalysis && (
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Health Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Score */}
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Overall Wellness Score</p>
                  <p className="text-4xl sm:text-5xl font-bold text-blue-600">{faceAnalysis.overallScore}<span className="text-2xl sm:text-3xl">/100</span></p>
                </div>

                {/* Detailed Analysis - Mobile Stacked */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Stress */}
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      <p className="font-medium text-sm sm:text-base">Stress Level</p>
                    </div>
                    <Badge className={`${getSeverityColor(faceAnalysis.stressLevel)} mb-2 text-xs sm:text-sm`}>
                      {faceAnalysis.stressLevel}
                    </Badge>
                    <ul className="text-xs sm:text-sm space-y-1">
                      {faceAnalysis.stressIndicators?.map((indicator: string, idx: number) => (
                        <li key={idx} className="text-gray-600">• {indicator}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Hydration */}
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <p className="font-medium text-sm sm:text-base">Hydration</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 mb-2 text-xs sm:text-sm">
                      {faceAnalysis.hydrationLevel}
                    </Badge>
                    <ul className="text-xs sm:text-sm space-y-1">
                      {faceAnalysis.hydrationSigns?.map((sign: string, idx: number) => (
                        <li key={idx} className="text-gray-600">• {sign}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Eye Health */}
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-green-500" />
                      <p className="font-medium text-sm sm:text-base">Eye Health</p>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p>Clarity: <span className="font-medium">{faceAnalysis.eyeHealth?.clarity}</span></p>
                      <p>Redness: <span className="font-medium">{faceAnalysis.eyeHealth?.redness}</span></p>
                      <p>Dark Circles: <span className="font-medium">{faceAnalysis.eyeHealth?.darkCircles}</span></p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <p className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle className="w-4 h-4" />
                    Recommendations
                  </p>
                  <ul className="space-y-2">
                    {faceAnalysis.recommendations?.map((rec: string, idx: number) => (
                      <li key={idx} className="text-xs sm:text-sm bg-green-50 border border-green-200 rounded p-2 sm:p-3">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 border rounded-lg p-3">
                  <p className="text-xs text-gray-600">{faceAnalysis.disclaimer}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Disclaimer - Mobile Optimized */}
      <div className="px-4 sm:px-0">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 sm:pt-6">
            <p className="text-xs sm:text-sm text-yellow-900">
              <strong>Important:</strong> This AI assistant provides educational information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with your healthcare provider for medical concerns.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}