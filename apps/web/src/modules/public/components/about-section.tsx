import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import { BOARD, FUNCTIONS, SITE } from "@/modules/public/data/site";

import { Reveal, RevealGroup, RevealItem } from "./reveal";
import SiteSection from "./site-section";

/** Nosotros: qué es la Juveco, qué hace y quiénes forman la directiva. */
export default function AboutSection() {
  return (
    <SiteSection id="nosotros" eyebrow="Nosotros" title="Somos la junta de vecinos de Samán">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <Reveal className="space-y-4 text-lg leading-relaxed text-foreground">
          {SITE.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>

        <RevealGroup className="grid gap-4 sm:grid-cols-2">
          {FUNCTIONS.map(({ icon: Icon, title, text }) => (
            <RevealItem key={title} className="rounded-lg border border-border bg-card p-5">
              <span className="mb-4 flex size-11 items-center justify-center rounded-md bg-secondary text-primary">
                <Icon aria-hidden className="size-6" />
              </span>
              <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-1 text-muted-foreground">{text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      {BOARD.length > 0 && (
        <div className="mt-16">
          <Reveal>
            <h3 className="font-heading text-2xl font-extrabold text-foreground">Directiva · {SITE.term}</h3>
          </Reveal>
          <RevealGroup className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {BOARD.map((member) => (
              <RevealItem
                key={`${member.role}-${member.name}`}
                className="flex flex-col items-center rounded-lg border border-border bg-card p-5 text-center"
              >
                <InitialsAvatar name={member.name} color={avatarColorOf(member.name)} className="size-16 text-xl" />
                <p className="mt-3 font-heading font-bold text-foreground">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      )}
    </SiteSection>
  );
}
