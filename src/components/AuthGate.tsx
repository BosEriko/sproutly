"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase";

export function AuthGate({ children }: { children: (user: User) => ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(clientAuth(), setUser), []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(clientAuth(), email, password);
    } catch {
      setError("Wrong email or password.");
    } finally {
      setBusy(false);
    }
  }

  if (user === undefined) {
    return <p className="p-8 text-center text-muted">Loading…</p>;
  }

  if (!user) {
    return (
      <form onSubmit={handleSubmit} className="mx-auto mt-16 flex w-full max-w-sm flex-col gap-3 px-4">
        <h1 className="mb-2 text-center text-3xl font-bold">🌱 Sproutly</h1>
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-line bg-card px-4 py-3 text-base"
          required
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-line bg-card px-4 py-3 text-base"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    );
  }

  return (
    <>
      {children(user)}
      <footer className="mx-auto mt-10 mb-8 flex max-w-lg items-center justify-between px-4 text-sm text-muted">
        <span>{user.email}</span>
        <button onClick={() => signOut(clientAuth())} className="underline">
          Sign out
        </button>
      </footer>
    </>
  );
}
