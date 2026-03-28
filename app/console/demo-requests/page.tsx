import { Inbox } from 'lucide-react'
import { getAllDemoRequests } from '@/lib/console/queries'
import { DemoRequestsClient } from './_components/DemoRequestsClient'

export default async function DemoRequestsPage() {
  const requests = await getAllDemoRequests()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Inbox className="w-6 h-6" style={{ color: '#C9A96E' }} />
          Demo Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage all demo request submissions from the website.
        </p>
      </div>
      <DemoRequestsClient requests={requests} />
    </div>
  )
}
