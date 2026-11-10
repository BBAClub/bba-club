import Link from "next/link";
import type { ReactNode } from "react";

export function DraftPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8EC5FF]">
          Admin · Draft
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A9B5C3]">{description}</p>
      </header>
      {children}
    </div>
  );
}

export function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-[#0D1D2C] p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

export function DraftLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      className="font-medium text-[#8EC5FF] underline-offset-4 hover:underline"
      href={href}
    >
      {children}
    </Link>
  );
}

export function Metrics({
  items,
}: {
  items: { label: string; value: number | string }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-2xl border border-white/10 bg-[#0D1D2C] p-4"
        >
          <dt className="text-sm text-[#A9B5C3]">{label}</dt>
          <dd className="mt-1 text-2xl font-semibold text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DraftTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: { id: string; cells: ReactNode[] }[];
  empty: string;
}) {
  if (!rows.length) return <p className="text-sm text-[#A9B5C3]">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="text-[#A9B5C3]">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-white/10">
              {row.cells.map((cell, index) => (
                <td key={headers[index]} className="px-3 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
