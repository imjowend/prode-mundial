import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { toast } from 'sonner'

import type { AppData, Match, Outcome90, Prediction, PredictionType, Qualifier, UserId } from '@/types'
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
  round32: 'Dieciseisavos',
  round16: 'Octavos',
  quarters: 'Cuartos',
  semis: 'Semis',
  third_place: '3º Puesto',
  final: 'Final',
}

function groupHeading(match: Match): string {
  if (match.stage === 'groups' && match.group) return `Grupo ${match.group}`
  return STAGE_LABEL[match.stage]
}

export function PrediccionesTab({ data, selectedUser, onRefetch }: PrediccionesTabProps) {
  const [stageFilter, setStageFilter] = useState<'all' | 'groups' | 'knockout'>('knockout')
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

  const matches = data.matches.filter((m) => {
    if (stageFilter === 'groups') return m.stage === 'groups'
    if (stageFilter === 'knockout') return m.stage !== 'groups'
    return true
  })

  // Group by date, preserving order.
  const byDate = new Map<string, Match[]>()
  for (const match of matches) {
    const list = byDate.get(match.date) ?? []
    list.push(match)
    byDate.set(match.date, list)
  }

  return (
    <div className="py-4 space-y-4">
      {/* Stage Toggle Pills */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setStageFilter('knockout')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            stageFilter === 'knockout'
              ? 'bg-amber-500 text-black font-semibold shadow-sm'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Fase Eliminatoria (32)
        </button>
        <button
          type="button"
          onClick={() => setStageFilter('groups')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            stageFilter === 'groups'
              ? 'bg-amber-500 text-black font-semibold shadow-sm'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Fase de Grupos (72)
        </button>
        <button
          type="button"
          onClick={() => setStageFilter('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            stageFilter === 'all'
              ? 'bg-amber-500 text-black font-semibold shadow-sm'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Todos ({data.matches.length})
        </button>
      </div>

      {[...byDate.entries()].map(([date, dateMatches]) => (
        <section key={date} className="mb-2">
          <h2 className="sticky top-0 z-10 bg-[var(--color-background)] py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center justify-between">
            <span>{date}</span>
            <span className="text-[11px] font-mono text-zinc-500 font-normal">
              {dateMatches.length} {dateMatches.length === 1 ? 'partido' : 'partidos'}
            </span>
          </h2>
          {dateMatches.map((match) => (
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
  prediction?: Prediction
  selectedUser: UserId
  onRefetch: () => void | Promise<void>
}

function MatchCard({ match, prediction, selectedUser, onRefetch }: MatchCardProps) {
  const isKnockout = match.stage !== 'groups'

  // Prediction mode for knockout: 'qualifier' | 'outcome_90' | 'exact'
  const [mode, setMode] = useState<PredictionType>(() => {
    if (!isKnockout) return 'exact'
    if (prediction?.type) return prediction.type
    return 'qualifier'
  })

  // State values
  const [qualifier, setQualifier] = useState<Qualifier | ''>(prediction?.qualifier ?? '')
  const [outcome90, setOutcome90] = useState<Outcome90 | ''>(prediction?.outcome90 ?? '')
  const [s1, setS1] = useState<string>(
    prediction?.score1 !== undefined && prediction?.score1 !== null
      ? String(prediction.score1)
      : '',
  )
  const [s2, setS2] = useState<string>(
    prediction?.score2 !== undefined && prediction?.score2 !== null
      ? String(prediction.score2)
      : '',
  )

  const [saving, setSaving] = useState(false)
  const hasResult = match.score1 !== null && match.score2 !== null

  async function handleSave() {
    if (!isKnockout || mode === 'exact') {
      const n1 = Number(s1)
      const n2 = Number(s2)
      if (s1 === '' || s2 === '' || Number.isNaN(n1) || Number.isNaN(n2) || n1 < 0 || n2 < 0) {
        toast.error('Ingresá un marcador válido')
        return
      }
      setSaving(true)
      try {
        await savePrediction({
          userId: selectedUser,
          matchId: match.id,
          type: isKnockout ? 'exact' : undefined,
          score1: n1,
          score2: n2,
        })
        await onRefetch()
        toast.success('✅ Marcador exacto guardado')
      } catch (err) {
        handleSaveError(err)
      } finally {
        setSaving(false)
      }
      return
    }

    if (mode === 'qualifier') {
      if (!qualifier) {
        toast.error('Seleccioná qué equipo clasifica')
        return
      }
      setSaving(true)
      try {
        await savePrediction({
          userId: selectedUser,
          matchId: match.id,
          type: 'qualifier',
          qualifier,
        })
        await onRefetch()
        toast.success('✅ Clasificado guardado')
      } catch (err) {
        handleSaveError(err)
      } finally {
        setSaving(false)
      }
      return
    }

    if (mode === 'outcome_90') {
      if (!outcome90) {
        toast.error('Seleccioná el resultado en los 90 minutos')
        return
      }
      setSaving(true)
      try {
        await savePrediction({
          userId: selectedUser,
          matchId: match.id,
          type: 'outcome_90',
          outcome90,
        })
        await onRefetch()
        toast.success('✅ Resultado en 90 min guardado')
      } catch (err) {
        handleSaveError(err)
      } finally {
        setSaving(false)
      }
      return
    }
  }

  function handleSaveError(err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 409) {
      toast.error('🔒 Partido cerrado para predicciones')
    } else {
      toast.error('❌ Error al guardar')
    }
  }

  // Status bottom bar
  let statusNode: React.ReactNode = null
  if (hasResult && prediction) {
    const { type } = calcMatchPoints(prediction, match)
    const map = {
      exact: {
<<<<<<< HEAD
        label: 'Marcador exacto',
        color: 'text-[var(--color-exact)]',
        pts: '+3 pts',
=======
        label: isKnockout ? 'Marcador exacto' : 'Marcador exacto',
        color: 'text-emerald-400 font-bold',
        pts: isKnockout ? '+3 pts' : '+4 pts',
>>>>>>> ac47330 (feat: agregar fase clasificatoria, reglas de puntuación eliminatoria y vista interactiva de llaves)
      },
      outcome: {
        label: isKnockout ? 'Resultado en 90 mins' : 'Resultado correcto',
        color: 'text-sky-400 font-bold',
        pts: isKnockout ? '+2 pts' : '+1 pt',
      },
      qualifier: {
        label: 'Clasificado acertado',
        color: 'text-amber-400 font-bold',
        pts: '+1 pt',
      },
      miss: { label: 'Sin puntos', color: 'text-zinc-500', pts: '0 pts' },
      pending: { label: '', color: '', pts: '' },
    } as const
    const info = map[type === 'pending' ? 'miss' : type]
    statusNode = (
<<<<<<< HEAD
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
        <span className={`text-xs font-medium ${info.color}`}>{info.label}</span>
        <span className={`text-sm font-bold ${info.color}`}>
          {points === 3 ? '+3 pts' : points === 1 ? '+1 pt' : '+0 pts'}
        </span>
=======
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs">
        <span className={info.color}>{info.label}</span>
        <span className={info.color}>{info.pts}</span>
>>>>>>> ac47330 (feat: agregar fase clasificatoria, reglas de puntuación eliminatoria y vista interactiva de llaves)
      </div>
    )
  } else if (prediction) {
    statusNode = (
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted)]">
        <span>Tu jugada guardada:</span>
        <span className="font-semibold text-zinc-300">
          {prediction.type === 'qualifier' &&
            `Clasifica: ${prediction.qualifier === 'team1' ? match.team1 : match.team2}`}
          {prediction.type === 'outcome_90' &&
            `90 mins: ${
              prediction.outcome90 === 'team1'
                ? `Gana ${match.team1}`
                : prediction.outcome90 === 'team2'
                ? `Gana ${match.team2}`
                : 'Empate'
            }`}
          {(prediction.type === 'exact' || !prediction.type) &&
            `${prediction.score1} – ${prediction.score2}`}
        </span>
      </div>
    )
  }

  return (
    <div className="mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted)] font-medium">
          {groupHeading(match)} · {match.date}
          {match.time ? ` · ${match.time}` : ''}
        </span>
        {match.locked && (
          <Badge className="bg-[var(--color-accent)] text-[var(--color-primary-foreground)] text-[10px]">
            Cerrado
          </Badge>
        )}
      </div>

      {/* Knockout Mode Switcher */}
      {isKnockout && !match.locked && (
        <div className="mt-3 flex items-center rounded-lg bg-zinc-900/90 p-1 border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setMode('qualifier')}
            className={`flex-1 rounded py-1 font-medium transition-all ${
              mode === 'qualifier'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Clasifica (1 pt)
          </button>
          <button
            type="button"
            onClick={() => setMode('outcome_90')}
            className={`flex-1 rounded py-1 font-medium transition-all ${
              mode === 'outcome_90'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            En 90 mins (2 pts)
          </button>
          <button
            type="button"
            onClick={() => setMode('exact')}
            className={`flex-1 rounded py-1 font-medium transition-all ${
              mode === 'exact'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Marcador (3 pts)
          </button>
        </div>
      )}

      {/* Teams Confrontation */}
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Flag code={match.flag1} className="h-10 w-auto rounded shadow-sm" />
          <span className="text-sm font-semibold text-[var(--color-text)] truncate max-w-[110px]">
            {match.team1}
          </span>
        </div>

        {/* Center: Score Display or Knockout Inputs */}
        <div className="flex min-w-[120px] flex-col items-center gap-2">
          {hasResult && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="rounded-md bg-zinc-800 px-3 py-1 font-mono text-base font-bold text-white shadow-inner">
                {match.score1} – {match.score2}
              </span>
              {match.notes && (
                <span className="text-[10px] font-mono text-amber-300 font-semibold">
                  {match.notes}
                </span>
              )}
            </div>
          )}

          {/* If match is locked, just show saved pick */}
          {match.locked ? (
            <span className="text-xs font-semibold text-zinc-400">
              {prediction
                ? prediction.type === 'qualifier'
                  ? `Pasa: ${prediction.qualifier === 'team1' ? match.team1 : match.team2}`
                  : prediction.type === 'outcome_90'
                  ? `90': ${prediction.outcome90 === 'draw' ? 'Empate' : prediction.outcome90 === 'team1' ? match.team1 : match.team2}`
                  : `${prediction.score1} – ${prediction.score2}`
                : '–'}
            </span>
          ) : isKnockout && mode === 'qualifier' ? (
            /* Mode 1: Who advances */
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => setQualifier('team1')}
                  className={`flex-1 rounded border px-2 py-1.5 text-xs font-semibold transition-all ${
                    qualifier === 'team1'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-sm'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  Pasa {match.team1}
                </button>
                <button
                  type="button"
                  onClick={() => setQualifier('team2')}
                  className={`flex-1 rounded border px-2 py-1.5 text-xs font-semibold transition-all ${
                    qualifier === 'team2'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-sm'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  Pasa {match.team2}
                </button>
              </div>
              <Button size="sm" className="w-full text-xs h-8" disabled={saving} onClick={handleSave}>
                {saving ? 'Guardando…' : 'Guardar (1 pt)'}
              </Button>
            </div>
          ) : isKnockout && mode === 'outcome_90' ? (
            /* Mode 2: 90 min outcome */
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="grid grid-cols-3 gap-1 w-full text-[11px]">
                <button
                  type="button"
                  onClick={() => setOutcome90('team1')}
                  className={`rounded border py-1 font-semibold transition-all ${
                    outcome90 === 'team1'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  Gana {match.team1.slice(0, 3)}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome90('draw')}
                  className={`rounded border py-1 font-semibold transition-all ${
                    outcome90 === 'draw'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  Empate
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome90('team2')}
                  className={`rounded border py-1 font-semibold transition-all ${
                    outcome90 === 'team2'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  Gana {match.team2.slice(0, 3)}
                </button>
              </div>
              <Button size="sm" className="w-full text-xs h-8" disabled={saving} onClick={handleSave}>
                {saving ? 'Guardando…' : 'Guardar (2 pts)'}
              </Button>
            </div>
          ) : (
            /* Mode 3 (or Group stage): Exact score */
            <div className="flex flex-col items-center gap-2">
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
              <Button size="sm" className="w-full text-xs h-8" disabled={saving} onClick={handleSave}>
                {saving ? 'Guardando…' : isKnockout ? 'Guardar (3 pts)' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Flag code={match.flag2} className="h-10 w-auto rounded shadow-sm" />
          <span className="text-sm font-semibold text-[var(--color-text)] truncate max-w-[110px]">
            {match.team2}
          </span>
        </div>
      </div>

      {statusNode}
    </div>
  )
}
