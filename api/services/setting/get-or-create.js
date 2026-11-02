import ReminderSetting from '../../models/ReminderSetting.js';

export default async function getOrCreateSettings(userId) {
    const [settings] = await ReminderSetting.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId },
    });
    return settings;
}
