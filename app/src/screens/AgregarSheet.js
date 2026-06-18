import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plus } from 'lucide-react-native';
import { C, F, R } from '../theme';
import { fmtDateShort, toISO, todayISO } from '../helpers';

// Bottom sheet para agregar una tarea: texto + Para (Hoy / Otro día) + fecha opcional.
export function AgregarSheet({ visible, onClose, onSubmit }) {
    const [text, setText] = useState('');
    const [future, setFuture] = useState(false);
    const [date, setDate] = useState(null); // Date
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        if (visible) { setText(''); setFuture(false); setDate(null); setShowPicker(false); }
    }, [visible]);

    const canSubmit = !!text.trim();

    const submit = () => {
        if (!canSubmit) return;
        let task_date = null;
        if (future) {
            const d = date || new Date(Date.now() + 86400000);
            task_date = toISO(d);
            if (task_date <= todayISO()) task_date = toISO(new Date(Date.now() + 86400000));
        }
        onSubmit(text.trim(), task_date);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Pressable style={{ position: 'absolute', inset: 0, backgroundColor: C.overlay }} onPress={onClose} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30 }}>
                        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: C.bgTint2, alignSelf: 'center', marginBottom: 20 }} />
                        <Text style={{ fontFamily: F.bold, fontSize: 22, color: C.ink, letterSpacing: -0.3 }}>Nueva tarea</Text>

                        <TextInput
                            value={text} onChangeText={setText}
                            placeholder="¿Qué tenés que hacer?" placeholderTextColor={C.muted2}
                            multiline
                            style={{
                                marginTop: 16, padding: 16, fontFamily: F.med, fontSize: 17, color: C.ink, lineHeight: 23,
                                backgroundColor: C.bg, borderRadius: R.md, minHeight: 76, textAlignVertical: 'top',
                            }}
                        />

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 18 }}>
                            <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.ink3 }}>Para</Text>
                            <View style={{ flex: 1, flexDirection: 'row', gap: 6, backgroundColor: C.inputBg, borderRadius: R.md, padding: 5 }}>
                                <DaySeg label="Hoy" active={!future} onPress={() => setFuture(false)} />
                                <DaySeg label="Otro día" active={future} onPress={() => setFuture(true)} />
                            </View>
                        </View>

                        {future && (
                            <Pressable
                                onPress={() => setShowPicker(true)}
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.bg, borderRadius: R.md }}
                            >
                                <Text style={{ fontFamily: F.med, fontSize: 16, color: C.ink }}>Fecha</Text>
                                <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.accent }}>
                                    {date ? fmtDateShort(toISO(date)) : 'Mañana'}
                                </Text>
                            </Pressable>
                        )}

                        {showPicker && (
                            <DateTimePicker
                                value={date || new Date(Date.now() + 86400000)}
                                mode="date"
                                minimumDate={new Date(Date.now() + 86400000)}
                                onChange={(e, d) => { setShowPicker(Platform.OS === 'ios'); if (d) setDate(d); }}
                            />
                        )}

                        <Pressable
                            onPress={submit} disabled={!canSubmit}
                            style={({ pressed }) => ({
                                marginTop: 22, height: 54, borderRadius: R.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                backgroundColor: canSubmit ? C.accent : '#E8EBF1',
                                transform: [{ scale: pressed && canSubmit ? 0.98 : 1 }],
                            })}
                        >
                            <Plus size={20} color={canSubmit ? '#fff' : '#B0B7C5'} strokeWidth={2.6} />
                            <Text style={{ fontFamily: F.semi, fontSize: 17, color: canSubmit ? '#fff' : '#B0B7C5' }}>Agregar tarea</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

function DaySeg({ label, active, onPress }) {
    return (
        <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: R.sm, backgroundColor: active ? C.surface : 'transparent', ...(active ? { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 } : null) }}>
            <Text style={{ fontFamily: F.semi, fontSize: 15, color: active ? C.accent : C.ink3 }}>{label}</Text>
        </Pressable>
    );
}
