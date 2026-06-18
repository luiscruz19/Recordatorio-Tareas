import Constants from 'expo-constants';

// Feedback háptico suave para las acciones. Lazy + best-effort: no rompe en Expo Go ni en
// bundles servidos por OTA a builds sin el módulo nativo.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
let H = null;
let tried = false;
function mod() {
    if (tried) return H;
    tried = true;
    if (IS_EXPO_GO) return null;
    try { H = require('expo-haptics'); } catch { H = null; }
    return H;
}

export function tap() {
    const h = mod();
    if (h) h.impactAsync(h.ImpactFeedbackStyle.Light).catch(() => {});
}
export function tapMedium() {
    const h = mod();
    if (h) h.impactAsync(h.ImpactFeedbackStyle.Medium).catch(() => {});
}
export function success() {
    const h = mod();
    if (h) h.notificationAsync(h.NotificationFeedbackType.Success).catch(() => {});
}
