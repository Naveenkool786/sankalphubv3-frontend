'use client'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  href: string
  label: string
}

export function BackButton({ href, label }: BackButtonProps) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 14px', borderRadius: '8px',
        border: '0.5px solid var(--border)',
        background: 'var(--background)',
        color: 'var(--muted-foreground)',
        fontSize: '12px', fontWeight: 500,
        cursor: 'pointer', marginBottom: '16px',
        transition: 'border-color .15s, color .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#C9A96E'
        e.currentTarget.style.color = '#BA7517'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--muted-foreground)'
      }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      {label}
    </button>
  )
}
