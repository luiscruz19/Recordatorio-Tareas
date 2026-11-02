import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

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
        comment: 'Interruptor maestro: activa/desactiva ambos recordatorios'
    },
    plan_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Recordatorio de planificación activado'
    },
    plan_window_start: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '09:00:00',
        comment: 'Inicio de la franja de planificación'
    },
    plan_window_end: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '12:00:00',
        comment: 'Fin de la franja de planificación'
    },
    plan_interval_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        comment: 'Intervalo mientras NO cargaste ninguna tarea para hoy'
    },
    plan_interval_loaded_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 90,
        comment: 'Intervalo (más largo) una vez que cargaste ≥1 tarea para hoy'
    },
    close_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Recordatorio de cierre activado'
    },
    close_window_start: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '18:00:00',
        comment: 'Inicio de la franja de cierre'
    },
    close_window_end: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '20:00:00',
        comment: 'Fin de la franja de cierre'
    },
    close_interval_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
        comment: 'Cada cuántos minutos recordar cerrar tareas pendientes'
    },
    interval_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 120,
        comment: 'DEPRECATED: intervalo único anterior'
    },
    window_start: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '09:00:00',
        comment: 'DEPRECATED: inicio de la franja única anterior'
    },
    window_end: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '21:00:00',
        comment: 'DEPRECATED: fin de la franja única anterior'
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
