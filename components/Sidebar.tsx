'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

const NAV = [
  {
    href: '/today',
    label: 'Today',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
      </svg>
    ),
  },
  {
    href: '/trading',
    label: 'Trading',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 17 9 11 13 15 21 6" />
        <polyline points="14 6 21 6 21 13" />
      </svg>
    ),
  },
  {
    href: '/fitness',
    label: 'Fitness',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5 17.5 17.5" />
        <path d="M2 8l3-3 3 3-3 3-3-3Z" />
        <path d="M16 16l3-3 3 3-3 3-3-3Z" />
        <path d="M9 9l1.5-1.5M13.5 13.5 15 12" />
      </svg>
    ),
  },
]

export default function Sidebar({ name }: { name?: string | null }) {
  const pathname = usePathname()

  return (
    <nav className={styles.sidebar} aria-label="Main">
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        <span className={styles.brandName}>{name ? `${name}'s board` : 'Dashboard'}</span>
      </div>
      <ul className={styles.navList}>
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <li key={item.href}>
              <Link href={item.href} className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
