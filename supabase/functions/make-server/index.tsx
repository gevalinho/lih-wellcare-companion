// // ============================================
// // AI CHAT ENDPOINTS
// // ============================================

// // Smart AI response with fallback
// function getSmartFallbackResponse(message: string, healthContext: any): string {
//   const lowerMessage = message.toLowerCase();
  
//   // Blood Pressure Questions
//   if (lowerMessage.includes('blood pressure') || lowerMessage.includes('bp')) {
//     if (lowerMessage.includes('recent') || lowerMessage.includes('latest') || lowerMessage.includes('mean') || lowerMessage.includes('reading')) {
//       if (healthContext.latestBP) {
//         const { systolic, diastolic } = healthContext.latestBP;
//         const status = systolic >= 140 || diastolic >= 90 ? 'elevated' : systolic >= 130 || diastolic >= 85 ? 'slightly elevated' : 'within normal range';
//         return `Your most recent blood pressure reading was ${systolic}/${diastolic} mmHg, which is ${status}. Normal blood pressure is typically around 120/80 mmHg. ${systolic >= 140 || diastolic >= 90 ? 'I recommend consulting your healthcare provider about this elevated reading.' : 'Continue monitoring your blood pressure regularly.'} Always follow your doctor's advice regarding your blood pressure management.`;
//       }
//       return "Based on general guidelines, normal blood pressure is around 120/80 mmHg. Values consistently above 130/85 mmHg may be considered elevated. I recommend logging your blood pressure readings regularly and discussing them with your healthcare provider.";
//     }
    
//     if (lowerMessage.includes('normal') || lowerMessage.includes('should') || lowerMessage.includes('healthy')) {
//       return "Normal blood pressure is typically around 120/80 mmHg. Here's what the ranges mean:\n\n• Normal: Less than 120/80 mmHg\n• Elevated: 120-129/80 mmHg\n• High (Stage 1): 130-139/80-89 mmHg\n• High (Stage 2): 140+/90+ mmHg\n\nAlways consult your healthcare provider for personalized guidance based on your health history.";
//     }
    
//     if (lowerMessage.includes('lower') || lowerMessage.includes('reduce') || lowerMessage.includes('improve') || lowerMessage.includes('decrease')) {
//       return "Here are evidence-based ways to help lower blood pressure:\n\n1. **Diet**: Reduce sodium intake (aim for less than 2,300mg/day), eat more fruits, vegetables, and whole grains\n2. **Exercise**: Aim for 30 minutes of moderate activity most days\n3. **Weight**: Maintain a healthy weight\n4. **Alcohol**: Limit alcohol consumption\n5. **Stress**: Practice relaxation techniques like deep breathing or meditation\n6. **Sleep**: Get 7-9 hours of quality sleep\n7. **Medications**: Take prescribed medications as directed\n\nAlways consult your healthcare provider before making significant lifestyle changes.";
//     }
//   }
  
//   // Medication Questions
//   if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('pill') || lowerMessage.includes('drug')) {
//     if (healthContext.medications && healthContext.medications.length > 0) {
//       const medList = healthContext.medications.map((m: any) => `${m.name} (${m.dosage})`).join(', ');
      
//       if (lowerMessage.includes('when') || lowerMessage.includes('time') || lowerMessage.includes('take')) {
//         return `You're currently taking: ${medList}.\n\nMedication timing is very important and specific to each medication and individual. Please follow your doctor's or pharmacist's instructions exactly. If you're unsure about when to take any of your medications, contact your healthcare provider or pharmacist for clarification.`;
//       }
      
//       return `You're currently taking ${healthContext.medications.length} medication(s): ${medList}.\n\nIt's important to take all medications exactly as prescribed. If you have questions about your medications, their side effects, or interactions, please consult your healthcare provider or pharmacist.`;
//     }
//     return "I don't see any medications logged in your profile. If you're taking medications, you can add them in the Medications section. Always take medications exactly as prescribed by your healthcare provider.";
//   }
  
//   // Heart Health
//   if (lowerMessage.includes('heart') && (lowerMessage.includes('health') || lowerMessage.includes('habit') || lowerMessage.includes('healthy'))) {
//     return "Great question! Here are key habits for heart health:\n\n1. **Regular Exercise**: 150 minutes of moderate activity per week\n2. **Healthy Diet**: Lots of fruits, vegetables, whole grains, lean proteins\n3. **Monitor Blood Pressure**: Check regularly and keep it under control\n4. **Manage Stress**: Practice relaxation techniques\n5. **Don't Smoke**: Avoid tobacco products\n6. **Limit Alcohol**: Moderate consumption if at all\n7. **Maintain Healthy Weight**: Work with your doctor on a healthy weight range\n8. **Regular Check-ups**: See your healthcare provider regularly\n\nThese habits, combined with any prescribed medications, can significantly improve heart health.";
//   }
  
//   // Stress Management
//   if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('relax')) {
//     return "Stress management is important for overall health, especially blood pressure. Here are some techniques:\n\n1. **Deep Breathing**: Practice slow, deep breaths for 5-10 minutes\n2. **Meditation**: Even 5 minutes daily can help\n3. **Physical Activity**: Exercise is a great stress reliever\n4. **Sleep**: Prioritize 7-9 hours of quality sleep\n5. **Social Connections**: Stay connected with friends and family\n6. **Hobbies**: Engage in activities you enjoy\n7. **Limit Caffeine**: Reduce if it makes you anxious\n\nIf stress feels overwhelming, please talk to your healthcare provider about additional support options.";
//   }
  
//   // Exercise
//   if (lowerMessage.includes('exercise') || lowerMessage.includes('activity') || lowerMessage.includes('workout')) {
//     return "Regular physical activity is excellent for your health! Here are recommendations:\n\n**For Most Adults:**\n• 150 minutes of moderate-intensity aerobic activity per week (like brisk walking)\n• Or 75 minutes of vigorous activity per week\n• Spread throughout the week\n• Include muscle-strengthening activities 2+ days per week\n\n**Good Options:**\n• Walking\n• Swimming\n• Cycling\n• Gardening\n• Dancing\n\n**Important**: Before starting a new exercise program, especially if you have health conditions, consult your healthcare provider to ensure it's safe and appropriate for you.";
//   }
  
//   // Diet/Nutrition
//   if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('nutrition')) {
//     return "A heart-healthy diet can significantly impact your overall health:\n\n**Eat More:**\n• Fruits and vegetables (aim for 5+ servings daily)\n• Whole grains (brown rice, whole wheat, oats)\n• Lean proteins (fish, poultry, beans, nuts)\n• Low-fat dairy\n• Foods rich in potassium and magnesium\n\n**Eat Less:**\n• Sodium (aim for less than 2,300mg/day)\n• Saturated and trans fats\n• Added sugars\n• Processed foods\n\n**Consider the DASH Diet**: Designed specifically for blood pressure management. Ask your healthcare provider or a registered dietitian for personalized nutrition advice.";
//   }
  
//   // Symptoms or Emergency
//   if (lowerMessage.includes('chest pain') || lowerMessage.includes('dizzy') || lowerMessage.includes('emergency')) {
//     return "⚠️ **IMPORTANT**: If you're experiencing chest pain, severe dizziness, difficulty breathing, or other serious symptoms, please:\n\n1. **Call 911 immediately** or go to the nearest emergency room\n2. **Do not wait** to see if symptoms improve\n3. **Do not drive yourself** if possible\n\nThis AI assistant is NOT a substitute for emergency medical care. When in doubt, seek immediate medical attention.";
//   }
  
//   // General greeting
//   if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.includes('hey')) {
//     return `Hello${healthContext.userName ? ' ' + healthContext.userName : ''}! 👋 I'm here to help answer your health questions. I can provide information about:\n\n• Blood pressure and vital signs\n• Medications\n• Heart-healthy lifestyle habits\n• Exercise and nutrition\n• Stress management\n\nWhat would you like to know?`;
//   }
  
//   // Default response
//   return "I'm here to help with your health questions! I can provide information about:\n\n• Understanding your blood pressure readings\n• Healthy lifestyle habits\n• Medication information\n• Heart health tips\n• Exercise and nutrition guidance\n\nWhat specific health topic would you like to learn about? Remember, I provide general information and you should always consult your healthcare provider for medical advice specific to your situation.";
// }

// // AI Health Assistant Chat
// app.post("/make-server-6e6f3496/chat", requireAuth, async (c) => {
//   try {
//     const userId = c.get('userId');
//     const body = await c.req.json();
//     const { message, conversationHistory } = body;

//     if (!message) {
//       return c.json({ error: 'Message is required' }, 400);
//     }

//     // Get user's health data for context
//     const profile = await kv.get(`user:${userId}`);
//     const recentVitals = await kv.getByPrefix(`vital:${userId}:`);
//     const medications = await kv.getByPrefix(`medication:${userId}:`);

//     // Sort vitals by timestamp and get most recent
//     recentVitals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
//     const latestVitals = recentVitals.slice(0, 5);

//     // Build health context object for fallback
//     const healthContextObj = {
//       userName: profile?.name,
//       latestBP: latestVitals.length > 0 ? latestVitals[0] : null,
//       medications: medications.filter((m: any) => m.active)
//     };

//     // Try OpenAI first, fall back to smart responses if rate limited
//     let aiMessage = '';
//     let usedFallback = false;

//     try {
//       // Build context for AI
//       let healthContext = `You are a helpful AI health assistant for WellCare Companion. `;
//       healthContext += `The user's name is ${profile?.name || 'the patient'}. `;
      
//       if (latestVitals.length > 0) {
//         const latest = latestVitals[0];
//         healthContext += `Their most recent blood pressure reading was ${latest.systolic}/${latest.diastolic} mmHg`;
//         if (latest.pulse) {
//           healthContext += ` with a pulse of ${latest.pulse} bpm`;
//         }
//         healthContext += `. `;
//       }

//       if (medications.length > 0) {
//         const activeMeds = medications.filter((m: any) => m.active);
//         if (activeMeds.length > 0) {
//           healthContext += `They are currently taking ${activeMeds.length} medication(s): `;
//           healthContext += activeMeds.map((m: any) => `${m.name} (${m.dosage})`).join(', ') + '. ';
//         }
//       }

//       healthContext += `\n\nProvide helpful, accurate health information. Always remind users to consult healthcare professionals for medical advice. Be empathetic and supportive. Keep responses concise and easy to understand.`;

//       // Prepare messages for OpenAI
//       const messages = [
//         { role: 'system', content: healthContext },
//       ];

//       // Add conversation history (last 10 messages)
//       if (conversationHistory && Array.isArray(conversationHistory)) {
//         conversationHistory.slice(-10).forEach((msg: any) => {
//           messages.push({
//             role: msg.role,
//             content: msg.content
//           });
//         });
//       }

//       // Add current user message
//       messages.push({ role: 'user', content: message });

//       // Call OpenAI API
//       const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
//       if (!openaiApiKey) {
//         console.log('OpenAI API key not configured - using fallback');
//         throw new Error('API key not configured');
//       }

//       console.log('Calling OpenAI API with', messages.length, 'messages');

//       const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${openaiApiKey}`
//         },
//         body: JSON.stringify({
//           model: 'gpt-3.5-turbo',
//           messages: messages,
//           temperature: 0.7,
//           max_tokens: 500
//         })
//       });

//       if (!openaiResponse.ok) {
//         const errorData = await openaiResponse.json().catch(() => ({ error: 'Unknown error' }));
//         console.log('OpenAI API error response:', JSON.stringify(errorData));
//         console.log('OpenAI API status:', openaiResponse.status, openaiResponse.statusText);
        
//         // Throw error to trigger fallback
//         if (openaiResponse.status === 429) {
//           throw new Error('Rate limit exceeded');
//         } else if (openaiResponse.status === 401) {
//           throw new Error('Invalid API key');
//         } else {
//           throw new Error(errorData.error?.message || 'API error');
//         }
//       }

//       const openaiData = await openaiResponse.json();
//       console.log('OpenAI response received successfully');
      
//       aiMessage = openaiData.choices[0]?.message?.content || '';
      
//       if (!aiMessage) {
//         throw new Error('Empty response from OpenAI');
//       }

//     } catch (openaiError) {
//       console.log('OpenAI error, using smart fallback:', openaiError.message);
//       usedFallback = true;
//       aiMessage = getSmartFallbackResponse(message, healthContextObj);
//     }

//     // Store chat history
//     const chatId = `chat:${userId}:${Date.now()}`;
//     const chatRecord = {
//       id: chatId,
//       userId,
//       userMessage: message,
//       aiResponse: aiMessage,
//       usedFallback,
//       timestamp: new Date().toISOString()
//     };
//     await kv.set(chatId, chatRecord);

//     return c.json({ 
//       success: true, 
//       message: aiMessage,
//       usedFallback
//     });
//   } catch (error) {
//     console.log('Chat error:', error);
//     return c.json({ error: `Failed to process chat: ${error.message}` }, 500);
//   }
// });

// // Get chat history
// app.get("/make-server-6e6f3496/chat/history", requireAuth, async (c) => {
//   try {
//     const userId = c.get('userId');
//     const chats = await kv.getByPrefix(`chat:${userId}:`);
//     chats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
//     return c.json({ chats });
//   } catch (error) {
//     console.log('Get chat history error:', error);
//     return c.json({ error: `Failed to get chat history: ${error.message}` }, 500);
//   }
// });


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

// Health check endpoint
app.get("/make-server-6e6f3496/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
      email_confirm: true, // Auto-confirm since we don't have email server configured
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
    await kv.set(`user:email:${email}`, userId); // Index by email

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
      id: userId, // Don't allow changing ID
      role: currentProfile.role, // Don't allow changing role
      email: currentProfile.email, // Don't allow changing email
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

// Add vital reading (BP, pulse, etc.)
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

    // Check for high BP alert
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

      // Notify caregivers and doctors with access
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
    const patientId = c.req.query('patientId'); // For caregivers/doctors viewing patient data
    
    let targetUserId = userId;
    
    // If viewing another user's data, check permissions
    if (patientId && patientId !== userId) {
      const hasAccess = await checkDataAccess(userId, patientId);
      if (!hasAccess) {
        return c.json({ error: 'Access denied' }, 403);
      }
      targetUserId = patientId;
    }

    const vitals = await kv.getByPrefix(`vital:${targetUserId}:`);
    
    // Sort by timestamp (newest first)
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

// Log medication dose taken
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
      taken: taken !== false, // Default to true
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

// Grant access to caregiver or doctor
app.post("/make-server-6e6f3496/consent/grant", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { granteeEmail, accessLevel } = body;

    if (!granteeEmail || !accessLevel) {
      return c.json({ error: 'Grantee email and access level are required' }, 400);
    }

    // Find grantee user
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
      accessLevel, // 'view' or 'full'
      granted: true,
      grantedAt: new Date().toISOString()
    };

    await kv.set(consentId, consent);
    
    // Also create reverse index for quick lookup
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

// Get granted consents (who can access my data)
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

// Get patients I have access to (for caregivers/doctors)
app.get("/make-server-6e6f3496/consent/patients", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const consents = await kv.getByPrefix(`consent:grantee:${userId}:`);
    
    // Fetch patient profiles
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

// Get notifications (for caregivers/doctors)
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
// AI CHAT ENDPOINTS
// ============================================

// Smart AI response with fallback
function getSmartFallbackResponse(message: string, healthContext: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Blood Pressure Questions
  if (lowerMessage.includes('blood pressure') || lowerMessage.includes('bp')) {
    if (lowerMessage.includes('recent') || lowerMessage.includes('latest') || lowerMessage.includes('mean') || lowerMessage.includes('reading')) {
      if (healthContext.latestBP) {
        const { systolic, diastolic } = healthContext.latestBP;
        const status = systolic >= 140 || diastolic >= 90 ? 'elevated' : systolic >= 130 || diastolic >= 85 ? 'slightly elevated' : 'within normal range';
        return `Your most recent blood pressure reading was ${systolic}/${diastolic} mmHg, which is ${status}. Normal blood pressure is typically around 120/80 mmHg. ${systolic >= 140 || diastolic >= 90 ? 'I recommend consulting your healthcare provider about this elevated reading.' : 'Continue monitoring your blood pressure regularly.'} Always follow your doctor's advice regarding your blood pressure management.`;
      }
      return "Based on general guidelines, normal blood pressure is around 120/80 mmHg. Values consistently above 130/85 mmHg may be considered elevated. I recommend logging your blood pressure readings regularly and discussing them with your healthcare provider.";
    }
    
    if (lowerMessage.includes('normal') || lowerMessage.includes('should') || lowerMessage.includes('healthy')) {
      return "Normal blood pressure is typically around 120/80 mmHg. Here's what the ranges mean:\n\n• Normal: Less than 120/80 mmHg\n• Elevated: 120-129/80 mmHg\n• High (Stage 1): 130-139/80-89 mmHg\n• High (Stage 2): 140+/90+ mmHg\n\nAlways consult your healthcare provider for personalized guidance based on your health history.";
    }
    
    if (lowerMessage.includes('lower') || lowerMessage.includes('reduce') || lowerMessage.includes('improve') || lowerMessage.includes('decrease')) {
      return "Here are evidence-based ways to help lower blood pressure:\n\n1. **Diet**: Reduce sodium intake (aim for less than 2,300mg/day), eat more fruits, vegetables, and whole grains\n2. **Exercise**: Aim for 30 minutes of moderate activity most days\n3. **Weight**: Maintain a healthy weight\n4. **Alcohol**: Limit alcohol consumption\n5. **Stress**: Practice relaxation techniques like deep breathing or meditation\n6. **Sleep**: Get 7-9 hours of quality sleep\n7. **Medications**: Take prescribed medications as directed\n\nAlways consult your healthcare provider before making significant lifestyle changes.";
    }
  }
  
  // Medication Questions
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
  
  // Heart Health
  if (lowerMessage.includes('heart') && (lowerMessage.includes('health') || lowerMessage.includes('habit') || lowerMessage.includes('healthy'))) {
    return "Great question! Here are key habits for heart health:\n\n1. **Regular Exercise**: 150 minutes of moderate activity per week\n2. **Healthy Diet**: Lots of fruits, vegetables, whole grains, lean proteins\n3. **Monitor Blood Pressure**: Check regularly and keep it under control\n4. **Manage Stress**: Practice relaxation techniques\n5. **Don't Smoke**: Avoid tobacco products\n6. **Limit Alcohol**: Moderate consumption if at all\n7. **Maintain Healthy Weight**: Work with your doctor on a healthy weight range\n8. **Regular Check-ups**: See your healthcare provider regularly\n\nThese habits, combined with any prescribed medications, can significantly improve heart health.";
  }
  
  // Stress Management
  if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('relax')) {
    return "Stress management is important for overall health, especially blood pressure. Here are some techniques:\n\n1. **Deep Breathing**: Practice slow, deep breaths for 5-10 minutes\n2. **Meditation**: Even 5 minutes daily can help\n3. **Physical Activity**: Exercise is a great stress reliever\n4. **Sleep**: Prioritize 7-9 hours of quality sleep\n5. **Social Connections**: Stay connected with friends and family\n6. **Hobbies**: Engage in activities you enjoy\n7. **Limit Caffeine**: Reduce if it makes you anxious\n\nIf stress feels overwhelming, please talk to your healthcare provider about additional support options.";
  }
  
  // Exercise
  if (lowerMessage.includes('exercise') || lowerMessage.includes('activity') || lowerMessage.includes('workout')) {
    return "Regular physical activity is excellent for your health! Here are recommendations:\n\n**For Most Adults:**\n• 150 minutes of moderate-intensity aerobic activity per week (like brisk walking)\n• Or 75 minutes of vigorous activity per week\n• Spread throughout the week\n• Include muscle-strengthening activities 2+ days per week\n\n**Good Options:**\n• Walking\n• Swimming\n• Cycling\n• Gardening\n• Dancing\n\n**Important**: Before starting a new exercise program, especially if you have health conditions, consult your healthcare provider to ensure it's safe and appropriate for you.";
  }
  
  // Diet/Nutrition
  if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('nutrition')) {
    return "A heart-healthy diet can significantly impact your overall health:\n\n**Eat More:**\n• Fruits and vegetables (aim for 5+ servings daily)\n• Whole grains (brown rice, whole wheat, oats)\n• Lean proteins (fish, poultry, beans, nuts)\n• Low-fat dairy\n• Foods rich in potassium and magnesium\n\n**Eat Less:**\n• Sodium (aim for less than 2,300mg/day)\n• Saturated and trans fats\n• Added sugars\n• Processed foods\n\n**Consider the DASH Diet**: Designed specifically for blood pressure management. Ask your healthcare provider or a registered dietitian for personalized nutrition advice.";
  }
  
  // Symptoms or Emergency
  if (lowerMessage.includes('chest pain') || lowerMessage.includes('dizzy') || lowerMessage.includes('emergency')) {
    return "⚠️ **IMPORTANT**: If you're experiencing chest pain, severe dizziness, difficulty breathing, or other serious symptoms, please:\n\n1. **Call 911 immediately** or go to the nearest emergency room\n2. **Do not wait** to see if symptoms improve\n3. **Do not drive yourself** if possible\n\nThis AI assistant is NOT a substitute for emergency medical care. When in doubt, seek immediate medical attention.";
  }
  
  // General greeting
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.includes('hey')) {
    return `Hello${healthContext.userName ? ' ' + healthContext.userName : ''}! 👋 I'm here to help answer your health questions. I can provide information about:\n\n• Blood pressure and vital signs\n• Medications\n• Heart-healthy lifestyle habits\n• Exercise and nutrition\n• Stress management\n\nWhat would you like to know?`;
  }
  
  // Default response
  return "I'm here to help with your health questions! I can provide information about:\n\n• Understanding your blood pressure readings\n• Healthy lifestyle habits\n• Medication information\n• Heart health tips\n• Exercise and nutrition guidance\n\nWhat specific health topic would you like to learn about? Remember, I provide general information and you should always consult your healthcare provider for medical advice specific to your situation.";
}

// AI Health Assistant Chat
app.post("/make-server-6e6f3496/chat", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get user's health data for context
    const profile = await kv.get(`user:${userId}`);
    const recentVitals = await kv.getByPrefix(`vital:${userId}:`);
    const medications = await kv.getByPrefix(`medication:${userId}:`);

    // Sort vitals by timestamp and get most recent
    recentVitals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestVitals = recentVitals.slice(0, 5);

    // Build health context object for fallback
    const healthContextObj = {
      userName: profile?.name,
      latestBP: latestVitals.length > 0 ? latestVitals[0] : null,
      medications: medications.filter((m: any) => m.active)
    };

    // Try OpenAI first, fall back to smart responses if rate limited
    let aiMessage = '';
    let usedFallback = false;

    try {
      // Build context for AI
      let healthContext = `You are a helpful AI health assistant for WellCare Companion. `;
      healthContext += `The user's name is ${profile?.name || 'the patient'}. `;
      
      if (latestVitals.length > 0) {
        const latest = latestVitals[0];
        healthContext += `Their most recent blood pressure reading was ${latest.systolic}/${latest.diastolic} mmHg`;
        if (latest.pulse) {
          healthContext += ` with a pulse of ${latest.pulse} bpm`;
        }
        healthContext += `. `;
      }

      if (medications.length > 0) {
        const activeMeds = medications.filter((m: any) => m.active);
        if (activeMeds.length > 0) {
          healthContext += `They are currently taking ${activeMeds.length} medication(s): `;
          healthContext += activeMeds.map((m: any) => `${m.name} (${m.dosage})`).join(', ') + '. ';
        }
      }

      healthContext += `\n\nProvide helpful, accurate health information. Always remind users to consult healthcare professionals for medical advice. Be empathetic and supportive. Keep responses concise and easy to understand.`;

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: healthContext },
      ];

      // Add conversation history (last 10 messages)
      if (conversationHistory && Array.isArray(conversationHistory)) {
        conversationHistory.slice(-10).forEach((msg: any) => {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
      }

      // Add current user message
      messages.push({ role: 'user', content: message });

      // Call OpenAI API
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        console.log('OpenAI API key not configured - using fallback');
        throw new Error('API key not configured');
      }

      console.log('Calling OpenAI API with', messages.length, 'messages');

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.log('OpenAI API error response:', JSON.stringify(errorData));
        console.log('OpenAI API status:', openaiResponse.status, openaiResponse.statusText);
        
        // Throw error to trigger fallback
        if (openaiResponse.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (openaiResponse.status === 401) {
          throw new Error('Invalid API key');
        } else {
          throw new Error(errorData.error?.message || 'API error');
        }
      }

      const openaiData = await openaiResponse.json();
      console.log('OpenAI response received successfully');
      
      aiMessage = openaiData.choices[0]?.message?.content || '';
      
      if (!aiMessage) {
        throw new Error('Empty response from OpenAI');
      }

    } catch (openaiError) {
      console.log('OpenAI error, using smart fallback:', openaiError.message);
      usedFallback = true;
      aiMessage = getSmartFallbackResponse(message, healthContextObj);
    }

    // Store chat history
    const chatId = `chat:${userId}:${Date.now()}`;
    const chatRecord = {
      id: chatId,
      userId,
      userMessage: message,
      aiResponse: aiMessage,
      usedFallback,
      timestamp: new Date().toISOString()
    };
    await kv.set(chatId, chatRecord);

    return c.json({ 
      success: true, 
      message: aiMessage,
      usedFallback
    });
  } catch (error) {
    console.log('Chat error:', error);
    return c.json({ error: `Failed to process chat: ${error.message}` }, 500);
  }
});

// Get chat history
app.get("/make-server-6e6f3496/chat/history", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const chats = await kv.getByPrefix(`chat:${userId}:`);
    chats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ chats });
  } catch (error) {
    console.log('Get chat history error:', error);
    return c.json({ error: `Failed to get chat history: ${error.message}` }, 500);
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
    
    // Store notification for each grantee
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

// Start the server
Deno.serve(app.fetch);
