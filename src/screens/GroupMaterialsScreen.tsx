import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText as Text } from '../components';
import { Card } from '../components';
import { useAuth } from '../context/AuthContext';
import { getMaterials, uploadMaterial, deleteMaterial } from '../services/materials';
import { Colors, Radius, Spacing } from '../theme';
import { GroupMaterial } from '../types';
import { showAlert, showConfirm } from '../utils/alert';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fileIcon(fileType: string): string {
  if (!fileType) return '🔗';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.startsWith('video/')) return '▶️';
  if (fileType.startsWith('image/')) return '🖼️';
  if (
    fileType.startsWith('application/msword') ||
    fileType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
    fileType.startsWith('application/vnd.oasis.opendocument.text') ||
    fileType === 'text/plain'
  )
    return '📝';
  return '🔗';
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function GroupMaterialsScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params as { groupId: string; groupName: string };
  const { user, appUser } = useAuth();

  const [materials, setMaterials] = useState<GroupMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Ref for the hidden web file input
  const fileInputRef = useRef<any>(null);

  const canManage =
    appUser?.role === 'administrador' || appUser?.role === 'pastor';

  // ─── Load materials ──────────────────────────────────────────────────────

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMaterials(groupId);
      setMaterials(data);
    } catch {
      showAlert('Erro', 'Não foi possível carregar os materiais.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    navigation.setOptions({ title: `Materiais — ${groupName}` });
  }, [groupName, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadMaterials();
    }, [loadMaterials])
  );

  // ─── Upload ──────────────────────────────────────────────────────────────

  const handleAddPress = () => {
    if (Platform.OS !== 'web') {
      showAlert('Em breve', 'Em breve no app mobile.');
      return;
    }
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleFilePick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: any) => {
    const file: File | undefined = e?.target?.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showAlert('Atenção', 'Selecione um arquivo antes de enviar.');
      return;
    }
    if (!title.trim()) {
      showAlert('Atenção', 'Informe um título para o material.');
      return;
    }
    if (!user || !appUser) {
      showAlert('Erro', 'Você precisa estar autenticado para enviar materiais.');
      return;
    }

    setUploading(true);
    try {
      await uploadMaterial(
        groupId,
        selectedFile,
        title.trim(),
        description.trim(),
        user.uid,
        appUser.name
      );
      await loadMaterials();
      setShowForm(false);
      showAlert('Sucesso', 'Material enviado com sucesso!');
    } catch {
      showAlert('Erro', 'Não foi possível enviar o material. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedFile(null);
    setTitle('');
    setDescription('');
  };

  // ─── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = (item: GroupMaterial) => {
    showConfirm(
      'Remover material',
      `Deseja remover "${item.title}"? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await deleteMaterial(item.id, item.fileURL);
          setMaterials((prev) => prev.filter((m) => m.id !== item.id));
        } catch {
          showAlert('Erro', 'Não foi possível remover o material.');
        }
      },
      'Remover'
    );
  };

  // ─── Render item ─────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: GroupMaterial }) => (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => Linking.openURL(item.fileURL)}
    >
      <Card style={styles.itemCard}>
        <View style={styles.itemRow}>
          {/* Icon */}
          <Text style={styles.itemIcon}>{fileIcon(item.fileType)}</Text>

          {/* Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {!!item.description && (
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.itemMeta}>
              {item.uploaderName} · {formatDate(item.uploadedAt)}
              {item.fileSize ? `  ·  ${formatSize(item.fileSize)}` : ''}
            </Text>
          </View>

          {/* Delete button (admins/pastors only) */}
          {canManage && (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => handleDelete(item)}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  // ─── Upload form (web only) ───────────────────────────────────────────────

  const renderUploadForm = () => (
    <Card style={styles.formCard}>
      <Text style={styles.formTitle}>Novo Material</Text>

      <Text style={styles.fieldLabel}>Título *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: Estudo de João 3"
        placeholderTextColor={Colors.textMuted}
        value={title}
        onChangeText={setTitle}
        editable={!uploading}
      />

      <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Breve descrição do arquivo…"
        placeholderTextColor={Colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        editable={!uploading}
      />

      {/* Hidden web file input */}
      {Platform.OS === 'web' && (
        // @ts-ignore — web-only DOM element rendered as a React element
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}

      <TouchableOpacity
        style={[styles.filePickerBtn, uploading && styles.btnDisabled]}
        onPress={handleFilePick}
        disabled={uploading}
        activeOpacity={0.8}
      >
        <Text style={styles.filePickerBtnText}>
          {selectedFile ? `📎 ${selectedFile.name}` : '📎 Selecionar arquivo'}
        </Text>
      </TouchableOpacity>

      {selectedFile && (
        <Text style={styles.fileSizeHint}>{formatSize(selectedFile.size)}</Text>
      )}

      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.cancelBtn]}
          onPress={handleCancelForm}
          disabled={uploading}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!selectedFile || uploading) && styles.btnDisabled,
          ]}
          onPress={handleUpload}
          disabled={!selectedFile || uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Enviar</Text>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );

  // ─── Main render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={materials}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={showForm ? renderUploadForm() : null}
        ListEmptyComponent={
          !showForm ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyText}>Nenhum material cadastrado</Text>
              {canManage && (
                <Text style={styles.emptyHint}>
                  Toque em "+ Adicionar Material" para enviar o primeiro arquivo.
                </Text>
              )}
            </View>
          ) : null
        }
        renderItem={renderItem}
      />

      {/* FAB — add button (admins/pastors only) */}
      {canManage && !showForm && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddPress}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+ Adicionar Material</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.lg,
    gap: 10,
    paddingBottom: 100, // space for FAB
  },

  // ─── Item card ───────────────────────────────────────────────────────────
  itemCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  itemIcon: {
    fontSize: 28,
    lineHeight: 34,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  itemMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  deleteBtn: {
    paddingLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 18,
  },

  // ─── Empty state ─────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    marginTop: 64,
    gap: 8,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 42,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  // ─── FAB ─────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: {
    color: Colors.textOnDark,
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Upload form ─────────────────────────────────────────────────────────
  formCard: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
    marginTop: Spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  filePickerBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
    backgroundColor: Colors.surface,
  },
  filePickerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  fileSizeHint: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textOnDark,
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
