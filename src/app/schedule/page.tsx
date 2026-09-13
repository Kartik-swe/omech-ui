import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Import the client component
const ScheduleClient = dynamic(() => import('./ScheduleClient'), { ssr: false })

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading schedule data...</div>}>
      <ScheduleClient />
    </Suspense>
  )
}
