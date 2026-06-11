import type { AppData } from '@/types'
import { USERS } from '@/types'
import { calcMatchPoints } from '@/lib/scoring'
import { Flag } from '@/components/Flag'

type TablaTabProps = {
  data: AppData
}

const POSITION_LABEL = ['1°', '2°', '3°']

export function TablaTab({ data }: TablaTabProps) {
  const sorted = [...data.leaderboard].sort((a, b) => b.total - a.total)
  const userName = (id: string) => USERS.find((u) => u.id === id)?.name ?? id

  const playedMatches = data.matches.filter((m) => m.score1 !== null && m.score2 !== null)

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Leaderboard */}
      <section className="flex flex-col gap-3">
        {sorted.map((entry, idx) => {
          const isFirst = idx === 0
          return (
            <div
              key={entry.userId}
              className={
                isFirst
                  ? 'flex items-center gap-3 rounded-xl border border-[var(--color-exact)] bg-[var(--color-exact)]/5 p-4'
                  : 'flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4'
              }
            >
              <span
                className={
                  isFirst
                    ? 'text-lg font-bold text-[var(--color-exact)]'
                    : 'text-lg font-bold text-[var(--color-muted)]'
                }
              >
                {POSITION_LABEL[idx] ?? `${idx + 1}°`}
              </span>
              <div className="flex flex-col">
                <span className="font-medium text-[var(--color-text)]">
                  {userName(entry.userId)}
                </span>
                <span className="text-xs text-[var(--color-muted)]">
                  {entry.exact} exactos · {entry.outcome} resultados
                </span>
              </div>
              <span className="ml-auto text-2xl font-bold text-[var(--color-text)]">
                {entry.total}
              </span>
            </div>
          )
        })}
      </section>

      {/* Legend */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[var(--color-exact)]" aria-hidden="true" />
            <span className="text-[var(--color-text)]">
              <span className="font-semibold">+4 pts</span> — Marcador exacto (gol por gol)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
            <span className="text-[var(--color-text)]">
              <span className="font-semibold">+1 pt</span> — Resultado correcto (G / E / P)
            </span>
          </div>
        </div>
      </section>

      {/* Detail table */}
      {playedMatches.length > 0 && (
        <section className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase text-[var(--color-muted)]">
                <th className="p-3 font-medium">Partido</th>
                <th className="p-3 font-medium">Resultado</th>
                {USERS.map((u) => (
                  <th key={u.id} className="p-3 font-medium">
                    {u.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {playedMatches.map((match) => (
                <tr key={match.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="whitespace-nowrap p-3 text-[var(--color-text)]">
                    <span className="inline-flex items-center gap-1">
                      <Flag code={match.flag1} className="h-4 w-auto" /> vs{' '}
                      <Flag code={match.flag2} className="h-4 w-auto" />
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-3 font-bold text-[var(--color-text)]">
                    {match.score1} – {match.score2}
                  </td>
                  {USERS.map((u) => {
                    const pred = data.predictions[u.id]?.[match.id]
                    if (!pred) {
                      return (
                        <td key={u.id} className="p-3 text-[var(--color-muted)]">
                          –
                        </td>
                      )
                    }
                    const { points, type } = calcMatchPoints(pred, {
                      score1: match.score1 as number,
                      score2: match.score2 as number,
                    })
                    const color =
                      type === 'exact'
                        ? 'text-[var(--color-exact)]'
                        : type === 'outcome'
                          ? 'text-[var(--color-success)]'
                          : 'text-[var(--color-danger)]'
                    return (
                      <td key={u.id} className={`whitespace-nowrap p-3 font-medium ${color}`}>
                        {pred.score1}–{pred.score2}{' '}
                        <span className="text-xs">
                          ({points === 4 ? '+4' : points === 1 ? '+1' : '+0'})
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
