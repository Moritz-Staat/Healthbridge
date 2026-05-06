import { auth } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import { AwardBonusForm } from '@/components/insurance/AwardBonusForm'

export default async function BonusPage() {
  const session = await auth()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Bonus-Verwaltung</h1>
      <Card title="Bonuspunkte manuell vergeben">
        <AwardBonusForm token={session!.user.accessToken} />
      </Card>
    </div>
  )
}
