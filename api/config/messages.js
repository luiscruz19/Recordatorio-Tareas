const messages = {
    generic: {
        invalid_enum_value: 'El valor proporcionado no está permitido',
        token_expirated: 'El token ingresado ha expirado.',
        token_invalid: 'El token ingresado no es válido.',
        token_not_found: 'El token ingresado no fue encontrado.',
    },
    error: {
        task: {
            fields_empty: {
                user_id: 'El usuario no puede estar vacío',
                text: 'El texto de la tarea no puede estar vacío',
                task_date: 'La fecha de la tarea no puede estar vacía',
                status: 'El estado no puede estar vacío',
            }
        },

        reminder_setting: {
            fields_empty: {
                user_id: 'El usuario no puede estar vacío',
            }
        },

        device: {
            fields_empty: {
                user_id: 'El usuario no puede estar vacío',
                device_uuid: 'El identificador del dispositivo no puede estar vacío',
                status: 'El estado no puede estar vacío',
            }
        },

        notification: {
            fields_empty: {
                user_id: 'El usuario no puede estar vacío',
                type: 'El tipo de notificación no puede estar vacío',
                status: 'El estado no puede estar vacío',
            }
        },
    },
};

export default messages;
