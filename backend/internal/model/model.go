package model

type Match struct {
	ID        string `json:"id"`
	Team1     string `json:"team1"`
	Flag1     string `json:"flag1"`
	Team2     string `json:"team2"`
	Flag2     string `json:"flag2"`
	Date      string `json:"date"`
	Time      string `json:"time,omitempty"`
	Group     string `json:"group,omitempty"`
	Stage     string `json:"stage"` // groups | round32 | round16 | quarters | semis | third_place | final
	Score1    *int   `json:"score1"`
	Score2    *int   `json:"score2"`
	Score1_90 *int   `json:"score1_90,omitempty"`
	Score2_90 *int   `json:"score2_90,omitempty"`
	Winner    string `json:"winner,omitempty"` // "team1" | "team2"
	Notes     string `json:"notes,omitempty"`  // e.g. "pen. 3-4", "t.e. 3-2"
	Locked    bool   `json:"locked"`
	CreatedAt string `json:"createdAt"`
}

type Prediction struct {
	UserID    string `json:"userId"`
	MatchID   string `json:"matchId"`
	Type      string `json:"type,omitempty"` // "exact" | "outcome_90" | "qualifier"
	Score1    *int   `json:"score1,omitempty"`
	Score2    *int   `json:"score2,omitempty"`
	Outcome90 string `json:"outcome90,omitempty"` // "team1" | "draw" | "team2"
	Qualifier string `json:"qualifier,omitempty"` // "team1" | "team2"
	SavedAt   string `json:"savedAt"`
}

type UserStats struct {
	UserID    string `json:"userId"`
	Total     int    `json:"total"`
	Exact     int    `json:"exact"`
	Outcome   int    `json:"outcome"`
	Qualifier int    `json:"qualifier"`
	Miss      int    `json:"miss"`
}

var ValidUsers = []string{"joaquin", "josue", "michael"}

