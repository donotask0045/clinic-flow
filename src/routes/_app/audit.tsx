import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_app/audit")({
  component: function AuditPage() {
    const { t } = useI18n();
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("auditLogs")}</h1>
        <Card><CardHeader><CardTitle>{t("auditLogs")}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{t("comingSoon")}</p></CardContent>
        </Card>
      </div>
    );
  },
});
