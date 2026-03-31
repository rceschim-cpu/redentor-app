import { UserRole } from '../types';

export function canCreateGroup(role: UserRole): boolean {
  return role === 'administrador' || role === 'pastor' || role === 'lider';
}

export function canManageGroup(role: UserRole, userId: string, leaderId: string): boolean {
  return role === 'administrador' || role === 'pastor' || userId === leaderId;
}

export function canManageMembers(role: UserRole): boolean {
  return role === 'administrador' || role === 'pastor';
}

export function canViewRequests(role: UserRole, userId: string, leaderId: string): boolean {
  return canManageGroup(role, userId, leaderId);
}
