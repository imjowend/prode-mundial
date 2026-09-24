package scoring

import (
	"sort"

	"github.com/imjowend/prode-mundial/backend/internal/model"
)

func Outcome(s1, s2 int) string {
	if s1 > s2 {
		return "team1"
	}
	if s2 > s1 {
		return "team2"
	}
	return "draw"
}

<<<<<<< HEAD
func CalcMatchPoints(predS1, predS2, resS1, resS2 int) (points int, pointType string) {
	if predS1 == resS1 && predS2 == resS2 {
		return 3, "exact"
=======
// CalcMatchPoints evaluates points earned for a prediction on a given match.
func CalcMatchPoints(pred model.Prediction, m model.Match) (points int, pointType string) {
	if m.Stage == "groups" {
		if pred.Score1 == nil || pred.Score2 == nil || m.Score1 == nil || m.Score2 == nil {
			return 0, "pending"
		}
		if *pred.Score1 == *m.Score1 && *pred.Score2 == *m.Score2 {
			return 4, "exact"
		}
		if Outcome(*pred.Score1, *pred.Score2) == Outcome(*m.Score1, *m.Score2) {
			return 1, "outcome"
		}
		return 0, "miss"
>>>>>>> ac47330 (feat: agregar fase clasificatoria, reglas de puntuación eliminatoria y vista interactiva de llaves)
	}

	// Knockout stage (Option B: Todo o nada)
	switch pred.Type {
	case "qualifier":
		// Mode 1: Quién clasifica -> 1 pt
		if m.Winner != "" && pred.Qualifier == m.Winner {
			return 1, "qualifier"
		}
		return 0, "miss"

	case "outcome_90":
		// Mode 2: Resultado en 90 minutos -> 2 pts
		actual90 := ""
		if m.Score1_90 != nil && m.Score2_90 != nil {
			actual90 = Outcome(*m.Score1_90, *m.Score2_90)
		} else if m.Score1 != nil && m.Score2 != nil {
			actual90 = Outcome(*m.Score1, *m.Score2)
		}
		if actual90 != "" && pred.Outcome90 == actual90 {
			return 2, "outcome"
		}
		return 0, "miss"

	case "exact":
		// Mode 3: Marcador exacto al final (90' o 120') -> 3 pts
		if pred.Score1 != nil && pred.Score2 != nil && m.Score1 != nil && m.Score2 != nil {
			if *pred.Score1 == *m.Score1 && *pred.Score2 == *m.Score2 {
				return 3, "exact"
			}
		}
		return 0, "miss"

	default:
		// Fallback for legacy predictions with only Score1 and Score2:
		if pred.Score1 != nil && pred.Score2 != nil && m.Score1 != nil && m.Score2 != nil {
			if *pred.Score1 == *m.Score1 && *pred.Score2 == *m.Score2 {
				return 3, "exact"
			}
		}
		return 0, "miss"
	}
}

func CalcLeaderboard(matches []model.Match, allPredictions map[string]map[string]model.Prediction) []model.UserStats {
	stats := make([]model.UserStats, 0, len(model.ValidUsers))

	for _, userID := range model.ValidUsers {
		userPreds := allPredictions[userID]
		us := model.UserStats{UserID: userID}

		for _, m := range matches {
			if m.Score1 == nil || m.Score2 == nil {
				continue
			}
			pred, ok := userPreds[m.ID]
			if !ok {
				continue
			}
			points, pointType := CalcMatchPoints(pred, m)
			us.Total += points
			switch pointType {
			case "exact":
				us.Exact++
			case "outcome":
				us.Outcome++
			case "qualifier":
				us.Qualifier++
			case "miss":
				us.Miss++
			}
		}

		stats = append(stats, us)
	}

	sort.Slice(stats, func(i, j int) bool {
		return stats[i].Total > stats[j].Total
	})

	return stats
}
