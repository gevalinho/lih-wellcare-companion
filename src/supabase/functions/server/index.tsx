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

// Health check endpoint
app.get("/make-server-6e6f3496/health", (c) => {
  return c.json({ status: "ok" });
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

Deno.serve(app.fetch);
