import { Zap } from 'lucide-react'
import { AutomationsClient } from './_components/AutomationsClient'

export default function AutomationsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6" style={{ color: '#C9A96E' }} />
          Automations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure automated emails, follow-up sequences, and organization management rules.
        </p>
      </div>
      <AutomationsClient />
    </div>
  )
}
