"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export type CourseOption = {
  _id: string;
  title: string;
  slug?: string;
};

type SubmissionType =
  | "tip"
  | "material"
  | "test"
  | "link";

type SubmitFormProps = {
  courses: CourseOption[];
};

const tipTypes = [
  {
    value: "general",
    label: "General advice",
  },
  {
    value: "lectures",
    label:
      "Lectures & seminars",
  },
  {
    value: "assignments",
    label:
      "Assignments & projects",
  },
  {
    value: "exam",
    label: "Exam / test",
  },
  {
    value: "strategy",
    label: "Study strategy",
  },
  {
    value: "resources",
    label:
      "Resources & materials",
  },
];

export default function SubmitForm({
  courses,
}: SubmitFormProps) {
  const [
    submissionType,
    setSubmissionType,
  ] =
    useState<SubmissionType>(
      "tip"
    );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const courseRequired =
    submissionType !== "link";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    try {
      const response =
        await fetch(
          "/api/study-submissions",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Submission failed."
        );
      }

      setSuccess(true);

      form.reset();

      setSubmissionType(
        "tip"
      );
    } catch (submitError) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Submission failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,87,255,0.17),transparent_35%)]" />

        <div className="relative mx-auto max-w-5xl">
          <Link
            href="/study"
            className="text-sm text-[#8EA0B3] transition hover:text-white"
          >
            ← Back to Study Hub
          </Link>

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
            BBA Club · Study Hub
          </p>

          <h1 className="mt-4 max-w-3xl text-[42px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl md:text-6xl">
            Share something
            <span className="text-[#0057FF]">
              {" "}
              useful.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:text-lg md:leading-8">
            Help other BBA
            students with a study
            tip, material, exam
            preview or useful link.
            Submissions are reviewed
            before they appear
            publicly.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 md:py-16 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.4fr] lg:gap-12">
          <div>
            {success ? (
              <div className="rounded-[26px] border border-[#0057FF]/30 bg-[#0D2035] p-7 md:p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0057FF] text-xl">
                  ✓
                </div>

                <h2 className="mt-6 text-2xl font-bold md:text-3xl">
                  Submission
                  received.
                </h2>

                <p className="mt-3 max-w-xl leading-7 text-[#A9B5C3]">
                  Your resource has
                  been sent to the
                  BBA Club team for
                  review. It will not
                  appear publicly
                  until it has been
                  approved.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSuccess(
                        false
                      )
                    }
                    className="rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold transition hover:bg-[#2874FF]"
                  >
                    Submit another
                  </button>

                  <Link
                    href="/study"
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-[#A9B5C3] transition hover:bg-white/10 hover:text-white"
                  >
                    Back to Study
                    Hub
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-7"
              >
                {/* HONEYPOT */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                {/* ABOUT YOU */}
                <section className="rounded-[24px] border border-white/10 bg-[#0B1A29] p-5 md:p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
                    01 · About you
                  </p>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium">
                        Name *
                      </span>

                      <input
                        required
                        name="name"
                        type="text"
                        placeholder="Your name"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium">
                        Email *
                      </span>

                      <input
                        required
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
                      />
                    </label>
                  </div>
                </section>

                {/* RESOURCE */}
                <section className="rounded-[24px] border border-white/10 bg-[#0B1A29] p-5 md:p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
                    02 · Resource
                  </p>

                  {/* TYPE */}
                  <label className="mt-5 block">
                    <span className="text-sm font-medium">
                      Resource type *
                    </span>

                    <select
                      required
                      name="submissionType"
                      value={
                        submissionType
                      }
                      onChange={(
                        event
                      ) =>
                        setSubmissionType(
                          event
                            .target
                            .value as SubmissionType
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition focus:border-[#0057FF]"
                    >
                      <option value="tip">
                        Study Tip
                      </option>

                      <option value="material">
                        Study Material
                      </option>

                      <option value="test">
                        Test / Exam
                        Preview
                      </option>

                      <option value="link">
                        Useful Link
                      </option>
                    </select>
                  </label>

                  {/* COURSE */}
                  <label className="mt-5 block">
                    <span className="text-sm font-medium">
                      Course
                      {courseRequired
                        ? " *"
                        : ""}
                    </span>

                    <select
                      name="course"
                      required={
                        courseRequired
                      }
                      defaultValue=""
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition focus:border-[#0057FF]"
                    >
                      <option value="">
                        {courseRequired
                          ? "Select a course"
                          : "General / not course-specific"}
                      </option>

                      {courses.map(
                        (course) => (
                          <option
                            key={
                              course._id
                            }
                            value={
                              course.title
                            }
                          >
                            {
                              course.title
                            }
                          </option>
                        )
                      )}
                    </select>

                    <p className="mt-2 text-xs text-[#53687D]">
                      Courses are
                      loaded
                      automatically
                      from the Study
                      Hub.
                    </p>
                  </label>

                  {/* TIP CATEGORY */}
                  {submissionType ===
                    "tip" && (
                    <label className="mt-5 block">
                      <span className="text-sm font-medium">
                        Tip category *
                      </span>

                      <select
                        required
                        name="tipType"
                        defaultValue=""
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition focus:border-[#0057FF]"
                      >
                        <option value="">
                          Select a
                          category
                        </option>

                        {tipTypes.map(
                          (
                            tipType
                          ) => (
                            <option
                              key={
                                tipType.value
                              }
                              value={
                                tipType.value
                              }
                            >
                              {
                                tipType.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  )}

                  {/* TITLE */}
                  <label className="mt-5 block">
                    <span className="text-sm font-medium">
                      Title *
                    </span>

                    <input
                      required
                      name="title"
                      type="text"
                      placeholder="Give your submission a clear title"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
                    />
                  </label>

                  {/* DESCRIPTION */}
                  <label className="mt-5 block">
                    <span className="text-sm font-medium">
                      Description *
                    </span>

                    <textarea
                      required
                      name="description"
                      rows={6}
                      placeholder={
                        submissionType ===
                        "tip"
                          ? "Write your tip and explain what helped you."
                          : "Explain what this resource contains and why it might be useful."
                      }
                      className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
                    />
                  </label>
                </section>

                {/* ATTACHMENT */}
                <section className="rounded-[24px] border border-white/10 bg-[#0B1A29] p-5 md:p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
                    03 · Attachment
                  </p>

                  {submissionType ===
                    "tip" && (
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-sm font-medium">
                        No attachment
                        needed.
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#71869A]">
                        Your tip will be
                        categorized by
                        course and tip
                        category.
                      </p>
                    </div>
                  )}

                  {(submissionType ===
                    "link" ||
                    submissionType ===
                      "material") && (
                    <label className="mt-5 block">
                      <span className="text-sm font-medium">
                        External URL
                        {submissionType ===
                        "link"
                          ? " *"
                          : ""}
                      </span>

                      <input
                        required={
                          submissionType ===
                          "link"
                        }
                        name="url"
                        type="url"
                        placeholder="https://..."
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
                      />
                    </label>
                  )}

                  {(submissionType ===
                    "material" ||
                    submissionType ===
                      "test") && (
                    <label className="mt-5 block">
                      <span className="text-sm font-medium">
                        Upload file
                      </span>

                      <input
                        name="file"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        className="mt-2 block w-full rounded-xl border border-dashed border-white/15 bg-[#071422] px-4 py-4 text-sm text-[#A9B5C3] file:mr-4 file:rounded-lg file:border-0 file:bg-[#0057FF] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />

                      <p className="mt-2 text-xs text-[#53687D]">
                        PDF, PNG, JPG
                        or WEBP · max
                        4 MB
                      </p>

                      {submissionType ===
                        "material" && (
                        <p className="mt-1 text-xs text-[#53687D]">
                          Add either a
                          file or an
                          external URL.
                        </p>
                      )}
                    </label>
                  )}
                </section>

                {error && (
                  <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="w-full rounded-xl bg-[#0057FF] px-6 py-4 font-semibold transition hover:bg-[#2874FF] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                >
                  {submitting
                    ? "Sending..."
                    : "Submit for review"}
                </button>
              </form>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="self-start rounded-[24px] border border-[#0057FF]/30 bg-[#0D2035] p-6 lg:sticky lg:top-24">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
              How it works
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <p className="font-semibold">
                  01 · Submit
                </p>

                <p className="mt-1 text-sm leading-6 text-[#8EA0B3]">
                  Choose the
                  resource type,
                  course and relevant
                  category.
                </p>
              </div>

              <div>
                <p className="font-semibold">
                  02 · Review
                </p>

                <p className="mt-1 text-sm leading-6 text-[#8EA0B3]">
                  The BBA Club team
                  checks the
                  submission before
                  publishing it.
                </p>
              </div>

              <div>
                <p className="font-semibold">
                  03 · Publish
                </p>

                <p className="mt-1 text-sm leading-6 text-[#8EA0B3]">
                  Approved resources
                  automatically appear
                  in the Study Hub.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs leading-5 text-[#71869A]">
                New courses added in
                Sanity automatically
                appear in the course
                dropdown.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}