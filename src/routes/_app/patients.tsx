import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

function Placeholder({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{t("comingSoon")}</p></CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/_app/patients")({
  component: () => {
    const { t } = useI18n();
    return <Placeholder title={t("patients")} />;
  },
});
