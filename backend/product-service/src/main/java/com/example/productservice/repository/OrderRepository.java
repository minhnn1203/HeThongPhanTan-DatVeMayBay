package com.example.productservice.repository;

import com.example.productservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByFlightId(Long flightId);
    List<Order> findByStatus(String status);
}