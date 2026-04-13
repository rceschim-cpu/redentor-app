import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { Card } from '../components';
import { useFontScale, FontSizePref, FONT_SCALES, FONT_PREF_LABELS } from '../context/FontScaleContext';
import { useAuth } from '../context/AuthContext';

const SIZE_OPTIONS: { key: FontSizePref; desc: string }[] = [
  { key: 'normal',  desc: 'Tamanho padrão do app' },
  { key: 'grande',  desc: 'Ideal para leitura mais confortável' },
  { key: 'extra',   desc: 'Para melhor visibilidade' },
];

export default function SettingsScreen({ navigation }: any) {
  const { pref, setPref } = useFontScale();
  const { appUser } = useAuth();
  const isStaff = appUser?.role === 'administrador' || appUser?.role === 'pastor';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>TAMANHO DA LETRA</Text>
        <Text style={styles.sectionDesc}>
          Escolha o tamanho de texto mais confortável para você.
        </Text>

        {SIZE_OPTIONS.map((opt) => {
          const active = pref === opt.key;
          const scale = FONT_SCALES[opt.key];
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setPref(opt.key)}
              activeOpacity={0.75}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive, { fontSize: Math.round(15 * scale) }]}>
                  {FONT_PREF_LABELS[opt.key]}
                </Text>
                <Text style={[styles.optionDesc, active && styles.optionDescActive]}>
                  {opt.desc}
                </Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* Preview */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>PRÉVIA</Text>
        <View style={styles.preview}>
          <Text style={[styles.previewHeading, { fontSize: Math.round(18 * FONT_SCALES[pref]) }]}>
            Comunidade do Redentor
          </Text>
          <Text style={[styles.previewBody, { fontSize: Math.round(14 * FONT_SCALES[pref]) }]}>
            Esta é uma prévia do tamanho de letra selecionado. Textos do app vão aparecer assim.
          </Text>
          <Text style={[styles.previewSmall, { fontSize: Math.round(11 * FONT_SCALES[pref]) }]}>
            MEMBRO ATIVO · IECLB
          </Text>
        </View>
      </Card>

      {isStaff && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>CONTEÚDO</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Banners')}
            activeOpacity={0.75}
          >
            <View style={styles.linkLeft}>
              <Text style={styles.linkIcon}>🖼️</Text>
              <View>
                <Text style={styles.linkLabel}>Banners da Home</Text>
                <Text style={styles.linkDesc}>Atualizar imagens do carrossel principal</Text>
              </View>
            </View>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
        </Card>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  section: { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: 10, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  sectionDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 14, lineHeight: 20 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.border, marginBottom: 8,
    backgroundColor: Colors.background,
  },
  optionActive: { borderColor: Colors.primary, backgroundColor: '#EBF1FA' },
  optionLeft: { flex: 1 },
  optionLabel: { fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  optionLabelActive: { color: Colors.primary },
  optionDesc: { fontSize: 12, color: Colors.textMuted },
  optionDescActive: { color: Colors.primary },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  preview: { gap: 8, paddingTop: 4 },
  previewHeading: { fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  previewBody: { color: Colors.textSecondary, lineHeight: 22 },
  previewSmall: { fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10,
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  linkIcon: { fontSize: 22 },
  linkLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  linkDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  linkArrow: { fontSize: 22, color: Colors.textMuted },
});
