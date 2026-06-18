import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

// Widget de pantalla de inicio (Android), fondo azul de marca. Pendientes de hoy + botón "+".
// Tocar el widget abre la app; el "+" abre el formulario de nueva tarea.
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
                backgroundColor: '#21498F', borderRadius: 24, padding: 16, flexDirection: 'column',
            }}
        >
            <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <TextWidget text="Tareas de hoy" style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }} />
                <FlexWidget
                    clickAction="OPEN_URI"
                    clickActionData={{ uri: 'recordatorios://add' }}
                    style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
                >
                    <TextWidget text="+" style={{ fontSize: 24, color: '#1F4894' }} />
                </FlexWidget>
            </FlexWidget>

            {pending.length === 0 ? (
                <TextWidget text="¡Todo hecho por hoy!" style={{ fontSize: 13, color: '#AFC2E6', marginTop: 6 }} />
            ) : (
                pending.slice(0, 4).map((t) => (
                    <FlexWidget
                        key={String(t.id)}
                        clickAction="OPEN_URI"
                        clickActionData={{ uri: `recordatorios://task/${t.id}` }}
                        style={{ flexDirection: 'row', width: 'match_parent', alignItems: 'center', marginBottom: 10 }}
                    >
                        <FlexWidget style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#6E8CC4', marginRight: 11 }} />
                        <TextWidget text={t.text} maxLines={1} truncate="END" style={{ fontSize: 14, color: '#EAF0FA' }} />
                    </FlexWidget>
                ))
            )}

            <FlexWidget style={{ flexGrow: 1 }} />
            <TextWidget text={`${done} de ${total} completadas`} style={{ fontSize: 12, color: '#9FB4DC', marginTop: 8 }} />
        </FlexWidget>
    );
}
