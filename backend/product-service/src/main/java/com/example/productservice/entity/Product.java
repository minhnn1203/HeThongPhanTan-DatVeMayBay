package com.example.productservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "FLIGHTS")
public class Product {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    /** Mã chuyến bay — bắt buộc, VD: "VN123" */
    @NotBlank
    @Column(nullable = false, unique = true, length = 20)
    private String flightNumber;
 
    /** Sân bay khởi hành — mã IATA, VD: "HAN" */
    @NotBlank
    @Column(nullable = false, length = 10)
    private String origin;
 
    /** Sân bay đến — mã IATA, VD: "SGN" */
    @NotBlank
    @Column(nullable = false, length = 10)
    private String destination;
 
    /**
     * Thời gian khởi hành — lưu dạng ISO-8601 string.
     * VD: "2025-06-15T07:30:00"
     * Dùng String để AdminFlightTicketPage truyền thẳng giá trị datetime-local.
     */
    @NotBlank
    @Column(nullable = false)
    private String departureTime;
 
    /**
     * Thời gian hạ cánh dự kiến — bổ sung.
     * VD: "2025-06-15T09:00:00"
     */
    @Column
    private String arrivalTime;
 
    /** Số ghế còn bán — phải >= 0 */
    @Min(0)
    @NotNull
    @Column(nullable = false)
    private Integer availableSeats;
 
    /** Giá vé — đơn vị VND, phải >= 0 */
    @Min(0)
    @NotNull
    @Column(nullable = false)
    private Double price;
 
    /**
     * Hãng hàng không — bổ sung.
     * VD: "Vietnam Airlines", "VietJet Air", "Bamboo Airways"
     */
    @Column(length = 100)
    private String airline;
 
    /**
     * Loại máy bay — bổ sung.
     * VD: "Airbus A321", "Boeing 787"
     */
    @Column(length = 50)
    private String aircraftType;
 
    /**
     * Trạng thái chuyến bay — bổ sung.
     * Giá trị: SCHEDULED | DELAYED | CANCELLED | DEPARTED | LANDED
     */
    @Column(length = 20)
    private String status = "SCHEDULED";
 
    // ─── Constructors ────────────────────────────────────────────────────────
 
    public Product() {}
 
    /** Constructor đầy đủ — dùng khi tạo từ code hoặc test. */
    public Product(String flightNumber, String origin, String destination,
                   String departureTime, String arrivalTime,
                   Integer availableSeats, Double price,
                   String airline, String aircraftType, String status) {
        this.flightNumber  = flightNumber;
        this.origin        = origin;
        this.destination   = destination;
        this.departureTime = departureTime;
        this.arrivalTime   = arrivalTime;
        this.availableSeats = availableSeats;
        this.price         = price;
        this.airline       = airline;
        this.aircraftType  = aircraftType;
        this.status        = status != null ? status : "SCHEDULED";
    }
 
    /** Constructor tối giản — tương thích ngược với code cũ. */
    public Product(String flightNumber, String origin, String destination,
                   String departureTime, Integer availableSeats, Double price) {
        this(flightNumber, origin, destination, departureTime,
             null, availableSeats, price, null, null, "SCHEDULED");
    }
 
    // ─── Getters & Setters ───────────────────────────────────────────────────
 
    public Long getId() { return id; }
 
    /**
     * getName() — alias của getFlightNumber().
     * Giữ tương thích với ProductController.update() đang gọi existing.setName().
     */
    public String getName()          { return flightNumber; }
    public void   setName(String n)  { this.flightNumber = n; }
 
    public String getFlightNumber()               { return flightNumber; }
    public void   setFlightNumber(String v)       { this.flightNumber = v; }
 
    public String getOrigin()                     { return origin; }
    public void   setOrigin(String v)             { this.origin = v; }
 
    public String getDestination()                { return destination; }
    public void   setDestination(String v)        { this.destination = v; }
 
    public String getDepartureTime()              { return departureTime; }
    public void   setDepartureTime(String v)      { this.departureTime = v; }
 
    public String getArrivalTime()                { return arrivalTime; }
    public void   setArrivalTime(String v)        { this.arrivalTime = v; }
 
    public Integer getAvailableSeats()            { return availableSeats; }
    public void    setAvailableSeats(Integer v)   { this.availableSeats = v; }
 
    /** getStock() / setStock() — alias tương thích ngược. */
    public Integer getStock()                     { return availableSeats; }
    public void    setStock(Integer v)            { this.availableSeats = v; }
 
    public Double getPrice()                      { return price; }
    public void   setPrice(Double v)              { this.price = v; }
 
    public String getAirline()                    { return airline; }
    public void   setAirline(String v)            { this.airline = v; }
 
    public String getAircraftType()               { return aircraftType; }
    public void   setAircraftType(String v)       { this.aircraftType = v; }
 
    public String getStatus()                     { return status; }
    public void   setStatus(String v)             { this.status = v; }
}
