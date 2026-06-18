import ReminderSetting from '../../models/ReminderSetting.js';

/**
 * Devuelve los ajustes de recordatorio del usuario, creándolos con los defaults si no existen.
 */
export default async function getOrCreateSettings(userId) {
    const [settings] = await ReminderSetting.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId },
    });
    return settings;
}
