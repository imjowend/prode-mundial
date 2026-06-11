package handler

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/imjowend/prode-mundial/backend/internal/model"
	"github.com/imjowend/prode-mundial/backend/internal/scoring"
	"github.com/imjowend/prode-mundial/backend/internal/store"
)

type Handler struct {
	store     *store.Store
	adminCode string
}

func New(s *store.Store, adminCode string) *Handler {
	return &Handler{store: s, adminCode: adminCode}
}

func (h *Handler) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/data", h.getData)
	mux.HandleFunc("POST /api/predictions", h.postPrediction)
	mux.HandleFunc("POST /api/admin/matches", h.createMatch)
	mux.HandleFunc("PATCH /api/admin/matches/{matchId}", h.updateMatch)
	mux.HandleFunc("DELETE /api/admin/matches/{matchId}", h.deleteMatch)
}

// ---- helpers ----------------------------------------------------------------

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func errJSON(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func newUUID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant bits
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:]), nil
}

func isValidUser(userID string) bool {
	for _, u := range model.ValidUsers {
		if u == userID {
			return true
		}
	}
	return false
}

// ---- GET /api/data ----------------------------------------------------------

func (h *Handler) getData(w http.ResponseWriter, r *http.Request) {
	matches, err := h.store.GetAllMatches()
	if err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}

	allPreds, err := h.store.GetAllPredictions()
	if err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}

	type predEntry struct {
		Score1  int    `json:"score1"`
		Score2  int    `json:"score2"`
		SavedAt string `json:"savedAt"`
	}
	predsOut := make(map[string]map[string]predEntry, len(allPreds))
	for userID, byMatch := range allPreds {
		predsOut[userID] = make(map[string]predEntry, len(byMatch))
		for matchID, p := range byMatch {
			predsOut[userID][matchID] = predEntry{Score1: p.Score1, Score2: p.Score2, SavedAt: p.SavedAt}
		}
	}

	leaderboard := scoring.CalcLeaderboard(matches, allPreds)

	writeJSON(w, http.StatusOK, map[string]any{
		"matches":     matches,
		"predictions": predsOut,
		"leaderboard": leaderboard,
	})
}

// ---- POST /api/predictions --------------------------------------------------

func (h *Handler) postPrediction(w http.ResponseWriter, r *http.Request) {
	var body struct {
		UserID  string `json:"userId"`
		MatchID string `json:"matchId"`
		Score1  *int   `json:"score1"`
		Score2  *int   `json:"score2"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errJSON(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if !isValidUser(body.UserID) {
		errJSON(w, http.StatusBadRequest, "invalid userId")
		return
	}
	if body.MatchID == "" {
		errJSON(w, http.StatusBadRequest, "matchId is required")
		return
	}
	if body.Score1 == nil || body.Score2 == nil {
		errJSON(w, http.StatusBadRequest, "score1 and score2 are required")
		return
	}
	if *body.Score1 < 0 || *body.Score2 < 0 {
		errJSON(w, http.StatusBadRequest, "scores must be >= 0")
		return
	}

	match, err := h.store.GetMatch(body.MatchID)
	if err == sql.ErrNoRows {
		errJSON(w, http.StatusNotFound, "not found")
		return
	}
	if err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if match.Locked {
		errJSON(w, http.StatusConflict, "match is locked")
		return
	}

	if err := h.store.UpsertPrediction(model.Prediction{
		UserID:  body.UserID,
		MatchID: body.MatchID,
		Score1:  *body.Score1,
		Score2:  *body.Score2,
	}); err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// ---- POST /api/admin/matches ------------------------------------------------

func (h *Handler) createMatch(w http.ResponseWriter, r *http.Request) {
	var body struct {
		AdminCode string `json:"adminCode"`
		Team1     string `json:"team1"`
		Flag1     string `json:"flag1"`
		Team2     string `json:"team2"`
		Flag2     string `json:"flag2"`
		Date      string `json:"date"`
		Time      string `json:"time"`
		Group     string `json:"group"`
		Stage     string `json:"stage"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errJSON(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if body.AdminCode != h.adminCode {
		errJSON(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	if body.Team1 == "" || body.Team2 == "" {
		errJSON(w, http.StatusBadRequest, "team1 and team2 are required")
		return
	}
	if body.Stage == "" {
		body.Stage = "groups"
	}

	id, err := newUUID()
	if err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}

	m := model.Match{
		ID:    id,
		Team1: body.Team1,
		Flag1: body.Flag1,
		Team2: body.Team2,
		Flag2: body.Flag2,
		Date:  body.Date,
		Time:  body.Time,
		Group: body.Group,
		Stage: body.Stage,
	}

	if err := h.store.CreateMatch(m); err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}

	created, err := h.store.GetMatch(id)
	if err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "match": created})
}

// ---- PATCH /api/admin/matches/{matchId} -------------------------------------

func (h *Handler) updateMatch(w http.ResponseWriter, r *http.Request) {
	matchID := r.PathValue("matchId")

	var body struct {
		AdminCode string `json:"adminCode"`
		Score1    *int   `json:"score1"`
		Score2    *int   `json:"score2"`
		Locked    *bool  `json:"locked"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errJSON(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if body.AdminCode != h.adminCode {
		errJSON(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if _, err := h.store.GetMatch(matchID); err == sql.ErrNoRows {
		errJSON(w, http.StatusNotFound, "not found")
		return
	} else if err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}

	updated, err := h.store.UpdateMatch(matchID, body.Score1, body.Score2, body.Locked)
	if err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "match": updated})
}

// ---- DELETE /api/admin/matches/{matchId} ------------------------------------

func (h *Handler) deleteMatch(w http.ResponseWriter, r *http.Request) {
	matchID := r.PathValue("matchId")

	var body struct {
		AdminCode string `json:"adminCode"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errJSON(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if body.AdminCode != h.adminCode {
		errJSON(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	err := h.store.DeleteMatch(matchID)
	if err == sql.ErrNoRows {
		errJSON(w, http.StatusNotFound, "not found")
		return
	}
	if err != nil {
		errJSON(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}
