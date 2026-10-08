FROM golang:1.26.8-alpine3.24 AS builder
RUN apk add --no-cache gcc musl-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 go build -o server ./cmd/server

FROM alpine:3.24.2
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
# Traefik no rutea a contenedores "starting"/"unhealthy": start-interval corto para que el
# primer chequeo llegue rápido. /health no toca la DB. wget es el de busybox.
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --start-interval=2s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT:-8080}/health" || exit 1
CMD ["./server"]
