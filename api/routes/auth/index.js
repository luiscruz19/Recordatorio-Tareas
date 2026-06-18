import { Router } from 'express';
import { login, me } from '../../controllers/auth/proxy.controllers.js';
import { setPin, loginPin, hasPin } from '../../controllers/auth/pin.controllers.js';
import validateToken from '../../middlewares/validate-token.js';
import resolveProfile from '../../middlewares/resolve-profile.js';

const auth = Router();

// Públicos (sin token):
auth.post('/login', login);        // primer ingreso: email + contraseña (proxy a fichada_auth)
auth.post('/login-pin', loginPin); // ingresos siguientes: email + PIN
auth.get('/has-pin', hasPin);      // ¿el email ya tiene PIN? → la app elige pantalla

// Protegidos (JWT):
auth.get('/me', [validateToken, resolveProfile], me);
auth.post('/set-pin', [validateToken, resolveProfile], setPin); // crear PIN tras el primer ingreso

export default auth;
