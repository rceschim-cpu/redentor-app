import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  PermissionAction,
  PermissionMatrix,
  PermissionResource,
  RESOURCE_ORDER,
  ROLE_ORDER,
  Scope,
  UserRole,
} from '../types';
import { DEFAULT_MATRIX, setActiveMatrix } from './permissions';

// A matriz vive em um único documento para ser lida de uma vez no boot do app
const DOC_PATH = ['config', 'permissions'] as const;

const ACTIONS: PermissionAction[] = ['criar', 'visualizar', 'editar', 'excluir'];
const VALID: Scope[] = ['T', 'G', 'P', 'N'];

/**
 * Reconstrói a matriz preenchendo o que faltar com o padrão do código.
 *
 * Sem isso, um perfil ou item adicionado numa versão nova do app ficaria
 * indefinido para quem já tem a matriz salva no Firestore — e toda consulta
 * a ele cairia em 'N', tirando acesso de quem deveria ter.
 */
export function normalizeMatrix(raw: unknown): PermissionMatrix {
  const source = (raw ?? {}) as Record<string, any>;
  const out = {} as PermissionMatrix;

  for (const role of ROLE_ORDER) {
    const roleDefaults = DEFAULT_MATRIX[role];
    const roleRaw = source[role] ?? {};
    const roleOut = {} as PermissionMatrix[UserRole];

    for (const res of RESOURCE_ORDER) {
      const resDefaults = roleDefaults[res];
      const resRaw = roleRaw[res] ?? {};
      const resOut = {} as Record<PermissionAction, Scope>;

      for (const action of ACTIONS) {
        const value = resRaw[action];
        resOut[action] = VALID.includes(value) ? value : resDefaults[action];
      }
      roleOut[res as PermissionResource] = resOut;
    }
    out[role] = roleOut;
  }
  return out;
}

/** Lê a matriz salva. Cai no padrão se ainda não existe ou se a leitura falhar. */
export async function fetchMatrix(): Promise<PermissionMatrix> {
  try {
    const snap = await getDoc(doc(db, ...DOC_PATH));
    if (!snap.exists()) return DEFAULT_MATRIX;
    return normalizeMatrix(snap.data()?.matrix);
  } catch {
    return DEFAULT_MATRIX;
  }
}

/**
 * Carrega a matriz e a instala como ativa. Chamado uma vez no boot, antes de
 * qualquer tela consultar permissões.
 */
export async function loadMatrix(): Promise<PermissionMatrix> {
  const matrix = await fetchMatrix();
  setActiveMatrix(matrix);
  return matrix;
}

/** Grava a matriz e já a aplica na sessão atual. */
export async function saveMatrix(
  matrix: PermissionMatrix,
  updatedBy: string
): Promise<void> {
  const normalized = normalizeMatrix(matrix);
  await setDoc(doc(db, ...DOC_PATH), {
    matrix: normalized,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });
  setActiveMatrix(normalized);
}

/** Devolve a matriz ao padrão do código. */
export async function resetMatrix(updatedBy: string): Promise<PermissionMatrix> {
  await saveMatrix(DEFAULT_MATRIX, updatedBy);
  return DEFAULT_MATRIX;
}
