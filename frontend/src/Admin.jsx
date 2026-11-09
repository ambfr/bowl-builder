import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";
import { swatchFor } from "./palette";
import { Btn, Loading, useToast } from "./ui";

const CATEGORIES = ["BASE", "TOPPING", "DRIZZLE"];
const rupees = (n) => "Rs " + Number(n).toFixed(2);

function StockRow({ item, token, onSaved }) {
  const toast = useToast();
  const [value, setValue] = useState(String(item.stock));
  const [busy, setBusy] = useState(false);
  const valid = /^\d+$/.test(value);
  const changed = value !== String(item.stock);

  async function save() {
    setBusy(true);
    try {
      await api("/api/ingredients/" + item.id + "/stock", {
        method: "PATCH",
        token,
        body: { stock: Number(value) },
      });
      toast(item.name + " stock set to " + value + ".");
      await onSaved();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-line py-3">
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10"
        style={{ background: swatchFor(item.name) }}
      />
      <span className="flex-1 font-medium">{item.name}</span>
      <span className="hidden text-sm text-ink/50 sm:inline">{rupees(item.price)}</span>
      {item.stock < 10 && <span className="text-sm text-berry">Low stock</span>}
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={"Stock for " + item.name}
        className="w-20 rounded-lg border border-line bg-white px-2 py-1 text-right"
      />
      <Btn busy={busy} busyLabel="Saving..." disabled={!changed || !valid} onClick={save}>
        Save
      </Btn>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-sm text-ink/60">{label}</span>
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-0 border-b border-line bg-transparent py-2 focus:border-berry focus:outline-none"
      />
    </label>
  );
}

const EMPTY = { name: "", category: "TOPPING", price: "", calories: "", proteinG: "", sugarG: "", stock: "100" };

export default function Admin() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api("/api/ingredients");
      list.sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.id - b.id);
      setIngredients(list);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));

  async function addIngredient() {
    const body = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      calories: parseInt(form.calories, 10),
      proteinG: Number(form.proteinG),
      sugarG: Number(form.sugarG),
      stock: parseInt(form.stock, 10),
    };
    const numbers = [body.price, body.calories, body.proteinG, body.sugarG, body.stock];
    if (!body.name || numbers.some((n) => !Number.isFinite(n) || n < 0)) {
      toast("Enter a name and a valid number in every other field.", "error");
      return;
    }
    setAdding(true);
    try {
      await api("/api/ingredients", { method: "POST", token, body });
      toast(body.name + " added.");
      setForm(EMPTY);
      await load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setAdding(false);
    }
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h2 className="font-display text-4xl tracking-tight">Admin</h2>
        <p className="mt-3 text-ink/60">
          This page is for admin accounts.{" "}
          <Link to="/" className="font-medium text-berry hover:underline">
            Back to the builder
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h2 className="font-display text-4xl tracking-tight">Ingredients and stock</h2>
      <p className="mt-2 text-ink/60">Set the exact number of portions in stock. Changes show up in the builder straight away.</p>

      {error && <p className="mt-6 text-red-700">{error}</p>}
      {loading && <div className="mt-6"><Loading text="Loading ingredients..." /></div>}

      <div className="mt-8 border-t border-line">
        {ingredients.map((i) => (
          <StockRow key={i.id} item={i} token={token} onSaved={load} />
        ))}
      </div>

      <h3 className="mt-14 font-display text-2xl">Add an ingredient</h3>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
        <Field label="Name" value={form.name} onChange={set("name")} />
        <label className="block">
          <span className="text-sm text-ink/60">Category</span>
          <select
            value={form.category}
            onChange={(e) => set("category")(e.target.value)}
            className="mt-1 w-full border-0 border-b border-line bg-transparent py-2 focus:border-berry focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c[0] + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <Field label="Price (Rs)" type="number" value={form.price} onChange={set("price")} />
        <Field label="Calories" type="number" value={form.calories} onChange={set("calories")} />
        <Field label="Protein (g)" type="number" value={form.proteinG} onChange={set("proteinG")} />
        <Field label="Sugar (g)" type="number" value={form.sugarG} onChange={set("sugarG")} />
        <Field label="Starting stock" type="number" value={form.stock} onChange={set("stock")} />
      </div>
      <Btn variant="berry" size="md" className="mt-6" busy={adding} busyLabel="Adding..." onClick={addIngredient}>
        Add ingredient
      </Btn>
    </main>
  );
}