import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";
import BowlPicture from "./BowlPicture";
import { swatchFor } from "./palette";
import { Btn, Loading, Spinner, useToast } from "./ui";

const SIZES = ["SMALL", "MEDIUM", "LARGE"];
const rupees = (n) => "Rs " + Number(n).toFixed(2);

function Check() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.5l2.5 2.5 4.5-5.5" />
    </svg>
  );
}

function Row({ item, selected, onClick }) {
  const out = item.stock < 1;
  return (
    <button
      type="button"
      disabled={out}
      onClick={onClick}
      aria-pressed={selected}
      className="flex w-full items-center gap-3 border-b border-line py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10"
        style={{ background: swatchFor(item.name) }}
      />
      <span className="flex-1 font-medium">{item.name}</span>
      <span className="text-sm text-ink/60">{out ? "Sold out" : rupees(item.price)}</span>
      <span
        className={
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition " +
          (selected ? "border-berry bg-berry text-white" : "border-line text-transparent")
        }
      >
        <Check />
      </span>
    </button>
  );
}

function Group({ title, hint, children }) {
  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-display text-xl">{title}</h2>
        {hint && <span className="text-sm text-ink/50">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export default function Builder() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  // "Edit in builder" on the favorites page passes the saved bowl here.
  const preset = useLocation().state?.bowl;

  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [baseId, setBaseId] = useState(preset?.baseId ?? null);
  const [toppingIds, setToppingIds] = useState(preset?.toppingIds ?? []);
  const [drizzleIds, setDrizzleIds] = useState(preset?.drizzleIds ?? []);
  const [size, setSize] = useState(preset?.size ?? "MEDIUM");
  const [promo, setPromo] = useState("");
  const [pricing, setPricing] = useState(null);
  const [pricingBusy, setPricingBusy] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [favName, setFavName] = useState("");
  const [savingFav, setSavingFav] = useState(false);

  const loadIngredients = useCallback(() => {
    api("/api/ingredients")
      .then((list) => {
        setIngredients(list.sort((a, b) => a.id - b.id));
        setLoadError("");
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoadingIngredients(false));
  }, []);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const byCategory = (c) => ingredients.filter((i) => i.category === c);
  const byId = useMemo(() => Object.fromEntries(ingredients.map((i) => [i.id, i])), [ingredients]);

  // Re-price from the server (debounced) whenever the selection changes.
  useEffect(() => {
    if (!baseId) {
      setPricing(null);
      setPriceError("");
      setPricingBusy(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setPricingBusy(true);
      api("/api/bowls/price", {
        method: "POST",
        body: { baseId, toppingIds, drizzleIds, size, promoCode: promo.trim() || null },
      })
        .then((p) => {
          if (cancelled) return;
          setPricing(p);
          setPriceError("");
        })
        .catch((e) => {
          if (cancelled) return;
          setPricing(null);
          setPriceError(e.message);
        })
        .finally(() => {
          if (!cancelled) setPricingBusy(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [baseId, toppingIds, drizzleIds, size, promo]);

  const toggle = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function placeOrder() {
    if (!user) {
      navigate("/login");
      return;
    }
    setPlacing(true);
    setOrderError("");
    try {
      await api("/api/orders", {
        method: "POST",
        token,
        body: { baseId, toppingIds, drizzleIds, size, promoCode: promo.trim() || null },
      });
      toast("Order placed.");
      navigate("/orders");
    } catch (e) {
      setOrderError(e.message);
      loadIngredients(); // stock may have changed while the person was choosing
    } finally {
      setPlacing(false);
    }
  }

  async function saveFavorite() {
    const name = favName.trim();
    if (!name) {
      toast("Give your bowl a name first.", "error");
      return;
    }
    setSavingFav(true);
    try {
      await api("/api/favorites", {
        method: "POST",
        token,
        body: { name, baseId, toppingIds, drizzleIds, size },
      });
      toast('Saved "' + name + '" to your favorites.');
      setFavName("");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSavingFav(false);
    }
  }

  const base = byId[baseId];
  const toppings = toppingIds.map((id) => byId[id]).filter(Boolean);
  const drizzles = drizzleIds.map((id) => byId[id]).filter(Boolean);
  const sizeFactor = size === "SMALL" ? 0.8 : size === "LARGE" ? 1.3 : 1;
  const discounted = pricing && Number(pricing.total) < Number(pricing.subtotal) * sizeFactor - 0.005;

  return (
    <main className="mx-auto grid max-w-6xl gap-12 px-6 py-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="lg:sticky lg:top-8 lg:self-start">
        <BowlPicture base={base} toppings={toppings} drizzles={drizzles} size={size} />

        <div className="mx-auto mt-6 max-w-md">
          {priceError && <p className="mb-3 text-sm text-red-700">{priceError}</p>}

          {pricing ? (
            <>
              <div className="flex items-end justify-between border-t border-line pt-4">
                <span className="flex items-center gap-2 font-display text-xl text-ink/70">
                  Total {pricingBusy && <Spinner className="h-4 w-4 text-berry" />}
                </span>
                <span className={"font-display text-5xl tracking-tight transition-opacity " + (pricingBusy ? "opacity-50" : "")}>
                  {rupees(pricing.total)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-line text-center">
                <div>
                  <div className="font-semibold">{pricing.nutrition.calories}</div>
                  <div className="text-sm text-ink/50">kcal</div>
                </div>
                <div>
                  <div className="font-semibold">{pricing.nutrition.proteinG} g</div>
                  <div className="text-sm text-ink/50">protein</div>
                </div>
                <div>
                  <div className="font-semibold">{pricing.nutrition.sugarG} g</div>
                  <div className="text-sm text-ink/50">sugar</div>
                </div>
              </div>
              {discounted && <p className="mt-3 text-center text-sm text-berry">Promo code applied</p>}

              <Btn
                variant="berry"
                size="lg"
                className="mt-6"
                busy={placing}
                busyLabel="Placing your order..."
                onClick={placeOrder}
              >
                {user ? "Place order" : "Sign in to order"}
              </Btn>
              {orderError && (
                <p role="alert" className="mt-3 text-center text-sm text-red-700">
                  {orderError}
                </p>
              )}

              {user && (
                <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                  <input
                    value={favName}
                    onChange={(e) => setFavName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !savingFav && saveFavorite()}
                    maxLength={50}
                    placeholder="Name this bowl"
                    aria-label="Favorite name"
                    className="flex-1 border-0 border-b border-line bg-transparent py-2 focus:border-berry focus:outline-none"
                  />
                  <Btn variant="outline" busy={savingFav} busyLabel="Saving..." onClick={saveFavorite}>
                    Save to favorites
                  </Btn>
                </div>
              )}
            </>
          ) : (
            !priceError && (
              <p className="border-t border-line pt-4 text-center text-ink/50">
                {pricingBusy ? "Working out your price..." : "Pick a base and your price will appear here."}
              </p>
            )
          )}
        </div>
      </div>

      <div className="space-y-9">
        {loadError && <p className="text-red-700">Could not load ingredients: {loadError}</p>}
        {loadingIngredients && <Loading text="Loading ingredients..." />}

        {!loadingIngredients && (
          <>
            <Group title="Base" hint="Pick one">
              {byCategory("BASE").map((i) => (
                <Row key={i.id} item={i} selected={baseId === i.id} onClick={() => setBaseId(i.id)} />
              ))}
            </Group>

            <Group title="Toppings" hint="As many as you like">
              {byCategory("TOPPING").map((i) => (
                <Row
                  key={i.id}
                  item={i}
                  selected={toppingIds.includes(i.id)}
                  onClick={() => toggle(toppingIds, setToppingIds, i.id)}
                />
              ))}
            </Group>

            <Group title="Drizzles" hint="As many as you like">
              {byCategory("DRIZZLE").map((i) => (
                <Row
                  key={i.id}
                  item={i}
                  selected={drizzleIds.includes(i.id)}
                  onClick={() => toggle(drizzleIds, setDrizzleIds, i.id)}
                />
              ))}
            </Group>

            <Group title="Size">
              <div className="mt-2 inline-flex rounded-full border border-line bg-white p-1">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={
                      "rounded-full px-5 py-1.5 text-sm font-medium transition " +
                      (size === s ? "bg-ink text-white" : "text-ink/70 hover:text-ink")
                    }
                  >
                    {s[0] + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Promo code">
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Have a code?"
                aria-label="Promo code"
                className="mt-2 w-full border-0 border-b border-line bg-transparent py-2 uppercase placeholder:normal-case placeholder:text-ink/40 focus:border-berry focus:outline-none"
              />
            </Group>
          </>
        )}
      </div>
    </main>
  );
}