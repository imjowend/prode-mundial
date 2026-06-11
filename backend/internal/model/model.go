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
	Stage     string `json:"stage"` // groups | round16 | quarters | semis | final
	Score1    *int   `json:"score1"`
	Score2    *int   `json:"score2"`
	Locked    bool   `json:"locked"`
	CreatedAt string `json:"createdAt"`
}

type Prediction struct {
	UserID  string `json:"userId"`
	MatchID string `json:"matchId"`
	Score1  int    `json:"score1"`
	Score2  int    `json:"score2"`
	SavedAt string `json:"savedAt"`
}

type UserStats struct {
	UserID  string `json:"userId"`
	Total   int    `json:"total"`
	Exact   int    `json:"exact"`
	Outcome int    `json:"outcome"`
	Miss    int    `json:"miss"`
}

var ValidUsers = []string{"joaquin", "josue", "michael"}
