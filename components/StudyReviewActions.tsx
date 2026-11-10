"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudyReviewActions({
  submissionId,
}: {
  submissionId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [reviewed, setReviewed] = useState(false);

  async function review(action: "approve" | "reject") {
    const message =
      action === "approve"
        ? "Approve this submission and publish it in Study Hub?"
        : "Reject this submission?";
    if (!window.confirm(message)) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/study-submissions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action }),
      });
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error || "Review failed.");
      setReviewed(true);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Review failed.");
    } finally {
      setPending(false);
    }
  }

  if (reviewed) return <span role="status">Review saved</span>;
  return (
    <div>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pending}
          className="text-[#8EC5FF] disabled:opacity-50"
          onClick={() => void review("approve")}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          className="text-red-300 disabled:opacity-50"
          onClick={() => void review("reject")}
        >
          Reject
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-2 max-w-64 whitespace-normal text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
