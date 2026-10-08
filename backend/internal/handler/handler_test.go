package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestIsAdmin(t *testing.T) {
	tests := []struct {
		name       string
		configured string
		sent       string
		want       bool
	}{
		{"correct code", "s3cret-code", "s3cret-code", true},
		{"wrong code", "s3cret-code", "nope", false},
		{"prefix of the code", "s3cret-code", "s3cret", false},
		{"empty code sent", "s3cret-code", "", false},
		{"empty configured code never authorizes", "", "", false},
		{"empty configured code, something sent", "", "anything", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &Handler{adminCode: tt.configured}
			if got := h.isAdmin(tt.sent); got != tt.want {
				t.Errorf("isAdmin(%q) with configured %q = %v, want %v", tt.sent, tt.configured, got, tt.want)
			}
		})
	}
}

func TestHealth(t *testing.T) {
	mux := http.NewServeMux()
	(&Handler{}).Routes(mux) // nil store: /health must not touch the DB

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/health", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := strings.TrimSpace(rec.Body.String()); got != `{"status":"ok"}` {
		t.Errorf("body = %s, want {\"status\":\"ok\"}", got)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}
}
