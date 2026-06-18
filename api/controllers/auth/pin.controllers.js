import bcrypt from 'bcryptjs';
import UserProfile from '../../models/UserProfile.js';
import CONFIG from '../../config/config.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

const { AUTH_API_URL, AUTHORIZATION, SECRET_KEY } = CONFIG;
const authBasic = 'Basic ' + Buffer.from(`${AUTHORIZATION.USER}:${AUTHORIZATION.PASSWORD}`).toString('base64');

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 5;

// Obtiene un JWT del auth de fichada para un user verificado (endpoint interno: Basic + SECRET_KEY).
async function generateAuthToken(userId) {
    if (!userId) return null;
    try {
        const res = await fetch(`${AUTH_API_URL}/generate-token?user_id=${encodeURIComponent(userId)}`, {
            headers: { Authorization: authBasic, token: SECRET_KEY },
        });
        const json = await res.json().catch(() => null);
        return json?.user?.token || null;
    } catch {
        return null;
    }
}

// POST /auth/set-pin (requiere JWT) — guarda el PIN hasheado en el perfil del usuario.
export async function setPin(req, res) {
    try {
        const pin = String(req.body?.pin || '');
        if (!/^\d{4}$/.test(pin)) {
            return res.status(400).json(errorMessage({ message: 'El PIN debe tener 4 dígitos' }));
        }
        const hash = await bcrypt.hash(pin, 10);
        await req.profile.update({ pin_hash: hash, pin_attempts: 0, pin_locked_until: null });
        return res.status(200).json(successMessage({ message: 'PIN configurado' }));
    } catch (error) {
        return res.status(500).json(errorMessage({ message: 'No se pudo configurar el PIN', extra: { error: error.message } }));
    }
}

// GET /auth/has-pin?email= — ¿ese usuario ya configuró PIN? (la app decide pedir PIN o contraseña).
export async function hasPin(req, res) {
    try {
        const email = String(req.query?.email || '').toLowerCase().trim();
        const profile = await UserProfile.findOne({ where: { email, status: 'active' }, attributes: ['id', 'pin_hash'] });
        return res.status(200).json(successMessage({ extra: { has_pin: !!(profile && profile.pin_hash) } }));
    } catch {
        return res.status(200).json(successMessage({ extra: { has_pin: false } }));
    }
}

// POST /auth/login-pin {email, pin} — login por PIN; genera el JWT vía auth. Bloquea tras MAX_ATTEMPTS.
export async function loginPin(req, res) {
    try {
        const email = String(req.body?.email || '').toLowerCase().trim();
        const pin = String(req.body?.pin || '');

        const profile = await UserProfile.findOne({ where: { email, status: 'active' } });
        if (!profile || !profile.pin_hash) {
            return res.status(401).json(errorMessage({ message: 'Credenciales inválidas' }));
        }
        if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
            return res.status(429).json(errorMessage({ message: 'Demasiados intentos. Esperá unos minutos.' }));
        }

        const ok = await bcrypt.compare(pin, profile.pin_hash);
        if (!ok) {
            const attempts = (profile.pin_attempts || 0) + 1;
            const updates = { pin_attempts: attempts };
            if (attempts >= MAX_ATTEMPTS) {
                updates.pin_attempts = 0;
                updates.pin_locked_until = new Date(Date.now() + LOCK_MINUTES * 60000);
            }
            await profile.update(updates);
            return res.status(401).json(errorMessage({ message: 'PIN incorrecto' }));
        }

        await profile.update({ pin_attempts: 0, pin_locked_until: null });
        const token = await generateAuthToken(profile.user_id);
        if (!token) {
            return res.status(502).json(errorMessage({ message: 'No se pudo iniciar sesión' }));
        }
        return res.status(200).json(successMessage({ extra: { user: { id: profile.user_id, token } } }));
    } catch (error) {
        return res.status(500).json(errorMessage({ message: 'Error al iniciar sesión con PIN', extra: { error: error.message } }));
    }
}
