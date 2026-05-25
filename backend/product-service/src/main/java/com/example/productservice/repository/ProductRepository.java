package com.example.productservice.repository;

import com.example.productservice.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
     /** Tìm chuyến bay theo điểm đi và điểm đến. */
    List<Product> findByOriginAndDestination(String origin, String destination);
 
    /** Tìm chuyến bay còn ghế trống. */
    List<Product> findByAvailableSeatsGreaterThan(Integer minSeats);
 
    /** Tìm theo trạng thái (SCHEDULED / DELAYED / CANCELLED ...). */
    List<Product> findByStatus(String status);
 
    /** Tìm theo mã chuyến bay (không phân biệt hoa thường). */
    List<Product> findByFlightNumberContainingIgnoreCase(String keyword);
 
    /**
     * Tìm chuyến bay khởi hành trong một khoảng thời gian.
     * departureTime lưu dạng String ISO-8601, so sánh lexicographic vẫn đúng
     * nếu định dạng nhất quán (yyyy-MM-ddTHH:mm:ss).
     */
    @Query("SELECT p FROM Product p WHERE p.departureTime BETWEEN :from AND :to")
    List<Product> findByDepartureTimeBetween(String from, String to);
}
