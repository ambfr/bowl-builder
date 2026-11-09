// Usage: node scripts/ws-test.mjs <email> <password> [destination]
// Customers listen on /user/queue/orders, staff/admin on /topic/kitchen (or pass a destination).
import { Client } from "@stomp/stompjs";

const [email, password, forced] = process.argv.slice(2);
const res = await fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const data = await res.json();
if (!res.ok) {
  console.error("Login failed:", data.error);
  process.exit(1);
}

const isStaff = data.user.role === "ADMIN" || data.user.role === "STAFF";
const destination = forced || (isStaff ? "/topic/kitchen" : "/user/queue/orders");

const client = new Client({
  brokerURL: "ws://localhost:8080/ws",
  connectHeaders: { Authorization: "Bearer " + data.token },
  reconnectDelay: 0,
  onConnect() {
    console.log("Connected as " + data.user.email + " (" + data.user.role + "), listening on " + destination);
    client.subscribe(destination, (msg) => {
      const o = JSON.parse(msg.body);
      console.log("  order #" + o.id + " -> " + o.status + " (Rs " + o.total + ")");
    });
  },
  onStompError(frame) {
    console.error("STOMP error:", frame.headers.message);
  },
  onWebSocketError(e) {
    console.error("WebSocket error:", e.message || e);
  },
});
client.activate();
