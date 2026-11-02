import { IS_EXPO_GO } from './runtime';

// Carga perezosa: no rompe en Expo Go ni en bundles OTA sobre builds sin el módulo nativo.
let hapticsModule = null;
let loadAttempted = false;

function loadHaptics() {
    if (loadAttempted) return hapticsModule;
    loadAttempted = true;
    if (IS_EXPO_GO) return null;
    try { hapticsModule = require('expo-haptics'); } catch { hapticsModule = null; }
    return hapticsModule;
}

export function tap() {
    const haptics = loadHaptics();
    if (haptics) haptics.impactAsync(haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function tapMedium() {
    const haptics = loadHaptics();
    if (haptics) haptics.impactAsync(haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function success() {
    const haptics = loadHaptics();
    if (haptics) haptics.notificationAsync(haptics.NotificationFeedbackType.Success).catch(() => {});
}
