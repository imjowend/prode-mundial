package store

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"

	"github.com/imjowend/prode-mundial/backend/internal/model"
)

type Store struct {
	db *sql.DB
}

func New(dbPath string) (*Store, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}
	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}
	return s, nil
}

func addColumnIfNotExists(db *sql.DB, table, colDef string) {
	_, _ = db.Exec(fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s", table, colDef))
}

func (s *Store) migrate() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS matches (
			id         TEXT PRIMARY KEY,
			team1      TEXT NOT NULL,
			flag1      TEXT DEFAULT '',
			team2      TEXT NOT NULL,
			flag2      TEXT DEFAULT '',
			date       TEXT DEFAULT '',
			time       TEXT DEFAULT '',
			group_name TEXT DEFAULT '',
			stage      TEXT DEFAULT 'groups',
			score1     INTEGER,
			score2     INTEGER,
			score1_90  INTEGER,
			score2_90  INTEGER,
			winner     TEXT DEFAULT '',
			notes      TEXT DEFAULT '',
			locked     INTEGER DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS predictions (
			user_id    TEXT NOT NULL,
			match_id   TEXT NOT NULL,
			type       TEXT DEFAULT '',
			score1     INTEGER,
			score2     INTEGER,
			outcome_90 TEXT DEFAULT '',
			qualifier  TEXT DEFAULT '',
			saved_at   TEXT DEFAULT (datetime('now')),
			PRIMARY KEY (user_id, match_id),
			FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
		);
	`)
	if err != nil {
		return err
	}

	addColumnIfNotExists(s.db, "matches", "score1_90 INTEGER")
	addColumnIfNotExists(s.db, "matches", "score2_90 INTEGER")
	addColumnIfNotExists(s.db, "matches", "winner TEXT DEFAULT ''")
	addColumnIfNotExists(s.db, "matches", "notes TEXT DEFAULT ''")

	addColumnIfNotExists(s.db, "predictions", "type TEXT DEFAULT ''")
	addColumnIfNotExists(s.db, "predictions", "outcome_90 TEXT DEFAULT ''")
	addColumnIfNotExists(s.db, "predictions", "qualifier TEXT DEFAULT ''")

	return nil
}

// GetAllMatches returns all matches ordered by date.
func (s *Store) GetAllMatches() ([]model.Match, error) {
	rows, err := s.db.Query(`
		SELECT id, team1, flag1, team2, flag2, date, time, group_name, stage,
		       score1, score2, score1_90, score2_90, COALESCE(winner, ''), COALESCE(notes, ''), locked, created_at
		FROM matches
		ORDER BY date, time, created_at
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	matches := make([]model.Match, 0)
	for rows.Next() {
		var m model.Match
		var locked int
		err := rows.Scan(
			&m.ID, &m.Team1, &m.Flag1, &m.Team2, &m.Flag2,
			&m.Date, &m.Time, &m.Group, &m.Stage,
			&m.Score1, &m.Score2, &m.Score1_90, &m.Score2_90,
			&m.Winner, &m.Notes, &locked, &m.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		m.Locked = locked != 0
		matches = append(matches, m)
	}
	return matches, rows.Err()
}

// GetMatch returns a single match by ID, sql.ErrNoRows if not found.
func (s *Store) GetMatch(id string) (model.Match, error) {
	row := s.db.QueryRow(`
		SELECT id, team1, flag1, team2, flag2, date, time, group_name, stage,
		       score1, score2, score1_90, score2_90, COALESCE(winner, ''), COALESCE(notes, ''), locked, created_at
		FROM matches WHERE id = ?
	`, id)

	var m model.Match
	var locked int
	err := row.Scan(
		&m.ID, &m.Team1, &m.Flag1, &m.Team2, &m.Flag2,
		&m.Date, &m.Time, &m.Group, &m.Stage,
		&m.Score1, &m.Score2, &m.Score1_90, &m.Score2_90,
		&m.Winner, &m.Notes, &locked, &m.CreatedAt,
	)
	if err != nil {
		return model.Match{}, err
	}
	m.Locked = locked != 0
	return m, nil
}

// CreateMatch inserts a new match.
func (s *Store) CreateMatch(m model.Match) error {
	lockedInt := 0
	if m.Locked {
		lockedInt = 1
	}
	_, err := s.db.Exec(`
		INSERT INTO matches (id, team1, flag1, team2, flag2, date, time, group_name, stage, score1, score2, score1_90, score2_90, winner, notes, locked)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, m.ID, m.Team1, m.Flag1, m.Team2, m.Flag2, m.Date, m.Time, m.Group, m.Stage,
		m.Score1, m.Score2, m.Score1_90, m.Score2_90, m.Winner, m.Notes, lockedInt)
	return err
}

// UpdateMatch updates score, 90min score, winner, notes and/or locked status.
func (s *Store) UpdateMatch(id string, score1, score2, score1_90, score2_90 *int, winner, notes *string, locked *bool) (model.Match, error) {
	query := "UPDATE matches SET id = id"
	var args []any

	if score1 != nil && score2 != nil {
		query += ", score1 = ?, score2 = ?"
		args = append(args, *score1, *score2)
	}
	if score1_90 != nil && score2_90 != nil {
		query += ", score1_90 = ?, score2_90 = ?"
		args = append(args, *score1_90, *score2_90)
	}
	if winner != nil {
		query += ", winner = ?"
		args = append(args, *winner)
	}
	if notes != nil {
		query += ", notes = ?"
		args = append(args, *notes)
	}
	if locked != nil {
		val := 0
		if *locked {
			val = 1
		}
		query += ", locked = ?"
		args = append(args, val)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	if _, err := s.db.Exec(query, args...); err != nil {
		return model.Match{}, err
	}
	return s.GetMatch(id)
}

// DeleteMatch removes a match (CASCADE deletes its predictions).
func (s *Store) DeleteMatch(id string) error {
	res, err := s.db.Exec(`DELETE FROM matches WHERE id = ?`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// GetAllPredictions returns all predictions grouped by userID then matchID.
func (s *Store) GetAllPredictions() (map[string]map[string]model.Prediction, error) {
	rows, err := s.db.Query(`
		SELECT user_id, match_id, score1, score2, COALESCE(type, ''), COALESCE(outcome_90, ''), COALESCE(qualifier, ''), saved_at FROM predictions
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]map[string]model.Prediction)
	for _, u := range model.ValidUsers {
		result[u] = make(map[string]model.Prediction)
	}

	for rows.Next() {
		var p model.Prediction
		if err := rows.Scan(&p.UserID, &p.MatchID, &p.Score1, &p.Score2, &p.Type, &p.Outcome90, &p.Qualifier, &p.SavedAt); err != nil {
			return nil, err
		}
		if p.Type == "qualifier" || p.Type == "outcome_90" {
			p.Score1 = nil
			p.Score2 = nil
		}
		if _, ok := result[p.UserID]; ok {
			result[p.UserID][p.MatchID] = p
		}
	}
	return result, rows.Err()
}

// UpsertPrediction inserts or replaces a prediction.
func (s *Store) UpsertPrediction(p model.Prediction) error {
	score1 := 0
	score2 := 0
	if p.Score1 != nil {
		score1 = *p.Score1
	}
	if p.Score2 != nil {
		score2 = *p.Score2
	}
	_, err := s.db.Exec(`
		INSERT OR REPLACE INTO predictions (user_id, match_id, score1, score2, type, outcome_90, qualifier, saved_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
	`, p.UserID, p.MatchID, score1, score2, p.Type, p.Outcome90, p.Qualifier)
	return err
}
