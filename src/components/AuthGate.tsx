"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Alert, Button, Form, Input } from "antd";
import { Sprout } from "lucide-react";
import { onAuthStateChanged, signInWithCustomToken, signOut, type User } from "firebase/auth";
import { DinoLoader } from "@/components/DinoLoader";
import { ACCESS_CLAIM } from "@/lib/access";
import { clientAuth } from "@/lib/firebase";

interface Credentials {
  password: string;
}

export function AuthGate({ children }: { children: (user: User) => ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(clientAuth(), async (next) => {
        if (next && (await next.getIdTokenResult()).claims[ACCESS_CLAIM] !== true) {
          await signOut(clientAuth());
          return;
        }
        setUser(next);
      }),
    [],
  );

  async function handleFinish({ password }: Credentials) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? "Too many tries. Wait a bit and try again." : "Wrong password.");
        return;
      }
      const { token } = (await res.json()) as { token: string };
      await signInWithCustomToken(clientAuth(), token);
    } catch {
      setError("Could not sign in. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="pt-24">
        <DinoLoader />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-sm px-4 pt-20">
        <div className="paper -rotate-1 rounded-sm px-6 pt-10 pb-6">
          <span className="tape" />
          <h1 className="mb-6 flex items-center justify-center gap-2 font-hand text-5xl font-bold text-accent">
            <Sprout size={36} strokeWidth={2.25} aria-hidden />
            Sproutly
          </h1>
          <Form<Credentials> layout="vertical" requiredMark={false} onFinish={handleFinish} disabled={busy}>
            <input type="text" name="username" autoComplete="username" value="sproutly" readOnly hidden />
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input.Password size="large" autoComplete="current-password" />
            </Form.Item>
            {error && <Alert type="error" title={error} showIcon className="mb-4" />}
            <Button type="primary" htmlType="submit" size="large" block loading={busy}>
              Sign in
            </Button>
          </Form>
        </div>
      </main>
    );
  }

  return children(user);
}
