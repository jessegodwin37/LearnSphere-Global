export function TrustedBy({ brands }: { brands: string[] }) {
  const doubled = [...brands, ...brands];

  return (
    <section className="border-y border-border/70 bg-background py-10">
      <div className="container">
        <p className="text-center text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
          Learners come from teams at
        </p>
        <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-12 hover:[animation-play-state:paused]">
            {doubled.map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="select-none whitespace-nowrap font-display text-lg tracking-tight text-foreground/35 transition-colors hover:text-foreground/60"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
