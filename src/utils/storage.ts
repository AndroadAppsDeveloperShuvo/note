import { SalesSession } from '../types/poultry';

const STORAGE_KEY = 'poultry_dari_sessions_v2';
const SETTINGS_KEY = 'poultry_dari_settings_v2';

export interface AppSettings {
  defaultTareKg: number;
  defaultRatePerKg: number;
  enableAudioChime: boolean;
  enableTtsSpeak: boolean;
  enableAutoHandsFree: boolean;
  activeBuyerName: string;
  customBuyers: string[];
  theme: 'dark' | 'light';
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTareKg: 2.0,
  defaultRatePerKg: 170,
  enableAudioChime: true,
  enableTtsSpeak: true,
  enableAutoHandsFree: false,
  activeBuyerName: 'নাইম',
  customBuyers: ['নাইম', 'রফিক', 'সুমন', 'আলম', 'লিটন'],
  theme: 'dark',
};

// Create a clean new session without fake demo entries
export function createNewSession(title?: string): SalesSession {
  const today = new Date();
  const dateStr = today.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  const id = 'session_' + Date.now();
  
  return {
    id,
    title: title || `আজকের বিক্রি - ${dateStr}`,
    date: dateStr,
    defaultTareKg: 2.0,
    defaultRatePerKg: 170,
    entries: [],
    payments: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function loadSessions(): SalesSession[] {
  if (typeof window === 'undefined') return [createNewSession()];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = [createNewSession()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [createNewSession()];
  } catch (e) {
    console.error('Failed to load sessions:', e);
    return [createNewSession()];
  }
}

export function saveSessions(sessions: SalesSession[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
