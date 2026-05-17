import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_app/visits")({
  component: function VisitsPage() {
    const { t } = useI18n();
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("visits")}</h1>
        <Card><CardHeader><CardTitle>{t("visits")}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{t("comingSoon")}</p></CardContent>
        </Card>
      </div>
    );
  },
});
