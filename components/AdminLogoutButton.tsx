"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

export default function AdminLogoutButton() {
  const router =
    useRouter();

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch(
        "/api/admin/logout",
        {
          method: "POST",
        }
      );
    } finally {
      router.replace(
        "/admin/login"
      );

      router.refresh();
    }
  }

  return (
    <button
      type="button"

      disabled={
        loggingOut
      }

      onClick={() =>
        void logout()
      }

      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-[#71869A] transition hover:bg-white/5 hover:text-white disabled:opacity-50"
    >
      {loggingOut
        ? "Signing out..."
        : "Sign out"}
    </button>
  );
}