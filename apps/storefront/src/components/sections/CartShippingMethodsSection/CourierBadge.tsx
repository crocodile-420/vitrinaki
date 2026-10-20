// Text badge naming the courier of a shipping option (no logos in v1).
export const CourierBadge = ({ name }: { name: string | null | undefined }) =>
  name ? (
    <span
      className="mr-2 inline-flex shrink-0 items-center rounded-full border border-[#2E4A37]/25 bg-[#2E4A37]/[0.07] px-2 py-0.5 text-[11px] font-semibold leading-4 text-[#2E4A37]"
      data-testid="courier-badge"
    >
      {name}
    </span>
  ) : null
