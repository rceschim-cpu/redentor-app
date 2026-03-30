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
  neighborhood?: string;
  city?: string;
  avatarIndex?: number;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  leaderId: string;
  coLeaderId?: string;
  memberIds: string[];
  meetingDay: string;
  meetingTime: string;
  location?: string;
  neighborhood?: string;
  status: 'ativo' | 'em_formacao' | 'inativo';
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'lider' | 'membro';
  memberId?: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Members: undefined;
  Groups: undefined;
  Profile: undefined;
};

export type MembersStackParamList = {
  MembersList: undefined;
  MemberDetail: { memberId: string };
  AddMember: undefined;
  EditMember: { memberId: string };
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string };
  AddGroup: undefined;
};
