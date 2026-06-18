import Device from '../../models/Device.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envía una notificación push a un Expo push token. `categoryId` habilita las acciones
 * interactivas (marcar hecha / posponer) declaradas en la app.
 */
export async function sendExpoPush(token, { title, body, data = {}, categoryId = null }) {
    if (!token) return { sent: false, reason: 'sin push token' };
    try {
        const res = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                to: token, title, body, data, sound: 'default',
                ...(categoryId ? { categoryId } : {}),
            }),
        });
        const json = await res.json().catch(() => null);
        return { sent: res.ok, response: json };
    } catch (e) {
        return { sent: false, reason: e.message };
    }
}

/**
 * Manda la push a todos los dispositivos activos del usuario (multi-dispositivo).
 */
export async function sendPushToUser(userId, payload) {
    const devices = await Device.findAll({ where: { user_id: userId, status: 'active' } });
    const tokens = devices.map(d => d.push_token).filter(Boolean);
    if (tokens.length === 0) return { sent: false, reason: 'sin dispositivo activo con token' };
    const results = await Promise.all(tokens.map(t => sendExpoPush(t, payload)));
    return { sent: results.some(r => r.sent), results };
}
