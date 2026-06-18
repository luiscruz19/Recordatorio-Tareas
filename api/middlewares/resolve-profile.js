import UserProfile from '../models/UserProfile.js';
import messages from '../config/messages.js';
import { errorMessage } from '../utils/messages.js';

/**
 * Resuelve (o crea perezosamente) el perfil local del usuario autenticado.
 * Las credenciales viven en el auth de fichada; acá guardamos un espejo mínimo
 * (display_name/email) para identificar al dueño de tareas/ajustes/dispositivos.
 * Cualquier usuario de fichada puede usar la app: en su primer request se crea el perfil.
 * Deja el registro en req.profile.
 */
export default async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json(errorMessage({ message: messages.generic.token_invalid }));
        }

        const email = (req.user.email || '').toLowerCase().trim() || null;
        const name =
            req.user.name ||
            [req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() ||
            email ||
            null;

        let profile = await UserProfile.findOne({ where: { user_id: userId } });
        if (!profile) {
            profile = await UserProfile.create({
                user_id: userId,
                email,
                display_name: name || 'Usuario',
            });
        } else {
            // Backfill con datos reales del JWT si el perfil quedó incompleto.
            const updates = {};
            if (email && profile.email !== email) updates.email = email;
            if (name && (!profile.display_name || profile.display_name === 'Usuario') && profile.display_name !== name) {
                updates.display_name = name;
            }
            if (Object.keys(updates).length) await profile.update(updates);
        }

        req.profile = profile;
        next();
    } catch (e) {
        return res.status(500).json(errorMessage({
            message: 'No se pudo resolver el perfil del usuario', extra: { error: e.message },
        }));
    }
};
