import { getItem, setItem, deleteItem } from './storage';

// La app habla SOLO con el api (auth queda interno; el login pega a POST /auth/login del api,
// que proxea a fichada_auth → mismos usuarios que fichada). EXPO_PUBLIC_API_URL (dominio real)
// GANA siempre. Si no está: en DEV usamos el gateway local de Traefik (Host-routing), y en
// release/OTA caemos al server real — NUNCA al gateway de emulador (10.0.2.2), que en un
// teléfono real no existe y dejaría el fetch colgado.
const PUBLIC_API = process.env.EXPO_PUBLIC_API_URL;
const PROD_API = 'https://recordatorios.sda.ovh';
const LOCAL_GATEWAY = 'http://10.0.2.2';
const LOCAL_API_HOST = 'recordatorios-api.localhost';
const USE_LOCAL = !PUBLIC_API && __DEV__;
const BASE = (PUBLIC_API || (__DEV__ ? LOCAL_GATEWAY : PROD_API)).replace(/\/$/, '');

function baseHeaders(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (USE_LOCAL) h.Host = LOCAL_API_HOST;
    return h;
}

// fetch con timeout: evita que una request quede colgada para siempre (sin red / URL mala).
async function tfetch(url, opts = {}, ms = 15000) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    try {
        return await fetch(url, { ...opts, signal: ctrl.signal });
    } catch (e) {
        if (e?.name === 'AbortError') throw new Error('Tiempo de espera agotado. Revisá tu conexión.');
        throw new Error('No se pudo conectar con el servidor.');
    } finally {
        clearTimeout(id);
    }
}

let token = null;
const TOKEN_KEY = 'recordatorios_token';

export async function loadToken() {
    token = await getItem(TOKEN_KEY);
    return token;
}
export async function setToken(t) {
    token = t;
    await setItem(TOKEN_KEY, t);
}
export async function clearToken() {
    token = null;
    await deleteItem(TOKEN_KEY);
}
export const getCurrentToken = () => token;

async function req(path, opts = {}) {
    const res = await tfetch(BASE + path, {
        ...opts,
        headers: baseHeaders({ token: token || '', ...(opts.headers || {}) }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
        const err = new Error(json?.message || 'No se pudo completar la operación');
        err.status = res.status;
        throw err;
    }
    return json;
}

// ─── Auth (mismos usuarios que fichada) ──────────────────────────────────────
export async function login(email, password) {
    const res = await tfetch(BASE + '/auth/login', {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => null);
    if (!json?.user?.token) throw new Error(json?.message || 'Credenciales inválidas');
    await setToken(json.user.token);
    return json.user;
}
export const getMe = () => req('/auth/me');

// ¿Ese email ya tiene PIN? (la app decide pedir PIN o contraseña).
export const hasPin = (email) => req(`/auth/has-pin?email=${encodeURIComponent(email)}`);

// Login por PIN (ingresos siguientes al primero).
export async function loginPin(email, pin) {
    const res = await tfetch(BASE + '/auth/login-pin', {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify({ email, pin }),
    });
    const json = await res.json().catch(() => null);
    if (!json?.user?.token) throw new Error(json?.message || 'PIN incorrecto');
    await setToken(json.user.token);
    return json.user;
}

// Setear el PIN tras el primer ingreso (requiere sesión).
export const setPinRemote = (pin) => req('/auth/set-pin', { method: 'POST', body: JSON.stringify({ pin }) });

// ─── Tareas ──────────────────────────────────────────────────────────────────
export const getToday = () => req('/tasks/today');
export const getCarryover = () => req('/tasks/carryover');
export const createTask = (text, task_date) =>
    req('/tasks', { method: 'POST', body: JSON.stringify(task_date ? { text, task_date } : { text }) });
export const updateTask = (id, patch) =>
    req(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const setTaskStatus = (id, status) => updateTask(id, { status });
export const snoozeTask = (id) => req(`/tasks/${id}/snooze`, { method: 'POST', body: '{}' });
export const deleteTask = (id) => req(`/tasks/${id}`, { method: 'DELETE' });
export const allCarryoverToday = () => req('/tasks/carryover/all-today', { method: 'POST', body: '{}' });

// ─── Ajustes ─────────────────────────────────────────────────────────────────
export const getSettings = () => req('/settings');
export const updateSettings = (patch) => req('/settings', { method: 'PUT', body: JSON.stringify(patch) });

// ─── Dispositivo + push ──────────────────────────────────────────────────────
export const registerDevice = (payload) => req('/devices/register', { method: 'POST', body: JSON.stringify(payload) });
export const updatePushToken = (device_uuid, push_token) =>
    req('/devices/push-token', { method: 'PATCH', body: JSON.stringify({ device_uuid, push_token }) });

// ─── Notificaciones ──────────────────────────────────────────────────────────
export const listNotifications = () => req('/notifications');
export const markNotificationRead = (id) => req(`/notifications/${id}/read`, { method: 'PATCH', body: '{}' });
