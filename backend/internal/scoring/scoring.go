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

func CalcMatchPoints(predS1, predS2, resS1, resS2 int) (points int, pointType string) {
	if predS1 == resS1 && predS2 == resS2 {
		return 3, "exact"
	}
	if Outcome(predS1, predS2) == Outcome(resS1, resS2) {
		return 1, "outcome"
	}
	return 0, "miss"
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
			points, pointType := CalcMatchPoints(pred.Score1, pred.Score2, *m.Score1, *m.Score2)
			us.Total += points
			switch pointType {
			case "exact":
				us.Exact++
			case "outcome":
				us.Outcome++
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
