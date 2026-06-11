import { USERS, type UserId } from '@/types'

type UserSelectModalProps = {
  onSelect: (id: UserId) => void
}

export function UserSelectModal({ onSelect }: UserSelectModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background)]/95 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-select-title"
    >
      <div className="w-full max-w-sm">
        <h2
          id="user-select-title"
          className="mb-1 text-center text-2xl font-bold text-[var(--color-text)]"
        >
          <span aria-hidden="true">⚽ </span>Prode Mundial 2026
        </h2>
        <p className="mb-6 text-center text-sm text-[var(--color-muted)]">
          ¿Quién sos?
        </p>
        <div className="flex flex-col gap-3">
          {USERS.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.id)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-5 text-lg font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              {user.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
