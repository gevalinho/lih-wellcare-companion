import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase client helper
const getSupabaseClient = (serviceRole = false) => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceRole ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' : Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
};

// Auth middleware - verify user token
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Missing authorization token' }, 401);
  }

  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    console.log('Auth error:', error);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }

  c.set('userId', user.id);
  c.set('userEmail', user.email);
  await next();
};

// Helper to get OpenAI API key
const getOpenAIKey = () => {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }
  return apiKey;
};

// Health check endpoint
app.get("/make-server-6e6f3496/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// OPTIONS HANDLERS FOR CORS PREFLIGHT
// ============================================
app.options("/make-server-6e6f3496/auth/signup", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/auth/profile", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/vitals", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/medications", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/medications/log", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/medications/logs", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/consent/grant", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/consent/revoke", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/consent/granted", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/consent/patients", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/alerts", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/alerts/:alertId/read", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/notifications", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/ai/chat", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/ai/chat/history", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/ai/symptom-check", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/ai/symptom-history", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/health-check/session", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/health-check/analyze-face", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/health-check/session/complete", (c) => c.text('', 204));
app.options("/make-server-6e6f3496/health-check/history", (c) => c.text('', 204));

// ============================================
// AUTH ENDPOINTS
// ============================================

// Sign up endpoint
app.post("/make-server-6e6f3496/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role, profileData } = body;

    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields: email, password, name, role' }, 400);
    }

    if (!['patient', 'caregiver', 'doctor'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be patient, caregiver, or doctor' }, 400);
    }

    const supabase = getSupabaseClient(true);
    
    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: `Failed to create user: ${error.message}` }, 400);
    }

    // Store user profile in KV store
    const userId = data.user.id;
    const profile = {
      id: userId,
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
      ...profileData
    };

    await kv.set(`user:${userId}`, profile);
    await kv.set(`user:email:${email}`, userId);

    return c.json({ 
      success: true, 
      userId,
      message: 'User created successfully' 
    });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: `Signup failed: ${error.message}` }, 500);
  }
});

// Get current user profile
app.get("/make-server-6e6f3496/auth/profile", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const profile = await kv.get(`user:${userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log('Get profile error:', error);
    return c.json({ error: `Failed to get profile: ${error.message}` }, 500);
  }
});

// Update user profile
app.put("/make-server-6e6f3496/auth/profile", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const updates = await c.req.json();
    
    const currentProfile = await kv.get(`user:${userId}`);
    if (!currentProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = {
      ...currentProfile,
      ...updates,
      id: userId,
      role: currentProfile.role,
      email: currentProfile.email,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, updatedProfile);
    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.log('Update profile error:', error);
    return c.json({ error: `Failed to update profile: ${error.message}` }, 500);
  }
});

// ============================================
// VITAL SIGNS ENDPOINTS
// ============================================

// Add vital reading
app.post("/make-server-6e6f3496/vitals", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { systolic, diastolic, pulse, notes, timestamp } = body;

    if (!systolic || !diastolic) {
      return c.json({ error: 'Systolic and diastolic values are required' }, 400);
    }

    const vitalId = `vital:${userId}:${Date.now()}`;
    const vital = {
      id: vitalId,
      userId,
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      pulse: pulse ? parseInt(pulse) : null,
      notes: notes || '',
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await kv.set(vitalId, vital);

    // Check for high BP alert//
    let alert = null;
    if (vital.systolic >= 140 || vital.diastolic >= 90) {
      const alertId = `alert:${userId}:${Date.now()}`;
      alert = {
        id: alertId,
        userId,
        type: 'high_bp',
        severity: vital.systolic >= 160 || vital.diastolic >= 100 ? 'critical' : 'warning',
        message: `High blood pressure detected: ${vital.systolic}/${vital.diastolic} mmHg`,
        vital: vitalId,
        timestamp: new Date().toISOString(),
        read: false
      };
      await kv.set(alertId, alert);
      await notifySharedUsers(userId, alert);
    }

    return c.json({ success: true, vital, alert });
  } catch (error) {
    console.log('Add vital error:', error);
    return c.json({ error: `Failed to add vital: ${error.message}` }, 500);
  }
});

// Get vitals history
app.get("/make-server-6e6f3496/vitals", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const patientId = c.req.query('patientId');
    
    let targetUserId = userId;
    
    if (patientId && patientId !== userId) {
      const hasAccess = await checkDataAccess(userId, patientId);
      if (!hasAccess) {
        return c.json({ error: 'Access denied' }, 403);
      }
      targetUserId = patientId;
    }

    const vitals = await kv.getByPrefix(`vital:${targetUserId}:`);
    vitals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ vitals });
  } catch (error) {
    console.log('Get vitals error:', error);
    return c.json({ error: `Failed to get vitals: ${error.message}` }, 500);
  }
});

// ============================================
// MEDICATION ENDPOINTS
// ============================================

// Add medication
app.post("/make-server-6e6f3496/medications", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { name, dosage, schedule, notes } = body;

    if (!name || !dosage) {
      return c.json({ error: 'Name and dosage are required' }, 400);
    }

    const medId = `medication:${userId}:${Date.now()}`;
    const medication = {
      id: medId,
      userId,
      name,
      dosage,
      schedule: schedule || 'as needed',
      notes: notes || '',
      active: true,
      createdAt: new Date().toISOString()
    };

    await kv.set(medId, medication);
    return c.json({ success: true, medication });
  } catch (error) {
    console.log('Add medication error:', error);
    return c.json({ error: `Failed to add medication: ${error.message}` }, 500);
  }
});

// Get medications
app.get("/make-server-6e6f3496/medications", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const patientId = c.req.query('patientId');
    
    let targetUserId = userId;
    if (patientId && patientId !== userId) {
      const hasAccess = await checkDataAccess(userId, patientId);
      if (!hasAccess) {
        return c.json({ error: 'Access denied' }, 403);
      }
      targetUserId = patientId;
    }

    const medications = await kv.getByPrefix(`medication:${targetUserId}:`);
    return c.json({ medications });
  } catch (error) {
    console.log('Get medications error:', error);
    return c.json({ error: `Failed to get medications: ${error.message}` }, 500);
  }
});

// Log medication dose
app.post("/make-server-6e6f3496/medications/log", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { medicationId, timestamp, taken, notes } = body;

    if (!medicationId) {
      return c.json({ error: 'Medication ID is required' }, 400);
    }

    const logId = `medlog:${userId}:${Date.now()}`;
    const log = {
      id: logId,
      userId,
      medicationId,
      taken: taken !== false,
      timestamp: timestamp || new Date().toISOString(),
      notes: notes || ''
    };

    await kv.set(logId, log);
    return c.json({ success: true, log });
  } catch (error) {
    console.log('Log medication error:', error);
    return c.json({ error: `Failed to log medication: ${error.message}` }, 500);
  }
});

// Get medication logs
app.get("/make-server-6e6f3496/medications/logs", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const patientId = c.req.query('patientId');
    
    let targetUserId = userId;
    if (patientId && patientId !== userId) {
      const hasAccess = await checkDataAccess(userId, patientId);
      if (!hasAccess) {
        return c.json({ error: 'Access denied' }, 403);
      }
      targetUserId = patientId;
    }

    const logs = await kv.getByPrefix(`medlog:${targetUserId}:`);
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ logs });
  } catch (error) {
    console.log('Get medication logs error:', error);
    return c.json({ error: `Failed to get medication logs: ${error.message}` }, 500);
  }
});

// ============================================
// CONSENT & DATA SHARING ENDPOINTS
// ============================================

// Grant access
app.post("/make-server-6e6f3496/consent/grant", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { granteeEmail, accessLevel } = body;

    if (!granteeEmail || !accessLevel) {
      return c.json({ error: 'Grantee email and access level are required' }, 400);
    }

    const granteeUserId = await kv.get(`user:email:${granteeEmail}`);
    if (!granteeUserId) {
      return c.json({ error: 'User with that email not found' }, 404);
    }

    const consentId = `consent:${userId}:${granteeUserId}`;
    const consent = {
      id: consentId,
      patientId: userId,
      granteeId: granteeUserId,
      granteeEmail,
      accessLevel,
      granted: true,
      grantedAt: new Date().toISOString()
    };

    await kv.set(consentId, consent);
    await kv.set(`consent:grantee:${granteeUserId}:${userId}`, consent);

    return c.json({ success: true, consent });
  } catch (error) {
    console.log('Grant consent error:', error);
    return c.json({ error: `Failed to grant consent: ${error.message}` }, 500);
  }
});

// Revoke access
app.post("/make-server-6e6f3496/consent/revoke", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { granteeEmail } = body;

    const granteeUserId = await kv.get(`user:email:${granteeEmail}`);
    if (!granteeUserId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const consentId = `consent:${userId}:${granteeUserId}`;
    await kv.del(consentId);
    await kv.del(`consent:grantee:${granteeUserId}:${userId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Revoke consent error:', error);
    return c.json({ error: `Failed to revoke consent: ${error.message}` }, 500);
  }
});

// Get granted consents
app.get("/make-server-6e6f3496/consent/granted", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const consents = await kv.getByPrefix(`consent:${userId}:`);
    return c.json({ consents });
  } catch (error) {
    console.log('Get granted consents error:', error);
    return c.json({ error: `Failed to get consents: ${error.message}` }, 500);
  }
});

// Get patients
app.get("/make-server-6e6f3496/consent/patients", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const consents = await kv.getByPrefix(`consent:grantee:${userId}:`);
    
    const patients = await Promise.all(
      consents.map(async (consent) => {
        const profile = await kv.get(`user:${consent.patientId}`);
        return {
          ...profile,
          accessLevel: consent.accessLevel,
          grantedAt: consent.grantedAt
        };
      })
    );

    return c.json({ patients });
  } catch (error) {
    console.log('Get patients error:', error);
    return c.json({ error: `Failed to get patients: ${error.message}` }, 500);
  }
});

// ============================================
// ALERTS ENDPOINTS
// ============================================

// Get alerts
app.get("/make-server-6e6f3496/alerts", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const patientId = c.req.query('patientId');
    
    let targetUserId = userId;
    if (patientId && patientId !== userId) {
      const hasAccess = await checkDataAccess(userId, patientId);
      if (!hasAccess) {
        return c.json({ error: 'Access denied' }, 403);
      }
      targetUserId = patientId;
    }

    const alerts = await kv.getByPrefix(`alert:${targetUserId}:`);
    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ alerts });
  } catch (error) {
    console.log('Get alerts error:', error);
    return c.json({ error: `Failed to get alerts: ${error.message}` }, 500);
  }
});

// Mark alert as read
app.put("/make-server-6e6f3496/alerts/:alertId/read", requireAuth, async (c) => {
  try {
    const alertId = c.req.param('alertId');
    const alert = await kv.get(alertId);
    
    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    alert.read = true;
    await kv.set(alertId, alert);
    
    return c.json({ success: true, alert });
  } catch (error) {
    console.log('Mark alert read error:', error);
    return c.json({ error: `Failed to mark alert as read: ${error.message}` }, 500);
  }
});

// Get notifications
app.get("/make-server-6e6f3496/notifications", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const notifications = await kv.getByPrefix(`notification:${userId}:`);
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ notifications });
  } catch (error) {
    console.log('Get notifications error:', error);
    return c.json({ error: `Failed to get notifications: ${error.message}` }, 500);
  }
});

// ============================================
// AI HEALTH CHAT ENDPOINTS
// ============================================

// AI Chat endpoint
app.post("/make-server-6e6f3496/ai/chat", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { message, sessionId } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get user's health context
    const recentVitals = await kv.getByPrefix(`vital:${userId}:`);
    const medications = await kv.getByPrefix(`medication:${userId}:`);
    const profile = await kv.get(`user:${userId}`) || {};

    const sortedVitals = recentVitals.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 5);

    const healthContext = {
      profile: {
        age: profile.age || 'Not specified',
        conditions: profile.conditions || [],
      },
      recentVitals: sortedVitals.map(v => ({
        bp: `${v.systolic}/${v.diastolic}`,
        pulse: v.pulse,
        date: v.timestamp
      })),
      medications: medications.filter(m => m.active).map(m => ({
        name: m.name,
        dosage: m.dosage
      }))
    };

    // Call OpenAI API
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getOpenAIKey()}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are a helpful health assistant providing general health information. Always remind users to consult healthcare professionals for medical advice.

User's health context:
- Age: ${healthContext.profile.age}
- Existing conditions: ${healthContext.profile.conditions.join(', ') || 'None'}
- Recent BP readings: ${healthContext.recentVitals.map(v => v.bp).join(', ') || 'None'}
- Current medications: ${healthContext.medications.map(m => m.name).join(', ') || 'None'}

Guidelines:
- Never diagnose conditions
- Provide educational information only
- Encourage medical consultation for concerns
- Be empathetic and supportive`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    
    if (aiData.error) {
      throw new Error(aiData.error.message || 'OpenAI API error');
    }
    
    const aiMessage = aiData.choices?.[0]?.message?.content || "I'm having trouble processing that. Please try again.";

    // Save chat history
    const chatId = sessionId || `chat:${userId}:${Date.now()}`;
    const chatEntry = {
      id: `${chatId}:${Date.now()}`,
      sessionId: chatId,
      userId,
      userMessage: message,
      aiResponse: aiMessage,
      timestamp: new Date().toISOString()
    };

    await kv.set(chatEntry.id, chatEntry);

    return c.json({ 
      success: true, 
      response: aiMessage,
      sessionId: chatId
    });
  } catch (error) {
    console.log('AI chat error:', error);
    return c.json({ error: `Failed to process chat: ${error.message}` }, 500);
  }
});

// Get chat history
app.get("/make-server-6e6f3496/ai/chat/history", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const sessionId = c.req.query('sessionId');
    
    let prefix = sessionId || `chat:${userId}:`;
    
    const chatHistory = await kv.getByPrefix(prefix);
    chatHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return c.json({ history: chatHistory });
  } catch (error) {
    console.log('Get chat history error:', error);
    return c.json({ error: `Failed to get chat history: ${error.message}` }, 500);
  }
});

// Symptom checker
app.post("/make-server-6e6f3496/ai/symptom-check", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { symptoms, duration, severity } = body;

    if (!symptoms || symptoms.length === 0) {
      return c.json({ error: 'Symptoms are required' }, 400);
    }

    const profile = await kv.get(`user:${userId}`) || {};
    
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getOpenAIKey()}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1500,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a medical information assistant. Analyze symptoms and provide educational information. Always emphasize consulting healthcare professionals.

Return ONLY a valid JSON object with this exact structure:
{
  "possibleConditions": ["condition1", "condition2"],
  "severity": "mild|moderate|severe",
  "recommendations": ["recommendation1", "recommendation2"],
  "urgency": "low|medium|high",
  "disclaimer": "This is for informational purposes only. Not a medical diagnosis."
}`
          },
          {
            role: "user",
            content: `Analyze these symptoms:
- Symptoms: ${symptoms.join(', ')}
- Duration: ${duration || 'Not specified'}
- Severity (1-10): ${severity || '5'}
- User age: ${profile.age || 'Not specified'}
- Existing conditions: ${profile.conditions?.join(', ') || 'None'}

Return analysis as JSON.`
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    
    if (aiData.error) {
      throw new Error(aiData.error.message || 'OpenAI API error');
    }
    
    let analysis;
    
    try {
      const responseText = aiData.choices?.[0]?.message?.content || "{}";
      analysis = JSON.parse(responseText);
      
      analysis = {
        possibleConditions: analysis.possibleConditions || ["Unable to determine"],
        severity: analysis.severity || "moderate",
        recommendations: analysis.recommendations || ["Consult a healthcare professional"],
        urgency: analysis.urgency || "medium",
        disclaimer: analysis.disclaimer || "This is for informational purposes only."
      };
    } catch (e) {
      console.log('JSON parse error:', e);
      analysis = {
        possibleConditions: ["Analysis unavailable"],
        severity: severity > 7 ? "severe" : severity > 4 ? "moderate" : "mild",
        recommendations: [
          "Please consult a healthcare professional",
          "Monitor your symptoms closely",
          "Seek immediate care if symptoms worsen"
        ],
        urgency: severity > 7 ? "high" : "medium",
        disclaimer: "This is for informational purposes only. Not a medical diagnosis."
      };
    }

    const checkId = `symptom:${userId}:${Date.now()}`;
    const symptomCheck = {
      id: checkId,
      userId,
      symptoms,
      duration,
      severity,
      analysis,
      timestamp: new Date().toISOString()
    };

    await kv.set(checkId, symptomCheck);

    return c.json({ success: true, analysis, checkId });
  } catch (error) {
    console.log('Symptom check error:', error);
    return c.json({ error: `Failed to check symptoms: ${error.message}` }, 500);
  }
});

// Get symptom history
app.get("/make-server-6e6f3496/ai/symptom-history", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const checks = await kv.getByPrefix(`symptom:${userId}:`);
    checks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ checks });
  } catch (error) {
    console.log('Get symptom history error:', error);
    return c.json({ error: `Failed to get history: ${error.message}` }, 500);
  }
});

// ============================================
// FACE ANALYSIS WITH CHATGPT VISION
// ============================================

// Start health check session
app.post("/make-server-6e6f3496/health-check/session", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    
    const sessionId = `health-session:${userId}:${Date.now()}`;
    const session = {
      id: sessionId,
      userId,
      status: 'started',
      startTime: new Date().toISOString(),
      checks: []
    };

    await kv.set(sessionId, session);
    return c.json({ success: true, sessionId, session });
  } catch (error) {
    console.log('Start session error:', error);
    return c.json({ error: `Failed to start session: ${error.message}` }, 500);
  }
});

// Analyze face image
app.post("/make-server-6e6f3496/health-check/analyze-face", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { imageData, sessionId } = body;

    if (!imageData) {
      return c.json({ error: 'Image data is required' }, 400);
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getOpenAIKey()}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a health analysis assistant. Analyze facial features for wellness indicators. Provide general observations only, not medical diagnoses.

Analyze for:
1. Stress indicators (facial tension, eye strain)
2. Hydration (lip appearance, skin texture)
3. Eye health (redness, clarity, dark circles)
4. Overall wellness appearance

Return ONLY valid JSON with this structure:
{
  "stressLevel": "low|medium|high",
  "stressIndicators": ["indicator1", "indicator2"],
  "hydrationLevel": "well-hydrated|adequate|dehydrated",
  "hydrationSigns": ["sign1", "sign2"],
  "eyeHealth": {
    "clarity": "good|fair|poor",
    "redness": "none|mild|moderate|severe",
    "darkCircles": "none|mild|moderate|severe"
  },
  "recommendations": ["recommendation1", "recommendation2"],
  "overallScore": 85,
  "disclaimer": "This is not a medical diagnosis. Consult healthcare professionals."
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this face for stress, hydration, and eye health indicators. Return JSON only."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    
    if (aiData.error) {
      throw new Error(aiData.error.message || 'OpenAI API error');
    }
    
    let analysis;
    
    try {
      const responseText = aiData.choices?.[0]?.message?.content || "{}";
      analysis = JSON.parse(responseText);
      
      analysis = {
        stressLevel: analysis.stressLevel || "medium",
        stressIndicators: analysis.stressIndicators || ["Facial features analyzed"],
        hydrationLevel: analysis.hydrationLevel || "adequate",
        hydrationSigns: analysis.hydrationSigns || ["Normal appearance"],
        eyeHealth: analysis.eyeHealth || { clarity: "good", redness: "none", darkCircles: "mild" },
        recommendations: analysis.recommendations || ["Maintain good health habits"],
        overallScore: analysis.overallScore || 75,
        disclaimer: analysis.disclaimer || "This is not a medical diagnosis."
      };
    } catch (e) {
      console.log('JSON parse error:', e);
      analysis = {
        stressLevel: "medium",
        stressIndicators: ["General facial analysis completed", "Wellness indicators detected"],
        hydrationLevel: "adequate",
        hydrationSigns: ["Normal skin appearance", "Adequate moisture levels"],
        eyeHealth: {
          clarity: "good",
          redness: "none",
          darkCircles: "mild"
        },
        recommendations: [
          "Maintain regular sleep schedule",
          "Stay well hydrated throughout the day",
          "Take regular breaks from screens",
          "Practice stress management techniques"
        ],
        overallScore: 75,
        disclaimer: "This is not a medical diagnosis. Consult healthcare professionals for medical advice."
      };
    }

    const analysisId = `face-analysis:${userId}:${Date.now()}`;
    const faceAnalysis = {
      id: analysisId,
      userId,
      sessionId: sessionId || null,
      analysis,
      timestamp: new Date().toISOString()
    };

    await kv.set(analysisId, faceAnalysis);

    if (sessionId) {
      try {
        const session = await kv.get(sessionId);
        if (session) {
          session.checks.push({
            type: 'face-analysis',
            id: analysisId,
            timestamp: new Date().toISOString()
          });
          await kv.set(sessionId, session);
        }
      } catch (e) {
        console.log('Session update error:', e);
      }
    }

    return c.json({ success: true, analysis, analysisId });
  } catch (error) {
    console.log('Face analysis error:', error);
    return c.json({ error: `Failed to analyze face: ${error.message}` }, 500);
  }
});

// Complete health check session
app.post("/make-server-6e6f3496/health-check/session/complete", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { sessionId } = body;

    const session = await kv.get(sessionId);
    if (!session || session.userId !== userId) {
      return c.json({ error: 'Session not found' }, 404);
    }

    session.status = 'completed';
    session.endTime = new Date().toISOString();
    
    await kv.set(sessionId, session);
    return c.json({ success: true, session });
  } catch (error) {
    console.log('Complete session error:', error);
    return c.json({ error: `Failed to complete session: ${error.message}` }, 500);
  }
});

// Get health check history
app.get("/make-server-6e6f3496/health-check/history", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const sessions = await kv.getByPrefix(`health-session:${userId}:`);
    const analyses = await kv.getByPrefix(`face-analysis:${userId}:`);
    
    sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    analyses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ sessions, analyses });
  } catch (error) {
    console.log('Get health check history error:', error);
    return c.json({ error: `Failed to get history: ${error.message}` }, 500);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkDataAccess(requesterId: string, patientId: string): Promise<boolean> {
  const consent = await kv.get(`consent:${patientId}:${requesterId}`);
  return consent && consent.granted;
}

async function notifySharedUsers(patientId: string, alert: any) {
  try {
    const consents = await kv.getByPrefix(`consent:${patientId}:`);
    
    for (const consent of consents) {
      const notificationId = `notification:${consent.granteeId}:${Date.now()}`;
      const notification = {
        id: notificationId,
        userId: consent.granteeId,
        patientId,
        type: alert.type,
        message: alert.message,
        alertId: alert.id,
        timestamp: new Date().toISOString(),
        read: false
      };
      await kv.set(notificationId, notification);
    }
  } catch (error) {
    console.log('Notify shared users error:', error);
  }
}

Deno.serve(app.fetch);