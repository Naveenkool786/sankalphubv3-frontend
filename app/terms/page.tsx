import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — SankalpHub',
  description: 'Terms of Service for SankalpHub — Production Intelligence Platform',
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Effective Date: 1 April 2026 &middot; Last Updated: 1 April 2026
      </p>
      <hr className="my-6 border-border" />

      {/* 1 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">1. About SankalpHub</h2>
        <p className="text-muted-foreground leading-relaxed">
          SankalpHub (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;, &ldquo;the
          platform&rdquo;) is a B2B SaaS platform for quality inspection and manufacturing
          workflow management, operated by SankalpHub (Hapur, Uttar Pradesh, India),
          accessible at{' '}
          <a href="https://sankalphub.in" className="text-primary underline">sankalphub.in</a>.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-3">
          By creating an account or using the platform, you agree to these Terms of Service.
          If using on behalf of an organisation, you confirm authority to bind that organisation.
        </p>
      </section>

      {/* 2 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">2. Definitions</h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-card">
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Term</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border"><td className="px-4 py-2.5">Platform</td><td className="px-4 py-2.5">SankalpHub web app and all services at sankalphub.in</td></tr>
              <tr className="border-b border-border bg-card/40"><td className="px-4 py-2.5">Organisation</td><td className="px-4 py-2.5">A Brand, Factory, or Inspection Agency account</td></tr>
              <tr className="border-b border-border"><td className="px-4 py-2.5">User</td><td className="px-4 py-2.5">An individual with a seat inside an Organisation</td></tr>
              <tr className="border-b border-border bg-card/40"><td className="px-4 py-2.5">Subscription</td><td className="px-4 py-2.5">A paid or free plan granting platform access</td></tr>
              <tr className="border-b border-border"><td className="px-4 py-2.5">Content</td><td className="px-4 py-2.5">Data, reports, templates, and files created by users</td></tr>
              <tr><td className="px-4 py-2.5">Founding Member</td><td className="px-4 py-2.5">An early-access organisation on a founding plan</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">3. Eligibility</h2>
        <p className="text-muted-foreground leading-relaxed">To use SankalpHub you must:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground leading-relaxed">
          <li>Be at least 18 years of age</li>
          <li>Have legal capacity to enter a binding agreement</li>
          <li>Use the platform for legitimate business purposes</li>
          <li>Not be in a country subject to applicable trade sanctions</li>
        </ul>
      </section>

      {/* 4 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">4. Account Registration</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Provide accurate and complete information</li>
          <li>Maintain security of your login credentials</li>
          <li>
            Notify{' '}
            <a href="mailto:info@sankalphub.in" className="text-primary underline">info@sankalphub.in</a>{' '}
            immediately if unauthorised access is suspected
          </li>
          <li>One account per person — no credential sharing</li>
          <li>We may suspend accounts that violate these terms</li>
        </ul>
      </section>

      {/* 5 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">5. Subscriptions and Plans</h2>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">5.1 Available Plans</h3>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-card">
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Plan</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border"><td className="px-4 py-2.5">Free</td><td className="px-4 py-2.5">5 users &middot; 10 inspections/month &middot; 5 projects &middot; 3 AI generations/month</td></tr>
              <tr className="border-b border-border bg-card/40"><td className="px-4 py-2.5">Pro</td><td className="px-4 py-2.5">$29/month &middot; unlimited inspections &middot; unlimited projects &middot; unlimited AI</td></tr>
              <tr className="border-b border-border"><td className="px-4 py-2.5">Enterprise</td><td className="px-4 py-2.5">Custom &middot; unlimited users &middot; white-label &middot; SSO &middot; API access</td></tr>
              <tr><td className="px-4 py-2.5">Founding Member</td><td className="px-4 py-2.5">Special early-access lifetime pricing for founding partners</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">5.2 Billing</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Billed monthly or annually depending on plan</li>
          <li>Payments processed via Razorpay</li>
          <li>Prices in USD unless stated otherwise</li>
          <li>Taxes may apply depending on location</li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">5.3 Cancellation</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Cancel anytime from billing settings</li>
          <li>Takes effect at end of current billing period</li>
          <li>No refunds for partial periods except where required by law</li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">5.4 Plan Changes</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Upgrade anytime — new rate applies immediately</li>
          <li>Downgrade takes effect at start of next billing period</li>
          <li>Excess data restricted but not deleted on downgrade</li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">5.5 Free Trial</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>21-day full-access trial for new accounts</li>
          <li>No credit card required</li>
          <li>Reverts to Free plan after trial unless paid plan selected</li>
        </ul>
      </section>

      {/* 6 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">6. Acceptable Use</h2>
        <p className="text-muted-foreground leading-relaxed">You must not:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground leading-relaxed">
          <li>Store, transmit, or process unlawful content</li>
          <li>Attempt unauthorised access to another organisation&apos;s data</li>
          <li>Reverse engineer or extract source code</li>
          <li>Use bots or scrapers to extract data</li>
          <li>Impersonate another user, organisation, or company</li>
          <li>Upload content infringing third-party IP rights</li>
          <li>Attempt to circumvent security or access controls</li>
          <li>Resell or sublicense platform access without written permission</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-3">
          Violation may result in immediate account suspension without refund.
        </p>
      </section>

      {/* 7 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">7. Your Content</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>You retain full ownership of all content you create</li>
          <li>
            You grant SankalpHub a limited licence to store and process your content solely
            for delivering the platform&apos;s services
          </li>
          <li>We do not claim ownership of your content</li>
          <li>We will not use it for any purpose beyond operating the platform</li>
        </ul>
      </section>

      {/* 8 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">8. Data and Privacy</h2>
        <p className="text-muted-foreground leading-relaxed">
          Governed by our Privacy Policy at{' '}
          <Link href="/privacy" className="text-primary underline">sankalphub.in/privacy</Link>.
        </p>
      </section>

      {/* 9 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">9. Intellectual Property</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>SankalpHub platform, design, code, and branding are owned by SankalpHub</li>
          <li>&ldquo;SankalpHub&rdquo; and &ldquo;Production Intelligence Platform&rdquo; are our property</li>
          <li>Nothing in these terms transfers IP rights to you</li>
          <li>Do not use our name or logo without prior written consent</li>
        </ul>
      </section>

      {/* 10 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">10. Availability and Uptime</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>We aim for 24/7 availability but do not guarantee uninterrupted access</li>
          <li>Scheduled maintenance communicated in advance where possible</li>
          <li>Enterprise SLA: 99.9% uptime as specified in agreement</li>
          <li>Not liable for downtime caused by Supabase, Vercel, or force majeure</li>
        </ul>
      </section>

      {/* 11 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">11. Limitation of Liability</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Platform provided &ldquo;as is&rdquo; without warranties</li>
          <li>Not liable for indirect, incidental, or consequential damages</li>
          <li>Total liability capped at amounts paid in the 3 months preceding the claim</li>
        </ul>
      </section>

      {/* 12 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">12. Indemnification</h2>
        <p className="text-muted-foreground leading-relaxed">You agree to indemnify SankalpHub from claims arising from:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground leading-relaxed">
          <li>Your violation of these Terms of Service</li>
          <li>Your use of the platform outside permitted scope</li>
          <li>Content you submit that infringes third-party rights</li>
          <li>Your violation of applicable law</li>
        </ul>
      </section>

      {/* 13 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">13. Termination</h2>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">13.1 By You</h3>
        <p className="text-muted-foreground leading-relaxed">
          Close account anytime via{' '}
          <a href="mailto:info@sankalphub.in" className="text-primary underline">info@sankalphub.in</a>{' '}
          or account settings.
        </p>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">13.2 By Us</h3>
        <p className="text-muted-foreground leading-relaxed">We may suspend or terminate if:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground leading-relaxed">
          <li>You violate these Terms</li>
          <li>Payment fails and is unresolved within 14 days</li>
          <li>Required by law</li>
          <li>We discontinue the platform (30 days&apos; notice)</li>
        </ul>

        <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">13.3 Effect of Termination</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Access ceases immediately</li>
          <li>Content retained 30 days then permanently deleted</li>
          <li>
            Request data export before deletion via{' '}
            <a href="mailto:info@sankalphub.in" className="text-primary underline">info@sankalphub.in</a>
          </li>
        </ul>
      </section>

      {/* 14 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">14. Changes to These Terms</h2>
        <p className="text-muted-foreground leading-relaxed">
          Account administrators notified by email at least 14 days before material changes.
          Continued use after effective date constitutes acceptance of updated terms.
        </p>
      </section>

      {/* 15 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">15. Governing Law and Disputes</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">
          <li>Governed by the laws of India</li>
          <li>Exclusive jurisdiction: courts of Uttar Pradesh, India</li>
          <li>
            Contact{' '}
            <a href="mailto:info@sankalphub.in" className="text-primary underline">info@sankalphub.in</a>{' '}
            before formal dispute — most issues resolved quickly
          </li>
        </ul>
      </section>

      {/* 16 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">16. Entire Agreement</h2>
        <p className="text-muted-foreground leading-relaxed">
          These Terms of Service together with our{' '}
          <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>{' '}
          constitute the entire agreement between you and SankalpHub regarding use of the platform.
        </p>
      </section>

      {/* 17 */}
      <section>
        <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground">17. Contact</h2>
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
