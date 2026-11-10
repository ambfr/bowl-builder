import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";
import { LiveBadge, useLiveOrders } from "./live";
import { Btn, Loading, useToast } from "./ui";

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
    <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label={"Status: " + LABEL[status]}>
      {STEPS.map((s, idx) => (
        <li key={s} className="flex items-center gap-2">
          <span className={"h-2.5 w-2.5 rounded-full " + (idx <= current ? "bg-berry" : "bg-line")} />
          <span className={idx === current ? "font-medium" : "text-ink/50"}>{LABEL[s]}</span>
          {idx < STEPS.length - 1 && <span className="h-px w-4 bg-line" />}
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order, busyAction, error, onCancel, onReorder }) {
  const anyBusy = Boolean(busyAction);
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
          <Btn
            variant="outline"
            busy={busyAction === "cancel"}
            busyLabel="Cancelling..."
            disabled={anyBusy}
            onClick={() => onCancel(order.id)}
          >
            Cancel order
          </Btn>
        )}
        <Btn
          variant="dark"
          busy={busyAction === "reorder"}
          busyLabel="Placing order..."
          disabled={anyBusy}
          onClick={() => onReorder(order.id)}
        >
          Order again
        </Btn>
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
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null); // { id, action }
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

  // Live updates: replace the order if we have it, otherwise add it at the top.
  const connected = useLiveOrders(
    token,
    "/user/queue/orders",
    (o) => {
      setOrders((prev) =>
        prev.some((x) => x.id === o.id) ? prev.map((x) => (x.id === o.id ? o : x)) : [o, ...prev]
      );
      if (o.status !== "PLACED" && o.status !== "CANCELLED") {
        toast("Order #" + o.id + " is now " + LABEL[o.status].toLowerCase() + ".");
      }
    },
    load
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function act(id, action, path) {
    setBusy({ id, action });
    setRowErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await api(path, { method: "POST", token });
      toast(action === "cancel" ? "Order #" + id + " cancelled." : "Order #" + res.id + " placed.");
      await load();
    } catch (e) {
      setRowErrors((prev) => ({ ...prev, [id]: e.message }));
    } finally {
      setBusy(null);
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
        <div className="flex items-baseline gap-5">
          <LiveBadge connected={connected} />
          <Btn variant="text" busy={refreshing} busyLabel="Refreshing..." onClick={refresh} className="!text-berry">
            Refresh
          </Btn>
        </div>
      </div>

      {error && <p className="mt-6 text-red-700">{error}</p>}
      {loading && <div className="mt-6"><Loading text="Loading your orders..." /></div>}

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
            busyAction={busy?.id === o.id ? busy.action : null}
            error={rowErrors[o.id]}
            onCancel={(id) => act(id, "cancel", "/api/orders/" + id + "/cancel")}
            onReorder={(id) => act(id, "reorder", "/api/orders/" + id + "/reorder")}
          />
        ))}
      </div>
    </main>
  );
}