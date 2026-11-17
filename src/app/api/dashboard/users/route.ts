import { PERMISSIONS } from '@/lib/access';
import { readBody, withPermission } from '@/lib/api/route';
import { createUserSchema } from '@/features/users/schemas';
import { createTeamUser, listTeamUsers } from '@/features/users/service';

export const dynamic = 'force-dynamic';

export const GET = withPermission(PERMISSIONS.USERS_READ, async () => ({ users: await listTeamUsers() }));

export const POST = withPermission(PERMISSIONS.USERS_WRITE, async (req, { user }) => {
  const input = await readBody(req, createUserSchema);
  return { user: await createTeamUser(input, user.id) };
});
