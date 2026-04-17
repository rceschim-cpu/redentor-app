import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle, TextProps } from 'react-native';
import { Colors, Radius, getAvatarColor } from '../theme';
import { useFontScale } from '../context/FontScaleContext';

// ─── AppText — Text com scale de acessibilidade aplicado ───────────────────
interface AppTextProps extends TextProps {
  /** Caps the font-scale multiplier for UI elements where larger text would break layout */
  maxScale?: number;
}
export function AppText({ style, maxScale, ...props }: AppTextProps) {
  const { scale } = useFontScale();
  const effectiveScale = maxScale ? Math.min(scale, maxScale) : scale;
  if (effectiveScale === 1) return <Text style={style} {...props} />;
  const flat = StyleSheet.flatten(style) ?? {};
  const scaled = flat.fontSize ? { ...flat, fontSize: Math.round(flat.fontSize * effectiveScale) } : flat;
  return <Text style={scaled} {...props} />;
}

// ─── Avatar ────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  size?: number;
  index?: number;
  photoURL?: string;
}
export const Avatar = ({ name, size = 40, index = 0, photoURL }: AvatarProps) => {
  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  const { bg, fg } = getAvatarColor(index);
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.avatarText, { color: fg, fontSize: size * 0.32 }]}>
        {initials}
      </Text>
    </View>
  );
};

// ─── StatusBadge ───────────────────────────────────────────────────────────
interface BadgeProps {
  status: 'ativo' | 'visitante' | 'inativo' | 'em_formacao';
}
const BADGE_MAP = {
  ativo: { bg: Colors.activeBg, fg: Colors.activeText, label: 'Ativo' },
  visitante: { bg: Colors.visitorBg, fg: Colors.visitorText, label: 'Visitante' },
  inativo: { bg: Colors.inactiveBg, fg: Colors.inactiveText, label: 'Inativo' },
  em_formacao: { bg: Colors.visitorBg, fg: Colors.visitorText, label: 'Em formação' },
};
export const StatusBadge = ({ status }: BadgeProps) => {
  const { bg, fg, label } = BADGE_MAP[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
};

// ─── ArchBar (decoração do logo) ────────────────────────────────────────────
export const ArchBar = ({ height = 4 }: { height?: number }) => (
  <View style={[styles.archBar, { height }]}>
    {[Colors.archRose, Colors.archBlue, Colors.archYellow, Colors.archGreen].map(
      (color, i) => (
        <View key={i} style={[styles.archSegment, { backgroundColor: color }]} />
      )
    )}
  </View>
);

// ─── SectionTitle ──────────────────────────────────────────────────────────
export const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
);

// ─── PrimaryButton ─────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  style?: any;
  disabled?: boolean;
}
export const PrimaryButton = ({ label, onPress, variant = 'primary', style, disabled }: ButtonProps) => (
  <TouchableOpacity
    onPress={disabled ? undefined : onPress}
    style={[styles.button, variant === 'ghost' && styles.buttonGhost, disabled && { opacity: 0.5 }, style]}
    activeOpacity={0.8}
  >
    <Text style={[styles.buttonText, variant === 'ghost' && styles.buttonTextGhost]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── DetailRow ─────────────────────────────────────────────────────────────
interface DetailRowProps {
  label: string;
  value?: string;
  accent?: boolean;
}
export const DetailRow = ({ label, value, accent }: DetailRowProps) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailKey}>{label}</Text>
    <Text style={[styles.detailVal, accent && { color: Colors.archBlue }]}>
      {value || '—'}
    </Text>
  </View>
);

// ─── ChipGroup ─────────────────────────────────────────────────────────────
interface ChipGroupProps {
  options: ReadonlyArray<{ key: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
  style?: ViewStyle;
}
export const ChipGroup = ({ options, value, onChange, style }: ChipGroupProps) => (
  <View style={[styles.chipRow, style]}>
    {options.map((o) => (
      <TouchableOpacity
        key={o.key}
        style={[styles.chip, value === o.key && styles.chipActive]}
        onPress={() => onChange(value === o.key ? '' : o.key)}
      >
        <Text style={[styles.chipText, value === o.key && styles.chipTextActive]}>
          {o.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Card ──────────────────────────────────────────────────────────────────
export const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => <View style={[styles.card, style]}>{children}</View>;

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  archBar: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 14,
  },
  archSegment: { flex: 1, borderRadius: 2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonTextGhost: { color: Colors.textPrimary },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailKey: { fontSize: 13, color: Colors.textSecondary },
  detailVal: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', flex: 1, marginLeft: 8 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
});
