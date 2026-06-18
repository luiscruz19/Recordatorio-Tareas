import Device from '../../models/Device.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

// ==================== REGISTRAR / ACTUALIZAR DISPOSITIVO ====================
// Multi-dispositivo: upsert por device_uuid. Reasigna el dispositivo al usuario actual.
export async function registerDevice(req, res) {
    try {
        const { device_uuid, platform, model, push_token } = req.body;
        const userId = req.user.id;

        const existing = await Device.findOne({ where: { device_uuid } });
        if (existing) {
            await existing.update({
                user_id: userId,
                platform: platform ?? existing.platform,
                model: model ?? existing.model,
                push_token: push_token ?? existing.push_token,
                status: 'active',
                last_seen_at: new Date(),
            });
            return res.status(200).json(successMessage({ message: 'Dispositivo actualizado', extra: { data: existing } }));
        }

        const device = await Device.create({
            user_id: userId,
            device_uuid,
            platform: platform ?? null,
            model: model ?? null,
            push_token: push_token ?? null,
            status: 'active',
            last_seen_at: new Date(),
        });

        return res.status(201).json(successMessage({ message: 'Dispositivo vinculado', extra: { data: device } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al registrar el dispositivo', extra: { error: error.message }
        }));
    }
}

// ==================== ACTUALIZAR PUSH TOKEN ====================
export async function updatePushToken(req, res) {
    try {
        const { device_uuid, push_token } = req.body;
        const device = await Device.findOne({ where: { device_uuid, user_id: req.user.id } });
        if (!device) return res.status(404).json(errorMessage({ message: 'Dispositivo no encontrado' }));

        await device.update({ push_token, status: 'active', last_seen_at: new Date() });
        return res.status(200).json(successMessage({ message: 'Token actualizado', extra: { data: device } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al actualizar el token', extra: { error: error.message }
        }));
    }
}
