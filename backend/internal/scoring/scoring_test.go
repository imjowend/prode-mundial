package scoring

import (
	"fmt"
	"testing"

	"github.com/imjowend/prode-mundial/backend/internal/model"
)

// prodCalcMatchPoints is a verbatim copy of CalcMatchPoints from b0b80ce (the
// version in production before the knockout modes). Legacy predictions must
// keep scoring exactly like this so the final standings don't change.
func prodCalcMatchPoints(predS1, predS2, resS1, resS2 int) (points int, pointType string) {
	if predS1 == resS1 && predS2 == resS2 {
		return 3, "exact"
	}
	if Outcome(predS1, predS2) == Outcome(resS1, resS2) {
		return 1, "outcome"
	}
	return 0, "miss"
}

func ptr(i int) *int { return &i }

var knockoutStages = []string{"round32", "round16", "quarters", "semis", "third_place", "final"}

// TestCalcMatchPoints_LegacyMatchesProduction compares every score from 0-0 to
// 5-5 (prediction vs result) against the production logic, for group matches
// and for knockout matches with legacy predictions (empty Type).
func TestCalcMatchPoints_LegacyMatchesProduction(t *testing.T) {
	cases := []struct{ stage, predType string }{
		{"groups", ""},
		{"groups", "exact"}, // groups ignore the prediction type
	}
	for _, st := range knockoutStages {
		cases = append(cases, struct{ stage, predType string }{st, ""})
	}

	for _, c := range cases {
		for p1 := 0; p1 <= 5; p1++ {
			for p2 := 0; p2 <= 5; p2++ {
				for r1 := 0; r1 <= 5; r1++ {
					for r2 := 0; r2 <= 5; r2++ {
						pred := model.Prediction{Type: c.predType, Score1: ptr(p1), Score2: ptr(p2)}
						m := model.Match{Stage: c.stage, Score1: ptr(r1), Score2: ptr(r2)}

						gotPts, gotType := CalcMatchPoints(pred, m)
						wantPts, wantType := prodCalcMatchPoints(p1, p2, r1, r2)
						if gotPts != wantPts || gotType != wantType {
							t.Errorf("stage=%s type=%q pred=%d-%d result=%d-%d: got (%d, %s), want (%d, %s)",
								c.stage, c.predType, p1, p2, r1, r2, gotPts, gotType, wantPts, wantType)
						}
					}
				}
			}
		}
	}
}

func TestCalcMatchPoints_KnockoutModes(t *testing.T) {
	tests := []struct {
		name     string
		pred     model.Prediction
		match    model.Match
		wantPts  int
		wantType string
	}{
		// qualifier: 1 pt if the winner matches
		{"qualifier ok", model.Prediction{Type: "qualifier", Qualifier: "team1"},
			model.Match{Score1: ptr(1), Score2: ptr(1), Winner: "team1"}, 1, "qualifier"},
		{"qualifier wrong", model.Prediction{Type: "qualifier", Qualifier: "team2"},
			model.Match{Score1: ptr(1), Score2: ptr(1), Winner: "team1"}, 0, "miss"},
		{"qualifier no winner yet", model.Prediction{Type: "qualifier", Qualifier: "team1"},
			model.Match{Score1: ptr(1), Score2: ptr(0)}, 0, "miss"},

		// outcome_90: 2 pts, uses the 90' score when present
		{"outcome_90 uses 90' draw", model.Prediction{Type: "outcome_90", Outcome90: "draw"},
			model.Match{Score1: ptr(2), Score2: ptr(1), Score1_90: ptr(1), Score2_90: ptr(1), Winner: "team1"}, 2, "outcome"},
		{"outcome_90 ignores final score when 90' exists", model.Prediction{Type: "outcome_90", Outcome90: "team1"},
			model.Match{Score1: ptr(2), Score2: ptr(1), Score1_90: ptr(1), Score2_90: ptr(1), Winner: "team1"}, 0, "miss"},
		{"outcome_90 falls back to final score", model.Prediction{Type: "outcome_90", Outcome90: "team2"},
			model.Match{Score1: ptr(0), Score2: ptr(2)}, 2, "outcome"},
		{"outcome_90 wrong", model.Prediction{Type: "outcome_90", Outcome90: "team1"},
			model.Match{Score1: ptr(0), Score2: ptr(2)}, 0, "miss"},

		// exact: 3 pts only on exact final score, no partial credit
		{"exact ok", model.Prediction{Type: "exact", Score1: ptr(2), Score2: ptr(1)},
			model.Match{Score1: ptr(2), Score2: ptr(1)}, 3, "exact"},
		{"exact right outcome only", model.Prediction{Type: "exact", Score1: ptr(3), Score2: ptr(1)},
			model.Match{Score1: ptr(2), Score2: ptr(1)}, 0, "miss"},
		{"exact missing scores", model.Prediction{Type: "exact"},
			model.Match{Score1: ptr(2), Score2: ptr(1)}, 0, "miss"},
	}

	for _, st := range knockoutStages {
		for _, tt := range tests {
			t.Run(fmt.Sprintf("%s/%s", st, tt.name), func(t *testing.T) {
				m := tt.match
				m.Stage = st
				gotPts, gotType := CalcMatchPoints(tt.pred, m)
				if gotPts != tt.wantPts || gotType != tt.wantType {
					t.Errorf("got (%d, %s), want (%d, %s)", gotPts, gotType, tt.wantPts, tt.wantType)
				}
			})
		}
	}
}

func TestCalcMatchPoints_GroupsPendingWithoutScores(t *testing.T) {
	pts, typ := CalcMatchPoints(model.Prediction{}, model.Match{Stage: "groups", Score1: ptr(1), Score2: ptr(0)})
	if pts != 0 || typ != "pending" {
		t.Errorf("got (%d, %s), want (0, pending)", pts, typ)
	}
}
