const messages = {
    generic: {
        fields_required: 'Todos los campos requeridos deben ser completados',
        invalid_status: 'El estado proporcionado no es válido',
        invalid_enum_value: 'El valor proporcionado no está permitido',
        id_required: 'El ID es requerido',
        invalid_date_format: 'Formato de fecha inválido',
        fields_empty: 'Campos vacíos',
        token_expirated: 'El token ingresado ha expirado.',
        token_invalid: 'El token ingresado no es válido.',
        token_not_found: 'El token ingresado no fue encontrado.',
        credential_invalid: 'Credenciales inválidas.',
        autorization_required: 'Autorización requerida.',
    },
    error: {
        general: {
            device_exists: 'Este dispositivo ya está vinculado',
        },

        user_profile: {
            fields_empty: {
                user_id: 'El usuario no puede estar vacío',
                display_name: 'El nombre no puede estar vacío',
            }
        },

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
