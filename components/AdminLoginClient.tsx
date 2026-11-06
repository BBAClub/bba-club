"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeDestination } from "@/lib/admin/destination";
const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3.5 outline-none focus:border-[#0057FF]";
export default function AdminLoginClient({
  accountsEnabled = false,
}: {
  accountsEnabled?: boolean;
}) {
  const router = useRouter(),
    params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [code, setCode] = useState("");
  const [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const registering = accountsEnabled && mode === "register";
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (registering && sent && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        sent ? "/api/admin/verify" : "/api/admin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            sent
              ? { code, password }
              : registering
                ? { action: "register", email, name }
                : accountsEnabled
                  ? { email, password }
                  : { password },
          ),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not sign in.");
      if (registering && !sent) {
        setSent(true);
        return;
      }
      setPassword("");
      setConfirm("");
      router.replace(
        data.status && data.status !== "active"
          ? "/admin/account"
          : safeDestination(params.get("next")),
      );
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign in.");
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
        {registering ? "Request an account" : "Admin access"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#A9B5C3]">
        {!accountsEnabled
          ? "Sign in with the staff password."
          : registering
            ? sent
              ? `Enter the code sent to ${email} and choose your password. The code expires in 10 minutes.`
              : "Verify your @vse.cz school email and create a password. New accounts need administrator approval."
            : "Sign in with your school email and your personal password."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {registering && !sent && (
          <label className="block text-sm">
            Your name
            <input
              required
              autoComplete="name"
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        {accountsEnabled && !sent && (
          <label className="block text-sm">
            School email
            <input
              required
              type="email"
              autoComplete="username"
              placeholder="username@vse.cz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        {sent && (
          <label className="block text-sm">
            Verification code
            <input
              autoFocus
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{8}"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        {(!registering || sent) && (
          <label className="block text-sm">
            {registering ? "New password" : "Password"}
            <input
              required
              type="password"
              autoComplete={registering ? "new-password" : "current-password"}
              minLength={registering ? 12 : undefined}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {registering && (
              <span className="mt-2 block text-xs text-[#A9B5C3]">
                Use 12–128 characters. A long passphrase works well.
              </span>
            )}
          </label>
        )}
        {registering && sent && (
          <label className="block text-sm">
            Confirm password
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-[#0057FF] px-5 py-3.5 font-semibold disabled:opacity-50"
        >
          {busy
            ? "Please wait…"
            : registering
              ? sent
                ? "Verify email & create password"
                : "Send verification code"
              : "Sign in"}
        </button>
      </form>
      {accountsEnabled && (
        <div className="mt-5 space-y-3 text-center text-sm text-[#8EC5FF]">
          <Link href="/admin/reset-password" className="block">
            Forgot / set password
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode(registering ? "login" : "register");
              setSent(false);
              setPassword("");
              setConfirm("");
              setCode("");
              setError("");
            }}
          >
            {registering
              ? "Already have an account? Sign in"
              : "New to BBA Club? Request an account"}
          </button>
          {sent && (
            <button
              type="button"
              disabled={busy}
              className="block w-full"
              onClick={() => {
                setSent(false);
                setCode("");
                setPassword("");
                setConfirm("");
                setError("");
              }}
            >
              Change email or request a new code
            </button>
          )}
        </div>
      )}
      <p className="mt-5 text-xs text-[#71869A]">
        Your session stays active for 12 hours.
      </p>
    </div>
  );
}
