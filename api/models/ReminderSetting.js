import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Ajustes de recordatorio por usuario (una fila por user_id). El intervalo es ÚNICO para
 * todas las tareas del día; los recordatorios solo suenan dentro de la franja horaria activa.
 */
const ReminderSetting = sequelize.define('reminder_settings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.reminder_setting.fields_empty.user_id },
        },
        comment: 'Dueño de los ajustes (user_id de auth)'
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Recordatorios activados'
    },
    interval_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 120,
        comment: 'Cada cuántos minutos recordar (30/60/120/240)'
    },
    window_start: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '09:00:00',
        comment: 'Inicio de la franja horaria activa'
    },
    window_end: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '21:00:00',
        comment: 'Fin de la franja horaria activa'
    },
    notif_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Permiso/estado de notificaciones'
    },
    timezone: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'America/Argentina/Buenos_Aires',
        comment: 'Zona horaria del usuario (para franja y día)'
    }
}, {
    tableName: 'reminder_settings',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['user_id'], name: 'reminder_settings_user_id' },
    ],
});

export default ReminderSetting;
