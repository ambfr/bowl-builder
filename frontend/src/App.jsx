import { useEffect, useState } from "react";
import { api } from "./api";

export default function App() {
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/ingredients").then(setIngredients).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-purple-50 p-8">
      <h1 className="text-3xl font-bold text-purple-900">Bowl Builder</h1>
      <p className="text-purple-700 mb-6">Setup check: ingredients loaded from the Spring Boot API</p>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ingredients.map((i) => (
          <div key={i.id} className="rounded-xl bg-white p-4 shadow">
            <div className="font-semibold">{i.name}</div>
            <div className="text-sm text-gray-500">{i.category}</div>
            <div className="mt-1">₹{i.price} · stock {i.stock}</div>
          </div>
        ))}
      </div>
    </div>
  );
}