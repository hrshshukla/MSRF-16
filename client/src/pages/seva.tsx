import { CampaignsSection } from "@/pages/campaigns";
import { ProjectsSection } from "@/pages/projects";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function SevaPage() {
  const [location] = useLocation();

  useEffect(() => {
    const scrollToHashTarget = () => {
      const hash = window.location.hash.slice(1);
      const target = hash ? document.getElementById(hash) : null;

      if (target) {
        target.scrollIntoView({ block: "start", behavior: "auto" });
      } else if (!hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    };

    const frame = window.requestAnimationFrame(scrollToHashTarget);
    const firstRetry = window.setTimeout(scrollToHashTarget, 100);
    const finalRetry = window.setTimeout(scrollToHashTarget, 400);
    window.addEventListener("hashchange", scrollToHashTarget);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(firstRetry);
      window.clearTimeout(finalRetry);
      window.removeEventListener("hashchange", scrollToHashTarget);
    };
  }, [location]);

  return (
    <div className="w-full pb-24">
      <header className="relative overflow-hidden border-b bg-card pt-24 pb-16">
        <div className="mandala-bg text-primary opacity-[0.03]" />
        <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center md:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Our work</p>
          <h1 className="font-serif text-5xl font-bold md:text-6xl">Seva</h1>
          <nav aria-label="Seva sections" className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              ["#campaigns", "Campaigns"],
              ["#foundation-projects", "Projects"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full border border-primary/25 px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main>
        <CampaignsSection />
        <ProjectsSection />
      </main>
    </div>
  );
}