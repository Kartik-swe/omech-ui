// Device registration helpers.
//
// A phone outside the office IPs gets a secret device key when it requests
// access; once an admin approves it, every API call sends that key in the
// X-Device-Token header. Browsers that never registered (office PCs) have no
// key and send nothing extra, so they behave exactly as before.

export const DEVICE_HEADER = 'X-Device-Token';
const STORAGE_KEY = 'omech_device_key';

export type DeviceStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'EXPIRED' | 'REJECTED' | 'REVOKED';

export interface DeviceStatusInfo {
  IP_ALLOWED: boolean;
  DEVICE_STATUS: DeviceStatus;
  DEVICE_NAME?: string | null;
  EXPIRES_AT?: string | null;
}

export const getDeviceKey = (): string | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  } catch {
    return null; // storage blocked (private mode etc.)
  }
};

export const setDeviceKey = (key: string): boolean => {
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
    return true;
  } catch {
    return false;
  }
};

/** Headers to add to every API call: the device key if this browser has one, otherwise nothing. */
export const deviceHeaders = (): Record<string, string> => {
  const key = getDeviceKey();
  return key ? { [DEVICE_HEADER]: key } : {};
};

const deviceApiBase = () => `${process.env.NEXT_PUBLIC_API_BASE_URL}api/device/`;

/**
 * Asks the API whether this browser is on an allowed IP and what state its
 * device is in. Returns null if the check itself fails, so callers can fall
 * back to the normal login screen instead of blocking anyone.
 */
export const fetchDeviceStatus = async (): Promise<DeviceStatusInfo | null> => {
  // never keep the login page waiting: give up after 6s and show normal login
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${deviceApiBase()}status`, {
      method: 'GET',
      headers: { ...deviceHeaders() },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.msgId === 200 && json.data ? (json.data as DeviceStatusInfo) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/** Sends a registration request. On success the new key is saved in this browser. */
export const requestDeviceAccess = async (
  username: string,
  password: string,
  deviceName: string
): Promise<{ ok: boolean; msg: string }> => {
  try {
    const res = await fetch(`${deviceApiBase()}request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ USERNAME: username, PASSWORD: password, DEVICE_NAME: deviceName }),
    });
    const json = await res.json();
    if (json?.msgId === 200 && json.data?.DEVICE_KEY) {
      if (!setDeviceKey(json.data.DEVICE_KEY)) {
        return { ok: false, msg: 'This browser blocks storage (private mode?). Please use a normal browser window.' };
      }
      return { ok: true, msg: json.msg };
    }
    return { ok: false, msg: json?.msg || 'Request failed. Please try again.' };
  } catch {
    return { ok: false, msg: 'Could not reach the server. Please try again.' };
  }
};

/** Best guess at a readable device name to pre-fill the form, e.g. "Android phone - Chrome". */
export const suggestDeviceName = (): string => {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  const device = /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Android phone' : 'Android tablet')
    : /Windows/.test(ua) ? 'Windows PC'
    : /Macintosh/.test(ua) ? 'Mac'
    : 'Device';
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /CriOS|Chrome\//.test(ua) ? 'Chrome'
    : /FxiOS|Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari'
    : '';
  return browser ? `${device} - ${browser}` : device;
};
