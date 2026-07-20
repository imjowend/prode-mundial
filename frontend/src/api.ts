import type { AppData, Match, UserId } from '@/types'

export const API_URL = import.meta.env.VITE_API_URL as string

async function ensureOk(res: Response): Promise<Response> {
  if (!res.ok) {
    const err = new Error(`Request failed with status ${res.status}`)
    ;(err as Error & { status?: number }).status = res.status
    throw err
  }
  return res
}

export async function fetchData(): Promise<AppData> {
  const res = await fetch(`${API_URL}/api/data`)
  await ensureOk(res)
  return res.json() as Promise<AppData>
}

export async function savePrediction(
  userId: UserId,
  matchId: string,
  score1: number,
  score2: number,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, matchId, score1, score2 }),
  })
  await ensureOk(res)
}

export async function addMatch(
  adminCode: string,
  match: Omit<Match, 'id' | 'createdAt' | 'score1' | 'score2' | 'locked'>,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminCode, ...match }),
  })
  await ensureOk(res)
}

export async function updateMatch(
  adminCode: string,
  matchId: string,
  payload: { score1?: number; score2?: number; locked?: boolean },
): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/matches/${matchId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminCode, ...payload }),
  })
  await ensureOk(res)
}

export async function deleteMatch(adminCode: string, matchId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/matches/${matchId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminCode }),
  })
  await ensureOk(res)
}
