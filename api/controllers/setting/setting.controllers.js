import getOrCreateSettings from '../../services/setting/get-or-create.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

// ==================== OBTENER AJUSTES ====================
export async function getSettings(req, res) {
    try {
        const settings = await getOrCreateSettings(req.user.id);
        return res.status(200).json(successMessage({ extra: { data: settings } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener los ajustes', extra: { error: error.message }
        }));
    }
}

// ==================== ACTUALIZAR AJUSTES ====================
export async function updateSettings(req, res) {
    try {
        const settings = await getOrCreateSettings(req.user.id);

        const fields = [
            'enabled', 'notif_enabled', 'timezone',
            'plan_enabled', 'plan_window_start', 'plan_window_end',
            'plan_interval_minutes', 'plan_interval_loaded_minutes',
            'close_enabled', 'close_window_start', 'close_window_end', 'close_interval_minutes',
            // legacy (aceptados por compatibilidad)
            'interval_minutes', 'window_start', 'window_end',
        ];
        const updates = {};
        for (const f of fields) {
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        }

        await settings.update(updates);
        return res.status(200).json(successMessage({ message: 'Ajustes actualizados', extra: { data: settings } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al actualizar los ajustes', extra: { error: error.message }
        }));
    }
}
