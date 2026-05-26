# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flight booking microservice system in Vietnamese. Backend is Java 17 / Spring Boot, frontend is ReactJS, database is Oracle XE (separate schema per service), messaging is Kafka, API routing via Spring Cloud Gateway.

**Default admin credentials:** `admin` / `admin123`

## Running the Application

```bash
# Start everything (requires Docker)
docker compose up --build

# Start backend services individually (from backend/ directory)
cd backend/user-service && mvn spring-boot:run
cd backend/product-service && mvn spring-boot:run
cd backend/order-service && mvn spring-boot:run
cd backend/notification-service && mvn spring-boot:run
cd backend/gateway && mvn spring-boot:run

# Frontend
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
| Frontend | 3000 | - |

## Architecture

### API Gateway Routing (`backend/gateway/src/main/resources/application.yml`)
All client traffic goes through the gateway (port 8080). Routes are:
- `/api/users/**` -> user-service:8081
- `/api/auth/**` -> user-service:8081
- `/api/products/**` -> product-service:8082
- `/api/flights/**` -> product-service:8082
- `/api/orders/**` -> order-service:8083
- `/api/bookings/**` -> order-service:8083
- `/api/notifications/**` -> notification-service:8084

### Auth Flow
- `user-service` holds auth logic with JWT (BCrypt passwords, jjwt 0.12.6)
- `SecurityConfig` permits `/api/auth/**` and `/actuator/**` without auth; all other paths require valid JWT
- Frontend stores token in localStorage, sends as `Authorization: Bearer <token>` header
- JWT secret is base64-encoded in `application.yml` (`jwt.secret`)

### Saga Pattern (Booking Flow)
Kafka choreography-based saga. Kafka topics are defined in `KafkaTopics.java`:

```
order.created          (order-service publishes)
    -> product-service consumes, reserves seats, publishes:
inventory.reserved     (product-service publishes)
    -> order-service consumes (InventorySagaListener), updates to CONFIRMED, publishes:
booking.confirmed      (order-service publishes)
    -> notification-service consumes, logs/saves notification

On failure (no seats / not found):
inventory.failed       (product-service publishes)
    -> order-service consumes (InventorySagaListener), updates to CANCELLED_<reason>
```

**order-service has a Resilience4j circuit breaker** (`bookingDependency`) protecting calls to user-service and product-service. If either service is down, `/api/bookings` returns 503.

### Database
Each Spring service has its own Oracle schema (ddl-auto: update). Schemas are created by `oracle-init/init.sql`:
- `USER_APP` (userpwd) - USERS, ROLES, USER_ROLES
- `PRODUCT_APP` (productpwd) - PRODUCTS (flights)
- `ORDER_APP` (orderpwd) - ORDERS (bookings)
- `NOTIF_APP` (notifpwd) - NOTIFICATIONS

### Key API Endpoints

**Auth:**
- `POST /api/auth/register` - Register new user (auto-assigned ROLE_CUSTOMER)
- `POST /api/auth/login` - Login, returns JWT
- `GET /api/auth/me` - Get current user info (requires JWT)

**Flights:**
- `GET /api/flights` - List all flights
- `POST /api/flights` - Create flight (requires JWT)
- `GET /api/flights/{id}` - Get flight details

**Bookings (main booking flow):**
- `POST /api/bookings` - Create booking (requires JWT, triggers saga)
- `GET /api/bookings?userId=X` - List bookings for a user (requires JWT)

**Notifications:**
- `GET /api/notifications` - List notifications

### Kafka Configuration
All services connect to `kafka:9092` (internal Docker network) or `localhost:29092` (host). JSON serialization. Consumer groups are named after each service (e.g., `groupId: order-service`).

### Distributed Tracing
Zipkin tracing is configured on all services via Micrometer. Zipkin endpoint: `http://zipkin:9411/api/v2/spans`. ELK stack is present in `docker-compose.yml` but commented out (Elastic registry auth issues).

## Important Code Locations

- **JWT utils:** `backend/user-service/src/main/java/com/example/userservice/security/JwtUtils.java`
- **Saga listener:** `backend/order-service/src/main/java/com/example/orderservice/event/InventorySagaListener.java`
- **Inventory consumer:** `backend/product-service/src/main/java/com/example/productservice/event/OrderEventListener.java`
- **Kafka topics constants:** Each service has its own `event/KafkaTopics.java` with identical constants
- **Booking controller:** `backend/order-service/src/main/java/com/example/orderservice/controller/BookingController.java`
- **Auth controller:** `backend/user-service/src/main/java/com/example/userservice/controller/AuthController.java`
- **Gateway routing:** `backend/gateway/src/main/resources/application.yml`