import type { Match, PointType, Prediction } from '@/types'

export function getOutcome(s1: number, s2: number): 'team1' | 'team2' | 'draw' {
  if (s1 > s2) return 'team1'
  if (s2 > s1) return 'team2'
  return 'draw'
}

export function calcMatchPoints(
  pred?: Prediction | null,
  match?: Match | null,
): { points: number; type: PointType } {
<<<<<<< HEAD
  if (pred.score1 === result.score1 && pred.score2 === result.score2)
    return { points: 3, type: 'exact' }
  if (getOutcome(pred.score1, pred.score2) === getOutcome(result.score1, result.score2))
    return { points: 1, type: 'outcome' }
  return { points: 0, type: 'miss' }
=======
  if (!pred || !match || match.score1 === null || match.score2 === null) {
    return { points: 0, type: 'pending' }
  }

  if (match.stage === 'groups') {
    if (pred.score1 == null || pred.score2 == null) {
      return { points: 0, type: 'pending' }
    }
    if (pred.score1 === match.score1 && pred.score2 === match.score2) {
      return { points: 4, type: 'exact' }
    }
    if (getOutcome(pred.score1, pred.score2) === getOutcome(match.score1, match.score2)) {
      return { points: 1, type: 'outcome' }
    }
    return { points: 0, type: 'miss' }
  }

  // Knockout stages (Option B: 1, 2, 3 points)
  switch (pred.type) {
    case 'qualifier':
      if (match.winner && pred.qualifier === match.winner) {
        return { points: 1, type: 'qualifier' }
      }
      return { points: 0, type: 'miss' }

    case 'outcome_90': {
      const actual90 =
        match.score1_90 != null && match.score2_90 != null
          ? getOutcome(match.score1_90, match.score2_90)
          : getOutcome(match.score1, match.score2)
      if (pred.outcome90 === actual90) {
        return { points: 2, type: 'outcome' }
      }
      return { points: 0, type: 'miss' }
    }

    case 'exact':
      if (
        pred.score1 != null &&
        pred.score2 != null &&
        pred.score1 === match.score1 &&
        pred.score2 === match.score2
      ) {
        return { points: 3, type: 'exact' }
      }
      return { points: 0, type: 'miss' }

    default:
      if (
        pred.score1 != null &&
        pred.score2 != null &&
        pred.score1 === match.score1 &&
        pred.score2 === match.score2
      ) {
        return { points: 3, type: 'exact' }
      }
      return { points: 0, type: 'miss' }
  }
>>>>>>> ac47330 (feat: agregar fase clasificatoria, reglas de puntuación eliminatoria y vista interactiva de llaves)
}
