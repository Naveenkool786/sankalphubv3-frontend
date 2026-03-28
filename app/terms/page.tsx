import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — SankalpHub',
}

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-muted-foreground">
        This page is being updated. For any queries related to our terms,
        please contact us at{' '}
        <a
          href="mailto:hello@sankalphub.in"
          className="text-primary underline"
        >
          hello@sankalphub.in
        </a>
        .
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to home
      </Link>
    </main>
  )
}
