import * as LocalAuthentication from 'expo-local-authentication';
import { getItem, setItem, deleteItem, IS_WEB } from './storage';

// Espejo del modelo de fichada: el "secreto" que respalda la biometría es el PIN local
// cifrado (SecureStore), guardado en una clave simple (sin atarlo al email). Tras validar
// huella/FaceID se recupera ese PIN y se hace el login-pin normal contra el backend.
const PIN_KEY = 'recordatorios_pin';

export const getLocalPin = () => getItem(PIN_KEY);

export async function saveLocalPin(pin) {
    if (pin) await setItem(PIN_KEY, pin);
}

export const clearLocalPin = () => deleteItem(PIN_KEY);

/** Hardware biométrico disponible Y con al menos una huella/rostro enrolado. */
export async function hwEnrolled() {
    if (IS_WEB) return false;
    const hw = await LocalAuthentication.hasHardwareAsync().catch(() => false);
    const enrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
    return !!(hw && enrolled);
}

/** Lanza el prompt biométrico. Devuelve true si la validación fue exitosa. */
export async function authenticate(promptMessage = 'Ingresar a Recordatorio Tareas') {
    if (IS_WEB) return false;
    const r = await LocalAuthentication.authenticateAsync({ promptMessage })
        .catch(() => ({ success: false }));
    return !!r?.success;
}
