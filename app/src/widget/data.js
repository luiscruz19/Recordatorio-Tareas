import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'widget_today';
const EMPTY_SNAPSHOT = { pending: [], done: 0, total: 0 };

export async function saveWidgetData(data) {
    try { await AsyncStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export async function loadWidgetData() {
    try {
        const stored = await AsyncStorage.getItem(KEY);
        return stored ? JSON.parse(stored) : EMPTY_SNAPSHOT;
    } catch {
        return EMPTY_SNAPSHOT;
    }
}

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
