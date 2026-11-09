import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";
import { Btn, useToast } from "./ui";

function Field({ label, value, onChange, type = "text", autoComplete, readOnly }) {
  return (
    <label className="block">
      <span className="text-sm text-ink/60">{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange && onChange(e.target.value)}
        autoComplete={autoComplete}
        className={
          "mt-1 w-full border-0 border-b border-line bg-transparent py-2 focus:border-berry focus:outline-none " +
          (readOnly ? "text-ink/50" : "")
        }
      />
    </label>
  );
}

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h2 className="font-display text-4xl tracking-tight">Profile</h2>
        <p className="mt-3 text-ink/60">
          <Link to="/login" className="font-medium text-berry hover:underline">
            Sign in
          </Link>{" "}
          to manage your profile.
        </p>
      </main>
    );
  }

  async function saveName(e) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Name cannot be empty.");
      return;
    }
    setSavingName(true);
    setNameError("");
    try {
      const updated = await api("/api/users/me", { method: "PATCH", token, body: { name: name.trim() } });
      updateUser(updated);
      setName(updated.name);
      toast("Name updated.");
    } catch (err) {
      setNameError(err.message);
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (next.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setPwError("The new passwords do not match.");
      return;
    }
    setSavingPw(true);
    setPwError("");
    try {
      await api("/api/users/me/password", {
        method: "POST",
        token,
        body: { currentPassword: current, newPassword: next },
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast("Password changed.");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h2 className="font-display text-4xl tracking-tight">Profile</h2>

      <form onSubmit={saveName} className="mt-10 space-y-5">
        <h3 className="font-display text-2xl">Your details</h3>
        <Field label="Email" value={user.email} readOnly />
        <Field label="Name" value={name} onChange={setName} autoComplete="name" />
        {nameError && (
          <p role="alert" className="text-sm text-red-700">
            {nameError}
          </p>
        )}
        <Btn type="submit" variant="dark" size="md" busy={savingName} busyLabel="Saving..." disabled={name.trim() === user.name}>
          Save name
        </Btn>
      </form>

      <form onSubmit={changePassword} className="mt-14 space-y-5 border-t border-line pt-10">
        <h3 className="font-display text-2xl">Change password</h3>
        <Field label="Current password" type="password" value={current} onChange={setCurrent} autoComplete="current-password" />
        <Field label="New password" type="password" value={next} onChange={setNext} autoComplete="new-password" />
        <Field label="Repeat new password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {pwError && (
          <p role="alert" className="text-sm text-red-700">
            {pwError}
          </p>
        )}
        <Btn type="submit" variant="dark" size="md" busy={savingPw} busyLabel="Updating..." disabled={!current || !next || !confirm}>
          Update password
        </Btn>
      </form>
    </main>
  );
}