import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
let supabaseClient: any = null;

export const getSupabase = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, publicAnonKey);
  }
  return supabaseClient;
};

const API_BASE = `${supabaseUrl}/functions/v1/make-server-6e6f3496`;

// Get auth headers
export const getAuthHeaders = async () => {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No active session. Please sign in.');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
};

type RequestOptions = RequestInit & { skipAuth?: boolean };

// API request helper
const apiRequest = async (endpoint: string, options: RequestOptions = {}) => {
  const { skipAuth, ...rest } = options;
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth) {
    const authHeaders = await getAuthHeaders();
    headers = { ...headers, ...authHeaders };
  } else {
    headers.Authorization = `Bearer ${publicAnonKey}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers: {
      ...headers,
      ...(rest.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  signup: async (data: any) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  signin: async (email: string, password: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signout: async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  updateProfile: async (updates: any) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Vitals API
export const vitalsAPI = {
  add: async (vital: any) => {
    return apiRequest('/vitals', {
      method: 'POST',
      body: JSON.stringify(vital),
    });
  },

  getHistory: async (patientId?: string) => {
    const query = patientId ? `?patientId=${patientId}` : '';
    return apiRequest(`/vitals${query}`);
  },
};

// Medications API
export const medicationsAPI = {
  add: async (medication: any) => {
    return apiRequest('/medications', {
      method: 'POST',
      body: JSON.stringify(medication),
    });
  },

  getList: async (patientId?: string) => {
    const query = patientId ? `?patientId=${patientId}` : '';
    return apiRequest(`/medications${query}`);
  },

  logDose: async (log: any) => {
    return apiRequest('/medications/log', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },

  getLogs: async (patientId?: string) => {
    const query = patientId ? `?patientId=${patientId}` : '';
    return apiRequest(`/medications/logs${query}`);
  },
}; 

// Consent API
export const consentAPI = {
  grant: async (granteeEmail: string, accessLevel: string) => {
    return apiRequest('/consent/grant', {
      method: 'POST',
      body: JSON.stringify({ granteeEmail, accessLevel }),
    });
  },

  revoke: async (granteeEmail: string) => {
    return apiRequest('/consent/revoke', {
      method: 'POST',
      body: JSON.stringify({ granteeEmail }),
    });
  },

  getGranted: async () => {
    return apiRequest('/consent/granted');
  },

  getPatients: async () => {
    return apiRequest('/consent/patients');
  },
};

// Alerts API
export const alertsAPI = {
  getList: async (patientId?: string) => {
    const query = patientId ? `?patientId=${patientId}` : '';
    return apiRequest(`/alerts${query}`);
  },

  markRead: async (alertId: string) => {
    return apiRequest(`/alerts/${alertId}/read`, {
      method: 'PUT',
    });
  },
};

// Notifications API
export const notificationsAPI = {
  getList: async () => {
    return apiRequest('/notifications');
  },
};

// AI Chat API
export const aiChatAPI = {
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
export const healthCheckAPI = {
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


// Chat API
export const chatAPI = {
  sendMessage: async (data: { message: string; conversationHistory?: any[] }) => {
    return apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getHistory: async () => {
    return apiRequest('/chat/history');
  },
};
