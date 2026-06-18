import CONFIG from '../../config/config.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import UserProfile from '../../models/UserProfile.js';
import getOrCreateSettings from '../../services/setting/get-or-create.js';

const { AUTH_API_URL, AUTHORIZATION } = CONFIG;
const BASIC = 'Basic ' + Buffer.from(`${AUTHORIZATION.USER}:${AUTHORIZATION.PASSWORD}`).toString('base64');

/**
 * Asegura/actualiza el perfil local a partir del user que devuelve auth en el login.
 * Defensivo con la forma de la respuesta de auth (id/email/nombre pueden venir distinto).
 */
async function upsertProfile(u) {
    const userId = u.id || u.user_id;
    if (!userId) return;
    const email = (u.email || '').toLowerCase().trim() || null;
    const name = u.name
        || [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
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

/**
 * Proxy de login: el cliente (app) pega acá; el api reenvía a fichada_auth con el Basic
 * servicio↔servicio (auth queda interno). Mismos usuarios que fichada. Al autenticar OK,
 * crea/asegura el perfil local (lazy provisioning) y devuelve la respuesta de auth tal cual.
 */
export async function login(req, res) {
    try {
        const r = await fetch(`${AUTH_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: BASIC },
            body: JSON.stringify(req.body || {}),
        });
        const json = await r.json().catch(() => null);

        if (r.ok && json) {
            const u = json.user || json.data?.user || json.data || null;
            if (u && typeof u === 'object') {
                await upsertProfile(u).catch(() => {});
            }
        }
        return res.status(r.status).json(json ?? errorMessage({ message: 'Error de autenticación' }));
    } catch (e) {
        return res.status(502).json(errorMessage({
            message: 'No se pudo contactar al servicio de autenticación',
            extra: { error: e.message },
        }));
    }
}

/**
 * Perfil + ajustes del usuario autenticado (req.profile lo deja resolve-profile).
 */
export async function me(req, res) {
    try {
        const settings = await getOrCreateSettings(req.user.id);
        return res.status(200).json(successMessage({
            extra: { data: { profile: req.profile, settings } },
        }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener el perfil', extra: { error: error.message },
        }));
    }
}
