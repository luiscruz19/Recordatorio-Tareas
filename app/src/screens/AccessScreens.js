import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Delete, Fingerprint, ChevronLeft } from 'lucide-react-native';
import { C, F, R, GRAD_BRAND, shadowFab } from '../theme';
import { Isotipo } from '../components';

function Brand({ subtitle }) {
    return (
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <LinearGradient colors={GRAD_BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center', ...shadowFab }}>
                <Isotipo size={48} color="#fff" />
            </LinearGradient>
            <Text style={{ fontFamily: F.bold, fontSize: 24, color: C.inkStrong, marginTop: 18, letterSpacing: -0.5 }}>Recordatorio Tareas</Text>
            {subtitle ? <Text style={{ fontFamily: F.med, fontSize: 14.5, color: C.ink3, marginTop: 6 }}>{subtitle}</Text> : null}
        </View>
    );
}

// ---- Paso 1: email ----
export function EmailScreen({ onContinue, busy, error, initialEmail }) {
    const [email, setEmail] = useState(initialEmail || '');
    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
            <View style={{ flex: 1, padding: 28, justifyContent: 'center' }}>
                <Brand subtitle="Tus tareas del día, siempre presentes" />
                <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address"
                    autoCorrect={false} autoFocus placeholderTextColor={C.muted2} style={inputStyle} returnKeyType="next"
                    onSubmitEditing={() => onContinue(email)} />
                {error ? <ErrText>{error}</ErrText> : null}
                <PrimaryBtn onPress={() => onContinue(email)} busy={busy} label="Continuar" />
            </View>
        </KeyboardAvoidingView>
    );
}

// ---- Paso 2a (primer ingreso): contraseña ----
export function PasswordScreen({ email, onLogin, onBack, error, busy }) {
    const [password, setPassword] = useState('');
    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
            <View style={{ flex: 1, padding: 28, justifyContent: 'center' }}>
                <Brand subtitle="Primer ingreso" />
                <Text style={{ fontFamily: F.med, fontSize: 14, color: C.ink2, textAlign: 'center', marginBottom: 14 }}>{email}</Text>
                <TextInput value={password} onChangeText={setPassword} placeholder="Contraseña" secureTextEntry autoFocus
                    placeholderTextColor={C.muted2} style={inputStyle} onSubmitEditing={() => onLogin(password)} />
                {error ? <ErrText>{error}</ErrText> : null}
                <PrimaryBtn onPress={() => onLogin(password)} busy={busy} label="Ingresar" />
                <Pressable onPress={onBack} style={{ marginTop: 18, alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.ink3 }}>Cambiar email</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

// ---- Teclado numérico ----
function PinPad({ onDigit, onDelete }) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300, alignSelf: 'center' }}>
            {keys.map((k, i) => (
                <View key={i} style={{ width: '33.33%', alignItems: 'center', paddingVertical: 8 }}>
                    {k === '' ? <View style={{ width: 72, height: 72 }} /> : (
                        <Pressable onPress={() => (k === 'del' ? onDelete() : onDigit(k))}
                            style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.surfaceMuted : 'transparent' })}>
                            {k === 'del'
                                ? <Delete size={26} color={C.ink2} strokeWidth={1.7} />
                                : <Text style={{ fontFamily: F.med, fontSize: 28, color: C.ink }}>{k}</Text>}
                        </Pressable>
                    )}
                </View>
            ))}
        </View>
    );
}

// ---- PIN: create | confirm | login (email + PIN) ----
export function PinScreen({ mode, email, error, onComplete, onBio, onBack }) {
    const [pin, setPin] = useState('');
    const titles = { create: 'Creá tu PIN', confirm: 'Repetí el PIN', login: 'Ingresá tu PIN' };
    function digit(d) {
        const next = (pin + d).slice(0, 4);
        setPin(next);
        if (next.length === 4) {
            setTimeout(() => { onComplete(next); setPin(''); }, 120);
        }
    }
    return (
        <View style={{ flex: 1, padding: 28, justifyContent: 'center', backgroundColor: C.bg }}>
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
                {mode === 'login' && email ? <Text style={{ fontFamily: F.med, fontSize: 14, color: C.ink3, marginBottom: 6 }}>{email}</Text> : null}
                <Text style={{ fontFamily: F.bold, fontSize: 23, color: C.inkStrong }}>{titles[mode]}</Text>
                {mode === 'create' ? <Text style={{ fontFamily: F.med, fontSize: 14, color: C.ink3, marginTop: 6 }}>Lo vas a usar para abrir la app rápido.</Text> : null}
                {error ? <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.danger, marginTop: 8 }}>{error}</Text> : null}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 34 }}>
                {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: i < pin.length ? C.accent : C.circle, backgroundColor: i < pin.length ? C.accent : 'transparent' }} />
                ))}
            </View>

            <PinPad onDigit={digit} onDelete={() => setPin((p) => p.slice(0, -1))} />

            {mode === 'login' && onBio ? (
                <Pressable onPress={onBio} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 26 }}>
                    <Fingerprint size={22} color={C.accent} strokeWidth={1.7} />
                    <Text style={{ fontFamily: F.semi, fontSize: 15.5, color: C.accent }}>Usar huella</Text>
                </Pressable>
            ) : null}

            {mode === 'login' && onBack ? (
                <Pressable onPress={onBack} style={{ marginTop: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    <ChevronLeft size={16} color={C.ink3} strokeWidth={1.9} />
                    <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.ink3 }}>Cambiar email</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

function PrimaryBtn({ onPress, busy, label }) {
    return (
        <Pressable onPress={onPress} disabled={busy}
            style={({ pressed }) => ({ height: 54, borderRadius: R.md, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 22, opacity: busy ? 0.7 : 1, transform: [{ scale: pressed && !busy ? 0.98 : 1 }], ...shadowFab })}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ fontFamily: F.semi, fontSize: 17, color: '#fff' }}>{label}</Text>}
        </Pressable>
    );
}

function ErrText({ children }) {
    return <Text style={{ fontFamily: F.semi, fontSize: 13.5, color: C.danger, marginTop: 12 }}>{children}</Text>;
}

const inputStyle = {
    height: 54, borderRadius: R.md, backgroundColor: C.inputBg,
    paddingHorizontal: 16, fontFamily: F.med, fontSize: 16, color: C.ink,
};
