import { useState } from "react";
import BookingPage from "./BookingPage";

function SearchFlightPage({ user }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Fake data trước
  const [flights, setFlights] = useState([]);

  const handleSearch = async () => {
    // Sau này gọi API backend ở đây

    const fakeFlights = [
      {
        id: 1,
        flightNumber: "VN123",
        from: from,
        to: to,
        departureTime: "08:00",
        price: 1500000,
      },
      {
        id: 2,
        flightNumber: "VJ456",
        from: from,
        to: to,
        departureTime: "14:30",
        price: 1200000,
      },
    ];

    setFlights(fakeFlights);
  };

  if (selectedFlight) {
    return (
      <BookingPage
        flight={selectedFlight}
        onBack={() => setSelectedFlight(null)}
        user={user}
      />
    );
  }

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>Tìm kiếm chuyến bay</h2>

      <div className="form-group">
        <label>Điểm đi</label>
        <input
          type="text"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Hà Nội"
        />
      </div>

      <div className="form-group">
        <label>Điểm đến</label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Đà Nẵng"
        />
      </div>

      <div className="form-group">
        <label>Ngày bay</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <button className="primary-button" onClick={handleSearch}>
        Tìm chuyến bay
      </button>

      <div style={{ marginTop: "20px" }}>
        {flights.map((flight) => (
          <div
            key={flight.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>{flight.flightNumber}</h3>

            <p>
              {flight.from} → {flight.to}
            </p>

            <p>Giờ bay: {flight.departureTime}</p>

            <p>Giá: {flight.price.toLocaleString()} VNĐ</p>

            <button
              className="primary-button"
              onClick={() => setSelectedFlight(flight)}
            >
              Đặt vé
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchFlightPage;