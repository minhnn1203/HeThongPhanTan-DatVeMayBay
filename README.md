# Flight Booking Microservices

Ung dung dat ve may bay theo kien truc microservice.

## Stack

- Backend: Java 17, Spring Boot, Spring Cloud Gateway
- Frontend: ReactJS
- Database: Oracle XE, tach schema theo service
- Message queue: Kafka
- Centralized logging: Filebeat -> Logstash -> Elasticsearch -> Kibana
- Distributed tracing: Micrometer Tracing -> Zipkin
- Resilience: Resilience4j Circuit Breaker
- Saga pattern: choreography qua Kafka event
- Deploy: Docker Compose, co huong dan Kubernetes trong `docs/k8s-deployment.md`

## Service

- `user-service` (`8081`): CRUD khach hang, gom email ca nhan de gui ve.
- `product-service` (`8082`): Flight/Inventory service, CRUD chuyen bay qua `/api/flights`, giu ghe khi nhan event Kafka.
- `order-service` (`8083`): Booking service, tao don dat ve, goi REST sang User/Flight, publish Kafka event, cap nhat trang thai saga.
- `notification-service` (`8084`): EmailService, consume `booking.confirmed`, luu notification va log noi dung mail gui toi nguoi dat.
- `gateway` (`8080`): API Gateway bang Spring Cloud Gateway.
- `frontend` (`3000`): React UI don gian de xem user, flight, booking.

## Luong nghiep vu

### 1. Dang nhap - Lay thong tin nguoi dung

Client goi `POST /api/auth/login` qua Gateway.

```
LoginPage.js
  → POST /api/auth/login (username, password)
  → GET /api/auth/me (Bearer token) → lay user.id
  → Luu vao AuthContext: { id, username, email, token, roles }
```

- JWT token duoc sinh boi `user-service` (JwtUtils), BCrypt password.
- Sau login, redirect admin -> `/admin`, customer -> `/search`.

### 2. Tim chuyen bay - SearchFlightPage

Client goi `GET /api/flights` lay danh sach chuyen bay.

```
SearchFlightPage
  → GET /api/flights (Bearer token)
  → ProductController.getAll() → repository.findAll()
  ← Tra ve danh sach flight: id, flightNumber, origin, destination,
    departureTime, availableSeats, price, airline, aircraftType, status
```

- Loc theo origin/destination tren frontend.
- Neu `availableSeats <= 0`, nut "Dat ve" bi disabled.

### 3. Dat ve - BookingPage (Kafka Saga Pattern)

Client goi `POST /api/bookings` qua Gateway.

```
BookingPage
  → POST /api/bookings { userId, flightId, quantity } (Bearer token)
  → BookingController.createOrder()
```

**Backend - Order Service:**

```
BookingController.createOrder()
  1. Call user-service (RestTemplate): GET /api/users/{userId}
  2. Call product-service (RestTemplate): GET /api/flights/{flightId}
  3. Validate: user ton tai, flight ton tai, ghe du, gia hop le
  4. Tao OrderEntity status = "PENDING_INVENTORY"
  5. repository.save(order)
  6. publish Kafka: order.created
  ← Tra ve order da tao (PENDING_INVENTORY)
```

**Backend - Product Service (Inventory Step):**

```
OrderEventListener (Kafka consumer, topic: order.created)
  1. Find flight by flightId
  2. Neu flight not found → publish inventory.failed (FLIGHT_NOT_FOUND)
  3. Neu availableSeats < quantity → publish inventory.failed (NOT_ENOUGH_SEATS)
  4. Neu hop le:
     - availableSeats -= quantity
     - repository.save(flight)
     - publish inventory.reserved
```

**Backend - Order Service (Saga Completion):**

```
InventorySagaListener (Kafka consumer, topic: inventory.reserved)
  1. Find order by orderId
  2. order.status = "CONFIRMED"
  3. repository.save(order)
  4. publish booking.confirmed (notification cho khach hang)
  5. publish admin.notification (thong bao cho admin)

InventorySagaListener (Kafka consumer, topic: inventory.failed)
  1. Find order by orderId
  2. order.status = "CANCELLED_<reason>"
  3. repository.save(order)
  4. publish admin.notification (thong bao admin ve booking bi huy)
```

### 4. Thong bao - Notification Service

```
NotificationEventListener (topic: booking.confirmed)
  → Tao Notification cho khach hang (recipientType = CUSTOMER)
  → Luu vao bang NOTIFICATIONS
  → Log: "Email sent to {email}: booking {id} confirmed..."

AdminNotificationListener (topic: admin.notification)
  → Tao Notification cho admin (recipientType = ADMIN, recipientEmail = admin@flightbooking.com)
  → Luu vao bang NOTIFICATIONS
  → Log: "[ADMIN ALERT] New booking #{id} - Passenger: {name}..."
```

### 5. Kafka Topics

| Topic | Publisher | Consumer | Payload |
|---|---|---|---|
| `order.created` | order-service | product-service | OrderCreatedEvent |
| `inventory.reserved` | product-service | order-service | InventoryEvent |
| `inventory.failed` | product-service | order-service | InventoryEvent |
| `booking.confirmed` | order-service | notification-service | BookingConfirmedEvent |
| `admin.notification` | order-service | notification-service | AdminNotificationEvent |

### 6. API Routes (Gateway)

| Path | -> Service | Auth |
|---|---|---|
| `/api/auth/**` | user-service:8081 | Khong can |
| `/api/users/**` | user-service:8081 | Can JWT |
| `/api/flights/**` | product-service:8082 | Can JWT |
| `/api/orders/**` | order-service:8083 | Can JWT |
| `/api/bookings/**` | order-service:8083 | Can JWT |
| `/api/notifications/**` | notification-service:8084 | Can JWT |

## API mau

Tao user:

```bash
curl -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"nguyenvana\",\"password\":\"123456\",\"email\":\"a@example.com\",\"fullName\":\"Nguyen Van A\"}"
```

Dang nhap:

```bash
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

Tao flight:

```bash
curl -X POST http://localhost:8080/api/flights ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <token>" ^
  -d "{\"flightNumber\":\"VN123\",\"origin\":\"HAN\",\"destination\":\"SGN\",\"departureTime\":\"2026-05-20T09:00:00\",\"availableSeats\":20,\"price\":1500000}"
```

Dat ve:

```bash
curl -X POST http://localhost:8080/api/bookings ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <token>" ^
  -d "{\"userId\":1,\"flightId\":1,\"quantity\":2}"
```

Kiem tra:

- `GET http://localhost:8080/api/flights`
- `GET http://localhost:8080/api/bookings?userId=1` (can Bearer token)
- `GET http://localhost:8080/api/orders`
- `GET http://localhost:8080/api/notifications`

## Chay bang Docker Compose

```bash
docker compose up --build
```

Endpoint:

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Kafka internal: `kafka:9092`, host: `localhost:29092`
- Kibana: http://localhost:5601
- Elasticsearch: http://localhost:9200
- Zipkin tracing: http://localhost:9411
- Oracle XE: `localhost:1521/XEPDB1`

## Log va tracing

- Moi Spring service ghi file log vao `/var/log/app/*.log`.
- `filebeat` doc log tu shared volume `app-logs`, day sang `logstash:5044`.
- Logstash import vao Elasticsearch index `flight-booking-logs-*`.
- Vao Kibana -> Discover -> tao data view `flight-booking-logs-*`.
- Trace request lien service xem tai Zipkin: http://localhost:9411.

## Oracle

`oracle-init/init.sql` tao cac schema doc lap:

- `USER_APP`
- `PRODUCT_APP`
- `ORDER_APP`
- `NOTIF_APP`

Moi service dung schema rieng de the hien tinh doc lap du lieu.