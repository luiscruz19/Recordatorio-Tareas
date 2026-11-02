import { getItem, setItem, deleteItem } from './storage';

// Sin EXPO_PUBLIC_API_URL (emulador local) se usa el gateway de Traefik con ruteo por Host.
const PUBLIC_API = process.env.EXPO_PUBLIC_API_URL;
const LOCAL_GATEWAY = 'http://10.0.2.2';
const LOCAL_API_HOST = 'recordatorios-api.localhost';
const USE_LOCAL = !PUBLIC_API;
const BASE = (PUBLIC_API || LOCAL_GATEWAY).replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15000;
const TOKEN_KEY = 'recordatorios_token';

let token = null;

function baseHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', ...extra };
    if (USE_LOCAL) headers.Host = LOCAL_API_HOST;
    return headers;
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (e) {
        if (e?.name === 'AbortError') throw new Error('Tiempo de espera agotado. Revisá tu conexión.');
        throw new Error('No se pudo conectar con el servidor.');
    } finally {
        clearTimeout(timeoutId);
    }
}

async function saveToken(value) {
    token = value;
    await setItem(TOKEN_KEY, value);
}

export async function loadToken() {
    token = await getItem(TOKEN_KEY);
    return token;
}

export async function clearToken() {
    token = null;
    await deleteItem(TOKEN_KEY);
}

async function request(path, options = {}) {
    const res = await fetchWithTimeout(BASE + path, {
        ...options,
        headers: baseHeaders({ token: token || '', ...(options.headers || {}) }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
        const err = new Error(json?.message || 'No se pudo completar la operación');
        err.status = res.status;
        throw err;
    }
    return json;
}

async function loginWith(path, credentials, fallbackMessage) {
    const res = await fetchWithTimeout(BASE + path, {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify(credentials),
    });
    const json = await res.json().catch(() => null);
    if (!json?.user?.token) throw new Error(json?.message || fallbackMessage);
    await saveToken(json.user.token);
    return json.user;
}

export const login = (email, password) => loginWith('/auth/login', { email, password }, 'Credenciales inválidas');
export const loginPin = (email, pin) => loginWith('/auth/login-pin', { email, pin }, 'PIN incorrecto');
export const getMe = () => request('/auth/me');
export const hasPin = (email) => request(`/auth/has-pin?email=${encodeURIComponent(email)}`);
export const setPinRemote = (pin) => request('/auth/set-pin', { method: 'POST', body: JSON.stringify({ pin }) });

export const getToday = () => request('/tasks/today');
export const getCarryover = () => request('/tasks/carryover');
export const createTask = (text, taskDate) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(taskDate ? { text, task_date: taskDate } : { text }) });
export const updateTask = (id, patch) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const setTaskStatus = (id, status) => updateTask(id, { status });
export const snoozeTask = (id) => request(`/tasks/${id}/snooze`, { method: 'POST', body: '{}' });
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' });
export const allCarryoverToday = () => request('/tasks/carryover/all-today', { method: 'POST', body: '{}' });

export const updateSettings = (patch) => request('/settings', { method: 'PUT', body: JSON.stringify(patch) });

export const registerDevice = (payload) => request('/devices/register', { method: 'POST', body: JSON.stringify(payload) });

export const listNotifications = () => request('/notifications');
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: 'PATCH', body: '{}' });
