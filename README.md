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

1. Client goi `POST /api/orders` qua Gateway.
2. `order-service` goi REST dong bo sang:
   - `user-service` de lay user/email.
   - `product-service` qua `/api/flights/{id}` de lay chuyen bay/gia.
3. Circuit breaker bao ve buoc goi service phu thuoc. Neu service loi tam thoi, API tra `503`.
4. Order duoc tao voi trang thai `PENDING_INVENTORY`, sau do publish Kafka topic `order.created`.
5. Flight service consume `order.created`:
   - du ghe: tru `availableSeats`, publish `inventory.reserved`.
   - het ghe/khong co flight: publish `inventory.failed`.
6. Order service consume ket qua inventory:
   - `inventory.reserved`: cap nhat `CONFIRMED`, publish `booking.confirmed`.
   - `inventory.failed`: cap nhat `CANCELLED_<reason>`.
7. EmailService consume `booking.confirmed`, luu notification va log mail gui toi `customerEmail`.

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

## API mau

Tao user:

```bash
curl -X POST http://localhost:8080/api/users ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"Nguyen Van A\",\"email\":\"a@example.com\"}"
```

Tao flight:

```bash
curl -X POST http://localhost:8080/api/flights ^
  -H "Content-Type: application/json" ^
  -d "{\"flightNumber\":\"VN123\",\"origin\":\"HAN\",\"destination\":\"SGN\",\"departureTime\":\"2026-05-20T09:00:00\",\"availableSeats\":20,\"price\":1500000}"
```

Dat ve:

```bash
curl -X POST http://localhost:8080/api/orders ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":1,\"flightId\":1,\"quantity\":2}"
```

Kiem tra:

- `GET http://localhost:8080/api/orders`
- `GET http://localhost:8080/api/flights`
- `GET http://localhost:8080/api/notifications`

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
