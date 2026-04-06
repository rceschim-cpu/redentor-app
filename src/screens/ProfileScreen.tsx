import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../theme';
import { Avatar, Card, PrimaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import { updateUserProfile } from '../services/userProfile';
import { getMember, updateMember } from '../services/members';
import { getGroups } from '../services/groups';
import { requestToJoin } from '../services/memberships';
import { maskPhone, maskDate } from '../utils/masks';
import { Group, Member } from '../types';

const showAlert = (title: string, msg?: string) => {
  const full = msg ? `${title}\n${msg}` : title;
  if (Platform.OS === 'web') {
    // @ts-ignore
    window.alert(full);
  } else {
    Alert.alert(title, msg);
  }
};

export default function ProfileScreen({ navigation }: any) {
  const { user, appUser, refreshAppUser } = useAuth();

  // campos editáveis
  const [name, setName] = useState(appUser?.name ?? '');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  // dados carregados
  const [member, setMember] = useState<Member | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [requestingGroup, setRequestingGroup] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Carrega dados do membro vinculado
      if (appUser?.memberId) {
        getMember(appUser.memberId).then((m) => {
          if (m) {
            setMember(m);
            setName(m.name);
            setPhone(m.phone ?? '');
            setBirthDate(m.birthDate ?? '');
            setNeighborhood(m.neighborhood ?? '');
          }
        });
      } else {
        setName(appUser?.name ?? '');
      }
    }, [appUser?.memberId, appUser?.name])
  );

  const handleSave = async () => {
    if (!name.trim()) { showAlert('Nome obrigatório'); return; }
    setSaving(true);
    try {
      // Atualiza perfil do usuário
      await updateUserProfile(user!.uid, { name: name.trim() });
      // Se tem memberId, atualiza também o registro de membro
      if (appUser?.memberId) {
        await updateMember(appUser.memberId, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          birthDate: birthDate.trim() || undefined,
          neighborhood: neighborhood.trim() || undefined,
        });
      }
      await refreshAppUser();
      setEditMode(false);
      showAlert('Perfil atualizado!');
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const all = await getGroups();
      setGroups(all);
    } catch {
      showAlert('Erro', 'Não foi possível carregar os grupos.');
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleRequestGroup = async (group: Group) => {
    if (!user || !appUser) return;
    setRequestingGroup(group.id);
    try {
      await requestToJoin(group.id, user.uid, appUser.name, appUser.email ?? user.email ?? '');
      setShowGroupPicker(false);
      showAlert('Solicitação enviada!', `Aguarde a aprovação do líder do grupo "${group.name}".`);
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível enviar a solicitação.');
    } finally {
      setRequestingGroup(null);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm('Deseja encerrar a sessão?')) signOut();
    } else {
      Alert.alert('Sair', 'Deseja encerrar a sessão?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => signOut() },
      ]);
    }
  };

  const currentGroupName = member?.groupId
    ? groups.find((g) => g.id === member.groupId)?.name ?? '—'
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Hero */}
      <View style={styles.hero}>
        <Avatar name={name || appUser?.name || 'U'} size={72} index={1} photoURL={appUser?.photoURL} />
        <Text style={styles.heroName}>{name || appUser?.name}</Text>
        <Text style={styles.heroEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{appUser?.role ?? 'membro'}</Text>
        </View>
      </View>

      {/* Dados pessoais */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DADOS PESSOAIS</Text>
          {!editMode && (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <Text style={styles.editLink}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {editMode ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>NOME</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName}
                autoCapitalize="words" placeholderTextColor={Colors.textMuted} placeholder="Seu nome" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>TELEFONE</Text>
              <TextInput style={styles.input} value={phone}
                onChangeText={(v) => setPhone(maskPhone(v))}
                keyboardType="phone-pad" placeholder="(41) 99999-9999" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>NASCIMENTO</Text>
              <TextInput style={styles.input} value={birthDate}
                onChangeText={(v) => setBirthDate(maskDate(v))}
                keyboardType="numeric" placeholder="DD/MM/AAAA" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>BAIRRO</Text>
              <TextInput style={styles.input} value={neighborhood} onChangeText={setNeighborhood}
                autoCapitalize="words" placeholder="Ex: Boa Vista" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.editBtns}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setEditMode(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSaveText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <InfoRow label="Nome" value={name || appUser?.name} />
            <InfoRow label="Telefone" value={phone || '—'} />
            <InfoRow label="Nascimento" value={birthDate || '—'} />
            <InfoRow label="Bairro" value={neighborhood || '—'} />
          </>
        )}
      </Card>

      {/* Grupo */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>PEQUENO GRUPO</Text>
        {member?.groupId ? (
          <InfoRow label="Grupo atual" value={currentGroupName ?? '—'} />
        ) : (
          <>
            <Text style={styles.noGroupText}>Você não está em nenhum pequeno grupo.</Text>
            {!showGroupPicker ? (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => { setShowGroupPicker(true); loadGroups(); }}
              >
                <Text style={styles.joinBtnText}>+ Solicitar entrada em um grupo</Text>
              </TouchableOpacity>
            ) : loadingGroups ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
            ) : (
              <View style={styles.groupList}>
                {groups.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.groupItem}
                    onPress={() => handleRequestGroup(g)}
                    disabled={requestingGroup === g.id}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupItemName}>{g.name}</Text>
                      {g.schedule && <Text style={styles.groupItemSub}>{g.schedule}</Text>}
                    </View>
                    {requestingGroup === g.id
                      ? <ActivityIndicator size="small" color={Colors.primary} />
                      : <Text style={styles.groupItemArrow}>›</Text>
                    }
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setShowGroupPicker(false)} style={{ alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </Card>

      {/* Logoff */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sair da conta</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  hero: {
    backgroundColor: Colors.headerBg,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  heroName: { fontSize: 20, fontWeight: '700', color: Colors.headerText, fontFamily: 'Lora_600SemiBold', marginTop: 8 },
  heroEmail: { fontSize: 12, color: Colors.textSecondary },
  roleBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(62,53,48,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  section: { margin: Spacing.md, marginBottom: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  editLink: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: 13, color: Colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  field: { gap: 5, marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 11,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  editBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancel: { flex: 1, paddingVertical: 11, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  btnSave: { flex: 1, paddingVertical: 11, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  btnSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  noGroupText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10 },
  joinBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  groupList: { gap: 6, marginTop: 8 },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupItemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  groupItemSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  groupItemArrow: { fontSize: 22, color: Colors.textMuted },
  signOutBtn: {
    margin: Spacing.md,
    marginTop: Spacing.lg,
    paddingVertical: 13,
    borderRadius: Radius.md,
    backgroundColor: '#C0392B',
    alignItems: 'center',
  },
  signOutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
