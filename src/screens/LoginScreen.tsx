import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: implementar autenticação real (Firebase/Supabase)
    if (!email || !password) {
      Alert.alert('Preencha todos os campos');
      return;
    }
    navigation.replace('Main');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header com logo */}
      <View style={styles.header}>
        <Image
          source={require('../../logo2color.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoSub}>Área do Membro</Text>
      </View>

      {/* Formulário */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-MAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SENHA</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.btnText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnLink}
          onPress={() => Alert.alert('Recuperação de senha', 'Em breve!')}
        >
          <Text style={styles.btnLinkText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Comunidade do Redentor · IECLB</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: {
    width: 180,
    height: 100,
    marginBottom: 8,
  },
  logoSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  form: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  inputGroup: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnLink: { alignItems: 'center', paddingVertical: 8 },
  btnLinkText: { color: Colors.textSecondary, fontSize: 14 },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
});
