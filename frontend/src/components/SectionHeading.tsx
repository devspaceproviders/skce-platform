// import Reveal from "./Reveal";

// type SectionHeadingProps = {
//   eyebrow?: string;
//   title: string;
//   description?: string;
//   className?: string;
// };

// /**
//  * Shared heading for homepage sections.
//  * Keeps eyebrow / title / description styling identical everywhere
//  * and fades in as it scrolls into view.
//  */
// export default function SectionHeading({
//   eyebrow,
//   title,
//   description,
//   className = "",
// }: SectionHeadingProps) {
//   return (
//     <Reveal className={`mx-auto mb-8 max-w-2xl text-center sm:mb-10 ${className}`}>
//       {eyebrow && (
//         <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500 sm:text-sm">
//           {eyebrow}
//         </p>
//       )}

//       <h2 className="text-3xl font-bold tracking-tight text-[#173B67] sm:text-4xl">
//         {title}
//       </h2>

//       {/* Animated accent bar */}
//       <div className="mx-auto mt-3 flex justify-center gap-1.5" aria-hidden="true">
//         <span className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-400" />
//         <span className="h-1 w-4 rounded-full bg-[#173B67]" />
//       </div>

//       {description && (
//         <p className="mt-4 text-base leading-7 text-slate-600">
//           {description}
//         </p>
//       )}
//     </Reveal>
//   );
// }


import Reveal from "./Reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  className = "",
}: SectionHeadingProps) {
  return (
    <Reveal
      className={`mx-auto mb-8 max-w-2xl text-center sm:mb-10 ${className}`}
    >
      {eyebrow && (
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600 sm:text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          {eyebrow}
          <span className="h-px w-7 bg-orange-300" />
        </p>
      )}

      <h2 className="text-3xl font-extrabold tracking-tight text-[#173B67] sm:text-4xl">
        {title}
      </h2>

      <div
        className="mx-auto mt-3 flex items-center justify-center gap-1.5"
        aria-hidden="true"
      >
        <span className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-400" />
        <span className="h-1 w-4 rounded-full bg-[#173B67]" />
      </div>

      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
          {description}
        </p>
      )}
    </Reveal>
  );
}
