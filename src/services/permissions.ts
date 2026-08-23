import {
  PermissionAction,
  PermissionMatrix,
  PermissionResource,
  RolePermissions,
  Scope,
  UserRole,
  RESOURCE_ORDER,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Matriz de permissões
//
// Fonte única de verdade do controle de acesso. Cada célula diz o ALCANCE de
// uma ação sobre um item, para um perfil:
//   T = tudo      todos os registros da comunidade
//   G = grupo     os do seu grupo, ministério ou área
//   P = próprio   só o que criou, ou o registro que é dele
//   N = nada      sem acesso — o item nem aparece na tela
//
// O mapa abaixo é o PADRÃO INICIAL. O administrador pode editar a matriz pela
// tela de Configurações; o valor editado fica no Firestore e sobrepõe este.
// Ver src/services/permissionMatrix.ts.
// ─────────────────────────────────────────────────────────────────────────────

// Atalho para montar uma linha: [criar, visualizar, editar, excluir]
const r = (c: Scope, v: Scope, e: Scope, x: Scope): Record<PermissionAction, Scope> => ({
  criar: c, visualizar: v, editar: e, excluir: x,
});

const ALL_T: RolePermissions = {
  membro:             r('T', 'T', 'T', 'T'),
  grupo:              r('T', 'T', 'T', 'T'),
  ministerio:         r('T', 'T', 'T', 'T'),
  escala:             r('T', 'T', 'T', 'T'),
  evento:             r('T', 'T', 'T', 'T'),
  crianca:            r('T', 'T', 'T', 'T'),
  material_geral:     r('T', 'T', 'T', 'T'),
  material_lideres:   r('T', 'T', 'T', 'T'),
  banner:             r('T', 'T', 'T', 'T'),
  usuario:            r('T', 'T', 'T', 'T'),
  solicitacao_perfil: r('T', 'T', 'T', 'T'),
  matriz:             r('N', 'T', 'T', 'N'),
};

export const DEFAULT_MATRIX: PermissionMatrix = {
  // Administrador — acesso irrestrito, único que edita a própria matriz
  administrador: ALL_T,

  // Pastor — liderança executiva; não cria nem exclui usuários, não edita a matriz
  pastor: {
    membro:             r('T', 'T', 'T', 'T'),
    grupo:              r('T', 'T', 'T', 'T'),
    ministerio:         r('T', 'T', 'T', 'T'),
    escala:             r('T', 'T', 'T', 'T'),
    evento:             r('T', 'T', 'T', 'T'),
    crianca:            r('T', 'T', 'T', 'T'),
    material_geral:     r('T', 'T', 'T', 'T'),
    material_lideres:   r('T', 'T', 'T', 'T'),
    banner:             r('T', 'T', 'T', 'T'),
    usuario:            r('N', 'T', 'T', 'N'),
    solicitacao_perfil: r('T', 'T', 'T', 'N'),
    matriz:             r('N', 'T', 'N', 'N'),
  },

  // Líder de PG — cria e toca o próprio grupo; vê os membros dele
  lider: {
    membro:             r('N', 'G', 'G', 'N'),
    grupo:              r('T', 'T', 'P', 'P'),
    ministerio:         r('N', 'T', 'N', 'N'),
    escala:             r('N', 'N', 'N', 'N'),
    evento:             r('G', 'T', 'P', 'P'),
    crianca:            r('N', 'G', 'N', 'N'),
    material_geral:     r('G', 'T', 'P', 'P'),
    material_lideres:   r('N', 'T', 'N', 'N'),
    banner:             r('N', 'T', 'N', 'N'),
    usuario:            r('N', 'N', 'N', 'N'),
    solicitacao_perfil: r('T', 'P', 'N', 'N'),
    matriz:             r('N', 'N', 'N', 'N'),
  },

  // Líder de Ministério — gerencia o próprio ministério e suas escalas
  lider_ministerio: {
    membro:             r('N', 'G', 'N', 'N'),
    grupo:              r('N', 'T', 'N', 'N'),
    ministerio:         r('N', 'T', 'P', 'N'),
    escala:             r('G', 'G', 'G', 'G'),
    evento:             r('G', 'T', 'P', 'P'),
    crianca:            r('N', 'N', 'N', 'N'),
    material_geral:     r('N', 'T', 'N', 'N'),
    material_lideres:   r('N', 'N', 'N', 'N'),
    banner:             r('N', 'T', 'N', 'N'),
    usuario:            r('N', 'N', 'N', 'N'),
    solicitacao_perfil: r('T', 'P', 'N', 'N'),
    matriz:             r('N', 'N', 'N', 'N'),
  },

  // Presbítero — conselho: enxerga tudo, cria ministérios, não exclui nem
  // altera perfis de terceiros
  presbitero: {
    membro:             r('T', 'T', 'T', 'N'),
    grupo:              r('T', 'T', 'T', 'N'),
    ministerio:         r('T', 'T', 'T', 'N'),
    escala:             r('N', 'T', 'N', 'N'),
    evento:             r('T', 'T', 'T', 'N'),
    crianca:            r('N', 'T', 'N', 'N'),
    material_geral:     r('T', 'T', 'T', 'N'),
    material_lideres:   r('N', 'T', 'N', 'N'),
    banner:             r('N', 'T', 'N', 'N'),
    usuario:            r('N', 'T', 'N', 'N'),
    solicitacao_perfil: r('T', 'P', 'N', 'N'),
    matriz:             r('N', 'T', 'N', 'N'),
  },

  // Coordenador — o perfil mais operacional acima dos líderes; sem acesso a usuários
  coordenador: {
    membro:             r('T', 'T', 'T', 'N'),
    grupo:              r('T', 'T', 'T', 'N'),
    ministerio:         r('N', 'T', 'T', 'N'),
    escala:             r('T', 'T', 'T', 'T'),
    evento:             r('T', 'T', 'T', 'T'),
    crianca:            r('T', 'T', 'T', 'N'),
    material_geral:     r('T', 'T', 'T', 'T'),
    material_lideres:   r('T', 'T', 'T', 'N'),
    banner:             r('T', 'T', 'T', 'T'),
    usuario:            r('N', 'N', 'N', 'N'),
    solicitacao_perfil: r('T', 'P', 'N', 'N'),
    matriz:             r('N', 'N', 'N', 'N'),
  },

  // Membro — vê o que é público e cuida do que é seu
  membro: {
    membro:             r('N', 'P', 'P', 'N'),
    grupo:              r('N', 'T', 'N', 'N'),
    ministerio:         r('N', 'T', 'N', 'N'),
    escala:             r('N', 'P', 'N', 'N'),
    evento:             r('N', 'T', 'N', 'N'),
    crianca:            r('P', 'P', 'P', 'N'),
    material_geral:     r('N', 'T', 'N', 'N'),
    material_lideres:   r('N', 'N', 'N', 'N'),
    banner:             r('N', 'T', 'N', 'N'),
    usuario:            r('N', 'P', 'N', 'N'),
    solicitacao_perfil: r('T', 'P', 'N', 'P'),
    matriz:             r('N', 'N', 'N', 'N'),
  },
};

// ─── Consulta ────────────────────────────────────────────────────────────────

// Matriz ativa: começa no padrão e é substituída pela versão do Firestore
// assim que o app carrega (ver loadMatrix em permissionMatrix.ts).
let activeMatrix: PermissionMatrix = DEFAULT_MATRIX;

export function setActiveMatrix(matrix: PermissionMatrix): void {
  activeMatrix = matrix;
}

export function getActiveMatrix(): PermissionMatrix {
  return activeMatrix;
}

/** Alcance de um perfil sobre uma ação. 'N' quando o perfil é desconhecido. */
export function scope(
  role: UserRole | undefined,
  resource: PermissionResource,
  action: PermissionAction
): Scope {
  if (!role) return 'N';
  return activeMatrix[role]?.[resource]?.[action] ?? 'N';
}

/** Tem algum acesso? Use para decidir se a tela ou o botão aparece. */
export function can(
  role: UserRole | undefined,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  return scope(role, resource, action) !== 'N';
}

/** Acesso irrestrito a todos os registros. */
export function canAll(
  role: UserRole | undefined,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  return scope(role, resource, action) === 'T';
}

/**
 * Decide o acesso a UM registro concreto, resolvendo G e P.
 *
 * ownerId  — quem criou ou é dono do registro
 * groupIds — grupos/ministérios do registro, para comparar com os do usuário
 */
export function canOn(
  role: UserRole | undefined,
  resource: PermissionResource,
  action: PermissionAction,
  ctx: { userId?: string; ownerId?: string; userGroupIds?: string[]; groupIds?: string[] }
): boolean {
  const s = scope(role, resource, action);
  if (s === 'N') return false;
  if (s === 'T') return true;
  if (s === 'P') return !!ctx.userId && ctx.userId === ctx.ownerId;
  // s === 'G'
  const mine = ctx.userGroupIds ?? [];
  const theirs = ctx.groupIds ?? [];
  return mine.some((g) => theirs.includes(g));
}

/** Itens que o perfil enxerga de alguma forma — usado para montar menus. */
export function visibleResources(role: UserRole | undefined): PermissionResource[] {
  return RESOURCE_ORDER.filter((res) => can(role, res, 'visualizar'));
}
