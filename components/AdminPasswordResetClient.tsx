"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
const field =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3.5 outline-none focus:border-[#0057FF]";
export default function AdminPasswordResetClient({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const [binding, setBinding] = useState<{ id: string; token: string } | null>(
    null,
  );
  const [ready, setReady] = useState(false),
    [email, setEmail] = useState(initialEmail),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [done, setDone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // Read the browser-only fragment after hydration; cancel Strict Mode replay.
    const readFragment = () =>
      queueMicrotask(() => {
        if (cancelled) return;
        const fragment = window.location.hash.slice(1);
        if (fragment) {
          setDone(false);
          setError("");
          setMessage("");
          setPassword("");
          setConfirm("");
          const [id, token] = fragment.split(":");
          if (
            /^adminPasswordResets\.[a-f0-9]{64}$/.test(id ?? "") &&
            /^[a-f0-9]{64}$/.test(token ?? "")
          )
            setBinding({ id, token });
          else setError("Invalid reset link. Request a new one below.");
          window.history.replaceState(null, "", window.location.pathname);
        }
        setReady(true);
      });
    readFragment();
    window.addEventListener("hashchange", readFragment);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", readFragment);
    };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !ready) return;
    if (binding && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          binding
            ? { action: "reset", ...binding, password }
            : { action: "request", email },
        ),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Could not process your request.");
      if (binding) {
        setPassword("");
        setConfirm("");
        setBinding(null);
        setDone(true);
        setMessage(
          "Password saved. Sign in with your school email and your new password. Account approval and permissions are unchanged.",
        );
      } else
        setMessage(
          "If an account exists for this email, we have sent a password link. It expires in 30 minutes. Check your inbox and spam folder.",
        );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not process your request.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#0D1D2C] p-6 md:p-8">
      <p className="text-xs uppercase tracking-widest text-[#8EC5FF]">
        BBA Club staff
      </p>
      <h1 className="mt-3 text-3xl font-bold">
        {binding ? "Choose a new password" : "Set or reset password"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#A9B5C3]">
        {binding
          ? "Use a password of 12–128 characters. Saving it signs out existing sessions."
          : "Already have a verified account? Request a link to set your first password or replace a forgotten one."}
      </p>
      {!ready ? (
        <p className="mt-6 text-sm">Loading…</p>
      ) : (
        !done && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {binding ? (
              <>
                <label className="block text-sm">
                  New password
                  <input
                    required
                    type="password"
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={field}
                  />
                </label>
                <label className="block text-sm">
                  Confirm password
                  <input
                    required
                    type="password"
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={field}
                  />
                </label>
              </>
            ) : (
              <label className="block text-sm">
                School email
                <input
                  required
                  type="email"
                  autoComplete="username"
                  placeholder="username@vse.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                />
              </label>
            )}
            <button
              disabled={busy}
              className="w-full rounded-xl bg-[#0057FF] px-5 py-3.5 font-semibold disabled:opacity-50"
            >
              {busy
                ? "Please wait…"
                : binding
                  ? "Save password"
                  : "Send password link"}
            </button>
          </form>
        )
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-green-400/10 p-3 text-sm text-green-200"
        >
          {message}
        </p>
      )}
      {binding && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBinding(null);
            setError("");
          }}
          className="mt-5 block text-sm text-[#8EC5FF]"
        >
          Request a new link
        </button>
      )}
      <Link
        href="/admin/login"
        className="mt-5 inline-block text-sm text-[#8EC5FF]"
      >
        Back to sign in
      </Link>
    </div>
  );
}
