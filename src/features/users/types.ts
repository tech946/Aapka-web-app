export interface TeamUser {
  id: string;
  email: string;
  fullName: string;
  roleId: number;
  roleLabel: string;
  active: boolean;
  editable: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
}

export interface RoleOption {
  id: number;
  label: string;
  description: string;
}
