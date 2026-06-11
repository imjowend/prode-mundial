export function SkeletonCards() {
  return (
    <div className="py-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-3 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
        >
          <div className="mb-4 h-3 w-32 rounded bg-[var(--color-surface)]" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex flex-col items-center gap-2">
              <div className="size-9 rounded-full bg-[var(--color-surface)]" />
              <div className="h-3 w-16 rounded bg-[var(--color-surface)]" />
            </div>
            <div className="h-8 w-24 rounded bg-[var(--color-surface)]" />
            <div className="flex flex-col items-center gap-2">
              <div className="size-9 rounded-full bg-[var(--color-surface)]" />
              <div className="h-3 w-16 rounded bg-[var(--color-surface)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
