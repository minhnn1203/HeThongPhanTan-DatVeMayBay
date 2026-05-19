package com.example.productservice.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "FLIGHTS")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String flightNumber;

    @NotBlank
    private String origin;

    @NotBlank
    private String destination;

    private String departureTime;

    @Min(0)
    private Integer availableSeats;

    @Min(0)
    private Double price;

    public Product() {}

    public Product(String flightNumber, String origin, String destination, String departureTime, Integer availableSeats, Double price) {
        this.flightNumber = flightNumber;
        this.origin = origin;
        this.destination = destination;
        this.departureTime = departureTime;
        this.availableSeats = availableSeats;
        this.price = price;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return flightNumber;
    }

    public String getFlightNumber() {
        return flightNumber;
    }

    public Integer getStock() {
        return availableSeats;
    }

    public void setName(String name) {
        this.flightNumber = name;
    }

    public void setFlightNumber(String flightNumber) {
        this.flightNumber = flightNumber;
    }

    public Integer getStockValue() {
        return availableSeats;
    }

    public void setStock(Integer stock) {
        this.availableSeats = stock;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getDepartureTime() {
        return departureTime;
    }

    public void setDepartureTime(String departureTime) {
        this.departureTime = departureTime;
    }

    public Integer getAvailableSeats() {
        return availableSeats;
    }

    public void setAvailableSeats(Integer availableSeats) {
        this.availableSeats = availableSeats;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }
}
