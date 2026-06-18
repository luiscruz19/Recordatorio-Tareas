import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Puente de datos app ↔ widget: la app guarda el snapshot de "hoy" y pide refrescar el widget.
const KEY = 'widget_today';

export async function saveWidgetData(data) {
    try { await AsyncStorage.setItem(KEY, JSON.stringify(data)); } catch { /* no-op */ }
}

export async function loadWidgetData() {
    try {
        const s = await AsyncStorage.getItem(KEY);
        return s ? JSON.parse(s) : { pending: [], done: 0, total: 0 };
    } catch {
        return { pending: [], done: 0, total: 0 };
    }
}

// Pide a Android que redibuje el widget con los datos actuales. Android-only y best-effort.
export async function refreshWidget() {
    if (Platform.OS !== 'android') return;
    try {
        const { requestWidgetUpdate } = require('react-native-android-widget');
        const React = require('react');
        const { TaskWidget } = require('./TaskWidget');
        const data = await loadWidgetData();
        await requestWidgetUpdate({
            widgetName: 'Tareas',
            renderWidget: () => React.createElement(TaskWidget, { data }),
            widgetNotFound: () => {},
        });
    } catch { /* el widget puede no estar agregado a la home */ }
}
