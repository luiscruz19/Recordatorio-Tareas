import sequelize from '../db/sequelize.js';

import UserProfile from './UserProfile.js';
import Task from './Task.js';
import ReminderSetting from './ReminderSetting.js';
import Device from './Device.js';
import Notification from './Notification.js';

/**
 * Sin asociaciones formales: todas las entidades de dominio se filtran por `user_id`
 * (el id del usuario de auth). No hay includes/joins entre entidades, así que no se
 * declaran relaciones (evita FKs físicas y conflictos de sync con paranoid).
 */

export {
    sequelize,
    UserProfile,
    Task,
    ReminderSetting,
    Device,
    Notification,
};

export default {
    sequelize,
    UserProfile,
    Task,
    ReminderSetting,
    Device,
    Notification,
};
