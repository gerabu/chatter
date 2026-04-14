type LandingSectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function LandingSectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: LandingSectionHeadingProps) {
  const alignment =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <header className={`flex max-w-2xl flex-col gap-3 ${alignment}`}>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
        {eyebrow}
      </p>
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-50 sm:text-4xl">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-7 text-stone-600 dark:text-stone-400 sm:text-base">
          {description}
        </p>
      </div>
    </header>
  );
}
