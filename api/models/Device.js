import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Dispositivo del usuario con su Expo push token (para los recordatorios del servidor).
 * Multi-dispositivo: un usuario puede tener varios; se notifica a todos los activos.
 */
const Device = sequelize.define('devices', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.device.fields_empty.user_id },
        },
    },
    device_uuid: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.device.fields_empty.device_uuid },
        },
        comment: 'Identificador único del dispositivo'
    },
    platform: {
        type: DataTypes.ENUM('ios', 'android'),
        allowNull: true,
    },
    model: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Modelo del teléfono (informativo)'
    },
    push_token: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Expo push token para notificaciones'
    },
    status: {
        type: DataTypes.ENUM('active', 'revoked'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            notNull: { msg: messages.error.device.fields_empty.status },
            isIn: {
                args: [['active', 'revoked']],
                msg: messages.generic.invalid_enum_value,
            },
        },
    },
    last_seen_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'devices',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['user_id'] },
        { unique: true, fields: ['device_uuid'], name: 'devices_device_uuid' },
    ],
});

export default Device;
