package com.example.productservice.controller;

import com.example.productservice.entity.Product;
import com.example.productservice.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/flights", "/api/products"})
public class ProductController {
    private final ProductRepository repository;

    public ProductController(ProductRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Product> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> create(@Validated @RequestBody Product product) {
        // Đảm bảo status mặc định nếu client không gửi
        if (product.getStatus() == null || product.getStatus().isBlank()) {
            product.setStatus("SCHEDULED");
        }
        Product saved = repository.save(product);
        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(
            @PathVariable Long id,
            @Validated @RequestBody Product product) {
 
        return repository.findById(id)
                .map(existing -> {
                    // ── Các field gốc ──────────────────────────────────────
                    existing.setName(product.getName());                     // alias → flightNumber
                    existing.setOrigin(product.getOrigin());
                    existing.setDestination(product.getDestination());
                    existing.setDepartureTime(product.getDepartureTime());
                    existing.setAvailableSeats(product.getAvailableSeats());
                    existing.setPrice(product.getPrice());
 
                    // ── Các field bổ sung ──────────────────────────────────
                    if (product.getArrivalTime() != null) {
                        existing.setArrivalTime(product.getArrivalTime());
                    }
                    if (product.getAirline() != null) {
                        existing.setAirline(product.getAirline());
                    }
                    if (product.getAircraftType() != null) {
                        existing.setAircraftType(product.getAircraftType());
                    }
                    if (product.getStatus() != null && !product.getStatus().isBlank()) {
                        existing.setStatus(product.getStatus());
                    }
 
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return repository.findById(id)
                .map(existing -> {
                    repository.delete(existing);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
