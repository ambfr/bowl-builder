import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";
import { LiveBadge, useLiveOrders } from "./live";
import { Btn, Loading, useToast } from "./ui";

const COLUMNS = [
  { status: "PLACED", title: "New", next: "PREPARING", nextLabel: "Start preparing", busyLabel: "Starting...", canCancel: true },
  { status: "PREPARING", title: "Preparing", next: "READY", nextLabel: "Mark ready", busyLabel: "Updating...", canCancel: true },
  { status: "READY", title: "Ready for pickup", next: "PICKED_UP", nextLabel: "Picked up", busyLabel: "Updating...", canCancel: false },
];
const ACTIVE = COLUMNS.map((c) => c.status);
const MAX_PER_COLUMN = 30;

const rupees = (n) => "Rs " + Number(n).toFixed(2);
const time = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export default function Kitchen() {
  const { user, token } = useAuth();
  const toast = useToast();
  const isStaff = user && (user.role === "STAFF" || user.role === "ADMIN");

  const [orders, setOrders] = useState({}); // id -> order, active orders only
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null); // { id, action }

  const load = useCallback(async () => {
    try {
      const all = await api("/api/staff/orders", { token });
      setOrders(Object.fromEntries(all.filter((o) => ACTIVE.includes(o.status)).map((o) => [o.id, o])));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isStaff) load();
  }, [token, isStaff, load]);

  // Put an order on the board, move it, or take it off once it is finished or cancelled.
  const apply = useCallback((o) => {
    setOrders((prev) => {
      const next = { ...prev };
      if (ACTIVE.includes(o.status)) next[o.id] = o;
      else delete next[o.id];
      return next;
    });
  }, []);

  const connected = useLiveOrders(
    isStaff ? token : null,
    "/topic/kitchen",
    (o) => {
      setOrders((prev) => {
        if (o.status === "PLACED" && !prev[o.id]) toast("New order #" + o.id + ".");
        return prev;
      });
      apply(o);
    },
    load
  );

  async function move(order, status) {
    setBusy({ id: order.id, action: status });
    try {
      const updated = await api("/api/orders/" + order.id + "/status", {
        method: "PATCH",
        token,
        body: { status },
      });
      apply(updated);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(null);
    }
  }

  function cancel(order) {
    if (window.confirm("Cancel order #" + order.id + "? The ingredients go back into stock.")) {
      move(order, "CANCELLED");
    }
  }

  if (!isStaff) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h2 className="font-display text-4xl tracking-tight">Kitchen</h2>
        <p className="mt-3 text-ink/60">
          This page is for kitchen staff.{" "}
          <Link to="/" className="font-medium text-berry hover:underline">
            Back to the builder
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-4xl tracking-tight">Kitchen</h2>
        <LiveBadge connected={connected} />
      </div>

      {error && <p className="mt-6 text-red-700">{error}</p>}
      {loading && <div className="mt-6"><Loading text="Loading orders..." /></div>}

      {!loading && (
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const list = Object.values(orders)
              .filter((o) => o.status === col.status)
              .sort((a, b) => a.id - b.id);
            const visible = list.slice(0, MAX_PER_COLUMN);
            return (
              <section key={col.status}>
                <div className="flex items-baseline justify-between border-b border-ink pb-2">
                  <h3 className="font-display text-xl">{col.title}</h3>
                  <span className="text-sm text-ink/50">{list.length}</span>
                </div>

                {list.length === 0 && <p className="py-6 text-sm text-ink/40">Nothing here.</p>}

                {visible.map((o) => {
                  const mine = busy?.id === o.id;
                  return (
                    <article key={o.id} className="border-b border-line py-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <h4 className="font-medium">#{o.id}</h4>
                        <span className="text-sm text-ink/50">{time(o.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-ink/50">
                        {o.size[0] + o.size.slice(1).toLowerCase()} bowl - {rupees(o.total)}
                      </p>
                      <p className="mt-2 text-sm">{o.items.map((i) => i.name).join(", ")}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <Btn
                          variant="dark"
                          busy={mine && busy.action === col.next}
                          busyLabel={col.busyLabel}
                          disabled={mine}
                          onClick={() => move(o, col.next)}
                        >
                          {col.nextLabel}
                        </Btn>
                        {col.canCancel && (
                          <Btn
                            variant="text"
                            busy={mine && busy.action === "CANCELLED"}
                            busyLabel="Cancelling..."
                            disabled={mine}
                            onClick={() => cancel(o)}
                          >
                            Cancel
                          </Btn>
                        )}
                      </div>
                    </article>
                  );
                })}

                {list.length > visible.length && (
                  <p className="pt-3 text-sm text-ink/50">+{list.length - visible.length} more waiting</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}