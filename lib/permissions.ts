export type Role = 'super_admin' | 'brand_manager' | 'factory_manager' | 'inspector' | 'viewer'

export interface Permission {
  category: string
  action: string
  description: string
  roles: Record<Role, boolean>
}

export const PERMISSIONS: Permission[] = [
  // Projects
  { category: 'Projects', action: 'Create Projects', description: 'Create new production projects', roles: { super_admin: true, brand_manager: true, factory_manager: false, inspector: false, viewer: false } },
  { category: 'Projects', action: 'Edit Projects', description: 'Modify existing project details', roles: { super_admin: true, brand_manager: true, factory_manager: false, inspector: false, viewer: false } },
  { category: 'Projects', action: 'View Projects', description: 'View project details and status', roles: { super_admin: true, brand_manager: true, factory_manager: true, inspector: true, viewer: true } },
  // Inspections
  { category: 'Inspections', action: 'Start Inspection', description: 'Create and start a new inspection', roles: { super_admin: true, brand_manager: true, factory_manager: true, inspector: true, viewer: false } },
  { category: 'Inspections', action: 'Submit Report', description: 'Submit completed inspection report', roles: { super_admin: true, brand_manager: true, factory_manager: false, inspector: true, viewer: false } },
  { category: 'Inspections', action: 'Approve Report', description: 'Approve or reject submitted reports', roles: { super_admin: true, brand_manager: true, factory_manager: false, inspector: false, viewer: false } },
  { category: 'Inspections', action: 'View Inspections', description: 'View inspection records and results', roles: { super_admin: true, brand_manager: true, factory_manager: true, inspector: true, viewer: true } },
  // Factories
  { category: 'Factories', action: 'Add Factory', description: 'Add a new manufacturing partner', roles: { super_admin: true, brand_manager: true, factory_manager: false, inspector: false, viewer: false } },
  { category: 'Factories', action: 'Edit Factory', description: 'Edit factory profile and details', roles: { super_admin: true, brand_manager: true, factory_manager: true, inspector: false, viewer: false } },
  { category: 'Factories', action: 'View Factories', description: 'View factory list and profiles', roles: { super_admin: true, brand_manager: true, factory_manager: true, inspector: true, viewer: true } },
  // Analytics
  { category: 'Analytics', action: 'View Analytics', description: 'Access quality analytics and reports', roles: { super_admin: true, brand_manager: true, factory_manager: true, inspector: false, viewer: false } },
  { category: 'Analytics', action: 'Export Data', description: 'Export reports to PDF or Excel', roles: { super_admin: true, brand_manager: true, factory_manager: false, inspector: false, viewer: false } },
  // Templates
  { category: 'Templates', action: 'Create Templates', description: 'Build inspection and workflow templates', roles: { super_admin: true, brand_manager: true, factory_manager: false, inspector: false, viewer: false } },
  { category: 'Templates', action: 'Use Templates', description: 'Apply templates to inspections', roles: { super_admin: true, brand_manager: true, factory_manager: true, inspector: true, viewer: false } },
  // Team & Settings
  { category: 'Team & Settings', action: 'Invite Members', description: 'Invite new team members', roles: { super_admin: true, brand_manager: true, factory_manager: false, inspector: false, viewer: false } },
  { category: 'Team & Settings', action: 'Manage Roles', description: 'Change roles for team members', roles: { super_admin: true, brand_manager: false, factory_manager: false, inspector: false, viewer: false } },
  { category: 'Team & Settings', action: 'Manage Billing', description: 'Manage plan, seats and payments', roles: { super_admin: true, brand_manager: false, factory_manager: false, inspector: false, viewer: false } },
  { category: 'Team & Settings', action: 'Edit Org Settings', description: 'Update organisation profile and settings', roles: { super_admin: true, brand_manager: false, factory_manager: false, inspector: false, viewer: false } },
]
