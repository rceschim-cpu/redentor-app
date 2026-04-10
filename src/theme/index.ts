export const Colors = {
  // Brand — Comunidade do Redentor (Proposta "Cal e Sombra")
  primary: '#4A7AB5',       // Azul vitral — cor de acento principal
  primaryLight: '#6B96C8',
  background: '#B8B5B0',    // Cinza-concreto (parede da igreja)
  surface: '#FFFFFF',
  border: '#D0CEC9',
  borderLight: '#E0DEDA',

  // Arco do vitral — 4 segmentos, extraídos do logo oficial
  archRose:   '#C07888',  // arco externo — rosa/malva
  archBlue:   '#8090C0',  // segundo arco — azul ardósia/periwinkle
  archYellow: '#C8B45A',  // terceiro arco — amarelo/dourado
  archGreen:  '#789E6E',  // arco interno — verde-sálvia

  // 160 Anos — identidade comemorativa
  gold:       '#B8963C',  // dourado da campanha
  goldLight:  '#F5EDD6',  // fundo dourado suave

  // Header / nav bar
  headerBg: '#F5F4F2',      // Quase-branco (cal da igreja)
  headerText: '#111111',

  // Texto
  textPrimary: '#111111',
  textSecondary: '#555550',
  textMuted: '#888884',
  textOnDark: '#FFFFFF',

  // Ações destrutivas
  danger: '#C0392B',

  // Status
  activeText: '#3B7A46',
  activeBg: '#E8F4EA',
  visitorText: '#B85C20',
  visitorBg: '#FDF0E8',
  inactiveText: '#9B3030',
  inactiveBg: '#F5EFEF',

  // Avatares (rotativo por inicial)
  avatarPurpleBg: '#EDE9F7',
  avatarPurpleFg: '#7B5EA7',
  avatarBlueBg: '#E8F2FA',
  avatarBlueFg: '#2D6EA0',
  avatarGreenBg: '#E8F4EA',
  avatarGreenFg: '#3B7A46',
  avatarOrangeBg: '#FDF0E8',
  avatarOrangeFg: '#B85C20',
};

export const Typography = {
  // Lora para títulos (mesma família do site)
  heading: 'Lora_600SemiBold',
  // Source Sans 3 para corpo
  body: 'SourceSans3_400Regular',
  bodySemiBold: 'SourceSans3_600SemiBold',
  bodyBold: 'SourceSans3_700Bold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

// Paleta de avatar rotativa por índice
export const AVATAR_COLORS = [
  { bg: Colors.avatarPurpleBg, fg: Colors.avatarPurpleFg },
  { bg: Colors.avatarBlueBg, fg: Colors.avatarBlueFg },
  { bg: Colors.avatarGreenBg, fg: Colors.avatarGreenFg },
  { bg: Colors.avatarOrangeBg, fg: Colors.avatarOrangeFg },
];

export const getAvatarColor = (index: number) =>
  AVATAR_COLORS[index % AVATAR_COLORS.length];
