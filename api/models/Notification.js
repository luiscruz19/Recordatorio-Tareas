import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Recordatorio enviado al usuario (push del servidor). Guarda el envío para tener
 * historial e idempotencia (el cron no repite el aviso dentro del intervalo del usuario).
 */
const Notification = sequelize.define('notifications', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.notification.fields_empty.user_id },
        },
    },
    type: {
        type: DataTypes.ENUM('task_reminder', 'plan_reminder'),
        allowNull: false,
        defaultValue: 'task_reminder',
        validate: {
            notNull: { msg: messages.error.notification.fields_empty.type },
            isIn: {
                args: [['task_reminder', 'plan_reminder']],
                msg: messages.generic.invalid_enum_value,
            },
        },
        comment: 'task_reminder = cierre de tareas pendientes; plan_reminder = planificación (cargar tareas del día)'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    body: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            notNull: { msg: messages.error.notification.fields_empty.status },
            isIn: {
                args: [['pending', 'sent', 'failed']],
                msg: messages.generic.invalid_enum_value,
            },
        },
    },
    sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['type'] },
        { fields: ['status'] },
    ],
});

export default Notification;
