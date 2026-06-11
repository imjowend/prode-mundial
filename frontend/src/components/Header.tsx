import { USERS, type UserId } from '@/types'

type HeaderProps = {
  selectedUser: UserId
  onSelectUser: (id: UserId) => void
}

export function Header({ selectedUser, onSelectUser }: HeaderProps) {
  return (
    <header className="flex flex-col gap-3 py-4">
      <h1 className="text-xl font-bold text-[var(--color-text)]">
        <span aria-hidden="true">⚽ </span>Prode Mundial 2026
      </h1>
      <div className="flex items-center gap-2" role="group" aria-label="Seleccionar usuario">
        {USERS.map((user) => {
          const active = user.id === selectedUser
          return (
            <button
              key={user.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectUser(user.id)}
              className={
                active
                  ? 'rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors'
                  : 'rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]'
              }
            >
              {user.name}
            </button>
          )
        })}
      </div>
    </header>
  )
}
