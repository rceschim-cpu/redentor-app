// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'administrador' | 'pastor' | 'lider' | 'membro';

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador',
  pastor: 'Pastor',
  lider: 'Líder de PG',
  membro: 'Membro',
};

// ─── Perfil de usuário (Firestore /users/{uid}) ───────────────────────────────
export interface AppUserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  memberId?: string;         // referência ao doc na coleção members
  profileComplete?: boolean; // true após completar cadastro no primeiro acesso
  photoURL?: string;         // foto importada do Google (ou outra provider)
  createdAt?: string;
  expoPushToken?: string;    // token para notificações push nativas (opcional)
}

// ─── Notificações in-app (Firestore /notifications/{uid}/items) ───────────────
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'join_request' | 'parking' | 'general';
  read: boolean;
  createdAt: string;
  metadata?: {
    groupId?: string;
    groupName?: string;
    plate?: string;
    memberName?: string;
  };
}

// ─── Redentor Kids / Ponte ────────────────────────────────────────────────────
export type KidsAgeGroup = '0-3' | '4-6' | '7-9' | '10-12';
export type KidsModule   = 'kids' | 'ponte';

export interface Guardian {
  name: string;
  phone: string;           // com DDD
  relationship: string;    // pai, mãe, avó, etc.
  memberId?: string;       // ID do membro vinculado (opcional)
}

export interface Child {
  id: string;
  name: string;
  birthDate: string;       // DD/MM/YYYY
  ageGroup: KidsAgeGroup;
  module: KidsModule;
  status: 'ativo' | 'inativo';
  photoURL?: string;
  guardians: Guardian[];
  guardianMemberIds?: string[]; // IDs dos membros responsáveis (para query array-contains)
  lastAttendance?: string;      // ISO date da última presença
  createdAt: string;
  observations?: string;
}

export interface ChildAttendance {
  id: string;
  childId: string;
  childName: string;
  date: string;            // YYYY-MM-DD
  module: KidsModule;
  ageGroup: KidsAgeGroup;
  registeredBy: 'qrcode' | 'manual';
  registeredByUid: string;
  registeredByName: string;
  createdAt: string;
}

// ─── Membros ───────────────────────────────────────────────────────────────────
export type MemberStatus = 'ativo' | 'visitante' | 'inativo';

export interface FamilyLink {
  memberId: string;
  memberName: string;
  relationship: string; // cônjuge, filho, filha, pai, mãe, irmão, irmã...
}

export interface Member {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  maritalStatus?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo';
  status: MemberStatus;
  groupId?: string;
  baptismDate?: string;
  memberSince?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  avatarIndex?: number;
  cars?: Array<{ plate: string; model?: string; color?: string }>;
  carPlates?: string[];
  familyLinks?: FamilyLink[];
}

// ─── Pequenos Grupos ───────────────────────────────────────────────────────────
export interface Group {
  id: string;
  name: string;
  icon?: string;
  leaderId: string;
  leaderName?: string;  // desnormalizado para evitar join na listagem
  coLeaderId?: string;
  coLeaderName?: string;
  memberCount?: number;
  pendingCount?: number;
  meetingDay?: string;
  meetingTime?: string;
  location?: string;
  neighborhood?: string;
  status: 'ativo' | 'em_formacao' | 'inativo';
  recurrence?: 'semanal' | 'quinzenal' | 'mensal';
  createdAt?: string;
  createdBy?: string;
}

// ─── Solicitação de ingresso em PG ───────────────────────────────────────────
export type MembershipStatus = 'pendente' | 'aprovado' | 'rejeitado';

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: MembershipStatus;
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// ─── Materiais de Pequenos Grupos ─────────────────────────────────────────────
export interface GroupMaterial {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  fileURL: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  uploadedBy: string;
  uploaderName: string;
  uploadedAt: string;
}

// ─── User (legado — mantido para compatibilidade) ─────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  memberId?: string;
}

// ─── Navigation param lists ───────────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Members: undefined;
  SmallGroups: undefined;
};

export type MembersStackParamList = {
  MembersList: undefined;
  MemberDetail: { memberId: string };
  AddMember: undefined;
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string };
  AddGroup: undefined;
  GroupMemberRequests: { groupId: string; groupName: string };
};
