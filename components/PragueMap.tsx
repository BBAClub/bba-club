"use client";

import dynamic from "next/dynamic";

import {
  useEffect,
  useState,
} from "react";

import type {
  Place,
} from "@/data/places";

export type PragueMapProps = {
  placesToShow: Place[];

  selectedPlace: Place | null;

  onSelect: (place: Place) => void;

  compact?: boolean;
};

const PragueMapInner =
  dynamic<PragueMapProps>(
    () =>
      import(
        "./PragueMapInner"
      ).then(
        (module) =>
          module.default
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
  const {
    compact = false,
  } = props;

  const [
    isDesktop,
    setIsDesktop,
  ] = useState(false);

  useEffect(() => {
    function checkScreenSize() {
      setIsDesktop(
        window.innerWidth >= 768
      );
    }

    checkScreenSize();

    window.addEventListener(
      "resize",
      checkScreenSize
    );

    return () => {
      window.removeEventListener(
        "resize",
        checkScreenSize
      );
    };
  }, []);

  /*
    Desktop map must not be
    mounted at all on mobile.

    Tailwind's `hidden` only hides
    the element visually. Leaflet
    would still initialise inside it.
  */
  if (
    !compact &&
    !isDesktop
  ) {
    return null;
  }

  return (
    <PragueMapInner
      {...props}
    />
  );
}