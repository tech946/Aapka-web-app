// Web app roles: Super Admin (1), Content Editor (2)
// No groups - simplified from CRM

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: number;
  sub_role_id?: number;
  is_primary: boolean;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface UserWithRoles {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  roles: UserRole[];
  primary_role?: UserRole;
  permissions: string[];
}

export enum RoleId {
  SUPER_ADMIN = 1,
  CONTENT_EDITOR = 2,
}
