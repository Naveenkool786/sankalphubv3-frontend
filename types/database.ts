export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type OrgType = 'brand' | 'factory' | 'agency'
export type OrgPlan = 'free' | 'starter' | 'professional' | 'enterprise'
export type UserRole = 'super_admin' | 'brand_manager' | 'factory_manager' | 'inspector' | 'viewer'
export type ProjectStatus = 'draft' | 'active' | 'inspection' | 'completed' | 'cancelled'
export type InspectionStatus = 'draft' | 'scheduled' | 'confirmed' | 'in_progress' | 'report_pending' | 'submitted' | 'approved' | 'cancelled'
export type InspectionResult = 'pending' | 'pass' | 'fail' | 'conditional_pass'
export type InspectionType = 'pre_production' | 'inline' | 'final' | 'lab_test' | 'fri' | 'dupro' | 'pre_final'
export type DefectSeverity = 'critical' | 'major' | 'minor'
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          org_type: OrgType
          plan: OrgPlan
          max_users: number
          logo_url: string | null
          is_active: boolean
          trial_start: string | null
          trial_end: string | null
          is_trial_locked: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          org_id: string | null
          full_name: string
          role: UserRole
          avatar_url: string | null
          department: string | null
          phone: string | null
          notification_preferences: Json
          is_active: boolean
          invited_by: string | null
          invite_token: string | null
          invite_accepted_at: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      factories: {
        Row: {
          id: string
          org_id: string
          name: string
          code: string | null
          country: string | null
          city: string | null
          address: string | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          certifications: Json
          audit_compliance: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['factories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['factories']['Insert']>
      }
      projects: {
        Row: {
          id: string
          org_id: string
          name: string
          po_number: string | null
          buyer_brand: string | null
          factory_id: string | null
          product_category: string | null
          product_description: string | null
          quantity: number | null
          unit: string | null
          deadline: string | null
          status: ProjectStatus
          assigned_inspector_id: string | null
          country: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      inspections: {
        Row: {
          id: string
          org_id: string
          project_id: string | null
          factory_id: string | null
          inspection_no: string
          inspection_type: InspectionType
          template_id: string | null
          template_code: string | null
          template_name: string | null
          aql_level: string
          status: InspectionStatus
          result: InspectionResult
          inspection_date: string
          auditor_name: string | null
          auditor_type: string | null
          quantity_inspected: number
          sample_size: number
          defects_found: number
          critical_defects: number
          major_defects: number
          minor_defects: number
          score: number | null
          form_data: Json
          remarks: string | null
          submitted_at: string | null
          approved_at: string | null
          approved_by: string | null
          email_recipients: string[] | null
          report_file: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['inspections']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['inspections']['Insert']>
      }
      inspection_templates: {
        Row: {
          id: string
          org_id: string
          name: string
          code: string | null
          industry: string | null
          template_type: string
          sections: Json
          score_formula: string | null
          is_archived: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['inspection_templates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['inspection_templates']['Insert']>
      }
      defect_records: {
        Row: {
          id: string
          org_id: string
          inspection_id: string
          severity: DefectSeverity
          description: string
          location: string | null
          image_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['defect_records']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['defect_records']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          org_id: string
          title: string
          description: string | null
          status: TaskStatus
          priority: TaskPriority
          assigned_to: string | null
          due_date: string | null
          related_inspection_id: string | null
          related_project_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      documents: {
        Row: {
          id: string
          org_id: string
          name: string
          file_url: string | null
          file_type: string | null
          file_size: number | null
          related_inspection_id: string | null
          related_project_id: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
