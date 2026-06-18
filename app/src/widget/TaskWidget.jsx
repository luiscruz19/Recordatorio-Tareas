import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

// Vista del widget de pantalla de inicio (Android). Mismo estilo que la app: fondo claro,
// pendientes de hoy, botón "+". Tocar abre la app; el "+" abre el formulario de agregar.
export function TaskWidget({ data }) {
    const pending = (data && data.pending) || [];
    const done = (data && data.done) || 0;
    const total = (data && data.total) || 0;

    return (
        <FlexWidget
            clickAction="OPEN_URI"
            clickActionData={{ uri: 'recordatorios://hoy' }}
            style={{
                height: 'match_parent', width: 'match_parent',
                backgroundColor: '#FFFFFF', borderRadius: 24, padding: 14, flexDirection: 'column',
            }}
        >
            <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', alignItems: 'center' }}>
                <TextWidget text="Tareas de hoy" style={{ fontSize: 15, fontWeight: '700', color: '#1F2433' }} />
                <FlexWidget style={{ flexGrow: 1 }} />
                <FlexWidget
                    clickAction="OPEN_URI"
                    clickActionData={{ uri: 'recordatorios://add' }}
                    style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#1F4894', alignItems: 'center', justifyContent: 'center' }}
                >
                    <TextWidget text="+" style={{ fontSize: 22, color: '#FFFFFF' }} />
                </FlexWidget>
            </FlexWidget>

            {pending.length === 0 ? (
                <TextWidget text="¡Todo hecho por hoy!" style={{ fontSize: 13, color: '#8A93A6', marginTop: 14 }} />
            ) : (
                pending.slice(0, 4).map((t) => (
                    <FlexWidget
                        key={String(t.id)}
                        clickAction="OPEN_URI"
                        clickActionData={{ uri: `recordatorios://task/${t.id}` }}
                        style={{ flexDirection: 'row', width: 'match_parent', alignItems: 'center', marginTop: 10 }}
                    >
                        <FlexWidget style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#E7ECF6', marginRight: 10 }} />
                        <TextWidget text={t.text} maxLines={1} truncate="END" style={{ fontSize: 14, color: '#2B3142' }} />
                    </FlexWidget>
                ))
            )}

            <FlexWidget style={{ flexGrow: 1 }} />
            <TextWidget text={`${done} de ${total} completadas`} style={{ fontSize: 12, color: '#9AA3B5', marginTop: 10 }} />
        </FlexWidget>
    );
}
