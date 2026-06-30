# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flight booking microservice system in Vietnamese. Backend is Java 17 / Spring Boot, frontend is React 18 (react-router-dom v7), database is Oracle XE 21 (separate schema per service), messaging is Kafka (choreography-based saga), API routing via Spring Cloud Gateway.

**Default admin credentials:** `admin` / `admin123`

## Running the Application

```bash
# Start everything (requires Docker)
docker compose up --build

# Frontend env var (needed when running React outside Docker)
# Set in frontend/.env: REACT_APP_API_BASE_URL=http://localhost:8080/api

# Individual services (from project root)
cd backend/user-service && mvn spring-boot:run
cd backend/product-service && mvn spring-boot:run
cd backend/order-service && mvn spring-boot:run
cd backend/notification-service && mvn spring-boot:run
cd backend/gateway && mvn spring-boot:run

# Frontend (React dev server)
cd frontend && npm install && npm start
```

## Service Ports

| Service | Port | Schema |
|---|---|---|
| Gateway | 8080 | - |
| user-service | 8081 | USER_APP |
| product-service | 8082 | PRODUCT_APP |
| order-service | 8083 | ORDER_APP |
| notification-service | 8084 | NOTIF_APP |
| Frontend (dev) | 3000 | - |
| Frontend (Docker) | 80 | - |

## Architecture

### API Gateway Routing
All client traffic routes through gateway (port 8080). CORS allows `http://localhost:3000`, `http://192.168.180.11:30000`, `http://192.168.180.12:30000`.

| Path | Target | Notes |
|---|---|---|
| `/api/auth/**` | user-service:8081 | No auth required |
| `/api/users/**` | user-service:8081 | GET `/api/users/{id}` and PATCH `/api/users/*/telegram` are public |
| `/api/flights/**` | product-service:8082 | Requires JWT |
| `/api/products/**` | product-service:8082 | Requires JWT |
| `/api/orders/**` | order-service:8083 | Requires JWT |
| `/api/bookings/**` | order-service:8083 | Gateway has circuit breaker; falls back to 503 |
| `/api/notifications/**` | notification-service:8084 | Requires JWT |

### Auth Flow
- `user-service` holds auth logic with JWT (BCrypt passwords, jjwt 0.12.6)
- `SecurityConfig` permits `/api/auth/**`, `/actuator/**`, `GET /api/users/{id}`, `PATCH /api/users/*/telegram` without auth; all other paths require valid JWT
- Frontend stores token + user data in localStorage under key `user`; sends as `Authorization: Bearer <token>`
- JWT secret is base64-encoded in each service's `application.yml` (`jwt.secret`)

### Frontend Architecture
- React 18 + react-router-dom v7, React Router v6 syntax
- API base URL configured via `REACT_APP_API_BASE_URL` env var (defaults to `http://localhost:8080/api`)
- `AuthContext` (`frontend/src/context/AuthContext.js`) decodes JWT on load, extracts roles, validates token expiry
- `api.js` (`frontend/src/api.js`) is the shared API layer; some pages (`DashboardPage`, `AdminFlightTicketPage`) make direct fetch calls instead

**Frontend routes** (`frontend/src/index.js`):
- `/login` — LoginPage (public)
- `/register` — RegisterPage (public)
- `/` — RoleRedirect: admins go to `/admin`, customers go to `/search`
- `/home` — HomePage (authenticated, customer placeholder)
- `/search` — SearchFlightPage (authenticated, customer)
- `/admin` — AdminFlightTicketPage (admin only) — **main admin page**
- `/dashboard` — DashboardPage (admin only) — secondary admin UI, similar to AdminFlightTicketPage
- `*` — redirects to `/`

### Saga Pattern (Booking Flow via Kafka)
Kafka choreography-based saga with 5 topics:

```
order.created           (order-service publishes)
    -> product-service (OrderEventListener) consumes:
        available? -> reserves seats, publishes inventory.reserved
        no seats  -> publishes inventory.failed
inventory.reserved      (product-service publishes)
    -> order-service (InventorySagaListener) consumes:
        sets status=CONFIRMED, publishes booking.confirmed + admin.notification
inventory.failed        (product-service publishes)
    -> order-service (InventorySagaListener) consumes:
        sets status=CANCELLED_<reason>, publishes admin.notification
booking.confirmed       (order-service publishes)
    -> notification-service (NotificationEventListener) consumes: logs/saves notification
admin.notification      (order-service publishes)
    -> notification-service (AdminNotificationListener) consumes: saves + sends Telegram
```

Failure reasons from `OrderEventListener`: `INVALID_QUANTITY`, `NOT_ENOUGH_SEATS`, `FLIGHT_NOT_FOUND`

**Notification flow** (via `AdminNotificationListener`):
- Listens on `admin.notification` Kafka topic
- Parses `AdminNotificationEvent` (orderId, flightId, passengerName, customerEmail, quantity, totalAmount, status)
- Saves notification to `NOTIF_APP.NOTIFICATIONS` table
- Sends message to Telegram using `TelegramService` (configured via `telegram.bot-token` + `telegram.chat-id` env vars or application.yml defaults)
- If Telegram is not configured (blank token/chat-id), logs a warning and skips sending

### K3s Deployment (k3s/app.yaml)
K3s deployment differs from docker-compose.yml in several ways:

| Aspect | docker-compose.yml | k3s/app.yaml |
|---|---|---|
| **Log aggregation** | ELK stack (Elasticsearch, Logstash, Kibana, Filebeat) — may fail due to Elastic registry auth | **OpenSearch 2.12** + OpenSearch Dashboards + **Fluent Bit 2.2** (free, fully functional) |
| **Zookeeper** | Separate `zookeeper` service for Kafka | Not needed — Kafka uses KRaft mode (no Zookeeper) |
| **Kafka listeners** | Both internal (`kafka:9092`) + host (`localhost:29092`) | Internal only (`kafka:9092`) |
| **Log volume** | Docker named volume `service-logs` | hostPath `/tmp/flight-logs` |
| **Frontend port** | Host 3000 → container 80 | NodePort 30000 → container 80 |
| **Telegram** | Relies on defaults in application.yml | Uses **Kubernetes Secret** `telegram-secret` (namespace `flight-booking`) with `bot-token` and `chat-id` keys |

**Before deploying with K3s:**
1. Build and push updated Docker images if you changed code (e.g., `ngocminh123/notification-service:v3` with Telegram fix)
2. Update image tags in `k3s/app.yaml` if using new versions
3. Replace Telegram Secret placeholder values with your actual bot token and chat ID
4. Ensure `/tmp/flight-logs` exists on all K3s nodes, or change to a shared storage path
5. Deploy: `kubectl apply -f k3s/app.yaml -n flight-booking`
6. Check pod status: `kubectl get pods -n flight-booking -w`
- **Gateway** (`backend/gateway/.../application.yml`): `bookingCircuitBreaker` on `/api/bookings/**` route → falls forward to `/fallback/booking` (503 JSON response)
- **order-service**: Resilience4j `@CircuitBreaker(name = "bookingDependency")` on `OrderController.createOrder()` and `BookingController.createBooking()`. On open: `createOrderFallback` returns 503 "Booking dependencies are temporarily unavailable"; `createBookingFallback` returns 503 with circuit breaker message.

### Database
Each Spring service uses its own Oracle schema with `ddl-auto: update`. Schemas created by `oracle-init/init.sql`:
- `USER_APP` (userpwd) — USERS, ROLES, USER_ROLES
- `PRODUCT_APP` (productpwd) — PRODUCTS (flights): flightNumber, origin, destination, departureTime, availableSeats, price
- `ORDER_APP` (orderpwd) — ORDERS (bookings): userId, flightId, quantity, status, totalAmount, customerEmail, passengerName
- `NOTIF_APP` (notifpwd) — NOTIFICATIONS: orderId, message, recipientType, isRead

### Key API Endpoints

**Auth** (user-service):
- `POST /api/auth/register` — Register user (auto-assigned ROLE_CUSTOMER)
- `POST /api/auth/login` — Login, returns JWT + user data
- `GET /api/auth/me` — Current user info (requires JWT)

**Flights** (product-service):
- `GET /api/flights` — List all flights
- `POST /api/flights` — Create flight (requires JWT)
- `PUT /api/flights/{id}` — Update flight
- `DELETE /api/flights/{id}` — Delete flight
- `GET /api/flights/{id}` — Flight details

**Orders** (order-service, legacy):
- `POST /api/orders` — Create order, triggers saga (requires JWT, has circuit breaker)

**Bookings** (order-service, current):
- `POST /api/bookings` — Create booking with seat availability check, triggers saga (requires JWT + Authorization header, circuit breaker)
- `GET /api/bookings?userId=X` — List bookings for user (requires JWT)

**Notifications** (notification-service):
- `GET /api/notifications/admin` — Admin notifications
- `GET /api/notifications/admin/unread-count` — Returns `{count: N}`
- `GET /api/notifications/admin/latest?limit=10` — Latest N notifications
- `PATCH /api/notifications/{id}/read` — Mark as read
- `PATCH /api/notifications/read-all` — Mark all as read
- `POST /api/notifications/admin` — Create admin notification (used by Kafka consumer)

### Kafka Configuration
All services connect to `kafka:9092` (Docker internal) or `localhost:29092` (host). JSON serialization via Jackson. Consumer groups match service names.

### Distributed Tracing & Observability
- **Zipkin** (`zipkin:9411`): Micrometer tracing on all services; gateway exposes circuit breaker metrics via actuator
- **ELK Stack**: Elasticsearch 8.13.4, Logstash, Kibana, Filebeat — all in docker-compose but may fail due to Elastic registry auth. Logs shipped from `/var/log/app` volume.

## Important Code Locations

- **JWT utils:** `backend/user-service/src/main/java/com/example/userservice/security/JwtUtils.java`
- **Security config:** `backend/user-service/src/main/java/com/example/userservice/config/SecurityConfig.java`
- **JWT filter:** `backend/user-service/src/main/java/com/example/userservice/security/JwtAuthFilter.java`
- **Saga listener:** `backend/order-service/src/main/java/com/example/orderservice/event/InventorySagaListener.java`
- **Inventory consumer:** `backend/product-service/src/main/java/com/example/productservice/event/OrderEventListener.java`
- **Booking controller:** `backend/order-service/src/main/java/com/example/orderservice/controller/BookingController.java`
- **Order controller:** `backend/order-service/src/main/java/com/example/orderservice/controller/OrderController.java`
- **Kafka topics (per service):** Each service has `event/KafkaTopics.java` with constants — order-service additionally has `BOOKING_CONFIRMED` and `ADMIN_NOTIFICATION`
- **Gateway routing + CORS + circuit breaker:** `backend/gateway/src/main/resources/application.yml`
- **Gateway fallback:** `backend/gateway/src/main/java/com/example/gateway/controller/GatewayFallbackController.java`
- **Frontend auth context:** `frontend/src/context/AuthContext.js`
- **Frontend API layer:** `frontend/src/api.js`
- **Frontend main admin page:** `frontend/src/pages/admin/AdminFlightTicketPage.jsx`
- **Frontend routing:** `frontend/src/index.js`
- **Notification controller:** `backend/notification-service/src/main/java/com/example/notificationservice/controller/NotificationController.java`
- **Admin notification listener (Telegram):** `backend/notification-service/src/main/java/com/example/notificationservice/event/AdminNotificationListener.java`
- **Telegram service:** `backend/notification-service/src/main/java/com/example/notificationservice/service/TelegramService.java`