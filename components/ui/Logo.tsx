'use client'

import { useId, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  variant?: 'icon' | 'full'
  className?: string
}

export function Logo({ size = 32, variant = 'icon', className }: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted ? resolvedTheme === 'dark' : true
  const centerDot = isDark ? '#060810' : '#FAF9F7'
  const strokeOpacity = isDark ? 1 : 1.3 // slightly stronger on light

  const dG = `dG-${uid}`
  const nG = `nG-${uid}`
  const glow = `glow-${uid}`

  const icon = (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={variant === 'icon' ? className : undefined}
    >
      <defs>
        <linearGradient id={dG} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDD898" />
          <stop offset="100%" stopColor="#A87C30" />
        </linearGradient>
        <linearGradient id={nG} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A96E" />
          <stop offset="100%" stopColor="#8B6520" />
        </linearGradient>
        <filter id={glow}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="70" cy="70" rx="56" ry="20" fill="none" stroke="#C9A96E" strokeWidth="1" opacity={0.3 * strokeOpacity} transform="rotate(-40 70 70)" />
      <ellipse cx="70" cy="70" rx="56" ry="20" fill="none" stroke="#C9A96E" strokeWidth="1" opacity={0.45 * strokeOpacity} transform="rotate(20 70 70)" />
      <polygon points="70,14 116,70 70,122 24,70" fill="none" stroke={`url(#${dG})`} strokeWidth="1.2" opacity={0.5 * strokeOpacity} />
      <polygon points="70,28 102,70 70,108 38,70" fill="none" stroke={`url(#${dG})`} strokeWidth="1.1" opacity={0.85 * strokeOpacity} />
      <polygon points="70,44 96,70 70,94 44,70" fill="none" stroke={`url(#${dG})`} strokeWidth="1.8" />
      <circle cx="70" cy="10" r="4" fill={`url(#${nG})`} filter={`url(#${glow})`} />
      <circle cx="120" cy="88" r="3" fill={`url(#${nG})`} opacity="0.6" />
      <circle cx="20" cy="88" r="3" fill={`url(#${nG})`} opacity="0.6" />
      <line x1="70" y1="10" x2="70" y2="44" stroke="#C9A96E" strokeWidth="0.6" opacity="0.3" />
      <circle cx="70" cy="70" r="12" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.4" />
      <circle cx="70" cy="70" r="6.5" fill={`url(#${dG})`} filter={`url(#${glow})`} />
      <circle cx="70" cy="70" r="2.8" fill={centerDot} />
    </svg>
  )

  if (variant === 'icon') return icon

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {icon}
      <span className="font-bold text-base tracking-tight text-foreground">
        Sankalp<span className="text-primary">Hub</span>
      </span>
    </div>
  )
}
