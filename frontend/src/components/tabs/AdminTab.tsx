import { useState } from 'react'
import { Lock, Unlock, Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

import type { AppData, Match, Stage } from '@/types'
<<<<<<< HEAD
import { addMatch, updateMatch, deleteMatch } from '@/api'
=======
import { ADMIN_CODE, addMatch, updateMatch, deleteMatch } from '@/api'
import { Flag } from '@/components/Flag'
>>>>>>> ac47330 (feat: agregar fase clasificatoria, reglas de puntuación eliminatoria y vista interactiva de llaves)
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

type AdminTabProps = {
  data: AppData
  adminCode: string | null
  onAuth: (code: string | null) => void
  onRefetch: () => void | Promise<void>
}

const STAGES: { value: Stage; label: string }[] = [
  { value: 'groups', label: 'Grupos' },
  { value: 'round32', label: 'Dieciseisavos' },
  { value: 'round16', label: 'Octavos' },
  { value: 'quarters', label: 'Cuartos' },
  { value: 'semis', label: 'Semis' },
  { value: 'third_place', label: '3º Puesto' },
  { value: 'final', label: 'Final' },
]

function isAuthError(err: unknown): boolean {
  return (err as { status?: number } | null)?.status === 401
}

export function AdminTab({ data, adminCode, onAuth, onRefetch }: AdminTabProps) {
  if (!adminCode) {
    return <AdminLogin onAuth={onAuth} />
  }
  return (
    <div className="flex flex-col gap-6 py-4">
      <AddMatchForm adminCode={adminCode} onAuth={onAuth} onRefetch={onRefetch} />
      <Separator />
      <ManageMatches matches={data.matches} adminCode={adminCode} onAuth={onAuth} onRefetch={onRefetch} />
    </div>
  )
}

function AdminLogin({ onAuth }: { onAuth: (code: string | null) => void }) {
  const [code, setCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAuth(code)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <Lock className="size-10 text-[var(--color-accent)]" aria-hidden="true" />
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Acceso admin</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Ingresá el código</p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <Input
          type="password"
          placeholder="Código"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Código admin"
        />
        <Button type="submit">Entrar</Button>
      </form>
    </div>
  )
}

function AddMatchForm({
  adminCode,
  onAuth,
  onRefetch,
}: {
  adminCode: string
  onAuth: (code: string | null) => void
  onRefetch: () => void | Promise<void>
}) {
  const [flag1, setFlag1] = useState('')
  const [team1, setTeam1] = useState('')
  const [flag2, setFlag2] = useState('')
  const [team2, setTeam2] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [group, setGroup] = useState('')
  const [stage, setStage] = useState<Stage>('groups')
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    if (!team1.trim() || !team2.trim()) {
      toast.error('Completá ambos equipos')
      return
    }
    if (!date.trim()) {
      toast.error('Ingresá la fecha')
      return
    }
    setBusy(true)
    try {
      await addMatch(adminCode, {
        team1: team1.trim(),
        flag1: flag1.trim(),
        team2: team2.trim(),
        flag2: flag2.trim(),
        date: date.trim(),
        time: time.trim() || undefined,
        group: stage === 'groups' ? group.trim() || undefined : undefined,
        stage,
      })
      await onRefetch()
      toast.success('⚽ Partido agregado')
      setTeam1('')
      setFlag1('')
      setTeam2('')
      setFlag2('')
      setDate('')
      setTime('')
      setGroup('')
      setStage('groups')
    } catch (err) {
      if (isAuthError(err)) {
        toast.error('❌ Código incorrecto')
        onAuth(null)
      } else {
        toast.error('❌ Error al agregar')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-[var(--color-text)]">Agregar partido</h2>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Equipo 1"
          value={team1}
          onChange={(e) => setTeam1(e.target.value)}
          aria-label="Equipo 1"
        />
        <Input
          placeholder="Bandera 1 (ej: ar)"
          value={flag1}
          onChange={(e) => setFlag1(e.target.value)}
          aria-label="Bandera 1"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Equipo 2"
          value={team2}
          onChange={(e) => setTeam2(e.target.value)}
          aria-label="Equipo 2"
        />
        <Input
          placeholder="Bandera 2 (ej: br)"
          value={flag2}
          onChange={(e) => setFlag2(e.target.value)}
          aria-label="Bandera 2"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Fecha"
        />
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Hora"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Grupo (opcional)"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          aria-label="Grupo"
          disabled={stage !== 'groups'}
        />
        <select
          aria-label="Fase"
          value={stage}
          onChange={(e) => setStage(e.target.value as Stage)}
          className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus-visible:border-[var(--color-accent)]"
        >
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <Button onClick={handleAdd} disabled={busy}>
        {busy ? 'Agregando…' : 'Agregar partido'}
      </Button>
    </section>
  )
}

function ManageMatches({
  matches,
  adminCode,
  onAuth,
  onRefetch,
}: {
  matches: Match[]
  adminCode: string
  onAuth: (code: string | null) => void
  onRefetch: () => void | Promise<void>
}) {
  const [filter, setFilter] = useState<'knockout' | 'groups' | 'all'>('knockout')

  const filteredMatches = matches.filter((m) => {
    if (filter === 'groups') return m.stage === 'groups'
    if (filter === 'knockout') return m.stage !== 'groups'
    return true
  })

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Gestionar partidos</h2>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter('knockout')}
            className={`rounded px-2.5 py-1 ${
              filter === 'knockout'
                ? 'bg-amber-500 font-bold text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Eliminatorias
          </button>
          <button
            type="button"
            onClick={() => setFilter('groups')}
            className={`rounded px-2.5 py-1 ${
              filter === 'groups'
                ? 'bg-amber-500 font-bold text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Grupos
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded px-2.5 py-1 ${
              filter === 'all'
                ? 'bg-amber-500 font-bold text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No hay partidos en esta categoría.</p>
      ) : (
<<<<<<< HEAD
        matches.map((match) => (
          <ManageMatchRow
            key={match.id}
            match={match}
            adminCode={adminCode}
            onAuth={onAuth}
            onRefetch={onRefetch}
          />
=======
        filteredMatches.map((match) => (
          <ManageMatchRow key={match.id} match={match} onRefetch={onRefetch} />
>>>>>>> ac47330 (feat: agregar fase clasificatoria, reglas de puntuación eliminatoria y vista interactiva de llaves)
        ))
      )}
    </section>
  )
}

function ManageMatchRow({
  match,
  adminCode,
  onAuth,
  onRefetch,
}: {
  match: Match
  adminCode: string
  onAuth: (code: string | null) => void
  onRefetch: () => void | Promise<void>
}) {
  const isKnockout = match.stage !== 'groups'
  const hasResult = match.score1 !== null && match.score2 !== null
  const [editing, setEditing] = useState(false)

  // Scores
  const [s1, setS1] = useState(match.score1 !== null ? String(match.score1) : '')
  const [s2, setS2] = useState(match.score2 !== null ? String(match.score2) : '')
  const [s1_90, setS1_90] = useState(match.score1_90 !== null && match.score1_90 !== undefined ? String(match.score1_90) : '')
  const [s2_90, setS2_90] = useState(match.score2_90 !== null && match.score2_90 !== undefined ? String(match.score2_90) : '')
  const [winner, setWinner] = useState<'team1' | 'team2' | ''>(match.winner ?? '')
  const [notes, setNotes] = useState(match.notes ?? '')

  const [busy, setBusy] = useState(false)
  const showInputs = !hasResult || editing

  async function toggleLock() {
    setBusy(true)
    try {
      await updateMatch(adminCode, match.id, { locked: !match.locked })
      await onRefetch()
    } catch (err) {
      if (isAuthError(err)) {
        toast.error('❌ Código incorrecto')
        onAuth(null)
      } else {
        toast.error('❌ Error')
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteMatch(adminCode, match.id)
      await onRefetch()
      toast.success('🗑️ Eliminado')
    } catch (err) {
      if (isAuthError(err)) {
        toast.error('❌ Código incorrecto')
        onAuth(null)
      } else {
        toast.error('❌ Error al eliminar')
      }
    } finally {
      setBusy(false)
    }
  }

  async function saveResult() {
    const n1 = Number(s1)
    const n2 = Number(s2)
    if (s1 === '' || s2 === '' || Number.isNaN(n1) || Number.isNaN(n2) || n1 < 0 || n2 < 0) {
      toast.error('Ingresá un marcador válido')
      return
    }

    let n1_90 = s1_90 !== '' ? Number(s1_90) : n1
    let n2_90 = s2_90 !== '' ? Number(s2_90) : n2
    let win = winner
    if (!win && isKnockout) {
      if (n1 > n2) win = 'team1'
      else if (n2 > n1) win = 'team2'
    }

    setBusy(true)
    try {
<<<<<<< HEAD
      await updateMatch(adminCode, match.id, { score1: n1, score2: n2 })
      await onRefetch()
      toast.success('⚽ Resultado guardado')
      setEditing(false)
      setS1('')
      setS2('')
    } catch (err) {
      if (isAuthError(err)) {
        toast.error('❌ Código incorrecto')
        onAuth(null)
      } else {
        toast.error('❌ Error al guardar')
      }
=======
      await updateMatch(ADMIN_CODE, match.id, {
        score1: n1,
        score2: n2,
        score1_90: n1_90,
        score2_90: n2_90,
        winner: win || undefined,
        notes: notes.trim() || undefined,
      })
      await onRefetch()
      toast.success('⚽ Resultado guardado')
      setEditing(false)
    } catch {
      toast.error('❌ Error al guardar')
>>>>>>> ac47330 (feat: agregar fase clasificatoria, reglas de puntuación eliminatoria y vista interactiva de llaves)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
          <Flag code={match.flag1} className="h-4 w-6 rounded shadow-sm object-cover" />
          <span>{match.team1}</span>
          <span className="text-zinc-500 font-normal">vs</span>
          <span>{match.team2}</span>
          <Flag code={match.flag2} className="h-4 w-6 rounded shadow-sm object-cover" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={busy}
            onClick={toggleLock}
            aria-label={match.locked ? 'Desbloquear' : 'Bloquear'}
            title={match.locked ? 'Desbloquear' : 'Bloquear'}
          >
            {match.locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={busy}
            onClick={handleDelete}
            aria-label="Eliminar"
            title="Eliminar partido"
            className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="text-xs text-[var(--color-muted)] flex items-center gap-2">
        <span className="uppercase font-mono font-bold text-amber-400/90">{match.stage}</span>
        <span>•</span>
        <span>{match.date} {match.time}</span>
      </div>

      {showInputs ? (
        <div className="space-y-2 rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-300 w-24">Marcador Final:</span>
            <Input
              type="number"
              min={0}
              placeholder={match.team1}
              value={s1}
              onChange={(e) => setS1(e.target.value)}
              className="h-8 w-16 text-center font-bold"
            />
            <span className="font-bold text-zinc-500">–</span>
            <Input
              type="number"
              min={0}
              placeholder={match.team2}
              value={s2}
              onChange={(e) => setS2(e.target.value)}
              className="h-8 w-16 text-center font-bold"
            />
          </div>

          {isKnockout && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-400 w-24">En 90 mins:</span>
                <Input
                  type="number"
                  min={0}
                  placeholder={match.team1}
                  value={s1_90}
                  onChange={(e) => setS1_90(e.target.value)}
                  className="h-8 w-16 text-center font-bold"
                />
                <span className="font-bold text-zinc-500">–</span>
                <Input
                  type="number"
                  min={0}
                  placeholder={match.team2}
                  value={s2_90}
                  onChange={(e) => setS2_90(e.target.value)}
                  className="h-8 w-16 text-center font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-400 w-24">Clasifica:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWinner('team1')}
                    className={`rounded px-2.5 py-1 text-xs font-semibold ${
                      winner === 'team1'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {match.team1}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinner('team2')}
                    className={`rounded px-2.5 py-1 text-xs font-semibold ${
                      winner === 'team2'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {match.team2}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-400 w-24">Notas (ej. pen):</span>
                <Input
                  placeholder="ej: pen. 3-4 o t.e. 3-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-1">
            {editing && (
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
            <Button size="sm" className="h-8 text-xs" onClick={saveResult} disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar resultado'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg bg-zinc-900/40 p-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-amber-300">
              {match.score1} – {match.score2}
            </span>
            {match.winner && (
              <span className="rounded bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] text-emerald-400 font-semibold">
                Pasa {match.winner === 'team1' ? match.team1 : match.team2}
              </span>
            )}
            {match.notes && (
              <span className="text-[11px] text-zinc-400 font-mono">({match.notes})</span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setEditing(true)}
          >
            <Edit2 className="size-3 mr-1" /> Editar
          </Button>
        </div>
      )}
    </div>
  )
}
