import { Router } from 'express';
import { login, me, hasPin, loginPin, setPin } from '../../controllers/auth/proxy.controllers.js';
import validateToken from '../../middlewares/validate-token.js';

const auth = Router();

// Credenciales: delegadas 100% a fichada_api (mismos usuarios + mismo PIN que fichada).
auth.post('/login', login);        // primer ingreso: email + contraseña
auth.post('/login-pin', loginPin); // ingresos siguientes: email + PIN (el de fichada)
auth.get('/has-pin', hasPin);      // ¿el email ya tiene PIN en fichada?
auth.post('/set-pin', setPin);     // crear/cambiar el PIN en fichada (fichada valida el JWT)

// Perfil + ajustes locales del usuario autenticado (esto sí es propio de recordatorios).
auth.get('/me', validateToken, me);

export default auth;
