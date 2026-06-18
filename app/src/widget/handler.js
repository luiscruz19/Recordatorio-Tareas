import { Platform } from 'react-native';

// Registra el task handler del widget (Android-only). Todo se carga de forma perezosa para no
// importar el módulo nativo en iOS / web / Expo Go.
if (Platform.OS === 'android') {
    try {
        const React = require('react');
        const { Linking } = require('react-native');
        const { registerWidgetTaskHandler } = require('react-native-android-widget');
        const { TaskWidget } = require('./TaskWidget');
        const { loadWidgetData } = require('./data');

        registerWidgetTaskHandler(async (props) => {
            const data = await loadWidgetData();
            const element = React.createElement(TaskWidget, { data });

            switch (props.widgetAction) {
                case 'WIDGET_ADDED':
                case 'WIDGET_UPDATE':
                case 'WIDGET_RESIZED':
                    props.renderWidget(element);
                    break;
                case 'WIDGET_CLICK': {
                    const uri = props.clickActionData && props.clickActionData.uri;
                    if (uri) { try { await Linking.openURL(uri); } catch { /* no-op */ } }
                    props.renderWidget(element);
                    break;
                }
                default:
                    break;
            }
        });
    } catch { /* widget no disponible (p.ej. Expo Go) */ }
}
