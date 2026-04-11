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

/**
 * Líder pode editar membros do seu próprio grupo.
 * groupLeaderId = leaderId do grupo ao qual o membro pertence.
 */
export function canEditMember(
  role: UserRole,
  userId: string,
  groupLeaderId?: string
): boolean {
  return role === 'administrador' || role === 'pastor' || userId === groupLeaderId;
}

export function canViewRequests(role: UserRole, userId: string, leaderId: string): boolean {
  return canManageGroup(role, userId, leaderId);
}
