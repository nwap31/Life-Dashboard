import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard · Vitality',
}

// Home just routes into the sidebar app — Today is the default landing section.
export default function Page() {
  redirect('/today')
}
