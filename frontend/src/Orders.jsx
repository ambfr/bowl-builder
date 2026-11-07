import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";

const STEPS = ["PLACED", "PREPARING", "READY", "PICKED_UP"];
const LABEL = {
  PLACED: "Placed",
  PREPARING: "Preparing",
  READY: "Ready",
  PICKED_UP: "Picked up",
  CANCELLED: "Cancelled",
};
const rupees = (n) => "Rs " + Number(n).toFixed(2);
const when = (iso) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Progress({ status }) {
  if (status === "CANCELLED") {
    return <p className="text-sm text-ink/50">This order was cancelled.</p>;
  }
  const current = STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label={"Status: " + LABEL[status]}>
      {STEPS.map((s, idx) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={
              "h-2.5 w-2.5 rounded-full " + (idx <= current ? "bg-berry" : "bg-line")
            }
          />
          <span className={idx === current ? "font-medium" : "text-ink/50"}>{LABEL[s]}</span>
          {idx < STEPS.length - 1 && <span className="h-px w-4 bg-line" />}
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order, busy, error, onCancel, onReorder }) {
  return (
    <article className="border-b border-line py-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-xl">Order #{order.id}</h3>
        <span className="font-display text-2xl">{rupees(order.total)}</span>
      </div>
      <p className="mt-1 text-sm text-ink/50">
        {when(order.createdAt)} - {order.size[0] + order.size.slice(1).toLowerCase()} bowl
        {order.promoCode ? " - code " + order.promoCode : ""}
      </p>
      <p className="mt-3">{order.items.map((i) => i.name).join(", ")}</p>
      <div className="mt-4">
        <Progress status={order.status} />
      </div>
      <div className="mt-4 flex gap-3">
        {order.status === "PLACED" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(order.id)}
            className="rounded-full border border-line px-4 py-1.5 text-sm font-medium transition hover:border-ink disabled:opacity-50"
          >
            Cancel order
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onReorder(order.id)}
          className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-white transition disabled:opacity-50"
        >
          Order again
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </article>
  );
}

export default function Orders() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  const load = useCallback(async () => {
    try {
      setOrders(await api("/api/orders", { token }));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function act(id, path) {
    setBusyId(id);
    setRowErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      await api(path, { method: "POST", token });
      await load();
    } catch (e) {
      setRowErrors((prev) => ({ ...prev, [id]: e.message }));
    } finally {
      setBusyId(null);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h2 className="font-display text-4xl tracking-tight">Your orders</h2>
        <p className="mt-3 text-ink/60">
          <Link to="/login" className="font-medium text-berry hover:underline">
            Sign in
          </Link>{" "}
          to see your orders.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-4xl tracking-tight">Your orders</h2>
        <button type="button" onClick={load} className="text-sm font-medium text-berry hover:underline">
          Refresh
        </button>
      </div>

      {error && <p className="mt-6 text-red-700">{error}</p>}
      {loading && <p className="mt-6 text-ink/50">Loading...</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="mt-6 text-ink/60">
          No orders yet.{" "}
          <Link to="/" className="font-medium text-berry hover:underline">
            Build your first bowl
          </Link>
        </p>
      )}

      <div className="mt-6 border-t border-line">
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            busy={busyId === o.id}
            error={rowErrors[o.id]}
            onCancel={(id) => act(id, "/api/orders/" + id + "/cancel")}
            onReorder={(id) => act(id, "/api/orders/" + id + "/reorder")}
          />
        ))}
      </div>
    </main>
  );
}