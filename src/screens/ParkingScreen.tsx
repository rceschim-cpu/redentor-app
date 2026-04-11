import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Member } from '../types';

export default function ParkingScreen() {
  const [plate, setPlate] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<Member | null | 'not_found'>(null);
  const [reportMode, setReportMode] = useState(false);

  const showAlert = (title: string, msg?: string) => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      window.alert(msg ? `${title}\n${msg}` : title);
    } else {
      Alert.alert(title, msg);
    }
  };

  const searchByPlate = async () => {
    const normalized = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized.length < 3) {
      showAlert('Placa inválida', 'Informe pelo menos 3 caracteres da placa.');
      return;
    }
    setSearching(true);
    setFound(null);
    try {
      const q = query(
        collection(db, 'members'),
        where('carPlates', 'array-contains', normalized)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setFound('not_found');
      } else {
        setFound({ id: snap.docs[0].id, ...snap.docs[0].data() } as Member);
      }
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível buscar o proprietário.');
    } finally {
      setSearching(false);
    }
  };

  const handleContact = (member: Member) => {
    if (member.phone) {
      const phone = member.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/55${phone}?text=${encodeURIComponent(`Olá ${member.name}, seu carro (placa ${plate.toUpperCase()}) está bloqueando a saída do estacionamento da Comunidade do Redentor. Por favor, retire-o o quanto antes. Obrigado!`)}`);
    } else {
      showAlert('Sem telefone', 'Este membro não tem telefone cadastrado.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Seção de report */}
      <View style={styles.reportCard}>
        <Text style={styles.reportIcon}>🅿️</Text>
        <Text style={styles.reportTitle}>Carro bloqueando saída?</Text>
        <Text style={styles.reportSub}>
          Informe a placa para identificar o proprietário e avisá-lo.
        </Text>

        <TextInput
          style={styles.plateInput}
          value={plate}
          onChangeText={(v) => {
            setPlate(v.toUpperCase());
            setFound(null);
          }}
          placeholder="ABC-1234"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          maxLength={8}
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={searchByPlate}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchBtnText}>Buscar proprietário</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Resultado */}
      {found === 'not_found' && (
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>❓</Text>
          <Text style={styles.resultTitle}>Proprietário não encontrado</Text>
          <Text style={styles.resultSub}>
            Nenhum membro tem a placa "{plate.toUpperCase()}" cadastrada.
          </Text>
        </View>
      )}

      {found && found !== 'not_found' && (
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>👤</Text>
          <Text style={styles.resultTitle}>{found.name}</Text>
          {found.phone && <Text style={styles.resultPhone}>{found.phone}</Text>}
          {found.cars?.map((car, i) => (
            <Text key={i} style={styles.carLine}>
              {car.plate}{car.model ? ` · ${car.model}` : ''}{car.color ? ` · ${car.color}` : ''}
            </Text>
          ))}
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => handleContact(found as Member)}
          >
            <Text style={styles.contactBtnText}>📱 Avisar via WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: 14 },
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 8,
  },
  reportIcon: { fontSize: 44, marginBottom: 4 },
  reportTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  reportSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 8 },
  plateInput: {
    width: '100%',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  searchBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 6,
  },
  resultIcon: { fontSize: 36, marginBottom: 4 },
  resultTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  resultPhone: { fontSize: 14, color: Colors.textSecondary },
  carLine: { fontSize: 13, color: Colors.textMuted },
  contactBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
