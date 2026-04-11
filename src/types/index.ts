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
}

// ─── Membros ───────────────────────────────────────────────────────────────────
export type MemberStatus = 'ativo' | 'visitante' | 'inativo';

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
