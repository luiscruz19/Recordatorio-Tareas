import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, R, GRAD_BRAND, shadowFab, shadowCard } from '../theme';
import { Isotipo } from '../components';

// Login con email + contraseña (mismos usuarios que fichada). No está en el diseño original;
// se arma en el estilo de marca.
export function LoginScreen({ onLogin, loading, error }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const canSubmit = !!email.trim() && !!password && !loading;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: C.bg }}
        >
            <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center' }}>
                <View style={{ alignItems: 'center', marginBottom: 34 }}>
                    <LinearGradient
                        colors={GRAD_BRAND}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={{ width: 92, height: 92, borderRadius: 26, alignItems: 'center', justifyContent: 'center', ...shadowFab }}
                    >
                        <Isotipo size={52} color="#fff" />
                    </LinearGradient>
                    <Text style={{ fontFamily: F.bold, fontSize: 26, color: C.inkStrong, marginTop: 20, letterSpacing: -0.5 }}>
                        Recordatorio Tareas
                    </Text>
                    <Text style={{ fontFamily: F.med, fontSize: 15, color: C.ink3, marginTop: 7 }}>
                        Entrá con tu cuenta
                    </Text>
                </View>

                <View style={{ backgroundColor: C.surface, borderRadius: R.xl, padding: 20, ...shadowCard }}>
                    <Field label="Email" value={email} onChangeText={setEmail}
                        placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                    <View style={{ height: 14 }} />
                    <Field label="Contraseña" value={password} onChangeText={setPassword}
                        placeholder="••••••••" secureTextEntry />

                    {!!error && (
                        <Text style={{ fontFamily: F.med, fontSize: 13.5, color: C.danger, marginTop: 14 }}>{error}</Text>
                    )}

                    <Pressable
                        onPress={() => canSubmit && onLogin(email.trim(), password)}
                        disabled={!canSubmit}
                        style={({ pressed }) => ({
                            marginTop: 20, height: 54, borderRadius: R.md, alignItems: 'center', justifyContent: 'center',
                            backgroundColor: canSubmit ? C.accent : '#E8EBF1',
                            transform: [{ scale: pressed && canSubmit ? 0.98 : 1 }],
                        })}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={{ fontFamily: F.semi, fontSize: 17, color: canSubmit ? '#fff' : '#B0B7C5' }}>Entrar</Text>}
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

function Field({ label, ...props }) {
    return (
        <View>
            <Text style={{ fontFamily: F.semi, fontSize: 12.5, letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted, marginBottom: 8, marginLeft: 2 }}>
                {label}
            </Text>
            <TextInput
                {...props}
                placeholderTextColor={C.muted2}
                style={{
                    fontFamily: F.med, fontSize: 16, color: C.ink,
                    backgroundColor: C.inputBg, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 14,
                }}
            />
        </View>
    );
}
