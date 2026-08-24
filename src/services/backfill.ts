import { Member } from '../types';
import { getMembers, addMember } from './members';
import { getAllUsers, updateUserProfile } from './userProfile';

export interface BackfillResult {
  created: number;   // registros de membro criados do zero
  linked: number;    // usuários ligados a um membro que já existia
  skipped: number;   // já tinham vínculo, nada a fazer
  failed: number;
}

const normalizeEmail = (e?: string) => (e ?? '').trim().toLowerCase();

/**
 * Quantos usuários ainda não têm registro em /members.
 *
 * Serve para decidir se vale mostrar o botão de correção — quando dá zero,
 * não há nada a corrigir.
 */
export async function countUsersWithoutMember(): Promise<number> {
  const users = await getAllUsers();
  return users.filter((u) => !u.memberId).length;
}

/**
 * Cria registros de membro para quem se cadastrou mas nunca completou o
 * perfil, e por isso não aparecia na tela de Membros.
 *
 * Só preenche nome e e-mail: telefone, nascimento e endereço continuam em
 * branco, porque quem os coleta é o formulário de perfil. A própria pessoa
 * pode preencher depois pela tela de Perfil.
 *
 * Reexecutar é seguro — quem já tem vínculo é ignorado.
 */
export async function backfillMembersFromUsers(): Promise<BackfillResult> {
  const [users, members] = await Promise.all([getAllUsers(), getMembers()]);

  // Índice por e-mail: alguém pode ter sido cadastrado à mão em /members e
  // ter criado a conta depois. Nesse caso liga os dois em vez de duplicar.
  const byEmail = new Map<string, string>();
  for (const m of members) {
    const key = normalizeEmail(m.email);
    if (key && !byEmail.has(key)) byEmail.set(key, m.id);
  }

  const result: BackfillResult = { created: 0, linked: 0, skipped: 0, failed: 0 };

  for (const user of users) {
    if (user.memberId) {
      result.skipped++;
      continue;
    }

    try {
      const existingId = byEmail.get(normalizeEmail(user.email));

      if (existingId) {
        await updateUserProfile(user.uid, { memberId: existingId });
        result.linked++;
        continue;
      }

      const data: Omit<Member, 'id'> = {
        name: user.name?.trim() || user.email?.split('@')[0] || 'Sem nome',
        email: user.email,
        status: 'ativo',
        avatarIndex: Math.floor(Math.random() * 4),
      };
      const memberId = await addMember(data);
      await updateUserProfile(user.uid, { memberId });

      const key = normalizeEmail(user.email);
      if (key) byEmail.set(key, memberId);
      result.created++;
    } catch {
      result.failed++;
    }
  }

  return result;
}
