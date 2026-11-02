import CONFIG from '../../config/config.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import getOrCreateSettings from '../../services/setting/get-or-create.js';

// No hay usuarios locales: las credenciales las valida fichada_api y la identidad es el user_id de su JWT.
const { FICHADA_API_URL } = CONFIG;

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

export async function login(req, res) {
    try {
        const { status, json } = await forward('/auth/login', { method: 'POST', body: req.body || {} });
        return res.status(status).json(json ?? errorMessage({ message: 'Error de autenticación' }));
    } catch (e) {
        return res.status(502).json(errorMessage({ message: 'No se pudo contactar al servicio de autenticación de fichada', extra: { error: e.message } }));
    }
}

export async function hasPin(req, res) {
    try {
        const email = encodeURIComponent(String(req.query?.email || ''));
        const { status, json } = await forward(`/auth/has-pin?email=${email}`);
        return res.status(status).json(json ?? successMessage({ extra: { has_pin: false } }));
    } catch {
        // Sin respuesta de fichada se asume que no hay PIN: la app pide la contraseña.
        return res.status(200).json(successMessage({ extra: { has_pin: false } }));
    }
}

export async function loginPin(req, res) {
    try {
        const { status, json } = await forward('/auth/login-pin', { method: 'POST', body: req.body || {} });
        return res.status(status).json(json ?? errorMessage({ message: 'No se pudo iniciar sesión' }));
    } catch (e) {
        return res.status(502).json(errorMessage({ message: 'No se pudo contactar a fichada', extra: { error: e.message } }));
    }
}

export async function setPin(req, res) {
    try {
        const { status, json } = await forward('/auth/set-pin', { method: 'POST', body: req.body || {}, token: tokenFromReq(req) });
        return res.status(status).json(json ?? errorMessage({ message: 'No se pudo configurar el PIN' }));
    } catch (e) {
        return res.status(502).json(errorMessage({ message: 'No se pudo contactar a fichada', extra: { error: e.message } }));
    }
}

export async function me(req, res) {
    try {
        const settings = await getOrCreateSettings(req.user.id);
        return res.status(200).json(successMessage({
            extra: { data: { user: { id: req.user.id, email: req.user.email || null }, settings } },
        }));
    } catch (error) {
        return res.status(500).json(errorMessage({ message: 'Error al obtener el perfil', extra: { error: error.message } }));
    }
}
