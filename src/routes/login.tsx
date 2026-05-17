import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stethoscope, Languages } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const { t, lang, setLang, dir } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(username, password);
    setBusy(false);
    if (error === "disabled") toast.error(t("accountDisabled"));
    else if (error) toast.error(t("invalidCreds"));
    else navigate({ to: "/" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4" dir={dir}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary/15),transparent_60%)]" />
      <div className="absolute top-4 end-4">
        <Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
          <Languages className="h-4 w-4 me-1" />
          {lang === "en" ? "العربية" : "English"}
        </Button>
      </div>
      <Card className="relative w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Stethoscope className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">{t("appName")}</CardTitle>
          <CardDescription>{t("appTagline")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("username")}</Label>
              <Input
                id="username" value={username} onChange={(e) => setUsername(e.target.value)}
                autoComplete="username" required autoFocus placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" required placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t("signingIn") : t("signIn")}
            </Button>
            <p className="pt-2 text-center text-xs text-muted-foreground">{t("loginHint")}</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
