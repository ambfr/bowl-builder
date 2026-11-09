import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";

const rupees = (n) => "Rs " + Number(n).toFixed(2);

export default function Favorites() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
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

  async function orderNow(fav) {
    setBusyId(fav.id);
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
      navigate("/orders");
    } catch (e) {
      setRowErrors((prev) => ({ ...prev, [fav.id]: e.message }));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(fav) {
    setBusyId(fav.id);
    try {
      await api("/api/favorites/" + fav.id, { method: "DELETE", token });
      await load();
    } catch (e) {
      setRowErrors((prev) => ({ ...prev, [fav.id]: e.message }));
    } finally {
      setBusyId(null);
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
      {loading && <p className="mt-6 text-ink/50">Loading...</p>}

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
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busyId === f.id || !f.pricing}
                  onClick={() => orderNow(f)}
                  className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-white transition disabled:opacity-50"
                >
                  Order now
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/", { state: { bowl: f } })}
                  className="rounded-full border border-line px-4 py-1.5 text-sm font-medium transition hover:border-ink"
                >
                  Edit in builder
                </button>
                <button
                  type="button"
                  disabled={busyId === f.id}
                  onClick={() => remove(f)}
                  className="px-2 py-1.5 text-sm font-medium text-ink/60 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
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