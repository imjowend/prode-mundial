import { useState } from 'react'
import { Lock, Unlock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { AppData, Match, Stage } from '@/types'
import { ADMIN_CODE, addMatch, updateMatch, deleteMatch } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

type AdminTabProps = {
  data: AppData
  isAdminAuth: boolean
  onAuth: (ok: boolean) => void
  onRefetch: () => void | Promise<void>
}

const STAGES: { value: Stage; label: string }[] = [
  { value: 'groups', label: 'Grupos' },
  { value: 'round16', label: 'Octavos' },
  { value: 'quarters', label: 'Cuartos' },
  { value: 'semis', label: 'Semis' },
  { value: 'final', label: 'Final' },
]

export function AdminTab({ data, isAdminAuth, onAuth, onRefetch }: AdminTabProps) {
  if (!isAdminAuth) {
    return <AdminLogin onAuth={onAuth} />
  }
  return (
    <div className="flex flex-col gap-6 py-4">
      <AddMatchForm onRefetch={onRefetch} />
      <Separator />
      <ManageMatches matches={data.matches} onRefetch={onRefetch} />
    </div>
  )
}

function AdminLogin({ onAuth }: { onAuth: (ok: boolean) => void }) {
  const [code, setCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code === ADMIN_CODE) {
      onAuth(true)
    } else {
      toast.error('❌ Código incorrecto')
    }
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

function AddMatchForm({ onRefetch }: { onRefetch: () => void | Promise<void> }) {
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
      await addMatch(ADMIN_CODE, {
        team1: team1.trim(),
        flag1: flag1.trim(),
        team2: team2.trim(),
        flag2: flag2.trim(),
        date: date.trim(),
        time: time.trim() || undefined,
        group: group.trim() || undefined,
        stage,
      })
      await onRefetch()
      toast.success('✅ Partido agregado')
      setFlag1('')
      setTeam1('')
      setFlag2('')
      setTeam2('')
      setDate('')
      setTime('')
      setGroup('')
      setStage('groups')
    } catch {
      toast.error('❌ Error al agregar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-[var(--color-text)]">Agregar partido</h2>

      <div className="grid grid-cols-[52px_1fr] gap-2">
        <Input
          placeholder="🇦🇷"
          aria-label="Bandera equipo 1"
          value={flag1}
          onChange={(e) => setFlag1(e.target.value)}
          className="text-center"
        />
        <Input
          placeholder="Equipo 1"
          aria-label="Equipo 1"
          value={team1}
          onChange={(e) => setTeam1(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[52px_1fr] gap-2">
        <Input
          placeholder="🇧🇷"
          aria-label="Bandera equipo 2"
          value={flag2}
          onChange={(e) => setFlag2(e.target.value)}
          className="text-center"
        />
        <Input
          placeholder="Equipo 2"
          aria-label="Equipo 2"
          value={team2}
          onChange={(e) => setTeam2(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          aria-label="Fecha"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          type="time"
          aria-label="Hora (opcional)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Grupo (A)"
          aria-label="Grupo"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
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
  onRefetch,
}: {
  matches: Match[]
  onRefetch: () => void | Promise<void>
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-[var(--color-text)]">Gestionar partidos</h2>
      {matches.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No hay partidos cargados.</p>
      ) : (
        matches.map((match) => (
          <ManageMatchRow key={match.id} match={match} onRefetch={onRefetch} />
        ))
      )}
    </section>
  )
}

function ManageMatchRow({
  match,
  onRefetch,
}: {
  match: Match
  onRefetch: () => void | Promise<void>
}) {
  const hasResult = match.score1 !== null && match.score2 !== null
  const [editing, setEditing] = useState(false)
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')
  const [busy, setBusy] = useState(false)

  const showInputs = !hasResult || editing

  async function toggleLock() {
    setBusy(true)
    try {
      await updateMatch(ADMIN_CODE, match.id, { locked: !match.locked })
      await onRefetch()
    } catch {
      toast.error('❌ Error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteMatch(ADMIN_CODE, match.id)
      await onRefetch()
      toast.success('🗑️ Eliminado')
    } catch {
      toast.error('❌ Error al eliminar')
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
    setBusy(true)
    try {
      await updateMatch(ADMIN_CODE, match.id, { score1: n1, score2: n2 })
      await onRefetch()
      toast.success('⚽ Resultado guardado')
      setEditing(false)
      setS1('')
      setS2('')
    } catch {
      toast.error('❌ Error al guardar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">
          <span aria-hidden="true">{match.flag1}</span> {match.team1} vs {match.team2}{' '}
          <span aria-hidden="true">{match.flag2}</span>
        </span>
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
            aria-label="Eliminar partido"
            title="Eliminar"
            className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3">
        {showInputs ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={20}
              inputMode="numeric"
              aria-label={`Goles ${match.team1}`}
              value={s1}
              onChange={(e) => setS1(e.target.value)}
              className="w-12 px-1 text-center font-bold"
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
              className="w-12 px-1 text-center font-bold"
            />
            <Button size="sm" variant="success" disabled={busy} onClick={saveResult}>
              Guardar resultado
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-exact)]">
              {match.score1} – {match.score2} ✓
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(true)
                setS1(String(match.score1 ?? ''))
                setS2(String(match.score2 ?? ''))
              }}
            >
              Editar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
