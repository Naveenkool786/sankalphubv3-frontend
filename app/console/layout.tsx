import { getConsoleContext } from '@/lib/console/getConsoleContext'
import { ConsoleShell } from '@/components/console/ConsoleShell'

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getConsoleContext()

  return (
    <ConsoleShell fullName={ctx.fullName} email={ctx.email}>
      {children}
    </ConsoleShell>
  )
}
