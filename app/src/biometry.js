import * as LocalAuthentication from 'expo-local-authentication';
import { getItem, setItem, deleteItem, IS_WEB } from './storage';

// La biometría solo libera el PIN cifrado en SecureStore; el ingreso sigue siendo el login por PIN.
const PIN_KEY = 'recordatorios_pin';

export const getLocalPin = () => getItem(PIN_KEY);

export async function saveLocalPin(pin) {
    if (pin) await setItem(PIN_KEY, pin);
}

export const clearLocalPin = () => deleteItem(PIN_KEY);

export async function hwEnrolled() {
    if (IS_WEB) return false;
    const hasHardware = await LocalAuthentication.hasHardwareAsync().catch(() => false);
    const enrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
    return !!(hasHardware && enrolled);
}

export async function authenticate(promptMessage = 'Ingresar a Recordatorio Tareas') {
    if (IS_WEB) return false;
    const result = await LocalAuthentication.authenticateAsync({ promptMessage })
        .catch(() => ({ success: false }));
    return !!result?.success;
}
