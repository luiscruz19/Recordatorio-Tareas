import * as LocalAuthentication from 'expo-local-authentication';
import { getItem, setItem, deleteItem, IS_WEB } from './storage';

// El "secreto" que respalda la biometría es el PIN local cifrado (SecureStore), atado
// al email al que pertenece. La biometría no guarda credenciales propias: tras validar
// la huella/FaceID recupera este PIN y hace el login-pin normal contra el backend.
const BIO_KEY = 'recordatorios_bio'; // JSON { email, pin }

export async function saveLocalPin(email, pin) {
    if (!email || !pin) return;
    await setItem(BIO_KEY, JSON.stringify({ email: String(email).toLowerCase(), pin }));
}

export async function getLocalPin(email) {
    const raw = await getItem(BIO_KEY);
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        // Solo sirve si es del mismo email (si cambiaste de cuenta, no aplica).
        if (email && data?.email && data.email !== String(email).toLowerCase()) return null;
        return data?.pin || null;
    } catch { return null; }
}

export async function clearLocalPin() {
    await deleteItem(BIO_KEY);
}

/** ¿Se puede ofrecer biometría para este email? PIN local + hardware disponible + enrolado. */
export async function canUseBiometry(email) {
    if (IS_WEB) return false;
    const pin = await getLocalPin(email);
    if (!pin) return false;
    const hw = await LocalAuthentication.hasHardwareAsync().catch(() => false);
    const enrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
    return !!(hw && enrolled);
}

/** Lanza el prompt biométrico. Devuelve true si la validación fue exitosa. */
export async function authenticate(promptMessage = 'Ingresar a Recordatorio Tareas') {
    if (IS_WEB) return false;
    const r = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Usar PIN',
        disableDeviceFallback: false,
    }).catch(() => ({ success: false }));
    return !!r?.success;
}
