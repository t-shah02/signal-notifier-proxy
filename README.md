# signal-notifier-proxy

HTTP proxy that receives [Coolify deployment webhooks](https://coolify.io/docs/knowledge-base/webhooks) and forwards deployment events to Signal via [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api).

## Stack

| Service | Role |
| --- | --- |
| `notifier-proxy` | Bun server; exposes `POST /signal-proxy` for Coolify webhooks |
| `cli-server` | `bbernhard/signal-cli-rest-api`; sends messages through Signal |

## Requirements

- [Bun](https://bun.sh) (local dev)
- [Docker](https://docs.docker.com/compose/) (containerized runs)

## Local development

Install dependencies and run the proxy on the host (without Docker):

```bash
bun install
bun run dev
```

The server listens on port `8100` by default. With `NODE_ENV=development`, Bun enables hot reload.

## Docker (local)

`docker-compose-local.yml` runs both services on a private `signal-network` and publishes ports on the host:

| Service | Host port | Container port |
| --- | --- | --- |
| `notifier-proxy` | 8100 | 8100 |
| `cli-server` | 8101 | 8080 |

```bash
docker compose -f docker-compose-local.yml up --build
```

- Webhook URL: `http://localhost:8100/signal-proxy`
- Signal CLI API (debugging): `http://localhost:8101`

`cli-server` persists account data in the `signal-api-data` volume. Register and link a Signal number through the [signal-cli-rest-api docs](https://github.com/bbernhard/signal-cli-rest-api) before expecting messages to send.

## Docker (Coolify)

`docker-compose-coolify.yml` is intended for deployment on [Coolify](https://coolify.io) with the Docker Compose build pack.

Networking:

- `notifier-proxy` joins the external **`coolify`** network (Traefik/Caddy proxy) and an internal **`signal-network`** so it stays reachable from the proxy while talking to `cli-server` privately.
- `cli-server` is only on **`signal-network`** and is not exposed on the Coolify network.

### Coolify setup

1. Create a **Docker Compose** resource and set **Docker Compose Location** to `docker-compose-coolify.yml`.
2. Assign a domain to **`notifier-proxy`** with container port **8100** (e.g. `https://notify.example.com:8100` in the Coolify UI).
3. Do not assign a domain to **`cli-server`**.
4. Configure Coolify’s deployment webhook to `POST` to `https://<your-domain>/signal-proxy`.

The external `coolify` network must exist on the server (created when Coolify’s proxy is installed). Verify with:

```bash
docker network ls | grep coolify
```

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `SERVER_PORT` | `8100` | Port for `notifier-proxy` |
| `SIGNAL_CLI_SERVER_HOST` | — | Hostname of signal-cli (set to `cli-server` in Compose) |
| `SIGNAL_CLI_SERVER_PORT` | `8101` (host) / `8080` (Compose) | Port of signal-cli-rest-api |
| `NODE_ENV` | — | Set to `development` for Bun watch mode |

## API

### `POST /signal-proxy`

Accepts a Coolify deployment webhook JSON body. Returns `400` if the payload fails validation, `200` when accepted.

## Scripts

```bash
bun run start    # production-style run
bun run dev      # watch mode
bun run build    # bundle to dist/
bun run format   # prettier
```
