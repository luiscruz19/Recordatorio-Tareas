import sequelize from '../db/sequelize.js';

import Task from './Task.js';
import ReminderSetting from './ReminderSetting.js';
import Device from './Device.js';
import Notification from './Notification.js';

// Sin tabla de usuarios ni asociaciones: cada entidad se filtra por el user_id del JWT de fichada.
export {
    sequelize,
    Task,
    ReminderSetting,
    Device,
    Notification,
};
