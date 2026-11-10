import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";

/**
 * Connects to the order feed with the JWT and calls onOrder for every pushed order.
 * onConnected runs on every (re)connect so the page can reload anything it missed.
 * Returns true while connected.
 */
export function useLiveOrders(token, destination, onOrder, onConnected) {
  const [connected, setConnected] = useState(false);
  const orderHandler = useRef(onOrder);
  const connectHandler = useRef(onConnected);

  useEffect(() => {
    orderHandler.current = onOrder;
    connectHandler.current = onConnected;
  });

  useEffect(() => {
    if (!token) return undefined;
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: "Bearer " + token },
      reconnectDelay: 5000,
      onConnect() {
        setConnected(true);
        client.subscribe(destination, (msg) => {
          try {
            orderHandler.current(JSON.parse(msg.body));
          } catch {
            // ignore a malformed message rather than breaking the page
          }
        });
        if (connectHandler.current) connectHandler.current();
      },
      onWebSocketClose() {
        setConnected(false);
      },
      onStompError() {
        setConnected(false);
      },
    });
    client.activate();
    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [token, destination]);

  return connected;
}

export function LiveBadge({ connected }) {
  return (
    <span className="flex items-center gap-2 text-sm text-ink/60" role="status">
      <span className={"h-2 w-2 rounded-full " + (connected ? "bg-green-600" : "bg-line")} />
      {connected ? "Live" : "Reconnecting..."}
    </span>
  );
}