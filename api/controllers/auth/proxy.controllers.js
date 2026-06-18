import CONFIG from '../../config/config.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import UserProfile from '../../models/UserProfile.js';
import getOrCreateSettings from '../../services/setting/get-or-create.js';

// El login depende PURA Y EXCLUSIVAMENTE de fichada: recordatorios reenvía todos los endpoints
// de credenciales a fichada_api (que ya maneja login + PIN sobre el Employee). El mismo
// email + PIN de fichada sirve acá. recordatorios NO guarda credenciales ni PIN propios.
const { FICHADA_API_URL } = CONFIG;

// Espejo local mínimo del usuario (para ser dueño de tareas/ajustes). NO es auth.
async function upsertProfile(u, fallbackEmail) {
    const userId = u?.id || u?.user_id;
    if (!userId) return;
    const email = ((u?.email || fallbackEmail) || '').toLowerCase().trim() || null;
    const name = u?.name
        || [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim()
        || email || 'Usuario';

    const [profile, created] = await UserProfile.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId, email, display_name: name },
    });
    if (!created) {
        const updates = {};
        if (email && profile.email !== email) updates.email = email;
        if (name && name !== 'Usuario' && profile.display_name !== name) updates.display_name = name;
        if (Object.keys(updates).length) await profile.update(updates);
    }
}

// Reenvía una request a fichada_api/auth/* y devuelve { status, json }.
async function forward(path, { method = 'GET', body = null, token = null } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers.token = token;
    const r = await fetch(`${FICHADA_API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = await r.json().catch(() => null);
    return { status: r.status, json };
}

function tokenFromReq(req) {
    const h = req.headers.token;
    const auth = req.headers.authorization;
    return h || (typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : null);
}

// POST /auth/login — primer ingreso (email + contraseña), delegado a fichada.
export async function login(req, res) {
    try {
        const { status, json } = await forward('/auth/login', { method: 'POST', body: req.body || {} });
        if (status >= 200 && status < 300 && json) {
            await upsertProfile(json.user || json.data || null, req.body?.email).catch(() => {});
        }
        return res.status(status).json(json ?? errorMessage({ message: 'Error de autenticación' }));
    } catch (e) {
        return res.status(502).json(errorMessage({ message: 'No se pudo contactar al servicio de autenticación de fichada', extra: { error: e.message } }));
    }
}

// GET /auth/has-pin?email= — ¿ese usuario ya tiene PIN EN FICHADA?
export async function hasPin(req, res) {
    try {
        const email = encodeURIComponent(String(req.query?.email || ''));
        const { status, json } = await forward(`/auth/has-pin?email=${email}`);
        return res.status(status).json(json ?? successMessage({ extra: { has_pin: false } }));
    } catch {
        return res.status(200).json(successMessage({ extra: { has_pin: false } }));
    }
}

// POST /auth/login-pin {email, pin} — login con el MISMO PIN de fichada.
export async function loginPin(req, res) {
    try {
        const { status, json } = await forward('/auth/login-pin', { method: 'POST', body: req.body || {} });
        if (status >= 200 && status < 300 && json) {
            await upsertProfile(json.user || json.data || null, req.body?.email).catch(() => {});
        }
        return res.status(status).json(json ?? errorMessage({ message: 'No se pudo iniciar sesión' }));
    } catch (e) {
        return res.status(502).json(errorMessage({ message: 'No se pudo contactar a fichada', extra: { error: e.message } }));
    }
}

// POST /auth/set-pin (con JWT) — crea/cambia el PIN EN FICHADA (queda compartido).
export async function setPin(req, res) {
    try {
        const { status, json } = await forward('/auth/set-pin', { method: 'POST', body: req.body || {}, token: tokenFromReq(req) });
        return res.status(status).json(json ?? errorMessage({ message: 'No se pudo configurar el PIN' }));
    } catch (e) {
        return res.status(502).json(errorMessage({ message: 'No se pudo contactar a fichada', extra: { error: e.message } }));
    }
}

// GET /auth/me — perfil + ajustes locales del usuario (esto sí es propio de recordatorios).
export async function me(req, res) {
    try {
        const settings = await getOrCreateSettings(req.user.id);
        return res.status(200).json(successMessage({ extra: { data: { profile: req.profile, settings } } }));
    } catch (error) {
        return res.status(500).json(errorMessage({ message: 'Error al obtener el perfil', extra: { error: error.message } }));
    }
}
