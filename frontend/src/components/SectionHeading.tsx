import Reveal from "./Reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

/**
 * Shared heading for homepage sections.
 * Keeps eyebrow / title / description styling identical everywhere
 * and fades in as it scrolls into view.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  className = "",
}: SectionHeadingProps) {
  return (
    <Reveal className={`mx-auto mb-8 max-w-2xl text-center sm:mb-10 ${className}`}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500 sm:text-sm">
          {eyebrow}
        </p>
      )}

      <h2 className="text-3xl font-bold tracking-tight text-[#173B67] sm:text-4xl">
        {title}
      </h2>

      {/* Animated accent bar */}
      <div className="mx-auto mt-3 flex justify-center gap-1.5" aria-hidden="true">
        <span className="h-1 w-12 rounded-full bg-orange-500" />
        <span className="h-1 w-4 rounded-full bg-[#173B67]" />
      </div>

      {description && (
        <p className="mt-4 text-base leading-7 text-slate-500">
          {description}
        </p>
      )}
    </Reveal>
  );
}
