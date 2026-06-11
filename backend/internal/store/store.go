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
			locked     INTEGER DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS predictions (
			user_id  TEXT NOT NULL,
			match_id TEXT NOT NULL,
			score1   INTEGER NOT NULL,
			score2   INTEGER NOT NULL,
			saved_at TEXT DEFAULT (datetime('now')),
			PRIMARY KEY (user_id, match_id),
			FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
		);
	`)
	return err
}

// GetAllMatches returns all matches ordered by date.
func (s *Store) GetAllMatches() ([]model.Match, error) {
	rows, err := s.db.Query(`
		SELECT id, team1, flag1, team2, flag2, date, time, group_name, stage,
		       score1, score2, locked, created_at
		FROM matches
		ORDER BY date, time, created_at
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []model.Match
	for rows.Next() {
		var m model.Match
		var locked int
		err := rows.Scan(
			&m.ID, &m.Team1, &m.Flag1, &m.Team2, &m.Flag2,
			&m.Date, &m.Time, &m.Group, &m.Stage,
			&m.Score1, &m.Score2, &locked, &m.CreatedAt,
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
		       score1, score2, locked, created_at
		FROM matches WHERE id = ?
	`, id)

	var m model.Match
	var locked int
	err := row.Scan(
		&m.ID, &m.Team1, &m.Flag1, &m.Team2, &m.Flag2,
		&m.Date, &m.Time, &m.Group, &m.Stage,
		&m.Score1, &m.Score2, &locked, &m.CreatedAt,
	)
	if err != nil {
		return model.Match{}, err
	}
	m.Locked = locked != 0
	return m, nil
}

// CreateMatch inserts a new match.
func (s *Store) CreateMatch(m model.Match) error {
	_, err := s.db.Exec(`
		INSERT INTO matches (id, team1, flag1, team2, flag2, date, time, group_name, stage)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, m.ID, m.Team1, m.Flag1, m.Team2, m.Flag2, m.Date, m.Time, m.Group, m.Stage)
	return err
}

// UpdateMatch updates score and/or locked status.
func (s *Store) UpdateMatch(id string, score1, score2 *int, locked *bool) (model.Match, error) {
	if score1 != nil && score2 != nil {
		_, err := s.db.Exec(`
			UPDATE matches SET score1 = ?, score2 = ?, locked = 1 WHERE id = ?
		`, *score1, *score2, id)
		if err != nil {
			return model.Match{}, err
		}
	} else if locked != nil {
		val := 0
		if *locked {
			val = 1
		}
		_, err := s.db.Exec(`UPDATE matches SET locked = ? WHERE id = ?`, val, id)
		if err != nil {
			return model.Match{}, err
		}
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
		SELECT user_id, match_id, score1, score2, saved_at FROM predictions
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
		if err := rows.Scan(&p.UserID, &p.MatchID, &p.Score1, &p.Score2, &p.SavedAt); err != nil {
			return nil, err
		}
		if _, ok := result[p.UserID]; ok {
			result[p.UserID][p.MatchID] = p
		}
	}
	return result, rows.Err()
}

// UpsertPrediction inserts or replaces a prediction.
func (s *Store) UpsertPrediction(p model.Prediction) error {
	_, err := s.db.Exec(`
		INSERT OR REPLACE INTO predictions (user_id, match_id, score1, score2, saved_at)
		VALUES (?, ?, ?, ?, datetime('now'))
	`, p.UserID, p.MatchID, p.Score1, p.Score2)
	return err
}
