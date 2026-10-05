import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1">
      <span className="text-3xl font-black tracking-[-0.08em]">
        BB
      </span>

      <span className="relative mx-1 inline-block h-7 w-7">
        <span className="absolute bottom-0 left-0 h-5 w-2.5 -skew-x-[25deg] bg-[#0057FF]" />
        <span className="absolute bottom-0 right-0 h-7 w-2.5 skew-x-[25deg] bg-[#F6F8FB]" />
      </span>

      <span className="text-2xl font-light tracking-tight">
        Club
      </span>
    </Link>
  );
}