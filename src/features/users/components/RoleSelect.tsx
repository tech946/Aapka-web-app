import { ASSIGNABLE_ROLES } from '@/lib/access/roles';

interface RoleSelectProps {
  id?: string;
  value: number | '';
  onChange: (roleId: number) => void;
  disabled?: boolean;
}

export function RoleSelect({ id, value, onChange, disabled }: RoleSelectProps) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled}>
      <option value='' disabled>
        Select a role
      </option>
      {ASSIGNABLE_ROLES.map((role) => (
        <option key={role.id} value={role.id}>
          {role.label}
        </option>
      ))}
    </select>
  );
}

export function roleDescription(roleId: number | ''): string | undefined {
  return ASSIGNABLE_ROLES.find((r) => r.id === roleId)?.description;
}
