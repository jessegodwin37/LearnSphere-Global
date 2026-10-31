import Link from "next/link";
import { GraduationCap, Github, Twitter, Linkedin } from "lucide-react";

const COLUMNS = [
  {
    title: "Learn",
    links: [
      { label: "All courses", href: "/courses" },
      { label: "Web development", href: "/courses?category=Web+Development" },
      { label: "Data science", href: "/courses?category=Data+Science" },
      { label: "Design", href: "/courses?category=Design" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Pricing", href: "/#pricing" },
      { label: "AI tutor", href: "/#ai-tutor" },
      { label: "Certificates", href: "/#certificates" },
      { label: "For teams", href: "/#instructors" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Teach on LearnSphere", href: "/instructor" },
      { label: "Careers", href: "/#about" },
      { label: "Contact", href: "/#about" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/25">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-[1.05rem] w-[1.05rem]" />
              </span>
              <span className="font-display text-[1.0625rem] tracking-tight">
                LearnSphere<span className="ml-1 text-muted-foreground">Global</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-[0.8125rem] leading-relaxed text-muted-foreground">
              Courses built by practitioners who have shipped at scale. Learn by building
              real systems, with an AI tutor that knows your course material.
            </p>
            <div className="mt-5 flex items-center gap-1">
              {[
                { Icon: Github, label: "GitHub" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Linkedin, label: "LinkedIn" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="eyebrow mb-3.5">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LearnSphere Global. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
