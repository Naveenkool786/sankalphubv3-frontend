# SankalphHub — Codebase Audit & Structure Extraction
## Claude Code Prompt — Run This BEFORE Implementing Any New Steps

## PURPOSE
Extract the complete structure, patterns, and conventions of the existing SankalphHub codebase (Steps 1-11) so that all new implementations (Steps 12-17, UI Redesign, Factory Audit, Merchandising) follow the EXACT same patterns.

## INSTRUCTIONS
Go through each section below methodically. For each one, read the relevant files, extract the information, and output a structured report. Save the final report as `CODEBASE_AUDIT_REPORT.md` in the project root.

---

## SECTION A: PROJECT STRUCTURE

1. Run `find . -type f -name "*.ts" -o -name "*.tsx" | head -200` to get the file tree
2. Run `ls -la app/` and recursively list the app directory structure
3. Run `cat package.json` to get all dependencies and versions
4. Run `cat tsconfig.json` to get TypeScript config
5. Run `cat next.config.*` to get Next.js configuration
6. Run `cat tailwind.config.*` to get Tailwind configuration

**Output for this section:**
- Complete app/ directory tree (every file and folder)
- Complete components/ directory tree
- Complete lib/ directory tree
- All npm dependencies with versions
- Any environment variable names used (check .env.example or .env.local — DO NOT output values, just variable names)

---

## SECTION B: SUPABASE SCHEMA (CRITICAL)

Run these queries against the Supabase database. Check for a Supabase client file first:

1. Find the Supabase client setup:
   ```
   grep -r "createClient" --include="*.ts" --include="*.tsx" -l
   ```

2. Look for any schema/migration files:
   ```
   find . -path "*/migrations/*" -o -path "*/schema/*" -o -name "*.sql" | head -50
   ```

3. Check if there's a generated types file from Supabase:
   ```
   find . -name "database.types.ts" -o -name "supabase.types.ts" -o -name "types.ts" -path "*/supabase/*"
   ```
   If found, read it — this has the COMPLETE schema.

4. If no types file, check the Supabase dashboard or look for table references:
   ```
   grep -r "from(" --include="*.ts" --include="*.tsx" | grep -oP "from\(['\"](\w+)['\"]\)" | sort -u
   ```

**Output for this section:**
- Every table name in the database
- Every column for each table (name, type, constraints)
- All foreign key relationships
- All RLS policies (if visible in code)
- The Supabase client setup pattern (server vs client, how auth is handled)

---

## SECTION C: AUTHENTICATION & AUTHORIZATION

1. Find auth-related files:
   ```
   find . -path "*/auth/*" -o -name "*auth*" | head -30
   grep -r "getUser\|getSession\|signIn\|signOut\|signUp" --include="*.ts" --include="*.tsx" -l
   ```

2. Find role/permission logic:
   ```
   grep -r "role\|permission\|isAdmin\|isSuperAdmin\|canEdit\|canView" --include="*.ts" --include="*.tsx" -l
   ```

3. Read the auth middleware or layout protection:
   ```
   cat app/middleware.ts (if exists)
   cat app/(dashboard)/layout.tsx
   ```

**Output for this section:**
- How authentication is set up (Supabase Auth method: email/password, magic link, OAuth?)
- How sessions are managed (cookies, tokens?)
- The role system: what roles exist, how are they stored, how are they checked
- How pages are protected (middleware, layout checks, server-side?)
- The user profile table structure

---

## SECTION D: STEP-BY-STEP MODULE DETAILS

For EACH of the following steps, read all relevant files and document:

### Step 1: Platform Setup & Configuration
- What settings exist?
- How is the settings page structured?
- What configuration options are available?

### Step 2: User Authentication & Role Management
- Login/signup pages and flows
- Role assignment UI
- User management page (if exists)
- Team/organization structure (if exists)

### Step 3: Dashboard / Home
- Current dashboard page location and structure
- What widgets/cards are shown
- What data is fetched
- Any charts or visualizations

### Step 4: Project Creation & Management
- Project creation form (all fields)
- Project list page
- Project detail page
- Server actions for project CRUD
- Zod validation schemas for projects
- The `projects` table schema (CRITICAL — this is where Bug #1 lives)

### Step 5: Factory Management
- Factory creation and list
- Factory detail page
- The `factories` table schema
- How factories link to projects

### Step 6: Inspection Management
- Inspection creation flow
- Inspection types available
- The inspection form
- How inspections link to projects/factories
- AQL (Acceptable Quality Level) settings

### Step 7: Defect Tracking
- How defects are logged
- Defect categories and types
- Photo upload for defects
- Defect severity levels

### Step 8: Reports & Analytics
- What reports are available
- Chart types used (Recharts components)
- PDF/Excel export implementation
- Data aggregation queries

### Step 9: Notifications & Alerts
- Notification system (Sonner toasts? In-app? Email?)
- What events trigger notifications
- How notifications are stored/displayed

### Step 10: Settings & Configuration
- Settings page structure
- What is configurable
- Role-based visibility (what can non-admins see?)

### Step 11: PremiumHub / Billing
- Pricing tiers and structure
- Feature flags or subscription checks
- How paid features are gated
- Stripe/payment integration (if any)

**For EACH step, document:**
```
## Step X: [Name]

### Files
- app/(dashboard)/[path]/page.tsx
- app/(dashboard)/[path]/[id]/page.tsx
- components/[name]/*.tsx
- lib/actions/[name].ts
- lib/validations/[name].ts
- lib/types/[name].ts

### Database Tables
- Table name: columns list

### Server Actions
- Function names and what they do

### Zod Schemas
- Schema names and their fields

### UI Components
- Component names and their props

### Patterns Used
- Form handling pattern
- Data fetching pattern
- Error handling pattern
- Loading state pattern
- Toast notification pattern
```

---

## SECTION E: SHARED PATTERNS & CONVENTIONS

1. **Form pattern:** How are forms built? Read 2-3 form components and document the pattern.
   ```
   grep -r "useForm\|zodResolver" --include="*.tsx" -l | head -5
   ```

2. **Server action pattern:** How are server actions structured?
   ```
   find . -path "*/actions/*" -name "*.ts" | head -10
   ```
   Read 2-3 of these files.

3. **Data fetching pattern:** How do pages fetch data? Server components? Client components with useEffect?

4. **Error handling:** How are errors caught and displayed?

5. **Loading states:** Suspense? Loading.tsx files? Skeleton components?

6. **Toast pattern:** How is Sonner used? Read a few examples.

7. **Table/list pattern:** How are data tables built? shadcn DataTable? Custom?

8. **Modal/dialog pattern:** How are dialogs used for create/edit?

9. **File upload pattern:** How are images/files uploaded to Supabase Storage?

10. **Navigation pattern:** How is the sidebar structured? What's the nav config?

**Output for each pattern:**
- The exact code pattern with a real example
- File where this pattern is used
- Any helper functions involved

---

## SECTION F: STYLING & DESIGN SYSTEM

1. Read the global CSS:
   ```
   cat app/globals.css
   ```

2. Check for custom theme tokens:
   ```
   grep -r "GOLD\|D4A843\|1A1A2E" --include="*.css" --include="*.tsx" --include="*.ts" -l
   ```

3. Check the shadcn/ui configuration:
   ```
   cat components.json (if exists)
   cat lib/utils.ts (if exists — usually has cn() helper)
   ```

4. List all shadcn/ui components installed:
   ```
   ls components/ui/
   ```

**Output:**
- All CSS custom properties / design tokens
- shadcn/ui components available
- Any custom component library patterns
- How brand colors are applied

---

## SECTION G: API ROUTES & MIDDLEWARE

1. Find all API routes:
   ```
   find . -path "*/api/*" -name "*.ts" -o -path "*/api/*" -name "*.tsx" | head -20
   ```

2. Check middleware:
   ```
   cat middleware.ts (if exists at project root)
   ```

3. Check for any webhook endpoints or external integrations

**Output:**
- All API route paths and their purpose
- Middleware logic
- External service integrations (Anthropic, Resend, Stripe, etc.)

---

## SECTION H: DEPLOYMENT & ENVIRONMENT

1. Check Vercel configuration:
   ```
   cat vercel.json (if exists)
   ```

2. Check environment variables needed:
   ```
   grep -r "process.env\." --include="*.ts" --include="*.tsx" | grep -oP "process\.env\.(\w+)" | sort -u
   ```

**Output:**
- All environment variable names (NOT values)
- Deployment configuration
- Any build scripts or custom configurations

---

## FINAL OUTPUT

Save everything as `CODEBASE_AUDIT_REPORT.md` in the project root with this structure:

```markdown
# SankalphHub Codebase Audit Report
Generated: [date]

## A. Project Structure
[output]

## B. Database Schema
[output]

## C. Authentication & Authorization
[output]

## D. Module Details (Steps 1-11)
### Step 1: ...
### Step 2: ...
[etc.]

## E. Shared Patterns
[output]

## F. Design System
[output]

## G. API Routes
[output]

## H. Environment
[output]
```

This report will be used as the reference for all new module implementations. It MUST be accurate and complete.
