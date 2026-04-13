import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { getChapter, BIBLE_BOOKS, BibleBook, BibleVerse } from '../services/bible';
import { showAlert } from '../utils/alert';

type Screen = 'books' | 'chapters' | 'reading';

export default function BibleScreen() {
  const [screen, setScreen] = useState<Screen>('books');
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [testament, setTestament] = useState<'AT' | 'NT' | 'todos'>('todos');
  const readingScrollRef = useRef<ScrollView>(null);

  const filteredBooks = BIBLE_BOOKS.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchTestament = testament === 'todos' || b.testament === testament;
    return matchSearch && matchTestament;
  });

  const loadChapter = async (book: BibleBook, chapter: number) => {
    setLoading(true);
    setVerses([]);
    try {
      const data = await getChapter(book.id, chapter);
      setVerses(data.verses ?? []);
      setScreen('reading');
      setTimeout(() => readingScrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
    } catch {
      showAlert('Erro', 'Não foi possível carregar o capítulo. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const selectBook = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setScreen('chapters');
  };

  const goBack = () => {
    if (screen === 'reading') setScreen('chapters');
    else if (screen === 'chapters') setScreen('books');
  };

  const prevChapter = () => {
    if (!selectedBook) return;
    const prev = selectedChapter - 1;
    if (prev < 1) return;
    setSelectedChapter(prev);
    loadChapter(selectedBook, prev);
  };

  const nextChapter = () => {
    if (!selectedBook) return;
    const next = selectedChapter + 1;
    if (next > selectedBook.chapters) return;
    setSelectedChapter(next);
    loadChapter(selectedBook, next);
  };

  // ── Tela: Lista de Livros ────────────────────────────────────────────────
  if (screen === 'books') {
    return (
      <View style={styles.container}>
        {/* Busca */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar livro..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Filtro AT / NT */}
        <View style={styles.filterRow}>
          {([['todos', 'Todos'], ['AT', 'Antigo Testamento'], ['NT', 'Novo Testamento']] as const).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, testament === key && styles.filterChipActive]}
              onPress={() => setTestament(key)}
            >
              <Text style={[styles.filterText, testament === key && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredBooks}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum livro encontrado.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookRow}
              activeOpacity={0.75}
              onPress={() => selectBook(item)}
            >
              <View style={[styles.testamentDot, { backgroundColor: item.testament === 'AT' ? Colors.archBlue : Colors.archRose }]} />
              <Text style={styles.bookName}>{item.name}</Text>
              <Text style={styles.bookChapters}>{item.chapters} cap.</Text>
              <Text style={styles.bookArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ── Tela: Seleção de Capítulo ─────────────────────────────────────────────
  if (screen === 'chapters' && selectedBook) {
    const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBar} onPress={goBack}>
          <Text style={styles.backBarText}>‹  {selectedBook.name}</Text>
        </TouchableOpacity>
        <Text style={styles.chaptersTitle}>Escolha o capítulo</Text>
        <ScrollView contentContainerStyle={styles.chapterGrid}>
          {chapters.map((ch) => (
            <TouchableOpacity
              key={ch}
              style={styles.chapterBtn}
              onPress={() => {
                setSelectedChapter(ch);
                loadChapter(selectedBook, ch);
              }}
            >
              <Text style={styles.chapterBtnText}>{ch}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Tela: Leitura ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header de leitura */}
      <View style={styles.readingHeader}>
        <TouchableOpacity onPress={goBack} style={styles.readingBackBtn}>
          <Text style={styles.readingBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.readingTitle}>
          {selectedBook?.name} {selectedChapter}
        </Text>
        <View style={styles.readingNav}>
          <TouchableOpacity
            onPress={prevChapter}
            disabled={selectedChapter <= 1 || loading}
            style={[styles.navBtn, selectedChapter <= 1 && styles.navBtnDisabled]}
          >
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={nextChapter}
            disabled={selectedChapter >= (selectedBook?.chapters ?? 1) || loading}
            style={[styles.navBtn, selectedChapter >= (selectedBook?.chapters ?? 1) && styles.navBtnDisabled]}
          >
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : (
        <ScrollView
          ref={readingScrollRef}
          style={styles.readingBody}
          contentContainerStyle={styles.readingContent}
          showsVerticalScrollIndicator={false}
        >
          {verses.map((v) => (
            <View key={v.verse} style={styles.verseRow}>
              <Text style={styles.verseNum}>{v.verse}</Text>
              <Text style={styles.verseText}>{v.text.trim()}</Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },

  // Busca e filtros
  searchBar: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    padding: Spacing.md,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },

  // Lista de livros
  list: { padding: Spacing.md, gap: 6 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testamentDot: { width: 8, height: 8, borderRadius: 4 },
  bookName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  bookChapters: { fontSize: 12, color: Colors.textMuted },
  bookArrow: { fontSize: 20, color: Colors.textMuted, marginLeft: 4 },

  // Seleção de capítulo
  backBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  chaptersTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    padding: Spacing.md,
    paddingBottom: 8,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: 8,
  },
  chapterBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },

  // Leitura
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.headerBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 8,
  },
  readingBackBtn: { padding: 4 },
  readingBackText: { fontSize: 28, color: Colors.headerText, lineHeight: 32, fontWeight: '200' },
  readingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.headerText,
    fontFamily: 'Inter_700Bold',
  },
  readingNav: { flexDirection: 'row', gap: 4 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: 22, color: Colors.headerText, fontWeight: '300', lineHeight: 26 },
  readingBody: { flex: 1 },
  readingContent: { padding: Spacing.lg, paddingTop: Spacing.md },
  verseRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  verseNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    minWidth: 20,
    marginTop: 2,
  },
  verseText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
});
