import { BOARD, FUNCTIONS, SITE } from "@/modules/public/data/site";

import Expandable from "./expandable";
import { Reveal, RevealGroup, RevealItem } from "./reveal";
import SiteSection from "./site-section";

/** Nosotros: qué es la Juveco, qué hace y quiénes forman la directiva (tras «Ver directiva»). Todo en filas compactas. */
export default function AboutSection() {
  return (
    <SiteSection id="nosotros" eyebrow="Nosotros" title="Somos la Junta Vecinal Comunal de Samán">
      <div className="grid gap-6 md:gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className="space-y-4 text-base leading-relaxed text-foreground">
          {SITE.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>

        <RevealGroup className="divide-y divide-border border-y border-border">
          {FUNCTIONS.map(({ icon: Icon, title, text }) => (
            <RevealItem key={title} className="flex items-start gap-3 py-3">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h3 className="text-base font-medium text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      {BOARD.length > 0 && (
        <Expandable label="Ver directiva" className="mt-4 md:mt-8">
          <h3 className="pt-4 font-heading text-xl font-semibold text-foreground">Directiva {SITE.term}</h3>
          <RevealGroup className="mt-4 grid grid-cols-2 gap-x-6 md:gap-x-10 lg:grid-cols-3">
            {BOARD.map((member) => (
              <RevealItem key={`${member.role}-${member.name}`} className="border-b border-border py-3">
                <p className="text-sm text-muted-foreground">{member.role}</p>
                <p className="text-base font-medium text-foreground">{member.name}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Expandable>
      )}
    </SiteSection>
  );
}
