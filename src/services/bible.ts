// Duas APIs: bible-api.com (Almeida, KJV, etc.) + API.Bible (NVT, BLT em PT)
const BIBLE_API_BASE = 'https://bible-api.com';
const API_BIBLE_BASE = 'https://rest.api.bible/v1';
const API_BIBLE_KEY  = 'bBEDOYwe7o-5-jNHRllHN';

export interface BibleTranslation {
  id: string;
  label: string;
  language: string;
  source: 'bible-api' | 'api-bible';
  ntOnly?: boolean; // BLT é só NT
}

export const TRANSLATIONS: BibleTranslation[] = [
  // Português
  { id: 'almeida',              label: 'Almeida Revisada e Corrigida', language: 'Português', source: 'bible-api' },
  { id: '41a6caa722a21d88-01', label: 'Nova Versão Transformadora',    language: 'Português', source: 'api-bible' },
  { id: 'd63894c8d9a7a503-01', label: 'Bíblia Livre Para Todos',       language: 'Português (NT)', source: 'api-bible', ntOnly: true },
  // Inglês
  { id: 'kjv',                  label: 'King James Version',           language: 'English',   source: 'bible-api' },
  { id: 'web',                  label: 'World English Bible',          language: 'English',   source: 'bible-api' },
  { id: 'bbe',                  label: 'Bible in Basic English',       language: 'English',   source: 'bible-api' },
];

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleChapter {
  reference: string;
  verses: BibleVerse[];
  translation_name: string;
}

// ── bible-api.com ────────────────────────────────────────────────────────────
async function getChapterBibleApi(book: string, chapter: number, translationId: string): Promise<BibleChapter> {
  const res = await fetch(`${BIBLE_API_BASE}/${encodeURIComponent(book)}+${chapter}?translation=${translationId}&verse_numbers=true`);
  if (!res.ok) throw new Error(`Erro ao carregar ${book} ${chapter}`);
  return res.json();
}

// ── API.Bible ────────────────────────────────────────────────────────────────
async function getChapterApiBible(bibleId: string, usfm: string, chapter: number, bookName: string): Promise<BibleChapter> {
  const chapterId = `${usfm}.${chapter}`;
  const url = `${API_BIBLE_BASE}/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-verse-numbers=true&include-titles=false&include-chapter-numbers=false`;
  const res = await fetch(url, { headers: { 'api-key': API_BIBLE_KEY } });
  if (!res.ok) throw new Error(`Erro ao carregar capítulo (${res.status})`);
  const json = await res.json();
  const raw: string = json?.data?.content ?? '';

  // Parseia "[1] texto [2] texto..." em array de versículos
  const verses: BibleVerse[] = [];
  const parts = raw.split(/\[(\d+)\]/).slice(1); // remove antes do primeiro [1]
  for (let i = 0; i < parts.length - 1; i += 2) {
    const verseNum = parseInt(parts[i], 10);
    const text = parts[i + 1]?.replace(/\s+/g, ' ').trim() ?? '';
    if (text) {
      verses.push({ verse: verseNum, text, book_id: usfm, book_name: bookName, chapter });
    }
  }
  return { reference: `${bookName} ${chapter}`, verses, translation_name: bibleId };
}

// ── Função unificada ─────────────────────────────────────────────────────────
export async function getChapter(
  bookId: string,
  chapter: number,
  translation: BibleTranslation
): Promise<BibleChapter> {
  if (translation.source === 'api-bible') {
    // bookId aqui é o usfm (ex: 'GEN'), bookName vem do BIBLE_BOOKS
    const book = BIBLE_BOOKS.find((b) => b.usfm === bookId);
    return getChapterApiBible(translation.id, bookId, chapter, book?.name ?? bookId);
  }
  // bible-api.com usa o id longo em inglês (ex: 'genesis')
  const book = BIBLE_BOOKS.find((b) => b.usfm === bookId);
  return getChapterBibleApi(book?.id ?? bookId, chapter, translation.id);
}

// ─── Lista de livros ──────────────────────────────────────────────────────────
export interface BibleBook {
  id: string;    // bible-api.com (inglês longo: 'genesis')
  usfm: string;  // API.Bible / padrão USFM 3 letras: 'GEN'
  name: string;  // português
  chapters: number;
  testament: 'AT' | 'NT';
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Antigo Testamento
  { id: 'genesis',         usfm: 'GEN', name: 'Gênesis',          chapters: 50,  testament: 'AT' },
  { id: 'exodus',          usfm: 'EXO', name: 'Êxodo',            chapters: 40,  testament: 'AT' },
  { id: 'leviticus',       usfm: 'LEV', name: 'Levítico',         chapters: 27,  testament: 'AT' },
  { id: 'numbers',         usfm: 'NUM', name: 'Números',          chapters: 36,  testament: 'AT' },
  { id: 'deuteronomy',     usfm: 'DEU', name: 'Deuteronômio',     chapters: 34,  testament: 'AT' },
  { id: 'joshua',          usfm: 'JOS', name: 'Josué',            chapters: 24,  testament: 'AT' },
  { id: 'judges',          usfm: 'JDG', name: 'Juízes',           chapters: 21,  testament: 'AT' },
  { id: 'ruth',            usfm: 'RUT', name: 'Rute',             chapters: 4,   testament: 'AT' },
  { id: '1 samuel',        usfm: '1SA', name: '1 Samuel',         chapters: 31,  testament: 'AT' },
  { id: '2 samuel',        usfm: '2SA', name: '2 Samuel',         chapters: 24,  testament: 'AT' },
  { id: '1 kings',         usfm: '1KI', name: '1 Reis',           chapters: 22,  testament: 'AT' },
  { id: '2 kings',         usfm: '2KI', name: '2 Reis',           chapters: 25,  testament: 'AT' },
  { id: '1 chronicles',    usfm: '1CH', name: '1 Crônicas',       chapters: 29,  testament: 'AT' },
  { id: '2 chronicles',    usfm: '2CH', name: '2 Crônicas',       chapters: 36,  testament: 'AT' },
  { id: 'ezra',            usfm: 'EZR', name: 'Esdras',           chapters: 10,  testament: 'AT' },
  { id: 'nehemiah',        usfm: 'NEH', name: 'Neemias',          chapters: 13,  testament: 'AT' },
  { id: 'esther',          usfm: 'EST', name: 'Ester',            chapters: 10,  testament: 'AT' },
  { id: 'job',             usfm: 'JOB', name: 'Jó',               chapters: 42,  testament: 'AT' },
  { id: 'psalms',          usfm: 'PSA', name: 'Salmos',           chapters: 150, testament: 'AT' },
  { id: 'proverbs',        usfm: 'PRO', name: 'Provérbios',       chapters: 31,  testament: 'AT' },
  { id: 'ecclesiastes',    usfm: 'ECC', name: 'Eclesiastes',      chapters: 12,  testament: 'AT' },
  { id: 'song of solomon', usfm: 'SNG', name: 'Cânticos',         chapters: 8,   testament: 'AT' },
  { id: 'isaiah',          usfm: 'ISA', name: 'Isaías',           chapters: 66,  testament: 'AT' },
  { id: 'jeremiah',        usfm: 'JER', name: 'Jeremias',         chapters: 52,  testament: 'AT' },
  { id: 'lamentations',    usfm: 'LAM', name: 'Lamentações',      chapters: 5,   testament: 'AT' },
  { id: 'ezekiel',         usfm: 'EZK', name: 'Ezequiel',         chapters: 48,  testament: 'AT' },
  { id: 'daniel',          usfm: 'DAN', name: 'Daniel',           chapters: 12,  testament: 'AT' },
  { id: 'hosea',           usfm: 'HOS', name: 'Oséias',           chapters: 14,  testament: 'AT' },
  { id: 'joel',            usfm: 'JOL', name: 'Joel',             chapters: 3,   testament: 'AT' },
  { id: 'amos',            usfm: 'AMO', name: 'Amós',             chapters: 9,   testament: 'AT' },
  { id: 'obadiah',         usfm: 'OBA', name: 'Obadias',          chapters: 1,   testament: 'AT' },
  { id: 'jonah',           usfm: 'JON', name: 'Jonas',            chapters: 4,   testament: 'AT' },
  { id: 'micah',           usfm: 'MIC', name: 'Miquéias',         chapters: 7,   testament: 'AT' },
  { id: 'nahum',           usfm: 'NAM', name: 'Naum',             chapters: 3,   testament: 'AT' },
  { id: 'habakkuk',        usfm: 'HAB', name: 'Habacuque',        chapters: 3,   testament: 'AT' },
  { id: 'zephaniah',       usfm: 'ZEP', name: 'Sofonias',         chapters: 3,   testament: 'AT' },
  { id: 'haggai',          usfm: 'HAG', name: 'Ageu',             chapters: 2,   testament: 'AT' },
  { id: 'zechariah',       usfm: 'ZEC', name: 'Zacarias',         chapters: 14,  testament: 'AT' },
  { id: 'malachi',         usfm: 'MAL', name: 'Malaquias',        chapters: 4,   testament: 'AT' },
  // Novo Testamento
  { id: 'matthew',         usfm: 'MAT', name: 'Mateus',           chapters: 28,  testament: 'NT' },
  { id: 'mark',            usfm: 'MRK', name: 'Marcos',           chapters: 16,  testament: 'NT' },
  { id: 'luke',            usfm: 'LUK', name: 'Lucas',            chapters: 24,  testament: 'NT' },
  { id: 'john',            usfm: 'JHN', name: 'João',             chapters: 21,  testament: 'NT' },
  { id: 'acts',            usfm: 'ACT', name: 'Atos',             chapters: 28,  testament: 'NT' },
  { id: 'romans',          usfm: 'ROM', name: 'Romanos',          chapters: 16,  testament: 'NT' },
  { id: '1 corinthians',   usfm: '1CO', name: '1 Coríntios',      chapters: 16,  testament: 'NT' },
  { id: '2 corinthians',   usfm: '2CO', name: '2 Coríntios',      chapters: 13,  testament: 'NT' },
  { id: 'galatians',       usfm: 'GAL', name: 'Gálatas',          chapters: 6,   testament: 'NT' },
  { id: 'ephesians',       usfm: 'EPH', name: 'Efésios',          chapters: 6,   testament: 'NT' },
  { id: 'philippians',     usfm: 'PHP', name: 'Filipenses',       chapters: 4,   testament: 'NT' },
  { id: 'colossians',      usfm: 'COL', name: 'Colossenses',      chapters: 4,   testament: 'NT' },
  { id: '1 thessalonians', usfm: '1TH', name: '1 Tessalonicenses', chapters: 5,  testament: 'NT' },
  { id: '2 thessalonians', usfm: '2TH', name: '2 Tessalonicenses', chapters: 3,  testament: 'NT' },
  { id: '1 timothy',       usfm: '1TI', name: '1 Timóteo',        chapters: 6,   testament: 'NT' },
  { id: '2 timothy',       usfm: '2TI', name: '2 Timóteo',        chapters: 4,   testament: 'NT' },
  { id: 'titus',           usfm: 'TIT', name: 'Tito',             chapters: 3,   testament: 'NT' },
  { id: 'philemon',        usfm: 'PHM', name: 'Filemon',          chapters: 1,   testament: 'NT' },
  { id: 'hebrews',         usfm: 'HEB', name: 'Hebreus',          chapters: 13,  testament: 'NT' },
  { id: 'james',           usfm: 'JAS', name: 'Tiago',            chapters: 5,   testament: 'NT' },
  { id: '1 peter',         usfm: '1PE', name: '1 Pedro',          chapters: 5,   testament: 'NT' },
  { id: '2 peter',         usfm: '2PE', name: '2 Pedro',          chapters: 3,   testament: 'NT' },
  { id: '1 john',          usfm: '1JN', name: '1 João',           chapters: 5,   testament: 'NT' },
  { id: '2 john',          usfm: '2JN', name: '2 João',           chapters: 1,   testament: 'NT' },
  { id: '3 john',          usfm: '3JN', name: '3 João',           chapters: 1,   testament: 'NT' },
  { id: 'jude',            usfm: 'JUD', name: 'Judas',            chapters: 1,   testament: 'NT' },
  { id: 'revelation',      usfm: 'REV', name: 'Apocalipse',       chapters: 22,  testament: 'NT' },
];
