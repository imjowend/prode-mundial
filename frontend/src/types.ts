export type UserId = 'joaquin' | 'josue' | 'michael'

export const USERS: { id: UserId; name: string }[] = [
  { id: 'joaquin', name: 'Joaquín' },
  { id: 'josue', name: 'Josué' },
  { id: 'michael', name: 'Michael' },
]

export type Stage =
  | 'groups'
  | 'round32'
  | 'round16'
  | 'quarters'
  | 'semis'
  | 'third_place'
  | 'final'

export type PointType = 'exact' | 'outcome' | 'qualifier' | 'miss' | 'pending'

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
  score1_90?: number | null
  score2_90?: number | null
  winner?: 'team1' | 'team2' | ''
  notes?: string
  locked: boolean
  createdAt: string
}

export type PredictionType = 'exact' | 'outcome_90' | 'qualifier'
export type Outcome90 = 'team1' | 'draw' | 'team2'
export type Qualifier = 'team1' | 'team2'

export type Prediction = {
  type?: PredictionType
  score1?: number | null
  score2?: number | null
  outcome90?: Outcome90
  qualifier?: Qualifier
  savedAt: string
}

export type UserPredictions = Record<string, Prediction>

export type LeaderboardEntry = {
  userId: UserId
  total: number
  exact: number
  outcome: number
  qualifier?: number
  miss: number
}

export type AppData = {
  matches: Match[]
  predictions: Record<UserId, UserPredictions>
  leaderboard: LeaderboardEntry[]
}
