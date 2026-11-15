"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Alert, Button, Form, Input, Spin } from "antd";
import { Sprout } from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase";

interface Credentials {
  email: string;
  password: string;
}

export function AuthGate({ children }: { children: (user: User) => ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(clientAuth(), setUser), []);

  async function handleFinish({ email, password }: Credentials) {
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
    return (
      <div className="flex justify-center pt-24">
        <Spin size="large" />
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
            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
              <Input size="large" autoComplete="email" inputMode="email" />
            </Form.Item>
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
