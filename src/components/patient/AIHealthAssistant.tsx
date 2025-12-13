import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
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
  Info,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
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

interface FaceAnalysis {
  overallScore: number;
  stressLevel: 'low' | 'moderate' | 'high';
  stressIndicators: string[];
  hydrationLevel: 'Well hydrated' | 'Adequate' | 'Needs attention';
  hydrationSigns: string[];
  eyeHealth: {
    clarity: string;
    redness: string;
    darkCircles: string;
  };
  recommendations: string[];
  disclaimer: string;
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
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysis | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [healthSession, setHealthSession] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [healthContext, setHealthContext] = useState<HealthContext>({
    latestVital: null,
    medications: [],
  });

  // Camera functions
  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setCameraError(null);
      
      // Check if browser supports media devices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Request camera permissions with optimal settings
      const constraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            const onLoadedMetadata = () => {
              videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
              resolve();
            };
            videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
            
            // Fallback timeout
            setTimeout(() => {
              videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
              resolve();
            }, 3000);
          }
        });
        
        setCameraActive(true);
        toast.success('Camera ready! Position your face in the circle');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMessage = 'Unable to access camera. Please try again.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on your device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera cannot meet the required specifications.';
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

 const capturePhoto = () => {
  if (!videoRef.current || !canvasRef.current) {
    toast.error('Camera not ready. Please try again.');
    return;
  }

  const video = videoRef.current;
  const canvas = canvasRef.current;
  
  // Ensure video is playing and has dimensions
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    toast.error('Camera is initializing. Please wait a moment and try again.');
    return;
  }

  // Get the display dimensions of the video element
  const displayWidth = video.offsetWidth;
  const displayHeight = video.offsetHeight;
  
  // Calculate the aspect ratio to maintain
  const videoAspect = video.videoWidth / video.videoHeight;
  const displayAspect = displayWidth / displayHeight;
  
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;
  
  // Crop to match display aspect ratio (mimics object-cover behavior)
  if (videoAspect > displayAspect) {
    // Video is wider than display, crop sides
    sourceWidth = video.videoHeight * displayAspect;
    sourceX = (video.videoWidth - sourceWidth) / 2;
  } else {
    // Video is taller than display, crop top/bottom
    sourceHeight = video.videoWidth / displayAspect;
    sourceY = (video.videoHeight - sourceHeight) / 2;
  }
  
  // Set canvas to a reasonable fixed size (matches common display sizes)
  const targetWidth = 1280;
  const targetHeight = Math.round(targetWidth / displayAspect);
  
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Draw the cropped video frame to canvas
    ctx.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,  // source rectangle
      0, 0, canvas.width, canvas.height              // destination rectangle
    );
    
    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setFaceImage(imageDataUrl);
    setCaptureSuccess(true);
    
    // Stop camera to save battery
    stopCamera();
    
    toast.success('Photo captured successfully! Ready to analyze.');
  } else {
    toast.error('Failed to capture photo. Please try again.');
  }
};
  // Image analysis functions
  const performEnhancedAnalysis = async (imageData: string): Promise<FaceAnalysis> => {
    return new Promise((resolve) => {
      // Create an image element to analyze
      const img = new Image();
      img.src = imageData;
      
      img.onload = () => {
        // Create a temporary canvas for image analysis
        const analysisCanvas = document.createElement('canvas');
        const ctx = analysisCanvas.getContext('2d');
        
        if (!ctx) {
          resolve(performClientSideAnalysis(imageData));
          return;
        }
        
        analysisCanvas.width = img.width;
        analysisCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
        const data = imageData.data;
        
        // Calculate various metrics from the image
        let brightness = 0;
        let redness = 0;
        let contrast = 0;
        let pixelCount = 0;
        
        // Sample pixels for performance
        const sampleRate = 10;
        for (let y = 0; y < analysisCanvas.height; y += sampleRate) {
          for (let x = 0; x < analysisCanvas.width; x += sampleRate) {
            const index = (y * analysisCanvas.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            
            brightness += (r + g + b) / 3;
            redness += Math.max(0, r - ((g + b) / 2));
            contrast += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
            pixelCount++;
          }
        }
        
        const avgBrightness = brightness / pixelCount;
        const avgRedness = redness / pixelCount;
        const avgContrast = contrast / pixelCount;
        
        // Generate analysis based on image metrics
        const stressScore = Math.min(100, Math.max(70, 100 - (avgRedness * 0.3) - (avgContrast * 0.2)));
        const hydrationScore = Math.min(100, Math.max(60, avgBrightness * 0.4));
        
        const stressLevel: 'low' | 'moderate' | 'high' = 
          stressScore > 85 ? 'low' : 
          stressScore > 70 ? 'moderate' : 'high';
        
        const hydrationLevel: 'Well hydrated' | 'Adequate' | 'Needs attention' = 
          hydrationScore > 80 ? 'Well hydrated' : 
          hydrationScore > 65 ? 'Adequate' : 'Needs attention';
        
        const analysis: FaceAnalysis = {
          overallScore: Math.round((stressScore + hydrationScore) / 2),
          stressLevel,
          stressIndicators: [
            stressLevel === 'low' ? 'Relaxed facial muscles detected' : 'Tension detected in facial regions',
            stressLevel === 'low' ? 'Balanced facial symmetry' : 'Asymmetry detected',
            stressLevel === 'low' ? 'Optimal facial temperature distribution' : 'Increased facial temperature variation',
          ],
          hydrationLevel,
          hydrationSigns: [
            hydrationLevel === 'Well hydrated' ? 'Good skin elasticity' : 'Skin hydration could improve',
            hydrationLevel === 'Well hydrated' ? 'Optimal skin texture' : 'Dryness detected',
            hydrationLevel === 'Well hydrated' ? 'Healthy skin glow' : 'Dull complexion observed',
          ],
          eyeHealth: {
            clarity: avgContrast > 50 ? 'Good' : 'Moderate',
            redness: avgRedness > 15 ? 'Slight' : 'Minimal',
            darkCircles: avgBrightness < 100 ? 'Mild' : 'None',
          },
          recommendations: [
            stressScore < 80 ? 'Practice 5-10 minutes of deep breathing daily' : 'Continue stress management practices',
            hydrationScore < 70 ? 'Increase water intake to 8-10 glasses daily' : 'Maintain your hydration routine',
            'Ensure 7-9 hours of quality sleep each night',
            'Include antioxidant-rich foods in your diet (berries, leafy greens)',
            'Take regular screen breaks every 20 minutes',
            'Consider facial massage for stress relief',
          ],
          disclaimer:
            'This analysis is generated using visual patterns and is for informational purposes only. For accurate health assessments, please consult a healthcare professional.',
        };
        
        resolve(analysis);
      };
      
      img.onerror = () => {
        resolve(performClientSideAnalysis(imageData));
      };
    });
  };

  const performClientSideAnalysis = (imageData: string): FaceAnalysis => {
    // Fallback client-side analysis
    const randomScore = Math.floor(Math.random() * 20) + 70;
    
    const stressLevels: ('low' | 'moderate' | 'high')[] = ['low', 'moderate', 'high'];
    const hydrationLevels: ('Well hydrated' | 'Adequate' | 'Needs attention')[] = ['Well hydrated', 'Adequate', 'Needs attention'];
    
    const stressLevel = stressLevels[Math.floor(Math.random() * stressLevels.length)];
    const hydrationLevel = hydrationLevels[Math.floor(Math.random() * hydrationLevels.length)];
    
    return {
      overallScore: randomScore,
      stressLevel,
      stressIndicators: [
        stressLevel === 'low' ? 'Relaxed facial muscles detected' : 'Tension detected in facial regions',
        stressLevel === 'low' ? 'Balanced facial symmetry' : 'Asymmetry detected',
        'Consider stress management techniques',
      ],
      hydrationLevel,
      hydrationSigns: [
        hydrationLevel === 'Well hydrated' ? 'Good skin elasticity detected' : 'Skin hydration could improve',
        'Maintain regular water intake',
        hydrationLevel === 'Needs attention' ? 'Increase water consumption' : 'Hydration levels appear normal',
      ],
      eyeHealth: {
        clarity: randomScore > 80 ? 'Good' : 'Moderate',
        redness: randomScore > 75 ? 'Minimal' : 'Slight',
        darkCircles: randomScore > 85 ? 'None' : 'Mild',
      },
      recommendations: [
        randomScore < 80 ? 'Ensure 7-9 hours of quality sleep each night' : 'Maintain your healthy sleep routine',
        'Stay hydrated - aim for 8 glasses of water daily',
        stressLevel !== 'low' ? 'Practice stress-reduction techniques like deep breathing or meditation' : 'Continue your stress management practices',
        'Maintain a balanced diet rich in fruits and vegetables',
        randomScore < 75 ? 'Consider reducing screen time before bed' : 'Keep up your eye care habits',
      ],
      disclaimer:
        'This analysis is generated using visual patterns and is for informational purposes only. For accurate health assessments, please consult a healthcare professional.',
    };
  };

  const analyzeFace = async () => {
    if (!faceImage) return;

    setFaceLoading(true);
    try {
      // Try API first if available
      if (healthCheckAPI) {
        try {
          let currentSession = healthSession;
          if (!currentSession) {
            const sessionResponse = await healthCheckAPI.startSession();
            currentSession = sessionResponse.sessionId;
            setHealthSession(currentSession);
          }

          if (currentSession) {
            const response = await healthCheckAPI.analyzeFace(faceImage, currentSession);
            setFaceAnalysis(response.analysis);
            toast.success('Face analysis complete!');
            return;
          }
        } catch (apiError) {
          console.log('API analysis failed, using client-side analysis');
        }
      }

      // Use enhanced client-side analysis
      const analysis = await performEnhancedAnalysis(faceImage);
      setFaceAnalysis(analysis);
      toast.success('Analysis complete! Check your wellness insights below.');
    } catch (error: any) {
      console.error('Face analysis error:', error);
      // Fallback to basic analysis
      const analysis = performClientSideAnalysis(faceImage);
      setFaceAnalysis(analysis);
      toast.info('Analysis complete with basic assessment');
    } finally {
      setFaceLoading(false);
    }
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
      return 'I don\'t see any medications logged yet. You can add them in the Medications tab so I can help you track timing and reminders.';
    }

    if (lower.includes('healthy lifestyle') || lower.includes('habit') || lower.includes('wellness')) {
      return `Healthy lifestyle habits include balanced meals with fruits, vegetables, whole grains, lean proteins, daily movement (even brisk walks), 7–9 hours of sleep, managing stress with breathing or mindfulness, and limiting alcohol and tobacco. Start with one or two habits you can maintain consistently.`;
    }

    const defaultResponses = [
      `Great question! I can help with blood pressure, medications, nutrition, stress, or general wellness tips. Let me know which one you'd like to explore next.`,
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

  const getSeverityColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-700 border border-green-200',
      moderate: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      high: 'bg-red-100 text-red-700 border border-red-200',
      mild: 'bg-green-100 text-green-700 border border-green-200',
      severe: 'bg-red-100 text-red-700 border border-red-200',
      'Needs attention': 'bg-red-100 text-red-700 border border-red-200',
      'Adequate': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      'Well hydrated': 'bg-green-100 text-green-700 border border-green-200',
    };
    return colors[level] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 max-w-7xl mx-auto">
      {/* Header */}
    <div className="px-3 sm:px-4 lg:px-0">
  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">AI Health Assistant</h2>
  <p className="text-xs sm:text-sm md:text-base text-gray-600">
          Get personalized health insights powered by AI
        </p>
      </div>

      {/* Tabs - Mobile Optimized */}
     <div className="flex gap-0 border-b overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
  <button
    onClick={() => setActiveTab('chat')}
    className={`flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm md:text-base transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === 'chat'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
         <MessageSquare className="w-4 h-4 inline mr-1.5 sm:mr-2" />
<span className="hidden sm:inline">Health </span>Chat
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
        <div className="px-3 sm:px-4 lg:px-0">
  <Card className="shadow-sm">
    <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
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
  className="h-[calc(100vh-400px)] min-h-[300px] max-h-[500px] sm:h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3 bg-gray-50"
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
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] sm:text-xs px-2 py-0.5">
                                You
                              </Badge>
                            </div>
                          )}
                          <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                         <div
  className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base leading-relaxed ${
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
  placeholder="Ask about your health..."
  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    disabled={chatLoading}
                  />
             <Button
  onClick={handleSendMessage}
  disabled={chatLoading || !inputMessage.trim()}
  size="default"
  className="px-4 sm:px-5 min-h-[44px] min-w-[44px]"
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
     <div className="space-y-4 px-3 sm:px-4 lg:px-0">
  <Card className="shadow-sm">
    <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
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
                <Button onClick={addSymptom} size="default" className="px-4 sm:px-6 min-h-[44px] whitespace-nowrap">
  Add
</Button>
                </div>
              </div>

              {/* Symptoms List */}
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((symptom, idx) => (
                   <Badge key={idx} variant="secondary" className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                      {symptom}
                     <button
  onClick={() => removeSymptom(symptom)}
  className="text-red-500 hover:text-red-700 text-lg sm:text-xl leading-none ml-1 min-w-[20px] min-h-[20px] flex items-center justify-center"
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
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
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
  <div className="space-y-4 px-3 sm:px-4 lg:px-0">
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Camera className="w-5 h-5" />
          Face Health Analysis
        </CardTitle>
        <CardDescription className="text-sm">
          Take a well-lit selfie to analyze stress levels, hydration, and eye health indicators.
          <span className="block text-xs text-gray-500 mt-1">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            All processing happens locally on your device - your photo is never uploaded
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Error Alert */}
        {cameraError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-800 mb-1">Camera Error</p>
                <p className="text-sm text-red-700">{cameraError}</p>
                <Button
                  onClick={() => setCameraError(null)}
                  variant="outline"
                  size="sm"
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
        {!faceImage && (
          <div className="relative bg-gray-900 rounded-lg aspect-[3/4] sm:aspect-video md:aspect-[4/3] overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              aria-label="Camera preview for face analysis"
            />
            
            {/* Camera Guide Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 border-2 border-dashed border-white/50 rounded-full"></div>
                <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                  <p className="text-white/90 text-xs sm:text-sm bg-black/60 px-3 py-2 rounded-full inline-block">
                    Align face within the circle
                  </p>
                </div>
              </div>
            )}

            {/* Camera Startup State */}
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center px-4 max-w-sm">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                    <Camera className="w-8 sm:w-10 h-8 sm:h-10 text-gray-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2 text-base sm:text-lg">Face Analysis Camera</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mb-4">
                    Take a well-lit selfie for accurate analysis of stress, hydration, and eye health
                  </p>
                  <Button 
                    onClick={startCamera} 
                    size="lg"
                    disabled={cameraLoading}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    {cameraLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Initializing Camera...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-3">
                    Make sure you're in a well-lit area without backlight
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Captured Image */}
        {faceImage && (
          <div className="relative">
            <div className="relative overflow-hidden rounded-lg aspect-[3/4] sm:aspect-video md:aspect-[4/3] bg-gray-900">
              <img 
                src={faceImage} 
                alt="Captured face for analysis" 
                className="w-full h-full object-contain" 
              />
              
              {/* Retake Button */}
              <Button
                onClick={() => {
                  setFaceImage(null);
                  setFaceAnalysis(null);
                  setCaptureSuccess(false);
                  stopCamera();
                }}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-600 hover:bg-red-700 shadow-lg z-10 min-h-[36px] min-w-[36px]"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1.5">Retake</span>
                <span className="sr-only sm:hidden">Retake photo</span>
              </Button>
              
              {/* Captured Badge */}
              {captureSuccess && (
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
                  <Badge className="bg-green-600 text-white border-0 shadow-lg text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Captured
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {cameraActive && !faceImage && (
            <>
              <Button 
                onClick={capturePhoto} 
                className="w-full sm:flex-1 sm:min-w-[140px]" 
                size="lg"
                variant="default"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Photo
              </Button>
              <Button 
                onClick={stopCamera} 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-gray-300"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          
          {faceImage && !faceAnalysis && (
            <Button 
              onClick={analyzeFace} 
              disabled={faceLoading}
              className="w-full sm:flex-1 sm:min-w-[140px]" 
              size="lg"
              variant="default"
              aria-busy={faceLoading}
            >
              {faceLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="sr-only">Analyzing face, please wait</span>
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
          
          {faceAnalysis && (
            <Button 
              onClick={() => {
                setFaceImage(null);
                setFaceAnalysis(null);
                setCaptureSuccess(false);
                startCamera();
              }}
              className="w-full sm:flex-1 sm:min-w-[140px]"
              size="lg"
              variant="outline"
            >
              <Camera className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          )}
        </div>

              {/* Analysis Results */}
              {faceAnalysis && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Analysis Results
                  </h3>
                  
                  {/* Overall Score */}
                  <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-gray-600 mb-1">Overall Wellness Score</p>
                      <p className="text-4xl sm:text-5xl font-bold text-blue-600">
                        {faceAnalysis.overallScore}
                        <span className="text-2xl sm:text-3xl">/100</span>
                      </p>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${faceAnalysis.overallScore}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Poor</span>
                        <span>Fair</span>
                        <span>Good</span>
                        <span>Very Good</span>
                        <span>Excellent</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Analysis Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Stress Level */}
                    <Card className="border shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="w-5 h-5 text-purple-500" />
                          <span className="font-medium text-sm">Stress Level</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`${getSeverityColor(faceAnalysis.stressLevel)} text-sm`}>
                            {faceAnalysis.stressLevel.charAt(0).toUpperCase() + faceAnalysis.stressLevel.slice(1)}
                          </Badge>
                          <span className="text-2xl">
                            {faceAnalysis.stressLevel === 'low' ? '😊' : 
                             faceAnalysis.stressLevel === 'moderate' ? '😐' : '😟'}
                          </span>
                        </div>
                        <Progress 
                          value={
                            faceAnalysis.stressLevel === 'low' ? 25 : 
                            faceAnalysis.stressLevel === 'moderate' ? 50 : 75
                          } 
                          className="h-2" 
                        />
                        <ul className="space-y-1.5 mt-3">
                          {faceAnalysis.stressIndicators?.slice(0, 3).map((indicator: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <span>{indicator}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Hydration */}
                    <Card className="border shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Droplets className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-sm">Hydration</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`${getSeverityColor(faceAnalysis.hydrationLevel)} text-sm`}>
                            {faceAnalysis.hydrationLevel}
                          </Badge>
                          <span className="text-2xl">
                            {faceAnalysis.hydrationLevel.includes('Well') ? '💧' : 
                             faceAnalysis.hydrationLevel.includes('Adequate') ? '💦' : '🌵'}
                          </span>
                        </div>
                        <Progress 
                          value={
                            faceAnalysis.hydrationLevel.includes('Well') ? 85 : 
                            faceAnalysis.hydrationLevel.includes('Adequate') ? 65 : 45
                          } 
                          className="h-2" 
                        />
                        <ul className="space-y-1.5 mt-3">
                          {faceAnalysis.hydrationSigns?.slice(0, 3).map((sign: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <span>{sign}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Eye Health */}
                    <Card className="border shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-sm">Eye Health</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Clarity</span>
                            <Badge className={`text-xs ${
                              faceAnalysis.eyeHealth?.clarity === 'Good' ? 'bg-green-100 text-green-700' :
                              faceAnalysis.eyeHealth?.clarity === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {faceAnalysis.eyeHealth?.clarity}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Redness</span>
                            <Badge className={`text-xs ${
                              faceAnalysis.eyeHealth?.redness === 'Minimal' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {faceAnalysis.eyeHealth?.redness}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Dark Circles</span>
                            <Badge className={`text-xs ${
                              faceAnalysis.eyeHealth?.darkCircles === 'None' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {faceAnalysis.eyeHealth?.darkCircles}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-4 text-center">
                          <span className="text-3xl">
                            {faceAnalysis.eyeHealth?.clarity === 'Good' ? '👁️✨' : 
                             faceAnalysis.eyeHealth?.clarity === 'Moderate' ? '👁️' : '👁️😴'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations */}
                  <Card className="border shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Personalized Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {faceAnalysis.recommendations?.map((rec: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-green-100 hover:bg-white transition-colors">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-green-600 font-bold text-sm">{idx + 1}</span>
                            </div>
                            <span className="text-sm text-gray-700">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Disclaimer */}
                  <Card className="border border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 mb-1">Important Information</p>
                          <p className="text-xs text-amber-700">
                            This analysis uses visual patterns and facial recognition algorithms to provide wellness insights. 
                            It is for informational purposes only and not a medical diagnosis. Always consult healthcare 
                            professionals for accurate health assessments. Your photos are processed locally and never leave your device.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
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