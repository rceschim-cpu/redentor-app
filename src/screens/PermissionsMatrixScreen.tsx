import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Colors, Radius, Spacing } from '../theme';
import {
  ACTION_LABELS, PermissionAction, PermissionMatrix, PermissionResource,
  RESOURCE_LABELS, RESOURCE_ORDER, ROLE_LABELS, ROLE_ORDER, Scope,
  SCOPE_LABELS, UserRole,
} from '../types';
import { fetchMatrix, saveMatrix, resetMatrix } from '../services/permissionMatrix';
import { can } from '../services/permissions';
import { useAuth } from '../context/AuthContext';
import { showAlert, showConfirm } from '../utils/alert';

const ACTIONS: PermissionAction[] = ['criar', 'visualizar', 'editar', 'excluir'];
const SCOPES: Scope[] = ['T', 'G', 'P', 'N'];

// Próximo valor no ciclo T → G → P → N → T
const nextScope = (s: Scope): Scope => SCOPES[(SCOPES.indexOf(s) + 1) % SCOPES.length];

const SCOPE_STYLE: Record<Scope, { bg: string; fg: string; br: string }> = {
  T: { bg: '#E4F0E2', fg: '#3D6B37', br: '#A9CBA2' },
  G: { bg: '#E4EBF7', fg: '#35598F', br: '#A8BCDD' },
  P: { bg: '#F7EEDB', fg: '#86611A', br: '#DDC58C' },
  N: { bg: 'transparent', fg: '#A69E95', br: Colors.border },
};

// Larguras fixas: a matriz rola na horizontal, então as colunas não podem flexionar
const COL_LABEL = 128;
const COL_ROLE = 84;

export default function PermissionsMatrixScreen() {
  const { user, appUser } = useAuth();
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const editable = can(appUser?.role, 'matriz', 'editar');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMatrix(await fetchMatrix());
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function cycle(role: UserRole, resource: PermissionResource, action: PermissionAction) {
    if (!editable || !matrix) return;
    setMatrix({
      ...matrix,
      [role]: {
        ...matrix[role],
        [resource]: {
          ...matrix[role][resource],
          [action]: nextScope(matrix[role][resource][action]),
        },
      },
    });
    setDirty(true);
  }

  async function handleSave() {
    if (!matrix) return;
    setSaving(true);
    try {
      await saveMatrix(matrix, user?.uid ?? '');
      setDirty(false);
      showAlert('Matriz salva', 'As permissões passam a valer no próximo acesso de cada pessoa.');
    } catch (e: any) {
      showAlert('Erro ao salvar', e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    showConfirm(
      'Restaurar padrão',
      'Isso descarta todas as alterações e volta a matriz ao padrão do app. Continuar?',
      async () => {
        setSaving(true);
        try {
          setMatrix(await resetMatrix(user?.uid ?? ''));
          setDirty(false);
        } catch (e: any) {
          showAlert('Erro', e.message);
        } finally {
          setSaving(false);
        }
      }
    );
  }

  const legend = useMemo(() => SCOPES.map((s) => (
    <View key={s} style={styles.legendItem}>
      <View style={[styles.chip, {
        backgroundColor: SCOPE_STYLE[s].bg, borderColor: SCOPE_STYLE[s].br,
      }]}>
        <Text style={[styles.chipText, { color: SCOPE_STYLE[s].fg }]}>{s}</Text>
      </View>
      <Text style={styles.legendLabel}>{SCOPE_LABELS[s]}</Text>
    </View>
  )), []);

  if (loading || !matrix) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.intro}>
          {editable
            ? 'Toque em uma célula para alternar o alcance: Tudo → Grupo → Próprio → Nada.'
            : 'Somente leitura. Apenas o administrador altera a matriz.'}
        </Text>

        <View style={styles.legendRow}>{legend}</View>

        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ paddingBottom: 8 }}>
          <View>
            {/* Cabeçalho — perfis */}
            <View style={styles.headRow}>
              <View style={[styles.headCell, { width: COL_LABEL }]}>
                <Text style={styles.headText}>Ação</Text>
              </View>
              {ROLE_ORDER.map((role) => (
                <View key={role} style={[styles.headCell, { width: COL_ROLE }]}>
                  <Text style={styles.headText} numberOfLines={2}>{ROLE_LABELS[role]}</Text>
                </View>
              ))}
            </View>

            {RESOURCE_ORDER.map((resource) => (
              <View key={resource}>
                {/* Faixa do item */}
                <View style={styles.groupRow}>
                  <Text style={styles.groupText}>{RESOURCE_LABELS[resource]}</Text>
                </View>

                {ACTIONS.map((action) => (
                  <View key={action} style={styles.row}>
                    <View style={[styles.labelCell, { width: COL_LABEL }]}>
                      <Text style={styles.labelText}>{ACTION_LABELS[action]}</Text>
                    </View>
                    {ROLE_ORDER.map((role) => {
                      const value = matrix[role][resource][action];
                      const st = SCOPE_STYLE[value];
                      return (
                        <TouchableOpacity
                          key={role}
                          style={[styles.cell, { width: COL_ROLE }]}
                          onPress={() => cycle(role, resource, action)}
                          disabled={!editable}
                          activeOpacity={editable ? 0.6 : 1}
                          accessibilityLabel={
                            `${ROLE_LABELS[role]}, ${ACTION_LABELS[action]} ${RESOURCE_LABELS[resource]}: ${SCOPE_LABELS[value]}`
                          }
                        >
                          <View style={[styles.chip, {
                            backgroundColor: st.bg, borderColor: st.br,
                          }]}>
                            <Text style={[styles.chipText, { color: st.fg }]}>{value}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.footnote}>
          A matriz controla o que aparece no app. As regras do Firestore são a
          barreira definitiva e precisam acompanhar qualquer mudança aqui.
        </Text>

        <View style={{ height: 90 }} />
      </ScrollView>

      {editable && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.btnGhost} onPress={handleReset} disabled={saving}>
            <Text style={styles.btnGhostText}>Restaurar padrão</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, (!dirty || saving) && styles.btnDisabled]}
            onPress={handleSave}
            disabled={!dirty || saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>{dirty ? 'Salvar alterações' : 'Tudo salvo'}</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md },

  intro: {
    fontSize: 14, color: Colors.textSecondary,
    lineHeight: 20, marginBottom: 14,
  },

  legendRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14,
    marginBottom: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendLabel: { fontSize: 13, color: Colors.textSecondary },

  headRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headCell: { paddingVertical: 10, paddingHorizontal: 4, justifyContent: 'center' },
  headText: {
    fontSize: 10, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 0.6, textTransform: 'uppercase', textAlign: 'center',
  },

  groupRow: {
    backgroundColor: Colors.headerBg,
    paddingVertical: 9, paddingHorizontal: 10,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
  },
  groupText: {
    fontSize: 12, fontWeight: '700', color: Colors.textPrimary,
    letterSpacing: 0.5, textTransform: 'uppercase',
    fontFamily: 'Lora_600SemiBold',
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  labelCell: { paddingVertical: 9, paddingHorizontal: 10 },
  labelText: { fontSize: 13, color: Colors.textSecondary },

  cell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 7, minHeight: 44 },
  chip: {
    width: 30, height: 30, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '700' },

  footnote: {
    fontSize: 12, color: Colors.textMuted,
    lineHeight: 18, marginTop: 18,
  },

  actionBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', gap: 10,
    padding: Spacing.md, paddingBottom: 22,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  btnGhost: {
    flex: 1, minHeight: 48, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGhostText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  btnPrimary: {
    flex: 1.4, minHeight: 48, borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.45 },
});
