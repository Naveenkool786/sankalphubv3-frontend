import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — SankalpHub',
  description: 'Privacy Policy for SankalpHub — Production Intelligence Platform',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Effective Date: 1 April 2026 &middot; Last Updated: 1 April 2026
      </p>
      <hr className="my-6 border-border" />

      {/* 1 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">1. Who We Are</h2>
        <p className="text-muted-foreground leading-relaxed">
          SankalpHub (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a B2B SaaS
          platform for quality inspection and manufacturing workflow management, operated by
          SankalpHub (Hapur, Uttar Pradesh, India). Accessible at{' '}
          <a href="https://sankalphub.in" className="text-primary underline">sankalphub.in</a>.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-2">
          Contact:{' '}
          <a href="mailto:info@sankalphub.in" className="text-primary underline">info@sankalphub.in</a>
        </p>
      </section>

      {/* 2 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">2. Who This Policy Applies To</h2>
        <p className="text-muted-foreground leading-relaxed">This policy applies to all users including:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground leading-relaxed">
          <li>Brand managers and buyers</li>
          <li>Factory managers and manufacturers</li>
          <li>Third-party inspection agencies and inspectors</li>
          <li>Viewers and team members within an organisation</li>
        </ul>
      </section>

      {/* 3 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">3. What Data We Collect</h2>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">3.1 Account &amp; Identity Data</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Full name</li>
          <li>Work email address</li>
          <li>Password (hashed — never stored as plain text)</li>
          <li>Phone number (optional)</li>
          <li>Profile photo (optional)</li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">3.2 Organisation Data</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Organisation name and type (Brand / Factory / Agency)</li>
          <li>Country and city</li>
          <li>Product categories</li>
          <li>Team members and assigned roles</li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">3.3 Platform Usage Data</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Projects, factories, inspections, reports, templates</li>
          <li>Defect logs and inspection photos</li>
          <li>Activity logs within your organisation</li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">3.4 Technical Data</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>IP address, browser type, device type, OS</li>
          <li>Pages visited, time spent, error logs</li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">3.5 Communication Data</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Demo request submissions</li>
          <li>Support emails to info@sankalphub.in</li>
        </ul>
      </section>

      {/* 4 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">4. How We Use Your Data</h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-card">
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Purpose</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Legal Basis</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border"><td className="px-4 py-2.5">Creating and managing your account</td><td className="px-4 py-2.5">Contract performance</td></tr>
              <tr className="border-b border-border bg-card/40"><td className="px-4 py-2.5">Delivering platform features</td><td className="px-4 py-2.5">Contract performance</td></tr>
              <tr className="border-b border-border"><td className="px-4 py-2.5">Sending transactional emails</td><td className="px-4 py-2.5">Contract performance</td></tr>
              <tr className="border-b border-border bg-card/40"><td className="px-4 py-2.5">Improving platform and fixing bugs</td><td className="px-4 py-2.5">Legitimate interest</td></tr>
              <tr className="border-b border-border"><td className="px-4 py-2.5">Responding to support requests</td><td className="px-4 py-2.5">Legitimate interest</td></tr>
              <tr className="border-b border-border bg-card/40"><td className="px-4 py-2.5">Complying with legal obligations</td><td className="px-4 py-2.5">Legal obligation</td></tr>
              <tr><td className="px-4 py-2.5">Sending product updates (opt-out available)</td><td className="px-4 py-2.5">Legitimate interest</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground leading-relaxed mt-4">
          We do <strong className="text-foreground">NOT</strong> use your data for advertising.<br />
          We do <strong className="text-foreground">NOT</strong> sell your data to third parties.
        </p>
      </section>

      {/* 5 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">5. Data Storage &amp; Security</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>All data stored on Supabase (SOC 2 Type II certified)</li>
          <li>Row-level security ensures each organisation sees only its own data</li>
          <li>All data in transit encrypted using TLS 1.2 or higher</li>
          <li>Passwords hashed — never stored in plain text</li>
          <li>Access to production data restricted to authorised personnel only</li>
        </ul>
      </section>

      {/* 6 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">6. Multi-Tenant Data Separation</h2>
        <p className="text-muted-foreground leading-relaxed">Each organisation&apos;s data is:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground leading-relaxed">
          <li>Logically separated at database level using row-level security</li>
          <li>Never visible to other organisations</li>
          <li>Accessible only to authenticated users within your organisation</li>
        </ul>
      </section>

      {/* 7 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">7. Who We Share Data With</h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-card">
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Provider</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border"><td className="px-4 py-2.5">Supabase</td><td className="px-4 py-2.5">Database and authentication</td></tr>
              <tr className="border-b border-border bg-card/40"><td className="px-4 py-2.5">Vercel</td><td className="px-4 py-2.5">Frontend hosting</td></tr>
              <tr className="border-b border-border"><td className="px-4 py-2.5">Resend</td><td className="px-4 py-2.5">Transactional email delivery</td></tr>
              <tr><td className="px-4 py-2.5">Razorpay</td><td className="px-4 py-2.5">Payment processing</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground leading-relaxed mt-4">
          No other sharing without explicit consent, except where required by law.
        </p>
      </section>

      {/* 8 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">8. Data Retention</h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-card">
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Data Type</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Retention Period</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border"><td className="px-4 py-2.5">Active account data</td><td className="px-4 py-2.5">While account is active</td></tr>
              <tr className="border-b border-border bg-card/40"><td className="px-4 py-2.5">Inspection records and reports</td><td className="px-4 py-2.5">Duration of subscription</td></tr>
              <tr className="border-b border-border"><td className="px-4 py-2.5">Deleted account data</td><td className="px-4 py-2.5">Permanently deleted within 30 days</td></tr>
              <tr className="border-b border-border bg-card/40"><td className="px-4 py-2.5">Billing records</td><td className="px-4 py-2.5">7 years (legal requirement)</td></tr>
              <tr><td className="px-4 py-2.5">Server logs</td><td className="px-4 py-2.5">90 days</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 9 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">9. Your Rights</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li><strong className="text-foreground">Access</strong> — Request a copy of your data</li>
          <li><strong className="text-foreground">Correction</strong> — Request correction of inaccurate data</li>
          <li><strong className="text-foreground">Deletion</strong> — Request deletion of your account and data</li>
          <li><strong className="text-foreground">Portability</strong> — Request data export in machine-readable format</li>
          <li><strong className="text-foreground">Objection</strong> — Object to certain types of processing</li>
          <li><strong className="text-foreground">Withdrawal</strong> — Withdraw consent for optional data uses</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-4">
          Email{' '}
          <a href="mailto:info@sankalphub.in" className="text-primary underline">info@sankalphub.in</a>{' '}
          to exercise any right. We respond within 30 days.
        </p>
      </section>

      {/* 10 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">10. Cookies</h2>
        <p className="text-muted-foreground leading-relaxed">
          SankalpHub uses only essential cookies for authentication and session management.
          No advertising or third-party tracking cookies.
        </p>
      </section>

      {/* 11 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">11. International Data Transfers</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your data may be processed in countries outside your own.
          Appropriate safeguards including contractual protections are in place.
        </p>
      </section>

      {/* 12 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">12. Children&apos;s Privacy</h2>
        <p className="text-muted-foreground leading-relaxed">
          SankalpHub is for business use by professionals.
          We do not knowingly collect data from individuals under 18.
          Contact{' '}
          <a href="mailto:info@sankalphub.in" className="text-primary underline">info@sankalphub.in</a>{' '}
          if you believe a minor has provided data.
        </p>
      </section>

      {/* 13 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">13. Changes to This Policy</h2>
        <p className="text-muted-foreground leading-relaxed">
          We update the &ldquo;Last Updated&rdquo; date when changes are made.
          For significant changes, account administrators will be notified by email.
          Continued use after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      {/* 14 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">14. Contact Us</h2>
        <p className="text-muted-foreground leading-relaxed">
          Email:{' '}
          <a href="mailto:info@sankalphub.in" className="text-primary underline">info@sankalphub.in</a>
        </p>
        <p className="text-muted-foreground leading-relaxed mt-1">
          Address: SankalpHub, Hapur, Uttar Pradesh, India
        </p>
      </section>

      <hr className="my-10 border-border" />
      <Link href="/" className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">
        &larr; Back to home
      </Link>
    </main>
  )
}
