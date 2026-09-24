import { useState } from 'react'
import { Trophy, Check, Calendar, Medal } from 'lucide-react'

import type { AppData, Match, Stage, UserId } from '@/types'
import { calcMatchPoints } from '@/lib/scoring'
import { Flag } from '@/components/Flag'
import { Badge } from '@/components/ui/badge'

type FaseFinalTabProps = {
  data: AppData
  selectedUser: UserId
}

const STAGE_ORDER: Stage[] = [
  'round32',
  'round16',
  'quarters',
  'semis',
  'third_place',
  'final',
]

const STAGE_NAMES: Record<Stage, string> = {
  groups: 'Fase de Grupos',
  round32: 'Dieciseisavos (R32)',
  round16: 'Octavos de Final',
  quarters: 'Cuartos de Final',
  semis: 'Semifinales',
  third_place: 'Tercer Puesto',
  final: 'Gran Final',
}

export function FaseFinalTab({ data, selectedUser }: FaseFinalTabProps) {
  const [filterStage, setFilterStage] = useState<Stage | 'all'>('all')

  const knockoutMatches = data.matches.filter((m) => m.stage !== 'groups')
  const userPreds = data.predictions[selectedUser] ?? {}

  // Filter matches
  const filteredMatches =
    filterStage === 'all'
      ? knockoutMatches
      : knockoutMatches.filter((m) => m.stage === filterStage)

  // Group by stage preserving tournament progression order
  const matchesByStage = new Map<Stage, Match[]>()
  for (const s of STAGE_ORDER) {
    const list = filteredMatches.filter((m) => m.stage === s)
    if (list.length > 0) {
      matchesByStage.set(s, list)
    }
  }

  // Count totals
  const totalMatches = knockoutMatches.length
  const completedMatches = knockoutMatches.filter(
    (m) => m.score1 !== null && m.score2 !== null,
  ).length

  return (
    <div className="py-4 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-zinc-900/90 to-zinc-900 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Trophy className="size-4 text-amber-400" />
              Mundial 2026 — Fase Eliminatoria
            </div>
            <h2 className="mt-1 text-lg font-bold text-white tracking-tight">
              Llaves Clasificatorias
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Los países que avanzan destacan en su <span className="text-zinc-200 font-medium">color original</span> y los eliminados quedan en <span className="text-zinc-400 italic">gris</span>.
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xs font-semibold text-amber-300">
              {completedMatches}/{totalMatches}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Partidos
            </span>
          </div>
        </div>
      </div>

      {/* Stage Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterStage('all')}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            filterStage === 'all'
              ? 'bg-amber-500 text-black shadow-sm font-semibold'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          Todas las fases
        </button>
        {STAGE_ORDER.map((s) => {
          const count = knockoutMatches.filter((m) => m.stage === s).length
          if (count === 0) return null
          const active = filterStage === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStage(s)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                active
                  ? 'bg-amber-500 text-black shadow-sm font-semibold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              {s === 'round32'
                ? 'R32 (16)'
                : s === 'round16'
                ? 'Octavos (8)'
                : s === 'quarters'
                ? 'Cuartos (4)'
                : s === 'semis'
                ? 'Semis (2)'
                : s === 'third_place'
                ? '3º Puesto'
                : 'Final'}
            </button>
          )
        })}
      </div>

      {/* Matches by Stage */}
      {matchesByStage.size === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-400">
          No hay partidos en esta fase.
        </div>
      ) : (
        [...matchesByStage.entries()].map(([stage, matches]) => (
          <section key={stage} className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-200 tracking-wide uppercase">
                {stage === 'final' ? (
                  <Medal className="size-4 text-amber-400" />
                ) : (
                  <div className="size-2 rounded-full bg-amber-400" />
                )}
                {STAGE_NAMES[stage]}
              </h3>
              <span className="text-xs text-zinc-500 font-mono">
                {matches.length} {matches.length === 1 ? 'partido' : 'partidos'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {matches.map((match) => {
                const userPred = userPreds[match.id]
                const isFinal = match.stage === 'final'

                const team1Won = match.winner === 'team1'
                const team2Won = match.winner === 'team2'
                const hasWinner = team1Won || team2Won

                // Points calculation
                const pointResult = calcMatchPoints(userPred, match)

                return (
                  <div
                    key={match.id}
                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 shadow-sm transition-all ${
                      isFinal
                        ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 via-zinc-900 to-zinc-900 shadow-amber-950/20'
                        : 'border-zinc-800/80 bg-zinc-900/90 hover:border-zinc-700'
                    }`}
                  >
                    {/* Top Row: Date & Round */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="size-3 text-zinc-500" />
                        {match.date}
                        {match.time && ` • ${match.time}`}
                      </span>
                      {isFinal && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          🏆 Gran Final
                        </span>
                      )}
                    </div>

                    {/* Teams Confrontation */}
                    <div className="space-y-2.5">
                      {/* Team 1 */}
                      <div
                        className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition-all ${
                          team1Won
                            ? 'bg-emerald-950/30 border border-emerald-500/30 shadow-sm'
                            : team2Won
                            ? 'opacity-40 bg-zinc-900/40'
                            : 'bg-zinc-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Flag
                            code={match.flag1}
                            className={`h-7 w-10 shrink-0 rounded object-cover shadow-sm transition-all ${
                              team2Won
                                ? 'grayscale contrast-75 opacity-40'
                                : 'contrast-105'
                            }`}
                          />
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`truncate text-sm ${
                                team1Won
                                  ? 'font-bold text-white'
                                  : team2Won
                                  ? 'text-zinc-500 line-through decoration-zinc-600'
                                  : 'font-medium text-zinc-200'
                              }`}
                            >
                              {match.team1}
                            </span>
                            {team1Won && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                                <Check className="size-3" /> Avanza
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Team 1 Score */}
                        {match.score1 !== null && (
                          <span
                            className={`font-mono text-base ${
                              team1Won
                                ? 'font-black text-emerald-400'
                                : team2Won
                                ? 'text-zinc-500 font-medium'
                                : 'font-bold text-zinc-300'
                            }`}
                          >
                            {match.score1}
                          </span>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div
                        className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition-all ${
                          team2Won
                            ? 'bg-emerald-950/30 border border-emerald-500/30 shadow-sm'
                            : team1Won
                            ? 'opacity-40 bg-zinc-900/40'
                            : 'bg-zinc-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Flag
                            code={match.flag2}
                            className={`h-7 w-10 shrink-0 rounded object-cover shadow-sm transition-all ${
                              team1Won
                                ? 'grayscale contrast-75 opacity-40'
                                : 'contrast-105'
                            }`}
                          />
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`truncate text-sm ${
                                team2Won
                                  ? 'font-bold text-white'
                                  : team1Won
                                  ? 'text-zinc-500 line-through decoration-zinc-600'
                                  : 'font-medium text-zinc-200'
                              }`}
                            >
                              {match.team2}
                            </span>
                            {team2Won && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                                <Check className="size-3" /> Avanza
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Team 2 Score */}
                        {match.score2 !== null && (
                          <span
                            className={`font-mono text-base ${
                              team2Won
                                ? 'font-black text-emerald-400'
                                : team1Won
                                ? 'text-zinc-500 font-medium'
                                : 'font-bold text-zinc-300'
                            }`}
                          >
                            {match.score2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match Notes / Definition (Penalties or Extra Time) */}
                    {(match.notes ||
                      (match.score1_90 !== null &&
                        match.score2_90 !== null &&
                        (match.score1 !== match.score1_90 ||
                          match.score2 !== match.score2_90))) && (
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-2 font-mono">
                        <span>
                          90 mins: {match.score1_90} - {match.score2_90}
                        </span>
                        {match.notes && (
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold border-amber-500/40 text-amber-300 bg-amber-950/30"
                          >
                            {match.notes}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* User Prediction Footer */}
                    <div className="mt-3 rounded-md bg-zinc-950/60 px-3 py-2 border border-zinc-800/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">
                          Tu jugada:
                        </span>
                        {userPred ? (
                          <span className="text-zinc-200 font-medium truncate">
                            {userPred.type === 'qualifier' && (
                              <>
                                Clasifica{' '}
                                <strong className="text-amber-400">
                                  {userPred.qualifier === 'team1'
                                    ? match.team1
                                    : match.team2}
                                </strong>
                              </>
                            )}
                            {userPred.type === 'outcome_90' && (
                              <>
                                En 90':{' '}
                                <strong className="text-amber-400">
                                  {userPred.outcome90 === 'team1'
                                    ? `Gana ${match.team1}`
                                    : userPred.outcome90 === 'team2'
                                    ? `Gana ${match.team2}`
                                    : 'Empate'}
                                </strong>
                              </>
                            )}
                            {(userPred.type === 'exact' || !userPred.type) && (
                              <>
                                Marcador:{' '}
                                <strong className="text-amber-400 font-mono">
                                  {userPred.score1} - {userPred.score2}
                                </strong>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="italic text-zinc-500">Sin pronóstico</span>
                        )}
                      </div>

                      {/* Points badge */}
                      {hasWinner && userPred && (
                        <div className="shrink-0 ml-2">
                          {pointResult.type === 'exact' && (
                            <Badge className="bg-emerald-500 text-black font-bold text-[10px]">
                              +3 pts Exacto
                            </Badge>
                          )}
                          {pointResult.type === 'outcome' && (
                            <Badge className="bg-sky-500 text-black font-bold text-[10px]">
                              +2 pts En 90'
                            </Badge>
                          )}
                          {pointResult.type === 'qualifier' && (
                            <Badge className="bg-amber-400 text-black font-bold text-[10px]">
                              +1 pt Clasifica
                            </Badge>
                          )}
                          {pointResult.type === 'miss' && (
                            <Badge
                              variant="outline"
                              className="text-zinc-500 border-zinc-700 text-[10px]"
                            >
                              0 pts
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
