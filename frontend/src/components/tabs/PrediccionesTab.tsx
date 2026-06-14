import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { toast } from 'sonner'

import type { AppData, Match, UserId } from '@/types'
import { savePrediction } from '@/api'
import { calcMatchPoints } from '@/lib/scoring'
import { Flag } from '@/components/Flag'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PrediccionesTabProps = {
  data: AppData
  selectedUser: UserId
  onRefetch: () => void | Promise<void>
}

const STAGE_LABEL: Record<Match['stage'], string> = {
  groups: 'Grupos',
  round16: 'Octavos',
  quarters: 'Cuartos',
  semis: 'Semis',
  final: 'Final',
}

function groupHeading(match: Match): string {
  if (match.stage === 'groups' && match.group) return `Grupo ${match.group}`
  return STAGE_LABEL[match.stage]
}

export function PrediccionesTab({ data, selectedUser, onRefetch }: PrediccionesTabProps) {
  const userPreds = data.predictions[selectedUser] ?? {}

  if (data.matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <ClipboardList className="size-10 text-[var(--color-muted)]" aria-hidden="true" />
        <p className="text-sm text-[var(--color-muted)]">
          No hay partidos cargados. Agregá uno desde Admin.
        </p>
      </div>
    )
  }

  // Group by date, preserving order.
  const byDate = new Map<string, Match[]>()
  for (const match of data.matches) {
    const list = byDate.get(match.date) ?? []
    list.push(match)
    byDate.set(match.date, list)
  }

  return (
    <div className="py-4">
      {[...byDate.entries()].map(([date, matches]) => (
        <section key={date} className="mb-2">
          <h2 className="sticky top-0 z-10 bg-[var(--color-background)] py-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {date}
          </h2>
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={userPreds[match.id]}
              selectedUser={selectedUser}
              onRefetch={onRefetch}
            />
          ))}
        </section>
      ))}
    </div>
  )
}

type MatchCardProps = {
  match: Match
  prediction?: { score1: number; score2: number }
  selectedUser: UserId
  onRefetch: () => void | Promise<void>
}

function MatchCard({ match, prediction, selectedUser, onRefetch }: MatchCardProps) {
  const [s1, setS1] = useState<string>(prediction ? String(prediction.score1) : '')
  const [s2, setS2] = useState<string>(prediction ? String(prediction.score2) : '')
  const [saving, setSaving] = useState(false)

  const hasResult = match.score1 !== null && match.score2 !== null

  async function handleSave() {
    const n1 = Number(s1)
    const n2 = Number(s2)
    if (s1 === '' || s2 === '' || Number.isNaN(n1) || Number.isNaN(n2) || n1 < 0 || n2 < 0) {
      toast.error('Ingresá un marcador válido')
      return
    }
    setSaving(true)
    try {
      await savePrediction(selectedUser, match.id, n1, n2)
      await onRefetch()
      toast.success('✅ Predicción guardada')
    } catch (err) {
      const status = (err as { status?: number }).status
      if (status === 409) {
        toast.error('🔒 Partido cerrado')
      } else {
        toast.error('❌ Error al guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  // Bottom status row.
  let statusNode: React.ReactNode = null
  if (hasResult && prediction) {
    const { points, type } = calcMatchPoints(prediction, {
      score1: match.score1 as number,
      score2: match.score2 as number,
    })
    const map = {
      exact: {
        label: 'Marcador exacto',
        color: 'text-[var(--color-exact)]',
        pts: '+3 pts',
      },
      outcome: {
        label: 'Resultado correcto',
        color: 'text-[var(--color-success)]',
        pts: '+1 pt',
      },
      miss: { label: 'Sin puntos', color: 'text-[var(--color-danger)]', pts: '+0 pts' },
      pending: { label: '', color: '', pts: '' },
    } as const
    const info = map[type === 'pending' ? 'miss' : type]
    statusNode = (
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
        <span className={`text-xs font-medium ${info.color}`}>{info.label}</span>
        <span className={`text-sm font-bold ${info.color}`}>
          {points === 3 ? '+3 pts' : points === 1 ? '+1 pt' : '+0 pts'}
        </span>
      </div>
    )
  } else if (prediction) {
    statusNode = (
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
        <span className="text-xs font-medium text-[var(--color-muted)]">
          Predicción guardada
        </span>
        <span className="text-sm font-medium text-[var(--color-muted)]">
          {prediction.score1} – {prediction.score2}
        </span>
      </div>
    )
  }

  return (
    <div className="mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted)]">
          {groupHeading(match)} · {match.date}
          {match.time ? ` · ${match.time}` : ''}
        </span>
        {match.locked && (
          <Badge className="bg-[var(--color-accent)] text-[var(--color-primary-foreground)]">
            Cerrado
          </Badge>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-1 text-center">
          <Flag code={match.flag1} />
          <span className="text-sm font-medium text-[var(--color-text)]">{match.team1}</span>
        </div>

        {/* Center */}
        <div className="flex min-w-[120px] flex-col items-center gap-2">
          {hasResult && (
            <span className="rounded-md bg-[var(--color-surface)] px-3 py-1 text-sm font-bold text-[var(--color-text)]">
              {match.score1} – {match.score2}
            </span>
          )}

          {match.locked ? (
            <span
              className={
                prediction
                  ? 'text-lg font-bold text-[var(--color-exact)]'
                  : 'text-lg font-bold text-[var(--color-muted)]'
              }
            >
              {prediction ? `${prediction.score1} – ${prediction.score2}` : '–'}
            </span>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={20}
                  inputMode="numeric"
                  aria-label={`Goles ${match.team1}`}
                  value={s1}
                  onChange={(e) => setS1(e.target.value)}
                  className="w-12 px-1 text-center font-bold text-[var(--color-exact)]"
                />
                <span className="font-bold text-[var(--color-muted)]">–</span>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  inputMode="numeric"
                  aria-label={`Goles ${match.team2}`}
                  value={s2}
                  onChange={(e) => setS2(e.target.value)}
                  className="w-12 px-1 text-center font-bold text-[var(--color-exact)]"
                />
              </div>
              <Button
                size="sm"
                className="w-full"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-1 text-center">
          <Flag code={match.flag2} />
          <span className="text-sm font-medium text-[var(--color-text)]">{match.team2}</span>
        </div>
      </div>

      {statusNode}
    </div>
  )
}
