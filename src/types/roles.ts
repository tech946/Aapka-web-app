import { ROLE_IDS } from '@/lib/access/roles';

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

export const RoleId = ROLE_IDS;
