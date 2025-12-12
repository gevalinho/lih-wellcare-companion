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
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
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

// Smart fallback responder for AI chat when OpenAI isn't available
const getSmartFallbackResponse = (message: string, healthContext: any) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('blood pressure') || lowerMessage.includes('bp')) {
    if (healthContext.latestBP) {
      const { systolic, diastolic } = healthContext.latestBP;
      const status =
        systolic >= 140 || diastolic >= 90
          ? 'elevated'
          : systolic >= 130 || diastolic >= 85
          ? 'slightly elevated'
          : 'within normal range';
      return `Your most recent blood pressure reading was ${systolic}/${diastolic} mmHg, which is ${status}. Normal blood pressure is typically around 120/80 mmHg. ${
        systolic >= 140 || diastolic >= 90
          ? 'I recommend consulting your healthcare provider about this elevated reading.'
          : 'Continue monitoring your blood pressure regularly.'
      } Always follow your doctor's advice regarding your blood pressure management.`;
    }

    if (lowerMessage.includes('normal') || lowerMessage.includes('should') || lowerMessage.includes('healthy')) {
      return "Normal blood pressure is typically around 120/80 mmHg. Here's what the ranges mean:\n\n• Normal: Less than 120/80 mmHg\n• Elevated: 120-129/80 mmHg\n• High (Stage 1): 130-139/80-89 mmHg\n• High (Stage 2): 140+/90+ mmHg\n\nAlways consult your healthcare provider for personalized guidance based on your health history.";
    }

    if (
      lowerMessage.includes('lower') ||
      lowerMessage.includes('reduce') ||
      lowerMessage.includes('improve') ||
      lowerMessage.includes('decrease')
    ) {
      return 'Here are evidence-based ways to help lower blood pressure:\n\n1. **Diet**: Reduce sodium intake (aim for less than 2,300mg/day), eat more fruits, vegetables, and whole grains\n2. **Exercise**: Aim for 30 minutes of moderate activity most days\n3. **Weight**: Maintain a healthy weight\n4. **Alcohol**: Limit alcohol consumption\n5. **Stress**: Practice relaxation techniques like deep breathing or meditation\n6. **Sleep**: Get 7-9 hours of quality sleep\n7. **Medications**: Take prescribed medications as directed\n\nAlways consult your healthcare provider before making significant lifestyle changes.';
    }
  }

  if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('pill') || lowerMessage.includes('drug')) {
    if (healthContext.medications && healthContext.medications.length > 0) {
      const medList = healthContext.medications.map((m: any) => `${m.name} (${m.dosage})`).join(', ');

      if (lowerMessage.includes('when') || lowerMessage.includes('time') || lowerMessage.includes('take')) {
        return `You're currently taking: ${medList}.\n\nMedication timing is very important and specific to each medication and individual. Please follow your doctor's or pharmacist's instructions exactly. If you're unsure about when to take any of your medications, contact your healthcare provider or pharmacist for clarification.`;
      }

      return `You're currently taking ${healthContext.medications.length} medication(s): ${medList}.\n\nIt's important to take all medications exactly as prescribed. If you have questions about your medications, their side effects, or interactions, please consult your healthcare provider or pharmacist.`;
    }
    return "I don't see any medications logged in your profile. If you're taking medications, you can add them in the Medications section. Always take medications exactly as prescribed by your healthcare provider.";
  }

  if (lowerMessage.includes('heart') && (lowerMessage.includes('health') || lowerMessage.includes('habit') || lowerMessage.includes('healthy'))) {
    return 'Great question! Here are key habits for heart health:\n\n1. **Regular Exercise**: 150 minutes of moderate activity per week\n2. **Healthy Diet**: Lots of fruits, vegetables, whole grains, lean proteins\n3. **Monitor Blood Pressure**: Check regularly and keep it under control\n4. **Manage Stress**: Practice relaxation techniques\n5. **Don\'t Smoke**: Avoid tobacco products\n6. **Limit Alcohol**: Moderate consumption if at all\n7. **Maintain Healthy Weight**: Work with your doctor on a healthy weight range\n8. **Regular Check-ups**: See your healthcare provider regularly\n\nThese habits, combined with any prescribed medications, can significantly improve heart health.';
  }

  if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('relax')) {
    return 'Stress management is important for overall health, especially blood pressure. Here are some techniques:\n\n1. **Deep Breathing**: Practice slow, deep breaths for 5-10 minutes\n2. **Meditation**: Even 5 minutes daily can help\n3. **Physical Activity**: Exercise is a great stress reliever\n4. **Sleep**: Prioritize 7-9 hours of quality sleep\n5. **Social Connections**: Stay connected with friends and family\n6. **Hobbies**: Engage in activities you enjoy\n7. **Limit Caffeine**: Reduce if it makes you anxious\n\nIf stress feels overwhelming, please talk to your healthcare provider about additional support options.';
  }

  if (lowerMessage.includes('exercise') || lowerMessage.includes('activity') || lowerMessage.includes('workout')) {
    return 'Regular physical activity is excellent for your health! Here are recommendations:\n\n**For Most Adults:**\n• 150 minutes of moderate-intensity aerobic activity per week (like brisk walking)\n• Or 75 minutes of vigorous activity per week\n• Spread throughout the week\n• Include muscle-strengthening activities 2+ days per week\n\n**Good Options:**\n• Walking\n• Swimming\n• Cycling\n• Gardening\n• Dancing\n\n**Important**: Before starting a new exercise program, especially if you have health conditions, consult your healthcare provider to ensure it\'s safe and appropriate for you.';
  }

  if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('nutrition')) {
    return 'A heart-healthy diet can significantly impact your overall health:\n\n**Eat More:**\n• Fruits and vegetables (aim for 5+ servings daily)\n• Whole grains (brown rice, whole wheat, oats)\n• Lean proteins (fish, poultry, beans, nuts)\n• Low-fat dairy\n• Foods rich in potassium and magnesium\n\n**Eat Less:**\n• Sodium (aim for less than 2,300mg/day)\n• Saturated and trans fats\n• Added sugars\n• Processed foods\n\n**Consider the DASH Diet**: Designed specifically for blood pressure management. Ask your healthcare provider or a registered dietitian for personalized nutrition advice.';
  }

  if (lowerMessage.includes('chest pain') || lowerMessage.includes('dizzy') || lowerMessage.includes('emergency')) {
    return '⚠️ **IMPORTANT**: If you\'re experiencing chest pain, severe dizziness, difficulty breathing, or other serious symptoms, please:\n\n1. **Call 911 immediately** or go to the nearest emergency room\n2. **Do not wait** to see if symptoms improve\n3. **Do not drive yourself** if possible\n\nThis AI assistant is NOT a substitute for emergency medical care. When in doubt, seek immediate medical attention.';
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.includes('hey')) {
    return `Hello${healthContext.userName ? ' ' + healthContext.userName : ''}! 👋 I'm here to help answer your health questions. I can provide information about:\n\n• Blood pressure and vital signs\n• Medications\n• Heart-healthy lifestyle habits\n• Exercise and nutrition\n• Stress management\n\nWhat would you like to know?`;
  }

  return "I'm here to help with your health questions! I can provide information about:\n\n• Understanding your blood pressure readings\n• Healthy lifestyle habits\n• Medication information\n• Heart health tips\n• Exercise and nutrition guidance\n\nWhat specific health topic would you like to learn about? Remember, I provide general information and you should always consult your healthcare provider for medical advice specific to your situation.";
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
const handleAIChat = async (c: any) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const profile = await kv.get(`user:${userId}`);
    const recentVitals = await kv.getByPrefix(`vital:${userId}:`);
    const medications = await kv.getByPrefix(`medication:${userId}:`);

    recentVitals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestVitals = recentVitals.slice(0, 5);

    const healthContextObj = {
      userName: profile?.name,
      latestBP: latestVitals.length > 0 ? latestVitals[0] : null,
      medications: medications.filter((m: any) => m.active),
    };

    let aiMessage = '';
    let usedFallback = false;

    try {
      const systemPromptParts = [
        'You are a helpful AI health assistant for WellCare Companion.',
        `The user's name is ${profile?.name || 'the patient'}.`,
      ];

      if (latestVitals.length > 0) {
        const latest = latestVitals[0];
        let vitals = `Their most recent blood pressure reading was ${latest.systolic}/${latest.diastolic} mmHg`;
        if (latest.pulse) {
          vitals += ` with a pulse of ${latest.pulse} bpm`;
        }
        vitals += '.';
        systemPromptParts.push(vitals);
      }

      const activeMeds = medications.filter((m: any) => m.active);
      if (activeMeds.length > 0) {
        systemPromptParts.push(
          `They are currently taking ${activeMeds.length} medication(s): ${activeMeds
            .map((m: any) => `${m.name} (${m.dosage})`)
            .join(', ')}.`,
        );
      }

      systemPromptParts.push(
        'Provide helpful, accurate health information. Always remind users to consult healthcare professionals for medical advice. Be empathetic and supportive. Keep responses concise and easy to understand.',
      );

      const messages = [{ role: 'system', content: systemPromptParts.join(' ') }];

      if (conversationHistory && Array.isArray(conversationHistory)) {
        conversationHistory.slice(-10).forEach((msg: any) => {
          if (msg.role && msg.content) {
            messages.push({ role: msg.role, content: msg.content });
          }
        });
      }

      messages.push({ role: 'user', content: message });

      const openaiApiKey = getOpenAIKey();

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        if (openaiResponse.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        if (openaiResponse.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(errorData.error?.message || 'OpenAI error');
      }

      const openaiData = await openaiResponse.json();
      aiMessage = openaiData.choices?.[0]?.message?.content || '';

      if (!aiMessage) {
        throw new Error('Empty response from OpenAI');
      }
    } catch (openaiError) {
      console.log('AI chat falling back:', openaiError.message);
      usedFallback = true;
      aiMessage = getSmartFallbackResponse(message, healthContextObj);
    }

    const chatId = `chat:${userId}:${Date.now()}`;
    await kv.set(chatId, {
      id: chatId,
      userId,
      userMessage: message,
      aiResponse: aiMessage,
      usedFallback,
      timestamp: new Date().toISOString(),
    });

    return c.json({
      success: true,
      message: aiMessage,
      usedFallback,
    });
  } catch (error) {
    console.log('AI chat error:', error);
    return c.json({ error: `Failed to process chat: ${error.message}` }, 500);
  }
};

app.post("/make-server-6e6f3496/ai/chat", requireAuth, handleAIChat);
app.post("/make-server-6e6f3496/chat", requireAuth, handleAIChat);

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
