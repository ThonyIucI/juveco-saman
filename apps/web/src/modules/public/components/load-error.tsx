import { Button } from "@juveco/ui/components/button";

interface ILoadErrorProps {
  onRetry: () => void;
}

/** Cuando la API no respondió: un texto corto y volver a intentar. */
export default function LoadError({ onRetry }: ILoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-base text-foreground">No pudimos cargar el evento.</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
