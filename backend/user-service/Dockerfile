FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
RUN apt-get update && apt-get install -y -qq wget openssl && \
    echo | openssl s_client -connect repo.maven.apache.org:443 -servername repo.maven.apache.org 2>/dev/null | \
    openssl x509 > /tmp/maven.crt 2>/dev/null && \
    keytool -import -trustcacerts -alias maven-central -file /tmp/maven.crt \
        -keystore $JAVA_HOME/lib/security/cacerts -storepass changeit -noprompt 2>/dev/null || true
COPY pom.xml .
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/user-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081
CMD ["java", "-jar", "app.jar"]