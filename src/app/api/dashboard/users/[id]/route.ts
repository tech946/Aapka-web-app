import { PERMISSIONS } from '@/lib/access';
import { readBody, withPermission } from '@/lib/api/route';
import { updateUserSchema } from '@/features/users/schemas';
import { deleteTeamUser, getTeamUser, updateTeamUser } from '@/features/users/service';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export const GET = withPermission<Params>(PERMISSIONS.USERS_READ, async (_req, { params }) => ({
  user: await getTeamUser(params.id),
}));

export const PATCH = withPermission<Params>(PERMISSIONS.USERS_WRITE, async (req, { params, user }) => {
  const input = await readBody(req, updateUserSchema);
  return { user: await updateTeamUser(params.id, input, user.id) };
});

export const DELETE = withPermission<Params>(PERMISSIONS.USERS_WRITE, async (_req, { params, user }) => {
  await deleteTeamUser(params.id, user.id);
  return { ok: true };
});
