import { UserRole } from './auth.types.js';

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isTeamActive?: boolean;
  mustChangePassword: boolean;
  hasGoogleLinked: boolean;
  managerId?: string | null;
  managerName?: string | null;
  assignedPropertyIds?: string[];
  assignedProperties?: { id: string; name: string }[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  role: 'MANAGER' | 'SALES';
  temporaryPassword: string;
  managerId?: string | null;
  propertyIds?: string[];
}

export interface UpdateEmployeeInput {
  name?: string;
  role?: 'MANAGER' | 'SALES';
  managerId?: string | null;
  temporaryPassword?: string;
  propertyIds?: string[];
}

export interface UpdateEmployeeStatusInput {
  isActive: boolean;
}
