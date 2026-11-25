import { buttonVariants } from "@juveco/ui/components/button";
import { cn } from "@juveco/ui/lib/utils";

import FacebookIcon from "@/common/components/icons/facebook-icon";
import TikTokIcon from "@/common/components/icons/tiktok-icon";
import { FACEBOOK_URL, TIKTOK_URL, TIKTOK_USERNAME } from "@/modules/public/data/social";

/** Enlaces a las redes de Juveco; se abren en otra pestaña. */
export default function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
        <FacebookIcon className="size-4.5" />
        Facebook
      </a>
      <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
        <TikTokIcon className="size-4.5" />@{TIKTOK_USERNAME}
      </a>
    </div>
  );
}
