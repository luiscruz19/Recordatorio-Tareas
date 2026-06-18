import sequelize from '../db/sequelize.js';

import Task from './Task.js';
import ReminderSetting from './ReminderSetting.js';
import Device from './Device.js';
import Notification from './Notification.js';

/**
 * Sin asociaciones formales ni tabla de usuarios local: la identidad es el `user_id` del JWT de
 * fichada. Todas las entidades de dominio se filtran por ese `user_id`. No hay includes/joins.
 */

export {
    sequelize,
    Task,
    ReminderSetting,
    Device,
    Notification,
};

export default {
    sequelize,
    Task,
    ReminderSetting,
    Device,
    Notification,
};
