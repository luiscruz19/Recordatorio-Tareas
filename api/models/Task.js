import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Tarea del día, SIN hora. `task_date` es el día para el que es (DATEONLY).
 *  - "Hoy"        = status pending && task_date == hoy
 *  - "Carry-over" = status pending && task_date <  hoy  (van a la revisión obligatoria)
 *  - "Otro día"   = task_date > hoy
 * Se completa marcándola done (done_at sella el momento). Soft-delete (paranoid).
 */
const Task = sequelize.define('tasks', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.task.fields_empty.user_id },
        },
        comment: 'Dueño de la tarea (user_id de auth)'
    },
    text: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.task.fields_empty.text },
        },
    },
    task_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.task.fields_empty.task_date },
        },
        comment: 'Día para el que es la tarea (sin hora)'
    },
    status: {
        type: DataTypes.ENUM('pending', 'done'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            notNull: { msg: messages.error.task.fields_empty.status },
            isIn: {
                args: [['pending', 'done']],
                msg: messages.generic.invalid_enum_value,
            },
        },
    },
    done_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Momento en que se marcó como hecha'
    }
}, {
    tableName: 'tasks',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['task_date'] },
        { fields: ['status'] },
    ],
});

export default Task;
