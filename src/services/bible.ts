// bible-api.com — gratuito, sem chave de API
const BASE = 'https://bible-api.com';

export interface BibleTranslation {
  id: string;
  label: string;
  language: string;
}

export const TRANSLATIONS: BibleTranslation[] = [
  { id: 'almeida',    label: 'Almeida Revisada e Corrigida', language: 'Português' },
  { id: 'kjv',        label: 'King James Version',           language: 'English' },
  { id: 'web',        label: 'World English Bible',          language: 'English' },
  { id: 'bbe',        label: 'Bible in Basic English',       language: 'English' },
  { id: 'darby',      label: 'Darby Translation',            language: 'English' },
  { id: 'asvn',       label: 'American Standard Version',    language: 'English' },
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

export async function getChapter(book: string, chapter: number, translation = 'almeida'): Promise<BibleChapter> {
  const res = await fetch(`${BASE}/${encodeURIComponent(book)}+${chapter}?translation=${translation}&verse_numbers=true`);
  if (!res.ok) throw new Error(`Erro ao carregar ${book} ${chapter}`);
  return res.json();
}

// ─── Lista de livros com nome PT-BR, chave da API e nº de capítulos ──────────
export interface BibleBook {
  id: string;       // nome aceito pela API (inglês)
  name: string;     // nome em português
  chapters: number;
  testament: 'AT' | 'NT';
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Antigo Testamento
  { id: 'genesis',         name: 'Gênesis',          chapters: 50,  testament: 'AT' },
  { id: 'exodus',          name: 'Êxodo',            chapters: 40,  testament: 'AT' },
  { id: 'leviticus',       name: 'Levítico',         chapters: 27,  testament: 'AT' },
  { id: 'numbers',         name: 'Números',          chapters: 36,  testament: 'AT' },
  { id: 'deuteronomy',     name: 'Deuteronômio',     chapters: 34,  testament: 'AT' },
  { id: 'joshua',          name: 'Josué',            chapters: 24,  testament: 'AT' },
  { id: 'judges',          name: 'Juízes',           chapters: 21,  testament: 'AT' },
  { id: 'ruth',            name: 'Rute',             chapters: 4,   testament: 'AT' },
  { id: '1 samuel',        name: '1 Samuel',         chapters: 31,  testament: 'AT' },
  { id: '2 samuel',        name: '2 Samuel',         chapters: 24,  testament: 'AT' },
  { id: '1 kings',         name: '1 Reis',           chapters: 22,  testament: 'AT' },
  { id: '2 kings',         name: '2 Reis',           chapters: 25,  testament: 'AT' },
  { id: '1 chronicles',    name: '1 Crônicas',       chapters: 29,  testament: 'AT' },
  { id: '2 chronicles',    name: '2 Crônicas',       chapters: 36,  testament: 'AT' },
  { id: 'ezra',            name: 'Esdras',           chapters: 10,  testament: 'AT' },
  { id: 'nehemiah',        name: 'Neemias',          chapters: 13,  testament: 'AT' },
  { id: 'esther',          name: 'Ester',            chapters: 10,  testament: 'AT' },
  { id: 'job',             name: 'Jó',               chapters: 42,  testament: 'AT' },
  { id: 'psalms',          name: 'Salmos',           chapters: 150, testament: 'AT' },
  { id: 'proverbs',        name: 'Provérbios',       chapters: 31,  testament: 'AT' },
  { id: 'ecclesiastes',    name: 'Eclesiastes',      chapters: 12,  testament: 'AT' },
  { id: 'song of solomon', name: 'Cânticos',         chapters: 8,   testament: 'AT' },
  { id: 'isaiah',          name: 'Isaías',           chapters: 66,  testament: 'AT' },
  { id: 'jeremiah',        name: 'Jeremias',         chapters: 52,  testament: 'AT' },
  { id: 'lamentations',    name: 'Lamentações',      chapters: 5,   testament: 'AT' },
  { id: 'ezekiel',         name: 'Ezequiel',         chapters: 48,  testament: 'AT' },
  { id: 'daniel',          name: 'Daniel',           chapters: 12,  testament: 'AT' },
  { id: 'hosea',           name: 'Oséias',           chapters: 14,  testament: 'AT' },
  { id: 'joel',            name: 'Joel',             chapters: 3,   testament: 'AT' },
  { id: 'amos',            name: 'Amós',             chapters: 9,   testament: 'AT' },
  { id: 'obadiah',         name: 'Obadias',          chapters: 1,   testament: 'AT' },
  { id: 'jonah',           name: 'Jonas',            chapters: 4,   testament: 'AT' },
  { id: 'micah',           name: 'Miquéias',         chapters: 7,   testament: 'AT' },
  { id: 'nahum',           name: 'Naum',             chapters: 3,   testament: 'AT' },
  { id: 'habakkuk',        name: 'Habacuque',        chapters: 3,   testament: 'AT' },
  { id: 'zephaniah',       name: 'Sofonias',         chapters: 3,   testament: 'AT' },
  { id: 'haggai',          name: 'Ageu',             chapters: 2,   testament: 'AT' },
  { id: 'zechariah',       name: 'Zacarias',         chapters: 14,  testament: 'AT' },
  { id: 'malachi',         name: 'Malaquias',        chapters: 4,   testament: 'AT' },
  // Novo Testamento
  { id: 'matthew',         name: 'Mateus',           chapters: 28,  testament: 'NT' },
  { id: 'mark',            name: 'Marcos',           chapters: 16,  testament: 'NT' },
  { id: 'luke',            name: 'Lucas',            chapters: 24,  testament: 'NT' },
  { id: 'john',            name: 'João',             chapters: 21,  testament: 'NT' },
  { id: 'acts',            name: 'Atos',             chapters: 28,  testament: 'NT' },
  { id: 'romans',          name: 'Romanos',          chapters: 16,  testament: 'NT' },
  { id: '1 corinthians',   name: '1 Coríntios',      chapters: 16,  testament: 'NT' },
  { id: '2 corinthians',   name: '2 Coríntios',      chapters: 13,  testament: 'NT' },
  { id: 'galatians',       name: 'Gálatas',          chapters: 6,   testament: 'NT' },
  { id: 'ephesians',       name: 'Efésios',          chapters: 6,   testament: 'NT' },
  { id: 'philippians',     name: 'Filipenses',       chapters: 4,   testament: 'NT' },
  { id: 'colossians',      name: 'Colossenses',      chapters: 4,   testament: 'NT' },
  { id: '1 thessalonians', name: '1 Tessalonicenses', chapters: 5,  testament: 'NT' },
  { id: '2 thessalonians', name: '2 Tessalonicenses', chapters: 3,  testament: 'NT' },
  { id: '1 timothy',       name: '1 Timóteo',        chapters: 6,   testament: 'NT' },
  { id: '2 timothy',       name: '2 Timóteo',        chapters: 4,   testament: 'NT' },
  { id: 'titus',           name: 'Tito',             chapters: 3,   testament: 'NT' },
  { id: 'philemon',        name: 'Filemon',          chapters: 1,   testament: 'NT' },
  { id: 'hebrews',         name: 'Hebreus',          chapters: 13,  testament: 'NT' },
  { id: 'james',           name: 'Tiago',            chapters: 5,   testament: 'NT' },
  { id: '1 peter',         name: '1 Pedro',          chapters: 5,   testament: 'NT' },
  { id: '2 peter',         name: '2 Pedro',          chapters: 3,   testament: 'NT' },
  { id: '1 john',          name: '1 João',           chapters: 5,   testament: 'NT' },
  { id: '2 john',          name: '2 João',           chapters: 1,   testament: 'NT' },
  { id: '3 john',          name: '3 João',           chapters: 1,   testament: 'NT' },
  { id: 'jude',            name: 'Judas',            chapters: 1,   testament: 'NT' },
  { id: 'revelation',      name: 'Apocalipse',       chapters: 22,  testament: 'NT' },
];
