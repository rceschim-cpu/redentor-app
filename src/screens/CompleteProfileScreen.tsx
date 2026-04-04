import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { ArchBar, PrimaryButton } from '../components';
import { addMember } from '../services/members';
import { updateUserProfile } from '../services/userProfile';
import { useAuth } from '../context/AuthContext';
import { maskPhone, maskDate } from '../utils/masks';

export default function CompleteProfileScreen() {
  const { user, appUser, refreshAppUser } = useAuth();
  const [name, setName] = useState(appUser?.name ?? '');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [saving, setSaving] = useState(false);

  const canSkip = appUser?.role === 'administrador' || appUser?.role === 'pastor';

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Por favor informe seu nome completo.');
      return;
    }
    if (!user || !appUser) return;

    setSaving(true);
    try {
      const memberId = await addMember({
        name: name.trim(),
        phone: phone.trim() || undefined,
        birthDate: birthDate.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        email: appUser.email,
        status: 'ativo',
        avatarIndex: Math.floor(Math.random() * 4),
      });
      await updateUserProfile(user.uid, {
        name: name.trim(),
        memberId,
        profileComplete: true,
      });
      await refreshAppUser();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { profileComplete: true });
      await refreshAppUser();
    } catch {
      Alert.alert('Erro', 'Tente novamente.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ArchBar />

      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Complete seu perfil</Text>
      <Text style={styles.subtitle}>
        Suas informações ficam vinculadas à sua conta na Comunidade do Redentor.
      </Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>NOME COMPLETO</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Como você é conhecido na comunidade"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>TELEFONE</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(v) => setPhone(maskPhone(v))}
            placeholder="(41) 99999-9999"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>DATA DE NASCIMENTO</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={(v) => setBirthDate(maskDate(v))}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>BAIRRO</Text>
          <TextInput
            style={styles.input}
            value={neighborhood}
            onChangeText={setNeighborhood}
            placeholder="Ex: Boa Vista"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
        </View>
      </View>

      <PrimaryButton
        label={saving ? 'Salvando...' : 'Concluir cadastro'}
        onPress={handleComplete}
      />

      {canSkip && (
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Pular por enquanto</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl },
  logo: {
    width: 160,
    height: 56,
    alignSelf: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: Typography.heading,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  form: { gap: 16, marginBottom: Spacing.xl },
  field: { gap: 6 },
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
  skipBtn: { alignItems: 'center', marginTop: Spacing.md, paddingVertical: 10 },
  skipText: { color: Colors.textMuted, fontSize: 13 },
});
