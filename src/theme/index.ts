export const Colors = {
  // Brand — Comunidade do Redentor
  primary: '#3E3530',       // Marrom escuro quente (cor principal)
  primaryLight: '#5C504A',
  background: '#FAF9F7',    // Off-white quente
  surface: '#FFFFFF',
  border: '#EDE9E3',
  borderLight: '#F5F1EC',

  // Arco do vitral — cores extraídas da logo
  archPurple: '#7B5B9E',
  archBlue:   '#4A7FBE',
  archGreen:  '#7BAA6A',
  archTan:    '#C8B068',
  archSalmon: '#C87868',

  // Texto
  textPrimary: '#3E3530',
  textSecondary: '#9E8E84',
  textMuted: '#B8AFA8',
  textOnDark: '#FFFFFF',

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
