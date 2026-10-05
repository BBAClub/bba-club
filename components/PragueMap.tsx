"use client";

import dynamic from "next/dynamic";

import type { Place } from "@/data/places";

export type PragueMapProps = {
  placesToShow: Place[];

  selectedPlace: Place | null;

  onSelect: (place: Place) => void;

  compact?: boolean;
};

const PragueMapInner = dynamic<PragueMapProps>(
  () =>
    import("./PragueMapInner").then(
      (module) => module.default
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-full min-h-[340px] items-center justify-center rounded-[24px] border border-white/10 bg-[#091A2A] text-sm text-[#71869A]">
        Loading map...
      </div>
    ),
  }
);

export default function PragueMap(
  props: PragueMapProps
) {
  return <PragueMapInner {...props} />;
}