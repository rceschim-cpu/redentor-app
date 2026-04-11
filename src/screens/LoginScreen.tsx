import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { signIn, signUp, resetPassword, signInWithGoogle, translateAuthError } from '../services/auth';
import { showAlert } from '../utils/alert';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showError = showAlert;

  const switchMode = (next: Mode) => {
    setMode(next);
    // Preserva email ao trocar de aba; limpa apenas nome e senhas
    setName('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showError('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      showError('Erro ao entrar', translateAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showError('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      showError('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      showError('Senhas diferentes', 'As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      // AuthContext cria o perfil automaticamente via onAuthStateChanged
    } catch (e: any) {
      showError('Erro ao criar conta', translateAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showError('Informe seu e-mail primeiro para recuperar a senha.');
      return;
    }
    try {
      await resetPassword(email.trim());
      showError('E-mail enviado', 'Verifique sua caixa de entrada para redefinir a senha.');
    } catch (e: any) {
      showError('Erro', translateAuthError(e.code));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoSub}>Área do Membro</Text>
        </View>

        {/* Tabs login / criar conta */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => switchMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'register' && styles.tabActive]}
            onPress={() => switchMode('register')}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Criar conta</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOME COMPLETO</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
          )}

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

          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRMAR SENHA</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.btnGoogle}
            onPress={async () => {
              try {
                await signInWithGoogle();
              } catch (e: any) {
                if (e.code !== 'auth/popup-closed-by-user') {
                  showError('Erro', translateAuthError(e.code));
                }
              }
            }}
            activeOpacity={0.85}
          >
            <View style={styles.btnGoogleInner}>
              {/* Google "G" logo em SVG inline via Image data URI */}
              <Image
                source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTI0IDkuNWMzLjU0IDAgNi43MSAxLjIyIDkuMjEgMy42bDYuODUtNi44NUMzNS45IDIuMzggMzAuMzMgMCAyNCAwIDEzLjU4IDAgNC42NCA2LjQ3IDEuNjQgMTUuNzVsNy45NiA2LjE4QzkuMzcgMTYuMDYgMTYuMDkgOS41IDI0IDkuNXoiLz48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2Yy00LjUxIDQuMTgtMTAuOTkgNi40LTE4Ljg5IDYuNC05LjI2IDAtMTcuMy02LjA3LTIwLjE4LTE0LjU2bC03Ljk2IDYuMThDNi4xIDQxLjk2IDE0LjUyIDQ4IDI0IDQ4YzYuNDggMCAxMS45My0yLjE0IDE1LjkxLTUuNzlsLTcuNzMtNmMtMi4xMiAxLjQzLTQuODMgMi4yNy03LjkxIDIuMjctNy4yNiAwLTEzLjQtNC44OS0xNS42LTExLjQ4bC03Ljk4IDYuMkM2LjA3IDQxLjk0IDE0LjUzIDQ4IDI0IDQ4YzYuNSAwIDExLjk1LTIuMTMgMTUuOTMtNS43N2w3LjczIDZDNDMuNzUgNDUuMTMgNDggMzUuMDcgNDggMjRjMC0uODItLjAzLTEuNjQtLjA2LTIuNDVIMjR2OS4wMmgxMy4yYy0uNTcgMi45OC0yLjI3IDUuNTItNC44IDcuMjNsNy43MyA2YzQuNTItNC4xOCA3LjM5LTEwLjM4IDcuMzktMTkuMjV6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNCIgZD0iTTEwLjUzIDI4LjU5Yy0uMzctMS4xMy0uNTktMi4zMy0uNTktMy41OXMuMjItMi40NS41OS0zLjU5VjE1LjI1bC03Ljk2LTYuMThDLjkyIDE1LjY0IDAgMTkuNjUgMCAyNHMuOTIgOC4zNiAyLjU3IDExLjkzbDcuOTYtNi4xOC0uMDYtMS4xNnoiLz48cGF0aCBmaWxsPSIjMzRBODUzIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTQgMTUuOTEtNS43OWwtNy43My02Yy0yLjEyIDEuNDMtNC44MyAyLjI3LTcuOTEgMi4yNy03LjI2IDAtMTMuNC00Ljg5LTE1LjYtMTEuNDhsLTcuOTYgNi4xOEM2LjEgNDEuOTYgMTQuNTIgNDggMjQgNDh6Ii8+PC9zdmc+' }}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.btnGoogleText}>Entrar com Google</Text>
            </View>
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity style={styles.btnLink} onPress={handleForgotPassword}>
              <Text style={styles.btnLinkText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.footer}>Comunidade do Redentor · IECLB</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: Colors.surface,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: { width: 180, height: 100, marginBottom: 8 },
  logoSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  form: { flex: 1, padding: 24, gap: 16 },
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
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textMuted },
  btnGoogle: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnGoogleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleIcon: { width: 20, height: 20 },
  btnGoogleText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
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
