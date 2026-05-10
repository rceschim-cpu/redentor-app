import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { ScheduleAssignment } from '../types';
import { createSchedule, createScheduleSeries } from '../services/schedules';
import { getMinistryMemberships } from '../services/ministries';

type Recurrence = 'unica' | 'semanal' | 'quinzenal' | 'mensal';

const ACCENT = '#E7C530';

export default function AddScheduleScreen({ route, navigation }: any) {
  const { ministryId, ministryName } = route.params as { ministryId: string; ministryName: string };
  const { appUser } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('unica');
  const [occurrences, setOccurrences] = useState('4');
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMinistryMemberships(ministryId).then((mems) =>
      setMembers(mems.map((m) => ({ id: m.memberId, name: m.memberName })))
    );
  }, [ministryId]);

  const toggleAssign = (id: string, name: string) => {
    if (assignments.some((a) => a.memberId === id)) {
      setAssignments(assignments.filter((a) => a.memberId !== id));
    } else {
      setAssignments([...assignments, { memberId: id, memberName: name }]);
    }
  };

  const setAssignRole = (id: string, role: string) => {
    setAssignments(assignments.map((a) => a.memberId === id ? { ...a, role } : a));
  };

  const onSave = async () => {
    if (!date) { Alert.alert('Atenção', 'Informe a data.'); return; }
    setSaving(true);
    try {
      const base = {
        ministryId, ministryName,
        date, time, title, description,
        assignments,
        createdBy: appUser?.uid,
      };
      if (recurrence === 'unica') {
        await createSchedule(base);
      } else {
        const n = Math.max(1, Math.min(parseInt(occurrences, 10) || 1, 26));
        await createScheduleSeries(base, recurrence, n);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a escala.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md, paddingBottom: 60 }}>
      <Field label="Título">
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: Culto Dominical 10h" />
      </Field>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="Data (YYYY-MM-DD)">
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-04-26" />
          </Field>
        </View>
        <View style={{ width: 100 }}>
          <Field label="Hora">
            <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="10:00" />
          </Field>
        </View>
      </View>

      <Field label="Descrição">
        <TextInput
          style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Observações"
          multiline
        />
      </Field>

      <Field label="Recorrência">
        <View style={styles.chipRow}>
          {(['unica', 'semanal', 'quinzenal', 'mensal'] as Recurrence[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, recurrence === r && styles.chipActive]}
              onPress={() => setRecurrence(r)}
            >
              <Text style={[styles.chipText, recurrence === r && styles.chipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      {recurrence !== 'unica' && (
        <Field label="Quantas ocorrências?">
          <TextInput
            style={styles.input}
            value={occurrences}
            onChangeText={setOccurrences}
            keyboardType="numeric"
            placeholder="4"
          />
        </Field>
      )}

      <Field label={`Voluntários escalados (${assignments.length})`}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => setPickerOpen(true)}>
          <Ionicons name="people-outline" size={18} color={Colors.primary} />
          <Text style={styles.btnSecondaryText}>
            {assignments.length > 0 ? `${assignments.length} selecionado(s)` : 'Selecionar voluntários'}
          </Text>
        </TouchableOpacity>
        {assignments.map((a) => (
          <View key={a.memberId} style={styles.assignRow}>
            <Text style={styles.assignName}>{a.memberName}</Text>
            <TextInput
              style={[styles.input, { flex: 1, paddingVertical: 6 }]}
              value={a.role}
              onChangeText={(r) => setAssignRole(a.memberId, r)}
              placeholder="Função (opcional)"
            />
          </View>
        ))}
      </Field>

      <TouchableOpacity style={styles.btnPrimary} onPress={onSave} disabled={saving}>
        <Text style={styles.btnPrimaryText}>{saving ? 'Salvando...' : '✓  Salvar escala'}</Text>
      </TouchableOpacity>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Voluntários</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)}>
              <Ionicons name="close" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={members}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: Spacing.md }}
            renderItem={({ item }) => {
              const checked = assignments.some((a) => a.memberId === item.id);
              return (
                <TouchableOpacity
                  style={[styles.pickerRow, checked && styles.pickerRowChecked]}
                  onPress={() => toggleAssign(item.id, item.name)}
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={checked ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={styles.pickerName}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhum voluntário neste ministério ainda.</Text>
            }
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, letterSpacing: 0.3 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:   { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  btnPrimary: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 12, marginBottom: 6,
  },
  btnSecondaryText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },

  assignRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, padding: 8, borderRadius: Radius.md,
    marginTop: 6, borderWidth: 1, borderColor: Colors.border,
  },
  assignName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, width: 110 },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: Colors.surface,
    borderRadius: Radius.md, marginBottom: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  pickerRowChecked: { borderColor: Colors.primary, backgroundColor: '#F5F8FE' },
  pickerName: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 30, fontSize: 13 },
});
