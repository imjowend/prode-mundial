export type UserId = 'joaquin' | 'josue' | 'michael'

export const USERS: { id: UserId; name: string }[] = [
  { id: 'joaquin', name: 'Joaquín' },
  { id: 'josue', name: 'Josué' },
  { id: 'michael', name: 'Michael' },
]

export type Stage = 'groups' | 'round16' | 'quarters' | 'semis' | 'final'

export type PointType = 'exact' | 'outcome' | 'miss' | 'pending'

export type Match = {
  id: string
  team1: string
  flag1: string
  team2: string
  flag2: string
  date: string
  time?: string
  group?: string
  stage: Stage
  score1: number | null
  score2: number | null
  locked: boolean
  createdAt: string
}

export type Prediction = {
  score1: number
  score2: number
  savedAt: string
}

export type UserPredictions = Record<string, Prediction>

export type LeaderboardEntry = {
  userId: UserId
  total: number
  exact: number
  outcome: number
  miss: number
}

export type AppData = {
  matches: Match[]
  predictions: Record<UserId, UserPredictions>
  leaderboard: LeaderboardEntry[]
}
