import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

export default function CelebrationScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Arco vitral decorativo */}
      <View style={styles.archBar}>
        {[Colors.archRose, Colors.archBlue, Colors.archYellow, Colors.archGreen].map(
          (color, i) => (
            <View key={i} style={[styles.archSegment, { backgroundColor: color }]} />
          )
        )}
      </View>

      {/* Logo comemorativo */}
      <View style={styles.logoArea}>
        <View style={styles.numeralRow}>
          <Text style={styles.numeral160}>160</Text>
          <View style={styles.anosChip}>
            <Text style={styles.anosText}>ANOS</Text>
          </View>
        </View>
        <Text style={styles.comunidade}>Comunidade do Redentor</Text>
        <Text style={styles.since}>1865 · Curitiba, PR</Text>
      </View>

      {/* Badge Em Breve */}
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>Em breve</Text>
      </View>

      {/* Mensagem */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loja Comemorativa</Text>
        <Text style={styles.cardBody}>
          Estamos preparando produtos especiais para celebrar os 160 anos da Comunidade
          do Redentor. Em breve você poderá adquirir aqui materiais exclusivos da campanha.
        </Text>
      </View>

      {/* Linha dourada */}
      <View style={styles.goldLine} />

      <Text style={styles.footerText}>
        Seja parte desta história
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  archBar: {
    flexDirection: 'row',
    width: '100%',
    height: 5,
    gap: 2,
    marginBottom: 0,
  },
  archSegment: { flex: 1 },

  logoArea: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  numeralRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  numeral160: {
    fontFamily: Typography.heading,
    fontSize: 80,
    color: Colors.primary,
    lineHeight: 80,
    letterSpacing: -2,
  },
  anosChip: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  anosText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.primary,
    letterSpacing: 2,
  },
  comunidade: {
    fontFamily: Typography.heading,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  since: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginBottom: 32,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  badgeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginHorizontal: Spacing.xl,
    marginBottom: 32,
    width: '88%',
  },
  cardTitle: {
    fontFamily: Typography.heading,
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  cardBody: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  goldLine: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    marginBottom: 16,
  },
  footerText: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});
