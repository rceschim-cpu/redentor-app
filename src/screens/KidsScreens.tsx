import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import { Avatar, Card, SectionTitle } from '../components';
import { useAuth } from '../context/AuthContext';
import { showAlert, showConfirm } from '../utils/alert';
import { maskPhone, maskDate } from '../utils/masks';
import {
  Child,
  Guardian,
  KidsAgeGroup,
  KidsModule,
  ChildAttendance,
} from '../types';
import {
  getChildren,
  getChild,
  addChild,
  updateChild,
  deleteChild,
  calcAge,
  calcAgeGroup,
  calcModule,
  getChildAttendanceHistory,
  markAttendance,
  removeAttendance,
} from '../services/kids';
import { uploadToCloudinary } from '../services/cloudinary';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AGE_GROUP_LABELS: Record<KidsAgeGroup, string> = {
  '0-3':   '0–3 anos',
  '4-6':   '4–6 anos',
  '7-9':   '7–9 anos',
  '10-12': '10–12 anos',
};

const MODULE_COLORS: Record<KidsModule, string> = {
  kids:  '#5BA56A',
  ponte: '#4A90C4',
};

function openWhatsApp(phone: string, childName: string) {
  const digits = phone.replace(/\D/g, '');
  const num = digits.startsWith('55') ? digits : `55${digits}`;
  const msg = encodeURIComponent(`Olá! Mensagem sobre ${childName} — Redentor Kids`);
  const url = `https://wa.me/${num}?text=${msg}`;
  Linking.openURL(url).catch(() => showAlert('Erro', 'Não foi possível abrir o WhatsApp.'));
}

// ─── Lista de Crianças ────────────────────────────────────────────────────────

export function KidsListScreen({ navigation }: any) {
  const { appUser } = useAuth();
  const isStaff = appUser?.role === 'administrador' || appUser?.role === 'pastor' || appUser?.role === 'lider';
  const [module, setModule] = useState<KidsModule>('kids');
  const [ageFilter, setAgeFilter] = useState<KidsAgeGroup | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getChildren()
        .then(setChildren)
        .catch(() => showAlert('Erro', 'Não foi possível carregar as crianças.'))
        .finally(() => setLoading(false));
    }, [])
  );

  const moduleChildren = children.filter((c) => c.module === module);

  const filtered = moduleChildren.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchAge = ageFilter === 'todos' || c.ageGroup === ageFilter;
    return matchSearch && matchAge;
  });

  const ageGroups: KidsAgeGroup[] = module === 'kids' ? ['0-3', '4-6', '7-9'] : ['10-12'];

  return (
    <View style={styles.container}>
      {/* Module tabs */}
      <View style={styles.moduleTabs}>
        {(['kids', 'ponte'] as KidsModule[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.moduleTab, module === m && { backgroundColor: MODULE_COLORS[m] }]}
            onPress={() => { setModule(m); setAgeFilter('todos'); }}
          >
            <Text style={[styles.moduleTabText, module === m && styles.moduleTabTextActive]}>
              {m === 'kids' ? 'Redentor Kids' : 'Ponte'}
            </Text>
            <Text style={[styles.moduleTabCount, module === m && styles.moduleTabTextActive]}>
              {children.filter((c) => c.module === m).length}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar criança..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Age group filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, ageFilter === 'todos' && styles.filterChipActive]}
          onPress={() => setAgeFilter('todos')}
        >
          <Text style={[styles.filterText, ageFilter === 'todos' && styles.filterTextActive]}>
            Todas ({moduleChildren.length})
          </Text>
        </TouchableOpacity>
        {ageGroups.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.filterChip, ageFilter === g && styles.filterChipActive]}
            onPress={() => setAgeFilter(g)}
          >
            <Text style={[styles.filterText, ageFilter === g && styles.filterTextActive]}>
              {AGE_GROUP_LABELS[g]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma criança encontrada.</Text>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('KidsDetail', { childId: item.id })}
            >
              <Avatar name={item.name} size={44} index={index} photoURL={item.photoURL} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowSub}>
                  {calcAge(item.birthDate)} anos · {AGE_GROUP_LABELS[item.ageGroup]}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'ativo' ? Colors.activeText : Colors.inactiveText }]} />
            </TouchableOpacity>
          )}
        />
      )}

      {isStaff && (
        <>
          {/* Botão chamada do dia */}
          <TouchableOpacity
            style={styles.attendanceBtn}
            onPress={() => navigation.navigate('KidsAttendance')}
            activeOpacity={0.85}
          >
            <Ionicons name="checkbox-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.attendanceBtnText}>Chamada de hoje</Text>
          </TouchableOpacity>

          {/* FAB adicionar criança */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddKid', {})}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ─── Detalhe da Criança ───────────────────────────────────────────────────────

export function KidsDetailScreen({ navigation, route }: any) {
  const { childId } = route.params as { childId: string };
  const { appUser } = useAuth();
  const isStaff = appUser?.role === 'administrador' || appUser?.role === 'pastor' || appUser?.role === 'lider';
  const [child, setChild] = useState<Child | null>(null);
  const [history, setHistory] = useState<ChildAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingPresence, setMarkingPresence] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([getChild(childId), getChildAttendanceHistory(childId)])
        .then(([c, h]) => { setChild(c); setHistory(h); })
        .catch(() => showAlert('Erro', 'Não foi possível carregar os dados.'))
        .finally(() => setLoading(false));
    }, [childId])
  );

  useEffect(() => {
    if (child) navigation.setOptions({ title: child.name });
  }, [child]);

  const handleMarkPresence = async () => {
    if (!child || !appUser) return;
    setMarkingPresence(true);
    try {
      await markAttendance(child, appUser.uid, appUser.name, 'manual');
      const [updatedChild, updatedHistory] = await Promise.all([
        getChild(childId),
        getChildAttendanceHistory(childId),
      ]);
      setChild(updatedChild);
      setHistory(updatedHistory);
      showAlert('Presença registrada!', `${child.name} marcada presente hoje.`);
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível registrar a presença.');
    } finally {
      setMarkingPresence(false);
    }
  };

  const handleRemoveAttendance = (att: ChildAttendance) => {
    showConfirm(
      'Remover presença',
      `Remover presença de ${att.date}?`,
      async () => {
        await removeAttendance(att.id).catch(() => showAlert('Erro', 'Não foi possível remover.'));
        setHistory((prev) => prev.filter((a) => a.id !== att.id));
      },
      'Remover'
    );
  };

  const handleDelete = () => {
    if (!child) return;
    showConfirm(
      'Excluir cadastro',
      `Deseja excluir o cadastro de ${child.name}? Esta ação não pode ser desfeita.`,
      async () => {
        await deleteChild(childId).catch(() => showAlert('Erro', 'Não foi possível excluir.'));
        navigation.goBack();
      },
      'Excluir'
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }
  if (!child) {
    return <View style={styles.center}><Text style={styles.empty}>Criança não encontrada.</Text></View>;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyPresent = history.some((a) => a.date === todayStr);

  // HTML do QR Code gerado via CDN (sem dependência extra)
  const qrHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#fff;font-family:sans-serif}canvas{border-radius:8px}p{font-size:13px;color:#555;margin-top:12px;text-align:center;padding:0 16px}</style></head><body><canvas id="qr"></canvas><p>${child.name}</p><script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script><script>QRCode.toCanvas(document.getElementById('qr'),'redentor-kids:${child.id}',{width:220,margin:2},function(err){if(err)document.body.innerHTML='<p>Erro ao gerar QR</p>'})</script></body></html>`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Modal QR Code */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <TouchableOpacity style={styles.qrOverlay} activeOpacity={1} onPress={() => setShowQR(false)}>
          <View style={styles.qrModal}>
            <Text style={styles.qrModalTitle}>QR Code — {child.name}</Text>
            <WebView
              source={{ html: qrHtml }}
              style={styles.qrWebView}
              scrollEnabled={false}
            />
            <Text style={styles.qrModalSub}>Toque fora para fechar</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header card */}
      <View style={[styles.kidsHeader, { backgroundColor: MODULE_COLORS[child.module] }]}>
        <Avatar name={child.name} size={72} index={0} photoURL={child.photoURL} />
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <Text style={styles.kidsHeaderName}>{child.name}</Text>
          <Text style={styles.kidsHeaderSub}>
            {calcAge(child.birthDate)} anos · {AGE_GROUP_LABELS[child.ageGroup]}
          </Text>
          <View style={[styles.modulePill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={styles.modulePillText}>
              {child.module === 'kids' ? 'Redentor Kids' : 'Ponte'}
            </Text>
          </View>
          {/* Botão QR */}
          <TouchableOpacity style={styles.qrHeaderBtn} onPress={() => setShowQR(true)}>
            <Ionicons name="qr-code-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.qrHeaderBtnText}>Ver QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ padding: Spacing.md, gap: Spacing.md }}>
        {/* Info */}
        <Card>
          <SectionTitle title="Informações" />
          <Row label="Data de nascimento" value={child.birthDate} />
          <Row label="Faixa etária" value={AGE_GROUP_LABELS[child.ageGroup]} />
          <Row label="Status" value={child.status === 'ativo' ? 'Ativo' : 'Inativo'} />
          {child.observations ? <Row label="Observações" value={child.observations} /> : null}
        </Card>

        {/* Responsáveis */}
        <Card>
          <SectionTitle title="Responsáveis" />
          {child.guardians.map((g, i) => (
            <View key={i} style={styles.guardianRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.guardianName}>{g.name}</Text>
                <Text style={styles.guardianSub}>{g.relationship} · {g.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() => openWhatsApp(g.phone, child.name)}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        {/* Presença hoje */}
        {isStaff && (
          <Card>
            <SectionTitle title="Presença" />
            {alreadyPresent ? (
              <View style={styles.presentBadge}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.activeText} />
                <Text style={styles.presentText}>Presente hoje</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.btnMarkPresence}
                onPress={handleMarkPresence}
                disabled={markingPresence}
              >
                <Text style={styles.btnMarkPresenceText}>
                  {markingPresence ? 'Registrando...' : '✓  Registrar presença hoje'}
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Histórico de presenças */}
        <Card>
          <SectionTitle title={`Histórico (${history.length} presenças)`} />
          {history.length === 0 ? (
            <Text style={styles.empty}>Nenhuma presença registrada.</Text>
          ) : (
            history.slice(0, 20).map((a) => (
              <View key={a.id} style={styles.histRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} style={{ marginRight: 6 }} />
                <Text style={styles.histDate}>{a.date}</Text>
                <Text style={styles.histMethod}>{a.registeredBy === 'qrcode' ? 'QR Code' : 'Manual'}</Text>
                {isStaff && (
                  <TouchableOpacity onPress={() => handleRemoveAttendance(a)}>
                    <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </Card>

        {/* Ações admin */}
        {isStaff && (
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={styles.btnEdit}
              onPress={() => navigation.navigate('AddKid', { childId })}
            >
              <Text style={styles.btnEditText}>Editar cadastro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
              <Text style={styles.btnDeleteText}>Excluir cadastro</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Cadastro / Edição ────────────────────────────────────────────────────────

const EMPTY_GUARDIAN: Guardian = { name: '', phone: '', relationship: '' };

export function AddKidScreen({ navigation, route }: any) {
  const { childId } = (route.params ?? {}) as { childId?: string };
  const isEditing = !!childId;
  const { appUser } = useAuth();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>();
  const [observations, setObservations] = useState('');
  const [guardians, setGuardians] = useState<Guardian[]>([{ ...EMPTY_GUARDIAN }]);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar Criança' : 'Nova Criança' });
    if (isEditing && childId) {
      getChild(childId)
        .then((c) => {
          if (!c) return;
          setName(c.name);
          setBirthDate(c.birthDate);
          setPhotoURL(c.photoURL);
          setObservations(c.observations ?? '');
          setGuardians(c.guardians.length > 0 ? c.guardians : [{ ...EMPTY_GUARDIAN }]);
        })
        .catch(() => showAlert('Erro', 'Não foi possível carregar os dados.'))
        .finally(() => setLoading(false));
    }
  }, [childId]);

  const updateGuardian = (index: number, field: keyof Guardian, value: string) => {
    setGuardians((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addGuardian = () => setGuardians((prev) => [...prev, { ...EMPTY_GUARDIAN }]);

  const removeGuardian = (index: number) => {
    setGuardians((prev) => prev.filter((_, i) => i !== index));
  };

  const pickPhoto = () => {
    if (Platform.OS !== 'web') {
      showAlert('Atenção', 'O upload de fotos está disponível apenas pelo app web.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file: File | undefined = e.target?.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const { url } = await uploadToCloudinary(file);
        setPhotoURL(url);
      } catch (err: any) {
        showAlert('Erro no upload', err?.message ?? 'Não foi possível enviar a imagem.');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleSave = async () => {
    if (!name.trim()) { showAlert('Atenção', 'Informe o nome da criança.'); return; }
    if (!birthDate || birthDate.length < 10) { showAlert('Atenção', 'Informe a data de nascimento (DD/MM/AAAA).'); return; }
    const validGuardians = guardians.filter((g) => g.name.trim());
    if (validGuardians.length === 0) { showAlert('Atenção', 'Informe ao menos um responsável.'); return; }

    setSaving(true);
    try {
      const ageGroup = calcAgeGroup(birthDate);
      const module = calcModule(ageGroup);
      const payload = {
        name: name.trim(),
        birthDate,
        ageGroup,
        module,
        guardians: validGuardians,
        observations: observations.trim() || undefined,
        photoURL,
      };

      if (isEditing && childId) {
        await updateChild(childId, payload);
      } else {
        await addChild({ ...payload, status: 'ativo', createdAt: new Date().toISOString() });
      }
      navigation.goBack();
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  const previewAgeGroup = birthDate.length === 10 ? calcAgeGroup(birthDate) : null;
  const previewModule = previewAgeGroup ? calcModule(previewAgeGroup) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
      {/* Foto */}
      <View style={styles.photoSection}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person-outline" size={36} color={Colors.textMuted} />
          </View>
        )}
        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto} disabled={uploading}>
          <Text style={styles.photoBtnText}>{uploading ? 'Enviando...' : photoURL ? 'Trocar foto' : 'Adicionar foto'}</Text>
        </TouchableOpacity>
      </View>

      <SectionTitle title="Dados da criança" />
      <View style={styles.field}>
        <Text style={styles.label}>Nome completo *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nome da criança"
          placeholderTextColor={Colors.textMuted}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Data de nascimento * (DD/MM/AAAA)</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={(t) => setBirthDate(maskDate(t))}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
        />
        {previewAgeGroup && (
          <View style={[styles.previewPill, { backgroundColor: MODULE_COLORS[previewModule!] }]}>
            <Text style={styles.previewPillText}>
              {AGE_GROUP_LABELS[previewAgeGroup]} · {previewModule === 'kids' ? 'Redentor Kids' : 'Ponte'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Observações (alergias, necessidades especiais...)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={observations}
          onChangeText={setObservations}
          placeholder="Opcional"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Responsáveis */}
      <View style={{ marginTop: Spacing.md }}>
        <SectionTitle title="Responsáveis" />
        {guardians.map((g, i) => (
          <View key={i} style={styles.guardianCard}>
            <View style={styles.guardianCardHeader}>
              <Text style={styles.guardianCardTitle}>Responsável {i + 1}</Text>
              {guardians.length > 1 && (
                <TouchableOpacity onPress={() => removeGuardian(i)}>
                  <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              value={g.name}
              onChangeText={(v) => updateGuardian(i, 'name', v)}
              placeholder="Nome do responsável"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={{ marginTop: 8 }}>
              <TextInput
                style={styles.input}
                value={g.phone}
                onChangeText={(v) => updateGuardian(i, 'phone', maskPhone(v))}
                placeholder="WhatsApp (com DDD)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={{ marginTop: 8 }}>
              <TextInput
                style={styles.input}
                value={g.relationship}
                onChangeText={(v) => updateGuardian(i, 'relationship', v)}
                placeholder="Parentesco (pai, mãe, avó...)"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.addGuardianBtn} onPress={addGuardian}>
          <Ionicons name="add-circle-outline" size={16} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.addGuardianText}>Adicionar responsável</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: Spacing.lg }}>
        <TouchableOpacity
          style={[styles.btnMarkPresence, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.btnMarkPresenceText}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar criança'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Subcomponente Row ────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, paddingBottom: 80 },
  empty: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, marginTop: 24 },

  // Module tabs
  moduleTabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  moduleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  moduleTabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  moduleTabTextActive: { color: '#fff' },
  moduleTabCount: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginBottom: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },

  // Filter chips
  filterScroll: { flexGrow: 0, marginBottom: Spacing.sm },
  filterRow: { paddingHorizontal: Spacing.md, gap: 6, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },

  // List row
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  rowName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },

  // Kids detail header
  kidsHeader: { alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing.lg },
  kidsHeaderName: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold', marginTop: 8 },
  kidsHeaderSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  modulePill: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  modulePillText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Detail rows
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  detailValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', flex: 2, textAlign: 'right' },

  // Guardian card (detail)
  guardianRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  guardianName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  guardianSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  whatsappBtn: { padding: 8, backgroundColor: '#E8FAF0', borderRadius: 20 },

  // Presence
  presentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  presentText: { fontSize: 14, color: Colors.activeText, fontWeight: '600' },
  btnMarkPresence: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  btnMarkPresenceText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Attendance history
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  histDate: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  histMethod: { fontSize: 11, color: Colors.textMuted, marginRight: 8 },

  // Action buttons
  btnEdit: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  btnEditText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  btnDelete: { borderWidth: 1.5, borderColor: Colors.danger, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  btnDeleteText: { color: Colors.danger, fontWeight: '600', fontSize: 14 },

  // Form
  formContent: { padding: Spacing.md },
  photoSection: { alignItems: 'center', marginBottom: Spacing.lg },
  photoPreview: { width: 88, height: 88, borderRadius: 44, marginBottom: 8 },
  photoPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  photoBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  field: { marginBottom: Spacing.md },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary },
  textarea: { height: 80, textAlignVertical: 'top' },
  previewPill: { marginTop: 6, alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  previewPillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  guardianCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 10 },
  guardianCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  guardianCardTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  addGuardianBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  addGuardianText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Botão chamada (lista)
  attendanceBtn: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5BA56A',
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  attendanceBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // QR Code header button (detalhe)
  qrHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  qrHeaderBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // QR Modal
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModal: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    width: 280,
  },
  qrModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  qrWebView: {
    width: 240,
    height: 240,
    borderRadius: Radius.md,
  },
  qrModalSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
});
