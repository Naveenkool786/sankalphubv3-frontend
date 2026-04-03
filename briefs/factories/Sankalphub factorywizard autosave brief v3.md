# SankalpHub — Factory Wizard Auto-Save Draft Brief (V3 Frontend)
**For: Claude Code**
**Date:** April 3, 2026
**Scope:** Add auto-save draft to the Add Factory wizard at `/factories/new`
**Mode:** Small targeted addition to existing wizard. Do NOT touch any other module.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Always use `org_id` (NOT organization_id) in all Supabase queries

---

## WHAT TO BUILD

Two layers of draft saving:

1. **localStorage** — saves every 10 seconds as user types (instant, no network)
2. **Supabase** — saves as a real draft record when user leaves a step or closes tab

When user comes back to `/factories/new`:
- Check localStorage for saved draft
- Show a banner: "You have an unsaved draft — [Continue draft] [Start fresh]"
- Continue draft → restores all fields exactly where they left off
- Start fresh → clears draft and resets form

Draft factories appear on the `/factories` board with a gray "Draft" badge and a "Continue →" button.

---

## STEP 1 — localStorage AUTO-SAVE (every 10 seconds)

Add this inside the wizard component:

```typescript
// Auto-save to localStorage every 10 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (formData.name) {  // only save if user has started filling
      localStorage.setItem('factory-wizard-draft', JSON.stringify({
        formData,
        currentStep,
        savedAt: new Date().toISOString(),
      }))
    }
  }, 10000)  // 10 seconds

  return () => clearInterval(interval)
}, [formData, currentStep])
```

---

## STEP 2 — RESTORE DRAFT BANNER

On page load, check localStorage and show banner if draft exists:

```typescript
const [savedDraft, setSavedDraft] = useState<any>(null)

useEffect(() => {
  try {
    const raw = localStorage.getItem('factory-wizard-draft')
    if (raw) {
      const draft = JSON.parse(raw)
      if (draft?.formData?.name) {
        setSavedDraft(draft)
      }
    }
  } catch {
    localStorage.removeItem('factory-wizard-draft')
  }
}, [])
```

**Banner UI — shown at top of page when draft exists:**

```tsx
{savedDraft && (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: '#FAEEDA',
    border: '0.5px solid #C9A96E',
    borderRadius: '8px',
    marginBottom: '16px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#633806" strokeWidth="2" strokeLinecap="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      <div>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#633806' }}>
          Unsaved draft found — {savedDraft.formData.name}
        </span>
        <span style={{ fontSize: '10px', color: '#854F0B', marginLeft: '8px' }}>
          Saved {new Date(savedDraft.savedAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        onClick={() => {
          setFormData(savedDraft.formData)
          setCurrentStep(savedDraft.currentStep || 1)
          setSavedDraft(null)
        }}
        style={{
          fontSize: '11px', padding: '5px 12px', borderRadius: '7px',
          background: '#BA7517', color: '#fff', border: 'none',
          cursor: 'pointer', fontWeight: 500,
        }}>
        Continue draft →
      </button>
      <button
        onClick={() => {
          localStorage.removeItem('factory-wizard-draft')
          setSavedDraft(null)
        }}
        style={{
          fontSize: '11px', padding: '5px 12px', borderRadius: '7px',
          background: 'transparent', color: '#633806',
          border: '0.5px solid #C9A96E', cursor: 'pointer',
        }}>
        Start fresh
      </button>
    </div>
  </div>
)}
```

---

## STEP 3 — SUPABASE DRAFT SAVE

Save to Supabase as a real draft record when:
- User clicks "Next" between steps
- User clicks "Save as draft" button on Step 3
- Page unload event fires (beforeunload)

```typescript
const saveDraftToSupabase = async () => {
  if (!formData.name) return  // don't save empty drafts

  try {
    const draftData = {
      org_id: orgId,
      name: formData.name || 'Untitled factory',
      code: formData.code || null,
      country: formData.country || null,
      city: formData.city || null,
      contact_name: formData.contactName || null,
      contact_email: formData.contactEmail || null,
      contact_phone: formData.contactPhone || null,
      website: formData.website || null,
      notes: formData.notes || null,
      status: 'inactive',  // draft = inactive until confirmed
      total_lines: parseInt(formData.totalLines) || null,
      max_capacity: parseInt(formData.maxCapacity) || null,
      categories: formData.categories || [],
      certifications: formData.certifications || [],
      aql_default: formData.aqlDefault || '2.5',
      created_by: user?.id,
      // Store draft metadata in notes field temporarily
      // until we have a proper draft_data column
    }

    if (draftId) {
      // Update existing draft
      await supabase.from('factories')
        .update(draftData)
        .eq('id', draftId)
    } else {
      // Create new draft record
      const { data } = await supabase.from('factories')
        .insert(draftData)
        .select('id').single()
      if (data) setDraftId(data.id)
    }
  } catch (err) {
    console.error('Draft save failed:', err)
    // Never surface this error to the user — silent fail
  }
}

// Save draft when moving between steps
const handleNext = async () => {
  await saveDraftToSupabase()
  setCurrentStep(prev => prev + 1)
}

// Save draft on page unload
useEffect(() => {
  const handleUnload = () => saveDraftToSupabase()
  window.addEventListener('beforeunload', handleUnload)
  return () => window.removeEventListener('beforeunload', handleUnload)
}, [formData])
```

---

## STEP 4 — DRAFT CARD ON FACTORIES BOARD

Factories with `status = 'inactive'` that were created by the wizard
(have `created_by` set) should show as drafts on the board.

Find the factory card component and add draft state:

```typescript
// A factory is a "wizard draft" if:
// status === 'inactive' AND name exists AND no latest_audit_score
const isDraft = factory.status === 'inactive' && !factory.latest_audit_score

// Draft card styling — gray border, faded
// Show "Draft" badge instead of status pill
// Show "Continue →" button in footer instead of orders info
```

**Draft card footer:**
```tsx
{isDraft ? (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    borderTop: '0.5px solid var(--color-border-tertiary)',
  }}>
    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
      Incomplete draft
    </span>
    <button
      onClick={() => router.push(`/factories/new?draftId=${factory.id}`)}
      style={{
        fontSize: '10px', padding: '3px 10px', borderRadius: '6px',
        background: '#FAEEDA', color: '#633806',
        border: '0.5px solid #C9A96E', cursor: 'pointer',
      }}>
      Continue →
    </button>
  </div>
) : (
  // Normal card footer
  <div>...</div>
)}
```

---

## STEP 5 — RESTORE FROM SUPABASE DRAFT

When `/factories/new?draftId=XXX` is opened:

```typescript
useEffect(() => {
  const draftId = searchParams.get('draftId')
  if (!draftId) return

  const loadDraft = async () => {
    const { data } = await supabase
      .from('factories')
      .select('*')
      .eq('id', draftId)
      .single()

    if (data) {
      setDraftId(data.id)
      setFormData({
        name: data.name || '',
        code: data.code || '',
        country: data.country || '',
        city: data.city || '',
        contactName: data.contact_name || '',
        contactEmail: data.contact_email || '',
        contactPhone: data.contact_phone || '',
        website: data.website || '',
        notes: data.notes || '',
        status: 'active',
        photoFile: null,
        photoPreview: data.photo_url || '',
        totalLines: data.total_lines?.toString() || '',
        maxCapacity: data.max_capacity?.toString() || '',
        categories: data.categories || [],
        certifications: data.certifications || [],
        aqlDefault: data.aql_default || '2.5',
        inspectionPreference: data.inspection_preference || 'final',
      })
    }
  }

  loadDraft()
}, [searchParams])
```

---

## STEP 6 — CLEAR DRAFT ON SUCCESSFUL SAVE

When factory is successfully saved (status = 'active'), clear all drafts:

```typescript
const handleSave = async () => {
  // ... save factory logic ...

  // On success — clear draft
  localStorage.removeItem('factory-wizard-draft')
  // Draft in Supabase is now the real factory (status updated to active)
  router.push('/factories')
}
```

---

## WHAT "MISSING FIELDS" SHOWS ON DRAFT CARD

Check which required fields are empty and show a hint:

```typescript
const getMissingFields = (factory: any): string => {
  const missing = []
  if (!factory.country) missing.push('country')
  if (!factory.contact_name) missing.push('contact name')
  if (!factory.contact_email) missing.push('contact email')
  if (!factory.total_lines) missing.push('production lines')
  if (missing.length === 0) return 'Review and confirm'
  return `Missing: ${missing.join(', ')}`
}

// Shows on draft card:
// "Missing: contact email, production lines"
```

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

npm run build 2>&1 | tail -20

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "feat: factory wizard auto-save draft — localStorage every 10s + Supabase draft record + restore from board"
  git push origin main
  echo "DEPLOYED"
else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error|×" | head -20
fi
```

---

## VERIFICATION CHECKLIST

- [ ] Form auto-saves to localStorage every 10 seconds while typing
- [ ] On page reload — amber banner appears: "Unsaved draft found — [factory name]"
- [ ] "Continue draft" → all fields restored, stepper on correct step
- [ ] "Start fresh" → clears localStorage, empty form
- [ ] Clicking Next between steps → saves draft to Supabase silently
- [ ] Closing the tab → saves draft to Supabase via beforeunload
- [ ] Factories board shows draft cards with gray border + "Draft" badge
- [ ] Draft card shows what fields are missing
- [ ] "Continue →" on draft card opens wizard with all fields pre-filled
- [ ] Successful save clears localStorage draft
- [ ] Draft save failures are completely silent — never shown to user

---

*SankalpHub V3 — Factory Wizard Auto-Save Draft*
*localStorage every 10s + Supabase draft record + restore from board*
*April 3, 2026*