export type TabKey = 'predicciones' | 'tabla' | 'admin'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'predicciones', label: 'Predicciones' },
  { key: 'tabla', label: 'Tabla' },
  { key: 'admin', label: 'Admin' },
]

type TabBarProps = {
  activeTab: TabKey
  onChange: (tab: TabKey) => void
}

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <nav
      className="flex items-center border-b border-[var(--color-border)]"
      aria-label="Navegación principal"
    >
      {TABS.map((tab) => {
        const active = tab.key === activeTab
        return (
          <button
            key={tab.key}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(tab.key)}
            className={
              active
                ? 'flex-1 border-b-2 border-[var(--color-accent)] px-3 py-3 text-sm font-medium text-[var(--color-text)] transition-colors'
                : 'flex-1 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]'
            }
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
