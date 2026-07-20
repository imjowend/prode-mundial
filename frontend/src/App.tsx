import { useCallback, useEffect, useState } from 'react'

import type { AppData, UserId } from '@/types'
import { USERS } from '@/types'
import { fetchData } from '@/api'
import { Header } from '@/components/Header'
import { TabBar, type TabKey } from '@/components/TabBar'
import { UserSelectModal } from '@/components/UserSelectModal'
import { SkeletonCards } from '@/components/SkeletonCards'
import { PrediccionesTab } from '@/components/tabs/PrediccionesTab'
import { TablaTab } from '@/components/tabs/TablaTab'
import { AdminTab } from '@/components/tabs/AdminTab'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'

const USER_KEY = 'prode-user'

function isUserId(value: string | null): value is UserId {
  return USERS.some((u) => u.id === value)
}

function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserId | null>(() => {
    const stored = localStorage.getItem(USER_KEY)
    return isUserId(stored) ? stored : null
  })
  const [activeTab, setActiveTab] = useState<TabKey>('predicciones')
  const [adminCode, setAdminCode] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(false)
      const result = await fetchData()
      setData(result)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function handleSelectUser(id: UserId) {
    localStorage.setItem(USER_KEY, id)
    setSelectedUser(id)
  }

  if (!selectedUser) {
    return (
      <>
        <UserSelectModal onSelect={handleSelectUser} />
        <Toaster position="top-center" />
      </>
    )
  }

  return (
    <div className="mx-auto min-h-svh w-full max-w-lg px-4 pb-16">
      <Header selectedUser={selectedUser} onSelectUser={handleSelectUser} />
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <SkeletonCards />
      ) : error || !data ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            No se pudieron cargar los datos.
          </p>
          <Button onClick={() => void loadData()}>Reintentar</Button>
        </div>
      ) : (
        <main>
          {activeTab === 'predicciones' && (
            <PrediccionesTab
              data={data}
              selectedUser={selectedUser}
              onRefetch={loadData}
            />
          )}
          {activeTab === 'tabla' && <TablaTab data={data} />}
          {activeTab === 'admin' && (
            <AdminTab
              data={data}
              adminCode={adminCode}
              onAuth={setAdminCode}
              onRefetch={loadData}
            />
          )}
        </main>
      )}

      <Toaster position="top-center" />
    </div>
  )
}

export default App
