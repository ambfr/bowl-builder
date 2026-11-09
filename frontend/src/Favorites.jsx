import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";
import { Btn, Loading, useToast } from "./ui";

const rupees = (n) => "Rs " + Number(n).toFixed(2);

export default function Favorites() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [favorites, setFavorites] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null); // { id, action }
  const [confirmId, setConfirmId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  const load = useCallback(async () => {
    try {
      const [favs, ings] = await Promise.all([
        api("/api/favorites", { token }),
        api("/api/ingredients"),
      ]);
      setFavorites(favs);
      setNames(Object.fromEntries(ings.map((i) => [i.id, i.name])));
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

  const isBusy = (f, action) => busy?.id === f.id && busy.action === action;
  const anyBusy = (f) => busy?.id === f.id;

  async function orderNow(fav) {
    setBusy({ id: fav.id, action: "order" });
    setRowErrors((prev) => ({ ...prev, [fav.id]: "" }));
    try {
      await api("/api/orders", {
        method: "POST",
        token,
        body: {
          baseId: fav.baseId,
          toppingIds: fav.toppingIds,
          drizzleIds: fav.drizzleIds,
          size: fav.size,
          promoCode: null,
        },
      });
      toast("Order placed.");
      navigate("/orders");
    } catch (e) {
      setRowErrors((prev) => ({ ...prev, [fav.id]: e.message }));
    } finally {
      setBusy(null);
    }
  }

  async function remove(fav) {
    setBusy({ id: fav.id, action: "remove" });
    try {
      await api("/api/favorites/" + fav.id, { method: "DELETE", token });
      toast('Removed "' + fav.name + '".');
      setConfirmId(null);
      await load();
    } catch (e) {
      setRowErrors((prev) => ({ ...prev, [fav.id]: e.message }));
    } finally {
      setBusy(null);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h2 className="font-display text-4xl tracking-tight">Favorites</h2>
        <p className="mt-3 text-ink/60">
          <Link to="/login" className="font-medium text-berry hover:underline">
            Sign in
          </Link>{" "}
          to see your saved bowls.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h2 className="font-display text-4xl tracking-tight">Favorites</h2>

      {error && <p className="mt-6 text-red-700">{error}</p>}
      {loading && <div className="mt-6"><Loading text="Loading your favorites..." /></div>}

      {!loading && !error && favorites.length === 0 && (
        <p className="mt-6 text-ink/60">
          Nothing saved yet. Build a bowl and use{" "}
          <Link to="/" className="font-medium text-berry hover:underline">
            Save to favorites
          </Link>
          .
        </p>
      )}

      <div className="mt-6 border-t border-line">
        {favorites.map((f) => {
          const items = [f.baseId, ...f.toppingIds, ...f.drizzleIds]
            .map((id) => names[id] || "Removed ingredient")
            .join(", ");
          return (
            <article key={f.id} className="border-b border-line py-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-xl">{f.name}</h3>
                {f.pricing ? (
                  <span className="font-display text-2xl">{rupees(f.pricing.total)}</span>
                ) : (
                  <span className="text-sm text-ink/50">Price unavailable</span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink/50">
                {f.size[0] + f.size.slice(1).toLowerCase()} bowl
                {f.pricing ? " - " + f.pricing.nutrition.calories + " kcal" : ""}
              </p>
              <p className="mt-3">{items}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {confirmId === f.id ? (
                  <>
                    <span className="text-sm text-ink/60">Remove this bowl?</span>
                    <Btn variant="berry" busy={isBusy(f, "remove")} busyLabel="Removing..." onClick={() => remove(f)}>
                      Yes, remove
                    </Btn>
                    <Btn variant="outline" disabled={anyBusy(f)} onClick={() => setConfirmId(null)}>
                      Keep
                    </Btn>
                  </>
                ) : (
                  <>
                    <Btn
                      variant="dark"
                      busy={isBusy(f, "order")}
                      busyLabel="Placing order..."
                      disabled={anyBusy(f) || !f.pricing}
                      onClick={() => orderNow(f)}
                    >
                      Order now
                    </Btn>
                    <Btn variant="outline" onClick={() => navigate("/", { state: { bowl: f } })}>
                      Edit in builder
                    </Btn>
                    <Btn variant="text" disabled={anyBusy(f)} onClick={() => setConfirmId(f.id)}>
                      Remove
                    </Btn>
                  </>
                )}
              </div>
              {rowErrors[f.id] && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {rowErrors[f.id]}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}