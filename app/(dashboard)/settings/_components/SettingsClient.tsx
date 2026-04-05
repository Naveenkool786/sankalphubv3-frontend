'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building2, Globe, Save, LogOut, Loader2 } from 'lucide-react'
import { updateProfile, updateOrganization } from '../actions'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/getUserContext'

export interface ProfileData {
  id: string
  full_name: string
  email: string
  role: UserRole
  department: string | null
  phone: string | null
}

export interface OrgData {
  id: string
  name: string
  org_type: string
}

interface Props {
  profile: ProfileData
  org: OrgData | null
  canManage: boolean
}

const ROLE_LABEL: Record<string, string> = {
  super_admin:     'Super Admin',
  brand_manager:   'Brand Manager',
  factory_manager: 'Factory Manager',
  inspector:       'Inspector',
  viewer:          'Viewer',
}

const ROLE_BADGE: Record<string, string> = {
  super_admin:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  brand_manager:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  factory_manager: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  inspector:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  viewer:          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const ORG_TYPE_LABELS: Record<string, string> = {
  brand:   'Brand / Buyer',
  factory: 'Factory / Manufacturer',
  agency:  'Inspection Agency',
}

const ORG_TYPE_BADGE: Record<string, string> = {
  brand:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  factory: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  agency:  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

function getInitials(name: string) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function SettingsClient({ profile, org, canManage: isAdmin }: Props) {
  const router = useRouter()

  // Profile form
  const [fullName, setFullName] = useState(profile.full_name)
  const [department, setDepartment] = useState(profile.department ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Org form
  const [orgName, setOrgName] = useState(org?.name ?? '')
  const [savingOrg, setSavingOrg] = useState(false)

  async function handleSaveProfile() {
    if (!fullName.trim()) { toast.error('Display name is required'); return }
    setSavingProfile(true)
    try {
      await updateProfile({ full_name: fullName, department, phone })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSaveOrg() {
    if (!orgName.trim()) { toast.error('Organization name is required'); return }
    setSavingOrg(true)
    try {
      await updateOrganization({ name: orgName })
      toast.success('Organization updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setSavingOrg(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-6">

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar + name/email/role */}
          <div className="flex items-center gap-4 pb-4 border-b border-border">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
              {getInitials(profile.full_name || profile.email)}
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile.full_name || '—'}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge className={cn('mt-1 text-[10px] px-1.5', ROLE_BADGE[profile.role] ?? '')}>
                {ROLE_LABEL[profile.role] ?? profile.role}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs" htmlFor="displayName">Display Name <span aria-hidden="true">*</span></Label>
              <Input
                id="displayName"
                className="h-9 mt-1.5"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={savingProfile}
                required
                aria-required="true"
                autoComplete="name"
              />
            </div>
            <div>
              <Label className="text-xs" htmlFor="profileEmail">Email Address</Label>
              <Input
                id="profileEmail"
                className="h-9 mt-1.5 bg-muted/50 text-muted-foreground"
                value={profile.email}
                disabled
                autoComplete="email"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Email is managed by your identity provider and cannot be changed here.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="department">Department</Label>
                <Input
                  id="department"
                  className="h-9 mt-1.5"
                  placeholder="e.g. Quality Control"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={savingProfile}
                />
              </div>
              <div>
                <Label className="text-xs" htmlFor="profilePhone">Phone</Label>
                <Input
                  id="profilePhone"
                  className="h-9 mt-1.5"
                  placeholder="+1 555 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={savingProfile}
                  autoComplete="tel"
                />
              </div>
            </div>
            <Button size="sm" className="gap-2" disabled={!fullName.trim() || savingProfile} onClick={handleSaveProfile}>
              {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization Settings (admin only) */}
      {isAdmin && org && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Organization Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Org identity block */}
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                {org.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{org.name}</p>
                <Badge className={cn('text-[10px] px-1.5 py-0.5 mt-0.5', ORG_TYPE_BADGE[org.org_type] ?? '')}>
                  {ORG_TYPE_LABELS[org.org_type] ?? org.org_type}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs" htmlFor="orgName">Organization Name <span aria-hidden="true">*</span></Label>
                <Input
                  id="orgName"
                  className="h-9 mt-1.5"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={savingOrg}
                  required
                  aria-required="true"
                  autoComplete="organization"
                />
              </div>
              <div>
                <Label className="text-xs">
                  <Globe className="w-3 h-3 inline mr-1" />Organization Type
                </Label>
                <Input
                  className="h-9 mt-1.5 bg-muted/50 text-muted-foreground"
                  value={ORG_TYPE_LABELS[org.org_type] ?? org.org_type}
                  disabled
                />
                <p className="text-[11px] text-muted-foreground mt-1">Organization type cannot be changed after creation.</p>
              </div>
              <Button size="sm" className="gap-2" disabled={!orgName.trim() || savingOrg} onClick={handleSaveOrg}>
                {savingOrg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Account / Sign Out */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-destructive">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Sign out</p>
              <p className="text-xs text-muted-foreground">Sign out of your SankalpHub account</p>
            </div>
            <Button variant="secondary" size="sm" className="gap-2" onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
