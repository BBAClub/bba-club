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
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
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
    <section className="space-y-3 border-t border-white/15 pt-4">
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
    <dl className="grid grid-cols-2 gap-x-5 gap-y-3 border-y border-white/15 py-3 sm:grid-cols-3 xl:grid-cols-5">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="min-w-0 py-1"
        >
          <dt className="text-sm text-[#A9B5C3]">{label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</dd>
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
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-white/5 text-[#C2CEDA]">
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
            <tr key={row.id} className="border-b border-white/10 hover:bg-white/[0.03]">
              {row.cells.map((cell, index) => (
                <td key={headers[index]} className="px-3 py-2.5 align-top">
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
