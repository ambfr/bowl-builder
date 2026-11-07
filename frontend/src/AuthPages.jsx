import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

function Field({ label, type = "text", value, onChange, autoComplete }) {
  return (
    <label className="block">
      <span className="text-sm text-ink/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full border-0 border-b border-line bg-transparent py-2 focus:border-berry focus:outline-none"
      />
    </label>
  );
}

function AuthShell({ title, subtitle, error, busy, onSubmit, submitLabel, footer, children }) {
  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h2 className="font-display text-4xl tracking-tight">{title}</h2>
      <p className="mt-2 text-ink/60">{subtitle}</p>
      <form
        className="mt-10 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink py-3 font-medium text-white transition disabled:opacity-50"
        >
          {busy ? "One moment..." : submitLabel}
        </button>
      </form>
      <p className="mt-8 text-sm text-ink/60">{footer}</p>
    </main>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to save bowls and see your orders."
      error={error}
      busy={busy}
      onSubmit={submit}
      submitLabel="Sign in"
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-medium text-berry hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a few seconds. Use at least 8 characters for the password."
      error={error}
      busy={busy}
      onSubmit={submit}
      submitLabel="Create account"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-berry hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Field label="Name" value={name} onChange={setName} autoComplete="name" />
      <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
    </AuthShell>
  );
}