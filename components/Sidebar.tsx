'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

const NAV = [
  { href: '/today', label: 'Today', dot: 'var(--mint)' },
  { href: '/finances', label: 'Finances', dot: 'var(--olive)' },
  { href: '/fitness', label: 'Fitness', dot: 'var(--red)' },
  { href: '/school', label: 'School', dot: 'var(--olive-deep)' },
  { href: '/self-growth', label: 'Self Growth', dot: 'var(--wine)' },
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
                <span className={styles.navDot} style={{ background: item.dot }} />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
