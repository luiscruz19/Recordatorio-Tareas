import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, ChevronRight, Clock3, Bell, RotateCcw } from 'lucide-react-native';
import { C, F, R, GRAD_HEADER, shadowHeader, shadowCard } from '../theme';

const INTERVALS = [
    { value: 30, label: '30 min' },
    { value: 60, label: '1 h' },
    { value: 120, label: '2 h' },
    { value: 240, label: '4 h' },
];

function timeToDate(t) {
    const [h, m] = String(t || '09:00').split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
}
function dateToTime(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:00`;
}
function timeLabel(t) {
    return String(t || '').slice(0, 5);
}

export function AjustesScreen({ settings, onBack, onChange, onSimulateReview, notifStatus }) {
    const [picker, setPicker] = useState(null); // 'start' | 'end' | null
    const s = settings || {};
    const notifOn = !!s.notif_enabled;
    const notifLabel = notifStatus === 'granted' || notifOn ? 'Activadas · suenan en tu franja' : 'Desactivadas';

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <LinearGradient
                colors={GRAD_HEADER} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, ...shadowHeader }}
            >
                <Pressable onPress={onBack} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}>
                    <ChevronLeft size={22} color="#fff" strokeWidth={2.2} />
                    <Text style={{ fontFamily: F.semi, fontSize: 15, color: 'rgba(255,255,255,0.92)' }}>Volver</Text>
                </Pressable>
                <Text style={{ fontFamily: F.bold, fontSize: 32, color: '#fff', letterSpacing: -0.8, marginTop: 8 }}>Ajustes</Text>
            </LinearGradient>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 40 }}>
                {/* Recordarme cada */}
                <Text style={label}>Recordarme cada</Text>
                <View style={{ backgroundColor: C.surface, borderRadius: R.lg, padding: 6, flexDirection: 'row', gap: 6, ...shadowCard }}>
                    {INTERVALS.map((o) => {
                        const active = Number(s.interval_minutes) === o.value;
                        return (
                            <Pressable key={o.value} onPress={() => onChange({ interval_minutes: o.value })}
                                style={{ flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: R.md, backgroundColor: active ? C.accent : 'transparent' }}>
                                <Text style={{ fontFamily: F.semi, fontSize: 14, color: active ? '#fff' : C.ink3 }}>{o.label}</Text>
                            </Pressable>
                        );
                    })}
                </View>
                <Text style={hint}>Un solo ritmo para todas las tareas del día.</Text>

                {/* Franja horaria */}
                <Text style={[label, { marginTop: 26 }]}>Franja horaria activa</Text>
                <View style={{ backgroundColor: C.surface, borderRadius: R.lg, overflow: 'hidden', ...shadowCard }}>
                    <TimeRow icon label="Desde" value={timeLabel(s.window_start)} onPress={() => setPicker('start')} divider />
                    <TimeRow icon label="Hasta" value={timeLabel(s.window_end)} onPress={() => setPicker('end')} />
                </View>
                <Text style={hint}>Fuera de esta franja no suenan recordatorios.</Text>

                {/* Notificaciones */}
                <Text style={[label, { marginTop: 26 }]}>Notificaciones</Text>
                <View style={{ backgroundColor: C.surface, borderRadius: R.lg, ...shadowCard }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                            <IconBox><Bell size={18} color={C.accent} strokeWidth={1.6} /></IconBox>
                            <View>
                                <Text style={{ fontFamily: F.med, fontSize: 16, color: C.ink }}>Recordatorios</Text>
                                <Text style={{ fontFamily: F.reg, fontSize: 13, color: notifOn ? C.ok : C.muted2, marginTop: 1 }}>{notifLabel}</Text>
                            </View>
                        </View>
                        <Switch
                            value={notifOn}
                            onValueChange={(v) => onChange({ notif_enabled: v })}
                            trackColor={{ false: '#D3D8E2', true: C.accent }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Demo */}
                <Text style={[label, { marginTop: 26 }]}>Demo</Text>
                <Pressable onPress={onSimulateReview}
                    style={({ pressed }) => ({ backgroundColor: pressed ? '#FAFBFD' : C.surface, borderRadius: R.lg, paddingHorizontal: 18, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadowCard })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <IconBox><RotateCcw size={18} color={C.accent} strokeWidth={1.8} /></IconBox>
                        <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.accent }}>Ver tareas pendientes de días previos</Text>
                    </View>
                    <ChevronRight size={18} color="#C2C8D2" strokeWidth={2} />
                </Pressable>
            </ScrollView>

            {picker && (
                <DateTimePicker
                    value={timeToDate(picker === 'start' ? s.window_start : s.window_end)}
                    mode="time" is24Hour
                    onChange={(e, d) => {
                        setPicker(Platform.OS === 'ios' ? picker : null);
                        if (d) onChange(picker === 'start' ? { window_start: dateToTime(d) } : { window_end: dateToTime(d) });
                    }}
                />
            )}
        </View>
    );
}

function TimeRow({ label, value, onPress, divider }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: divider ? 1 : 0, borderBottomColor: C.hairline }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconBox><Clock3 size={18} color={C.accent} strokeWidth={1.9} /></IconBox>
                <Text style={{ fontFamily: F.med, fontSize: 16, color: C.ink }}>{label}</Text>
            </View>
            <Pressable onPress={onPress} style={{ backgroundColor: C.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.accent }}>{value}</Text>
            </Pressable>
        </View>
    );
}

function IconBox({ children }) {
    return (
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.iconBg, alignItems: 'center', justifyContent: 'center' }}>
            {children}
        </View>
    );
}

const label = { fontFamily: F.semi, fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase', color: C.muted, paddingHorizontal: 6, paddingBottom: 11 };
const hint = { fontFamily: F.reg, fontSize: 13, color: C.muted2, paddingHorizontal: 6, paddingTop: 10, lineHeight: 19 };
