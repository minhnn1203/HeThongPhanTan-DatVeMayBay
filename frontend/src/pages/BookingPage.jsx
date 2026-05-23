import { useState } from "react";
import { createOrder } from "../api";

function BookingPage({ flight, onBack, user }) {
    const [quantity, setQuantity] = useState(1);
    const [success, setSuccess] = useState(false);

    const handleBooking = async () => {
        try {
            await createOrder({
                userId: user.userId,
                flightId: flight.id,
                quantity: Number(quantity),
                token: user.token
            });

            setSuccess(true);
        }   catch (error) {
            console.error(error);
            alert("Đặt vé thất bại");
        }
    };

    return (
        <div style={{ marginTop: "30px" }}>
        <button onClick={onBack}>
            ← Quay lại
        </button>

        <h2>Đặt vé máy bay</h2>

        <div
            style={{
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "10px",
            marginTop: "20px",
            }}
        >
            <h3>{flight.flightNumber}</h3>

            <p>
            {flight.from} → {flight.to}
            </p>

            <p>Giờ bay: {flight.departureTime}</p>

            <p>
            Giá: {flight.price.toLocaleString()} VNĐ
            </p>

            <div className="form-group">
            <label>Số lượng vé</label>

            <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
            />
            </div>

            <button
            className="primary-button"
            onClick={handleBooking}
            >
            Xác nhận đặt vé
            </button>

            {success && (
            <div
                className="message-box success"
                style={{ marginTop: "20px" }}
            >
                Đặt vé thành công!
            </div>
            )}
        </div>
        </div>
    );
}

export default BookingPage;