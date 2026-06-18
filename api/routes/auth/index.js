import { Router } from 'express';
import { login, me } from '../../controllers/auth/proxy.controllers.js';
import validateToken from '../../middlewares/validate-token.js';
import resolveProfile from '../../middlewares/resolve-profile.js';

const auth = Router();

// Público: proxy de login a fichada_auth (mismos usuarios que fichada).
auth.post('/login', login);

// Protegido: perfil + ajustes del usuario autenticado.
auth.get('/me', [validateToken, resolveProfile], me);

export default auth;
