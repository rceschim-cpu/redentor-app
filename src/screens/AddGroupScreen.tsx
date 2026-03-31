import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { PrimaryButton } from '../components';
import { createGroup } from '../services/groups';
import { useAuth } from '../context/AuthContext';

const ICONS = ['🏠', '❤️', '⚡', '💍', '🌿', '📖', '🕊️', '🙏', '🌟', '👨‍👩‍👧'];
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const STATUS_OPTIONS: Array<{ key: 'ativo' | 'em_formacao'; label: string }> = [
  { key: 'ativo', label: 'Ativo' },
  { key: 'em_formacao', label: 'Em formação' },
];

export default function AddGroupScreen({ navigation }: any) {
  const { user, appUser } = useAuth();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏠');
  const [meetingDay, setMeetingDay] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [location, setLocation] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [status, setStatus] = useState<'ativo' | 'em_formacao'>('ativo');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do pequeno grupo.');
      return;
    }
    if (!user || !appUser) return;

    setSaving(true);
    try {
      await createGroup(
        {
          name: name.trim(),
          icon,
          leaderId: user.uid,
          leaderName: appUser.name,
          meetingDay,
          meetingTime,
          location: location.trim(),
          neighborhood: neighborhood.trim(),
          status,
        },
        user.uid
      );
      Alert.alert('Grupo criado!', `"${name}" foi cadastrado com sucesso.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o grupo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Nome */}
      <View style={styles.field}>
        <Text style={styles.label}>NOME DO GRUPO</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Célula Norte"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="words"
        />
      </View>

      {/* Ícone */}
      <View style={styles.field}>
        <Text style={styles.label}>ÍCONE</Text>
        <View style={styles.iconGrid}>
          {ICONS.map((ic) => (
            <TouchableOpacity
              key={ic}
              style={[styles.iconBtn, icon === ic && styles.iconBtnActive]}
              onPress={() => setIcon(ic)}
            >
              <Text style={styles.iconEmoji}>{ic}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dia da reunião */}
      <View style={styles.field}>
        <Text style={styles.label}>DIA DA REUNIÃO</Text>
        <View style={styles.dayGrid}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, meetingDay === day && styles.dayChipActive]}
              onPress={() => setMeetingDay(day)}
            >
              <Text style={[styles.dayText, meetingDay === day && styles.dayTextActive]}>
                {day.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Horário */}
      <View style={styles.field}>
        <Text style={styles.label}>HORÁRIO</Text>
        <TextInput
          style={styles.input}
          value={meetingTime}
          onChangeText={setMeetingTime}
          placeholder="Ex: 19h30"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Local */}
      <View style={styles.field}>
        <Text style={styles.label}>LOCAL / ENDEREÇO</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Ex: Casa do líder"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Bairro */}
      <View style={styles.field}>
        <Text style={styles.label}>BAIRRO</Text>
        <TextInput
          style={styles.input}
          value={neighborhood}
          onChangeText={setNeighborhood}
          placeholder="Ex: Boa Vista"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Status */}
      <View style={styles.field}>
        <Text style={styles.label}>STATUS</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.statusChip, status === opt.key && styles.statusChipActive]}
              onPress={() => setStatus(opt.key)}
            >
              <Text style={[styles.statusText, status === opt.key && styles.statusTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <PrimaryButton label={saving ? 'Salvando...' : 'Criar Grupo'} onPress={handleSave} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: 18 },
  field: { gap: 8 },
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
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: { borderColor: Colors.primary, backgroundColor: '#EDE9E3' },
  iconEmoji: { fontSize: 20 },
  dayGrid: { flexDirection: 'row', gap: 6 },
  dayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  dayTextActive: { color: '#fff' },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  statusTextActive: { color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: Colors.textSecondary, fontSize: 14 },
});
