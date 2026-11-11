"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
export default function AdminSignOut() {
  const router = useRouter();
  const [error, setError] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#A9B5C3]"
        onClick={async () => {
          try {
            const response = await fetch("/api/admin/logout", {
              method: "POST",
            });
            if (!response.ok) throw new Error();
            router.replace("/admin/login");
            router.refresh();
          } catch {
            setError(true);
          }
        }}
      >
        Sign out
      </button>
      {error && (
        <span role="alert" className="ml-2 text-xs text-red-200">
          Could not sign out.
        </span>
      )}
    </div>
  );
}
