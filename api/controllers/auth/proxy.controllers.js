import CONFIG from '../../config/config.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import { tokenFromRequest } from '../../utils/helpers.js';
import getOrCreateSettings from '../../services/setting/get-or-create.js';

// No hay usuarios locales: las credenciales las valida fichada_api y la identidad es el user_id de su JWT.
const { FICHADA_API_URL } = CONFIG;

async function forward(path, { method = 'GET', body = null, token = null } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers.token = token;
    const response = await fetch(`${FICHADA_API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = await response.json().catch(() => null);
    return { status: response.status, json };
}

const postToFichada = (path, { invalidResponseMessage, unreachableMessage, sendToken = false }) =>
    async (req, res) => {
        try {
            const { status, json } = await forward(path, {
                method: 'POST',
                body: req.body || {},
                token: sendToken ? tokenFromRequest(req) : null,
            });
            return res.status(status).json(json ?? errorMessage({ message: invalidResponseMessage }));
        } catch (e) {
            return res.status(502).json(errorMessage({ message: unreachableMessage, extra: { error: e.message } }));
        }
    };

export const login = postToFichada('/auth/login', {
    invalidResponseMessage: 'Error de autenticación',
    unreachableMessage: 'No se pudo contactar al servicio de autenticación de fichada',
});

export const loginPin = postToFichada('/auth/login-pin', {
    invalidResponseMessage: 'No se pudo iniciar sesión',
    unreachableMessage: 'No se pudo contactar a fichada',
});

export const setPin = postToFichada('/auth/set-pin', {
    invalidResponseMessage: 'No se pudo configurar el PIN',
    unreachableMessage: 'No se pudo contactar a fichada',
    sendToken: true,
});

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
