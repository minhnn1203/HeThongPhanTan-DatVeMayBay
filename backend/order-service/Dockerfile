FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/order-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8083
CMD ["java", "-jar", "app.jar"]
