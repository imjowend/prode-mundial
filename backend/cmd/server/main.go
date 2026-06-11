package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime/debug"
	"time"

	"github.com/joho/godotenv"

	"github.com/imjowend/prode-mundial/backend/internal/handler"
	"github.com/imjowend/prode-mundial/backend/internal/store"
)

func main() {
	_ = godotenv.Load()

	port := getenv("PORT", "8080")
	adminCode := getenv("ADMIN_CODE", "")
	dbPath := getenv("DB_PATH", "./prode.db")
	allowedOrigin := getenv("ALLOWED_ORIGIN", "*")

	s, err := store.New(dbPath)
	if err != nil {
		log.Fatalf("store: %v", err)
	}

	h := handler.New(s, adminCode)

	mux := http.NewServeMux()
	h.Routes(mux)

	var srv http.Handler = mux
	srv = corsMiddleware(allowedOrigin, srv)
	srv = loggerMiddleware(srv)
	srv = recovererMiddleware(srv)

	addr := fmt.Sprintf(":%s", port)
	log.Printf("listening on %s", addr)
	if err := http.ListenAndServe(addr, srv); err != nil {
		log.Fatalf("server: %v", err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// corsMiddleware adds CORS headers and handles preflight OPTIONS requests.
func corsMiddleware(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// loggerMiddleware logs method, path, status and duration for each request.
func loggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, rw.status, time.Since(start))
	})
}

// recovererMiddleware catches panics and returns 500.
func recovererMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("panic: %v\n%s", rec, debug.Stack())
				http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture the status code.
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(status int) {
	rw.status = status
	rw.ResponseWriter.WriteHeader(status)
}
