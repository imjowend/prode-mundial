import type { PointType } from '@/types'

export function getOutcome(s1: number, s2: number): 'team1' | 'team2' | 'draw' {
  if (s1 > s2) return 'team1'
  if (s2 > s1) return 'team2'
  return 'draw'
}

export function calcMatchPoints(
  pred: { score1: number; score2: number },
  result: { score1: number; score2: number },
): { points: number; type: PointType } {
  if (pred.score1 === result.score1 && pred.score2 === result.score2)
    return { points: 3, type: 'exact' }
  if (getOutcome(pred.score1, pred.score2) === getOutcome(result.score1, result.score2))
    return { points: 1, type: 'outcome' }
  return { points: 0, type: 'miss' }
}
