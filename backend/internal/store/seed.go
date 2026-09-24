package store

import (
	"crypto/rand"
	"fmt"

	"github.com/imjowend/prode-mundial/backend/internal/model"
)

type seedMatch struct {
	Team1, Flag1, Team2, Flag2, Date, Time, Group string
}

// Códigos ISO 3166-1 alpha-2 en minúsculas para flagcdn.com.
// Excepciones: gb-sct (Escocia), gb-eng (Inglaterra).
// Horarios en hora Argentina (UTC-3).
// Fuente: openfootball/worldcup.json
var groupStage = []seedMatch{
	// ── Grupo A ──────────────────────────────────────────────────────────
	{"México", "mx", "Sudáfrica", "za", "2026-06-11", "16:00", "A"},
	{"Corea del Sur", "kr", "República Checa", "cz", "2026-06-11", "23:00", "A"},
	{"República Checa", "cz", "Sudáfrica", "za", "2026-06-18", "13:00", "A"},
	{"México", "mx", "Corea del Sur", "kr", "2026-06-18", "22:00", "A"},
	{"República Checa", "cz", "México", "mx", "2026-06-24", "22:00", "A"},
	{"Sudáfrica", "za", "Corea del Sur", "kr", "2026-06-24", "22:00", "A"},

	// ── Grupo B ──────────────────────────────────────────────────────────
	{"Canadá", "ca", "Bosnia y Herzegovina", "ba", "2026-06-12", "16:00", "B"},
	{"Catar", "qa", "Suiza", "ch", "2026-06-13", "16:00", "B"},
	{"Suiza", "ch", "Bosnia y Herzegovina", "ba", "2026-06-18", "16:00", "B"},
	{"Canadá", "ca", "Catar", "qa", "2026-06-18", "19:00", "B"},
	{"Suiza", "ch", "Canadá", "ca", "2026-06-24", "16:00", "B"},
	{"Bosnia y Herzegovina", "ba", "Catar", "qa", "2026-06-24", "16:00", "B"},

	// ── Grupo C ──────────────────────────────────────────────────────────
	{"Brasil", "br", "Marruecos", "ma", "2026-06-13", "19:00", "C"},
	{"Haití", "ht", "Escocia", "gb-sct", "2026-06-13", "22:00", "C"},
	{"Escocia", "gb-sct", "Marruecos", "ma", "2026-06-19", "19:00", "C"},
	{"Brasil", "br", "Haití", "ht", "2026-06-19", "21:30", "C"},
	{"Escocia", "gb-sct", "Brasil", "br", "2026-06-24", "19:00", "C"},
	{"Marruecos", "ma", "Haití", "ht", "2026-06-24", "19:00", "C"},

	// ── Grupo D ──────────────────────────────────────────────────────────
	{"EE.UU.", "us", "Paraguay", "py", "2026-06-12", "22:00", "D"},
	{"Australia", "au", "Turquía", "tr", "2026-06-14", "01:00", "D"},
	{"EE.UU.", "us", "Australia", "au", "2026-06-19", "16:00", "D"},
	{"Turquía", "tr", "Paraguay", "py", "2026-06-20", "00:00", "D"},
	{"Turquía", "tr", "EE.UU.", "us", "2026-06-25", "23:00", "D"},
	{"Paraguay", "py", "Australia", "au", "2026-06-25", "23:00", "D"},

	// ── Grupo E ──────────────────────────────────────────────────────────
	{"Alemania", "de", "Curazao", "cw", "2026-06-14", "14:00", "E"},
	{"Costa de Marfil", "ci", "Ecuador", "ec", "2026-06-14", "20:00", "E"},
	{"Alemania", "de", "Costa de Marfil", "ci", "2026-06-20", "17:00", "E"},
	{"Ecuador", "ec", "Curazao", "cw", "2026-06-20", "21:00", "E"},
	{"Curazao", "cw", "Costa de Marfil", "ci", "2026-06-25", "17:00", "E"},
	{"Ecuador", "ec", "Alemania", "de", "2026-06-25", "17:00", "E"},

	// ── Grupo F ──────────────────────────────────────────────────────────
	{"Países Bajos", "nl", "Japón", "jp", "2026-06-14", "17:00", "F"},
	{"Suecia", "se", "Túnez", "tn", "2026-06-14", "23:00", "F"},
	{"Países Bajos", "nl", "Suecia", "se", "2026-06-20", "14:00", "F"},
	{"Túnez", "tn", "Japón", "jp", "2026-06-21", "01:00", "F"},
	{"Japón", "jp", "Suecia", "se", "2026-06-25", "20:00", "F"},
	{"Túnez", "tn", "Países Bajos", "nl", "2026-06-25", "20:00", "F"},

	// ── Grupo G ──────────────────────────────────────────────────────────
	{"Bélgica", "be", "Egipto", "eg", "2026-06-15", "16:00", "G"},
	{"Irán", "ir", "Nueva Zelanda", "nz", "2026-06-15", "22:00", "G"},
	{"Bélgica", "be", "Irán", "ir", "2026-06-21", "16:00", "G"},
	{"Nueva Zelanda", "nz", "Egipto", "eg", "2026-06-21", "22:00", "G"},
	{"Egipto", "eg", "Irán", "ir", "2026-06-27", "00:00", "G"},
	{"Nueva Zelanda", "nz", "Bélgica", "be", "2026-06-27", "00:00", "G"},

	// ── Grupo H ──────────────────────────────────────────────────────────
	{"España", "es", "Cabo Verde", "cv", "2026-06-15", "13:00", "H"},
	{"Arabia Saudita", "sa", "Uruguay", "uy", "2026-06-15", "19:00", "H"},
	{"España", "es", "Arabia Saudita", "sa", "2026-06-21", "13:00", "H"},
	{"Uruguay", "uy", "Cabo Verde", "cv", "2026-06-21", "19:00", "H"},
	{"Cabo Verde", "cv", "Arabia Saudita", "sa", "2026-06-26", "21:00", "H"},
	{"Uruguay", "uy", "España", "es", "2026-06-26", "21:00", "H"},

	// ── Grupo I ──────────────────────────────────────────────────────────
	{"Francia", "fr", "Senegal", "sn", "2026-06-16", "16:00", "I"},
	{"Irak", "iq", "Noruega", "no", "2026-06-16", "19:00", "I"},
	{"Francia", "fr", "Irak", "iq", "2026-06-22", "18:00", "I"},
	{"Noruega", "no", "Senegal", "sn", "2026-06-22", "21:00", "I"},
	{"Noruega", "no", "Francia", "fr", "2026-06-26", "16:00", "I"},
	{"Senegal", "sn", "Irak", "iq", "2026-06-26", "16:00", "I"},

	// ── Grupo J ──────────────────────────────────────────────────────────
	{"Argentina", "ar", "Argelia", "dz", "2026-06-16", "22:00", "J"},
	{"Austria", "at", "Jordania", "jo", "2026-06-17", "01:00", "J"},
	{"Argentina", "ar", "Austria", "at", "2026-06-22", "14:00", "J"},
	{"Jordania", "jo", "Argelia", "dz", "2026-06-23", "00:00", "J"},
	{"Argelia", "dz", "Austria", "at", "2026-06-27", "23:00", "J"},
	{"Jordania", "jo", "Argentina", "ar", "2026-06-27", "23:00", "J"},

	// ── Grupo K ──────────────────────────────────────────────────────────
	{"Portugal", "pt", "Congo DR", "cd", "2026-06-17", "14:00", "K"},
	{"Uzbekistán", "uz", "Colombia", "co", "2026-06-17", "23:00", "K"},
	{"Portugal", "pt", "Uzbekistán", "uz", "2026-06-23", "14:00", "K"},
	{"Colombia", "co", "Congo DR", "cd", "2026-06-23", "23:00", "K"},
	{"Colombia", "co", "Portugal", "pt", "2026-06-27", "20:30", "K"},
	{"Congo DR", "cd", "Uzbekistán", "uz", "2026-06-27", "20:30", "K"},

	// ── Grupo L ──────────────────────────────────────────────────────────
	{"Inglaterra", "gb-eng", "Croacia", "hr", "2026-06-17", "17:00", "L"},
	{"Ghana", "gh", "Panamá", "pa", "2026-06-17", "20:00", "L"},
	{"Inglaterra", "gb-eng", "Ghana", "gh", "2026-06-23", "17:00", "L"},
	{"Panamá", "pa", "Croacia", "hr", "2026-06-23", "20:00", "L"},
	{"Panamá", "pa", "Inglaterra", "gb-eng", "2026-06-27", "18:00", "L"},
	{"Croacia", "hr", "Ghana", "gh", "2026-06-27", "18:00", "L"},
}

type seedKnockoutMatch struct {
	Team1, Flag1, Team2, Flag2, Date, Time, Stage string
	Score1, Score2                                *int
	Score1_90, Score2_90                          *int
	Winner                                        string
	Notes                                         string
}

func intPtr(n int) *int {
	return &n
}

var knockoutStage = []seedKnockoutMatch{
	// ── Dieciseisavos (Round of 32) ─────────────────────────────────────────
	{
		Team1: "Sudáfrica", Flag1: "za", Team2: "Canadá", Flag2: "ca",
		Date: "2026-06-28", Time: "12:00", Stage: "round32",
		Score1: intPtr(0), Score2: intPtr(1),
		Score1_90: intPtr(0), Score2_90: intPtr(1),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "Alemania", Flag1: "de", Team2: "Paraguay", Flag2: "py",
		Date: "2026-06-29", Time: "16:30", Stage: "round32",
		Score1: intPtr(1), Score2: intPtr(1),
		Score1_90: intPtr(1), Score2_90: intPtr(1),
		Winner: "team2", Notes: "pen. 3-4",
	},
	{
		Team1: "Países Bajos", Flag1: "nl", Team2: "Marruecos", Flag2: "ma",
		Date: "2026-06-29", Time: "19:00", Stage: "round32",
		Score1: intPtr(1), Score2: intPtr(1),
		Score1_90: intPtr(1), Score2_90: intPtr(1),
		Winner: "team2", Notes: "pen. 2-3",
	},
	{
		Team1: "Brasil", Flag1: "br", Team2: "Japón", Flag2: "jp",
		Date: "2026-06-29", Time: "12:00", Stage: "round32",
		Score1: intPtr(2), Score2: intPtr(1),
		Score1_90: intPtr(2), Score2_90: intPtr(1),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "Francia", Flag1: "fr", Team2: "Suecia", Flag2: "se",
		Date: "2026-06-30", Time: "17:00", Stage: "round32",
		Score1: intPtr(3), Score2: intPtr(0),
		Score1_90: intPtr(3), Score2_90: intPtr(0),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "Costa de Marfil", Flag1: "ci", Team2: "Noruega", Flag2: "no",
		Date: "2026-06-30", Time: "12:00", Stage: "round32",
		Score1: intPtr(1), Score2: intPtr(2),
		Score1_90: intPtr(1), Score2_90: intPtr(2),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "México", Flag1: "mx", Team2: "Ecuador", Flag2: "ec",
		Date: "2026-06-30", Time: "19:00", Stage: "round32",
		Score1: intPtr(2), Score2: intPtr(0),
		Score1_90: intPtr(2), Score2_90: intPtr(0),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "Inglaterra", Flag1: "gb-eng", Team2: "RD Congo", Flag2: "cd",
		Date: "2026-07-01", Time: "12:00", Stage: "round32",
		Score1: intPtr(2), Score2: intPtr(1),
		Score1_90: intPtr(2), Score2_90: intPtr(1),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "EE.UU.", Flag1: "us", Team2: "Bosnia y Herzegovina", Flag2: "ba",
		Date: "2026-07-01", Time: "17:00", Stage: "round32",
		Score1: intPtr(2), Score2: intPtr(0),
		Score1_90: intPtr(2), Score2_90: intPtr(0),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "Bélgica", Flag1: "be", Team2: "Senegal", Flag2: "sn",
		Date: "2026-07-01", Time: "13:00", Stage: "round32",
		Score1: intPtr(3), Score2: intPtr(2),
		Score1_90: intPtr(2), Score2_90: intPtr(2),
		Winner: "team1", Notes: "t.e. 3-2",
	},
	{
		Team1: "Portugal", Flag1: "pt", Team2: "Croacia", Flag2: "hr",
		Date: "2026-07-02", Time: "19:00", Stage: "round32",
		Score1: intPtr(2), Score2: intPtr(1),
		Score1_90: intPtr(2), Score2_90: intPtr(1),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "España", Flag1: "es", Team2: "Austria", Flag2: "at",
		Date: "2026-07-02", Time: "12:00", Stage: "round32",
		Score1: intPtr(3), Score2: intPtr(0),
		Score1_90: intPtr(3), Score2_90: intPtr(0),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "Suiza", Flag1: "ch", Team2: "Argelia", Flag2: "dz",
		Date: "2026-07-02", Time: "20:00", Stage: "round32",
		Score1: intPtr(2), Score2: intPtr(0),
		Score1_90: intPtr(2), Score2_90: intPtr(0),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "Argentina", Flag1: "ar", Team2: "Cabo Verde", Flag2: "cv",
		Date: "2026-07-03", Time: "18:00", Stage: "round32",
		Score1: intPtr(3), Score2: intPtr(2),
		Score1_90: intPtr(1), Score2_90: intPtr(1),
		Winner: "team1", Notes: "t.e. 3-2",
	},
	{
		Team1: "Colombia", Flag1: "co", Team2: "Ghana", Flag2: "gh",
		Date: "2026-07-03", Time: "20:30", Stage: "round32",
		Score1: intPtr(1), Score2: intPtr(0),
		Score1_90: intPtr(1), Score2_90: intPtr(0),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "Australia", Flag1: "au", Team2: "Egipto", Flag2: "eg",
		Date: "2026-07-03", Time: "13:00", Stage: "round32",
		Score1: intPtr(1), Score2: intPtr(1),
		Score1_90: intPtr(1), Score2_90: intPtr(1),
		Winner: "team2", Notes: "pen. 2-4",
	},

	// ── Octavos (Round of 16) ───────────────────────────────────────────────
	{
		Team1: "Paraguay", Flag1: "py", Team2: "Francia", Flag2: "fr",
		Date: "2026-07-04", Time: "17:00", Stage: "round16",
		Score1: intPtr(0), Score2: intPtr(1),
		Score1_90: intPtr(0), Score2_90: intPtr(1),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "Canadá", Flag1: "ca", Team2: "Marruecos", Flag2: "ma",
		Date: "2026-07-04", Time: "12:00", Stage: "round16",
		Score1: intPtr(0), Score2: intPtr(3),
		Score1_90: intPtr(0), Score2_90: intPtr(3),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "Brasil", Flag1: "br", Team2: "Noruega", Flag2: "no",
		Date: "2026-07-05", Time: "16:00", Stage: "round16",
		Score1: intPtr(1), Score2: intPtr(2),
		Score1_90: intPtr(1), Score2_90: intPtr(2),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "México", Flag1: "mx", Team2: "Inglaterra", Flag2: "gb-eng",
		Date: "2026-07-05", Time: "18:00", Stage: "round16",
		Score1: intPtr(2), Score2: intPtr(3),
		Score1_90: intPtr(2), Score2_90: intPtr(3),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "Portugal", Flag1: "pt", Team2: "España", Flag2: "es",
		Date: "2026-07-06", Time: "14:00", Stage: "round16",
		Score1: intPtr(0), Score2: intPtr(1),
		Score1_90: intPtr(0), Score2_90: intPtr(1),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "EE.UU.", Flag1: "us", Team2: "Bélgica", Flag2: "be",
		Date: "2026-07-06", Time: "17:00", Stage: "round16",
		Score1: intPtr(1), Score2: intPtr(4),
		Score1_90: intPtr(1), Score2_90: intPtr(4),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "Argentina", Flag1: "ar", Team2: "Egipto", Flag2: "eg",
		Date: "2026-07-07", Time: "12:00", Stage: "round16",
		Score1: intPtr(3), Score2: intPtr(2),
		Score1_90: intPtr(3), Score2_90: intPtr(2),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "Suiza", Flag1: "ch", Team2: "Colombia", Flag2: "co",
		Date: "2026-07-07", Time: "13:00", Stage: "round16",
		Score1: intPtr(0), Score2: intPtr(0),
		Score1_90: intPtr(0), Score2_90: intPtr(0),
		Winner: "team1", Notes: "pen. 4-3",
	},

	// ── Cuartos de Final (Quarter-finals) ────────────────────────────────────
	{
		Team1: "Francia", Flag1: "fr", Team2: "Marruecos", Flag2: "ma",
		Date: "2026-07-09", Time: "16:00", Stage: "quarters",
		Score1: intPtr(2), Score2: intPtr(0),
		Score1_90: intPtr(2), Score2_90: intPtr(0),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "España", Flag1: "es", Team2: "Bélgica", Flag2: "be",
		Date: "2026-07-10", Time: "12:00", Stage: "quarters",
		Score1: intPtr(2), Score2: intPtr(1),
		Score1_90: intPtr(2), Score2_90: intPtr(1),
		Winner: "team1", Notes: "",
	},
	{
		Team1: "Noruega", Flag1: "no", Team2: "Inglaterra", Flag2: "gb-eng",
		Date: "2026-07-11", Time: "17:00", Stage: "quarters",
		Score1: intPtr(1), Score2: intPtr(2),
		Score1_90: intPtr(1), Score2_90: intPtr(1),
		Winner: "team2", Notes: "t.e. 1-2",
	},
	{
		Team1: "Argentina", Flag1: "ar", Team2: "Suiza", Flag2: "ch",
		Date: "2026-07-11", Time: "20:00", Stage: "quarters",
		Score1: intPtr(3), Score2: intPtr(1),
		Score1_90: intPtr(1), Score2_90: intPtr(1),
		Winner: "team1", Notes: "t.e. 3-1",
	},

	// ── Semifinales (Semi-finals) ───────────────────────────────────────────
	{
		Team1: "Francia", Flag1: "fr", Team2: "España", Flag2: "es",
		Date: "2026-07-14", Time: "14:00", Stage: "semis",
		Score1: intPtr(0), Score2: intPtr(2),
		Score1_90: intPtr(0), Score2_90: intPtr(2),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "Inglaterra", Flag1: "gb-eng", Team2: "Argentina", Flag2: "ar",
		Date: "2026-07-15", Time: "15:00", Stage: "semis",
		Score1: intPtr(1), Score2: intPtr(2),
		Score1_90: intPtr(1), Score2_90: intPtr(2),
		Winner: "team2", Notes: "",
	},

	// ── Tercer Puesto & Final ────────────────────────────────────────────────
	{
		Team1: "Francia", Flag1: "fr", Team2: "Inglaterra", Flag2: "gb-eng",
		Date: "2026-07-18", Time: "17:00", Stage: "third_place",
		Score1: intPtr(4), Score2: intPtr(6),
		Score1_90: intPtr(4), Score2_90: intPtr(6),
		Winner: "team2", Notes: "",
	},
	{
		Team1: "España", Flag1: "es", Team2: "Argentina", Flag2: "ar",
		Date: "2026-07-19", Time: "15:00", Stage: "final",
		Score1: intPtr(1), Score2: intPtr(0),
		Score1_90: intPtr(0), Score2_90: intPtr(0),
		Winner: "team1", Notes: "t.e. 1-0",
	},
}

// SeedIfEmpty inserta los 72 partidos de fase de grupos si la BD está vacía y los partidos de eliminación directa si faltan.
func (s *Store) SeedIfEmpty() error {
	matches, err := s.GetAllMatches()
	if err != nil {
		return err
	}
	if len(matches) == 0 {
		for _, m := range groupStage {
			id, err := newUUID()
			if err != nil {
				return err
			}
			if err := s.CreateMatch(model.Match{
				ID:    id,
				Team1: m.Team1,
				Flag1: m.Flag1,
				Team2: m.Team2,
				Flag2: m.Flag2,
				Date:  m.Date,
				Time:  m.Time,
				Group: m.Group,
				Stage: "groups",
			}); err != nil {
				return err
			}
		}
	}

	return s.SeedKnockoutIfMissing()
}

// SeedKnockoutIfMissing inserta los 32 partidos de fases eliminatorias si aún no están en la BD.
func (s *Store) SeedKnockoutIfMissing() error {
	matches, err := s.GetAllMatches()
	if err != nil {
		return err
	}
	for _, m := range matches {
		if m.Stage != "groups" {
			return nil // ya existen partidos eliminatorios
		}
	}

	for _, m := range knockoutStage {
		id, err := newUUID()
		if err != nil {
			return err
		}
		if err := s.CreateMatch(model.Match{
			ID:        id,
			Team1:     m.Team1,
			Flag1:     m.Flag1,
			Team2:     m.Team2,
			Flag2:     m.Flag2,
			Date:      m.Date,
			Time:      m.Time,
			Stage:     m.Stage,
			Score1:    m.Score1,
			Score2:    m.Score2,
			Score1_90: m.Score1_90,
			Score2_90: m.Score2_90,
			Winner:    m.Winner,
			Notes:     m.Notes,
			Locked:    false,
		}); err != nil {
			return err
		}
	}
	return nil
}

func newUUID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:]), nil
}

