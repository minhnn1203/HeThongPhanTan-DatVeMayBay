package com.example.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class GatewayFallbackController {

    @GetMapping("/booking")
    public Mono<ResponseEntity<Map<String, Object>>> bookingFallbackGet() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "error", "Booking service is temporarily unavailable",
                "message", "The circuit breaker has opened due to multiple failures. Please try again later.",
                "status", 503
        )));
    }

    @PostMapping("/booking")
    public Mono<ResponseEntity<Map<String, Object>>> bookingFallbackPost() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "error", "Booking service is temporarily unavailable",
                "message", "The circuit breaker has opened due to multiple failures. Please try again later.",
                "status", 503
        )));
    }
}
