import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  MessageSquare,
  Camera,
  Send,
  Loader2,
  AlertCircle,
  Droplets,
  Eye,
  Brain,
  CheckCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { aiChatAPI, chatAPI, healthCheckAPI, vitalsAPI, medicationsAPI } from '../../utils/api';

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  content: string;
  context?: string;
}

interface AIHealthAssistantProps {
  profile?: any;
}

interface HealthContext {
  latestVital: any | null;
  medications: any[];
}

export function AIHealthAssistant({ profile }: AIHealthAssistantProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'symptoms' | 'face'>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content: `Hello${
        profile?.name ? ` ${profile.name.split(' ')[0]}` : ''
      }! 👋 I'm your AI health assistant. Ask me about symptoms, vitals, or general wellness tips.`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [healthContext, setHealthContext] = useState<HealthContext>({
    latestVital: null,
    medications: [],
  });

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, chatLoading]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Load vitals/medications for smarter fallback responses
  useEffect(() => {
    const loadHealthContext = async () => {
      try {
        const [vitalRes, medRes] = await Promise.all([
          vitalsAPI.getHistory().catch(() => ({ vitals: [] })),
          medicationsAPI.getList().catch(() => ({ medications: [] })),
        ]);
        const latestVital = vitalRes.vitals?.[0] || null;
        const medications = medRes.medications || [];
        setHealthContext({ latestVital, medications });
      } catch (error) {
        console.error('Failed to load health context for AI assistant', error);
      }
    };
    loadHealthContext();
  }, []);

  const buildLocalAssistantResponse = (message: string) => {
    const lower = message.toLowerCase();
    const { latestVital, medications } = healthContext;
    const activeMeds = medications.filter((med: any) => med.active);

    if (lower.includes('thank')) {
      return `You're welcome${
        profile?.name ? `, ${profile.name.split(' ')[0]}` : ''
      }! Let me know if you want tips about vitals, medications, or lifestyle habits.`;
    }

    if (lower.includes('blood pressure') || lower.includes('bp')) {
      if (latestVital) {
        const status =
          latestVital.systolic >= 140 || latestVital.diastolic >= 90
            ? 'which is considered high. Please consult your healthcare provider.'
            : latestVital.systolic >= 130 || latestVital.diastolic >= 85
            ? 'which is slightly elevated. Keep monitoring and adopt heart-healthy habits.'
            : 'which is within the normal range. Keep up the great work!';
        return `Your latest reading is ${latestVital.systolic}/${latestVital.diastolic} mmHg${
          latestVital.pulse ? ` with a pulse of ${latestVital.pulse} bpm` : ''
        }, ${status}`;
      }
      return `Normal blood pressure is typically near 120/80 mmHg. If you haven't logged a reading recently, consider logging one so I can give you more personalized feedback.`;
    }

    if (lower.includes('medication')) {
      if (activeMeds.length > 0) {
        const medList = activeMeds.slice(0, 3).map((med: any) => `${med.name} (${med.dosage})`).join(', ');
        return `You're currently taking ${activeMeds.length} medication(s): ${medList}${
          activeMeds.length > 3 ? ', ...' : ''
        }. Take them exactly as prescribed and consult your healthcare provider with any concerns.`;
      }
      return 'I don’t see any medications logged yet. You can add them in the Medications tab so I can help you track timing and reminders.';
    }

    if (lower.includes('healthy lifestyle') || lower.includes('habit') || lower.includes('wellness')) {
      return `Healthy lifestyle habits include balanced meals with fruits, vegetables, whole grains, lean proteins, daily movement (even brisk walks), 7–9 hours of sleep, managing stress with breathing or mindfulness, and limiting alcohol and tobacco. Start with one or two habits you can maintain consistently.`;
    }

    if (lower.includes('exercise') || lower.includes('workout') || lower.includes('fitness') || lower.includes('activity')) {
      return `Aim for at least 150 minutes of moderate activity weekly (like brisk walking) or 75 minutes of vigorous activity (like jogging). Pair it with two strength sessions and plenty of stretching. Always check with your healthcare provider before starting a new routine.`;
    }

    if (lower.includes('diet') || lower.includes('nutrition') || lower.includes('food') || lower.includes('eat')) {
      return `Build meals using the “half plate veggies/fruits, quarter lean protein, quarter whole grains” approach. Reduce sodium and sugary drinks, stay hydrated, and limit processed foods. The DASH or Mediterranean diets are great blueprints for heart health.`;
    }

    if (lower.includes('stress') || lower.includes('anxiety') || lower.includes('sleep')) {
      return `Try short breathing breaks, light stretching, or journaling when stress builds up. Prioritize a calming bedtime routine, limit screen time an hour before bed, and keep a regular sleep schedule. If stress feels overwhelming, reach out to your healthcare provider.`;
    }

    if (lower.includes('heart')) {
      return `Heart-healthy care combines regular activity, nutrient-dense foods, good sleep, medication adherence, and routine checkups. Tracking vitals and staying consistent with your care plan is key.`;
    }

    const defaultResponses = [
      `Great question! I can help with blood pressure, medications, nutrition, stress, or general wellness tips. Let me know which one you’d like to explore next.`,
      `I'm here for you. Ask about symptoms, vitals, medications, or lifestyle coaching and I'll share practical steps.`,
      `How can I support you today? I can explain readings, offer heart-healthy habits, or guide you on tracking symptoms.`,
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  // Handle chat message send
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatLoading) return;

    const userMessage = inputMessage.trim();
    const conversationHistory = messages
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .map(({ role, content }) => ({ role, content }))
      .slice(-10);
    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        message: userMessage,
        conversationHistory,
      });
      const assistantContent = response.usedFallback
        ? buildLocalAssistantResponse(userMessage)
        : response.message;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantContent,
        },
      ]);
      if (response.usedFallback) {
        console.log('ℹ️ AI response using smart fallback mode (OpenAI rate limited)');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error('Chat is temporarily unavailable.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: error?.message || 'Sorry, I had trouble processing that. Please try again.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle symptom checking
  const addSymptom = () => {
    const clean = symptomInput.trim();
    if (!clean || symptoms.includes(clean)) return;
    setSymptoms((prev) => [...prev, clean]);
    setSymptomInput('');
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms((prev) => prev.filter((s) => s !== symptom));
  };

  const estimateDurationDays = (value: string) => {
    if (!value) return 0;
    const match = value.toLowerCase().match(/(\d+)\s*(hour|hr|day|week|month)/);
    if (!match) return 0;
    const amount = Number(match[1]);
    const unit = match[2];
    if (unit.startsWith('hour')) return amount / 24;
    if (unit.startsWith('day')) return amount;
    if (unit.startsWith('week')) return amount * 7;
    if (unit.startsWith('month')) return amount * 30;
    return 0;
  };

  const symptomKnowledgeBase = [
    {
      keywords: ['weakness', 'fatigue', 'tired'],
      conditions: ['Anemia', 'Chronic fatigue', 'Dehydration', 'Infection'],
      recommendations: [
        'Stay hydrated and get adequate rest',
        'Monitor temperature and note any accompanying symptoms',
        'If weakness worsens suddenly, seek urgent care',
      ],
    },
    {
      keywords: ['headache', 'migraine'],
      conditions: ['Migraine', 'Tension headache', 'High blood pressure'],
      recommendations: [
        'Reduce screen time and stay hydrated',
        'Monitor blood pressure if you have a history of hypertension',
        'Seek urgent care if headache is sudden and severe',
      ],
    },
    {
      keywords: ['fever', 'temperature'],
      conditions: ['Viral infection', 'Bacterial infection'],
      recommendations: [
        'Stay hydrated and rest',
        'Monitor temperature every 4-6 hours',
        'Seek medical attention if fever exceeds 103°F / 39.4°C',
      ],
    },
    {
      keywords: ['chest pain', 'shortness of breath'],
      conditions: ['Cardiac issue', 'Anxiety', 'Respiratory infection'],
      recommendations: [
        'If chest pain is crushing or radiates to arm/jaw, call emergency services immediately',
        'Practice slow breathing to reduce anxiety-related discomfort',
        'Consult your doctor soon for further evaluation',
      ],
    },
    {
      keywords: ['cough'],
      conditions: ['Upper respiratory infection', 'Allergies', 'Asthma flare'],
      recommendations: [
        'Stay hydrated and consider using a humidifier',
        'Note if cough is dry or productive and report to your provider',
        'Seek urgent care for difficulty breathing or blood in mucus',
      ],
    },
    {
      keywords: ['dizziness', 'lightheaded'],
      conditions: ['Low blood pressure', 'Dehydration', 'Inner ear imbalance'],
      recommendations: [
        'Sit or lie down until the feeling passes',
        'Avoid sudden posture changes and stay hydrated',
        'See your provider if dizziness persists or you faint',
      ],
    },
  ];

  const buildSymptomFallback = () => {
    const durationDays = estimateDurationDays(duration);
    const severityLabel = severity >= 8 ? 'severe' : severity >= 5 ? 'moderate' : 'mild';
    const urgency =
      severity >= 8 || durationDays >= 7
        ? 'high'
        : severity >= 5 || durationDays >= 3
        ? 'medium'
        : 'low';

    const possibleConditions = new Set<string>();
    const recommendations = new Set<string>();

    symptoms.forEach((symptom) => {
      const entry = symptomKnowledgeBase.find((item) =>
        item.keywords.some((keyword) => symptom.toLowerCase().includes(keyword)),
      );
      if (entry) {
        entry.conditions.forEach((condition) => possibleConditions.add(condition));
        entry.recommendations.forEach((rec) => recommendations.add(rec));
      }
    });

    if (possibleConditions.size === 0) {
      possibleConditions.add('Viral infection');
      possibleConditions.add('Stress-related symptoms');
    }
    if (recommendations.size === 0) {
      recommendations.add('Monitor symptoms and rest');
      recommendations.add('Stay hydrated and follow a light diet');
    }

    if (severity >= 8 || symptoms.some((symptom) => /chest pain|shortness of breath/.test(symptom.toLowerCase()))) {
      recommendations.add('Seek immediate medical attention if symptoms worsen or include chest pain.');
    }

    return {
      severity: severityLabel,
      urgency,
      possibleConditions: Array.from(possibleConditions),
      recommendations: Array.from(recommendations),
      disclaimer:
        'This guidance is informational only. Severe or persistent symptoms require evaluation by a healthcare professional.',
    };
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) return;

    setSymptomLoading(true);
    try {
      const response = await aiChatAPI.checkSymptoms(symptoms, duration, severity);
      setSymptomAnalysis(response.analysis);
    } catch (error: any) {
      console.error('Symptom analysis error:', error);
      toast.warning('Symptom analysis service is being set up. Showing best-effort guidance.');
      setSymptomAnalysis(buildSymptomFallback());
    } finally {
      setSymptomLoading(false);
    }
  };

  // Camera controls
  const startCamera = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      toast.error(error?.message || 'Could not access camera. Please check permissions.');
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
      let currentSession = healthSession;
      if (!currentSession) {
        const sessionResponse = await healthCheckAPI.startSession();
        currentSession = sessionResponse.sessionId;
        setHealthSession(currentSession);
      }

      const response = await healthCheckAPI.analyzeFace(faceImage, currentSession);
      setFaceAnalysis(response.analysis);
    } catch (error: any) {
      console.error('Face analysis error:', error);
      toast.error(error?.message || 'Failed to analyze face');
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
        <p className="text-sm sm:text-base text-gray-600">
          Get personalized health insights powered by AI
        </p>
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
                <div
                  ref={messagesContainerRef}
                  className="h-[50vh] sm:h-96 overflow-y-auto border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50"
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8">
                      <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">Start a conversation about your health</p>
                      <p className="text-xs sm:text-sm mt-2 px-4">
                        Ask questions about your vitals, medications, or general health
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      const isError = msg.role === 'error';
                      return (
                        <div key={idx} className="space-y-1">
                          {isUser && (
                            <div className="flex justify-end">
                              <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[11px]">
                                You
                              </Badge>
                            </div>
                          )}
                          <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base ${
                                isUser
                                  ? 'bg-blue-50 border border-blue-200 text-blue-900'
                                  : isError
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-white border'
                              }`}
                            >
                              <p>{msg.content}</p>
                              {msg.context && (
                                <p
                                  className={`mt-2 text-xs whitespace-pre-wrap ${
                                    isUser ? 'text-blue-700' : 'text-gray-500'
                                  }`}
                                >
                                  {msg.context}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border rounded-lg px-3 sm:px-4 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input - Mobile Optimized */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
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
                    {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 px-1">
                  💡 This AI uses your health data for personalized insights. Always consult healthcare
                  professionals.
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSymptom();
                      }
                    }}
                    placeholder="e.g., headache, fever"
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button onClick={addSymptom} size="default" className="px-4 sm:px-6">
                    Add
                  </Button>
                </div>
              </div>

              {/* Symptoms List */}
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((symptom, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-2">
                      {symptom}
                      <button
                        onClick={() => removeSymptom(symptom)}
                        className="text-red-500 hover:text-red-700 text-lg leading-none"
                        aria-label={`Remove ${symptom}`}
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
                      <li key={idx} className="text-xs sm:text-sm text-gray-700">
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {symptomAnalysis.recommendations?.map((rec: string, idx: number) => (
                      <li key={idx} className="text-xs sm:text-sm text-gray-700">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {symptomAnalysis.disclaimer && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs sm:text-sm text-yellow-800">{symptomAnalysis.disclaimer}</p>
                  </div>
                )}
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
                        <Button onClick={startCamera} size="default">
                          Start Camera
                        </Button>
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
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
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
                  <p className="text-4xl sm:text-5xl font-bold text-blue-600">
                    {faceAnalysis.overallScore}
                    <span className="text-2xl sm:text-3xl">/100</span>
                  </p>
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
                        <li key={idx} className="text-gray-600">
                          • {indicator}
                        </li>
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
                        <li key={idx} className="text-gray-600">
                          • {sign}
                        </li>
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
                      <p>
                        Clarity: <span className="font-medium">{faceAnalysis.eyeHealth?.clarity}</span>
                      </p>
                      <p>
                        Redness: <span className="font-medium">{faceAnalysis.eyeHealth?.redness}</span>
                      </p>
                      <p>
                        Dark Circles: <span className="font-medium">{faceAnalysis.eyeHealth?.darkCircles}</span>
                      </p>
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

                {faceAnalysis.disclaimer && (
                  <div className="bg-gray-50 border rounded-lg p-3">
                    <p className="text-xs text-gray-600">{faceAnalysis.disclaimer}</p>
                  </div>
                )}
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
              <strong>Important:</strong> This AI assistant provides educational information only and is not a
              substitute for professional medical advice, diagnosis, or treatment. Always consult with your
              healthcare provider for medical concerns.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
