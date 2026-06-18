import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Espejo local del usuario del servicio auth de fichada. Las credenciales/JWT viven en auth;
 * acá guardamos lo mínimo de dominio (display_name/email) para identificar al dueño de
 * tareas/ajustes/dispositivos. Se crea perezosamente en el primer login (mismos usuarios que fichada).
 */
const UserProfile = sequelize.define('user_profiles', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.user_profile.fields_empty.user_id },
        },
        comment: 'FK al usuario del servicio auth de fichada'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    display_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Usuario',
        validate: {
            notNull: { msg: messages.error.user_profile.fields_empty.display_name },
        },
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: {
                args: [['active', 'inactive']],
                msg: messages.generic.invalid_enum_value,
            },
        },
    }
}, {
    tableName: 'user_profiles',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['user_id'], name: 'user_profiles_user_id' },
        { fields: ['status'] },
    ],
});

export default UserProfile;
