import Sidebar from '@/components/Sidebar'
import { site } from '@/content/site'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar name={site.name || null} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}
