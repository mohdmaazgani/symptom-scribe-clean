import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { browserEnv } from "@/lib/env";

const StartupDiagnostics = () => {
  const { diagnostics } = browserEnv;

  return (
    <div className="dark min-h-screen bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.22),transparent_32%),radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.18),transparent_28%),linear-gradient(135deg,#04111d_0%,#0a1726_42%,#0f2a24_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />
      <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center">
        <Card className="w-full border border-white/10 bg-slate-950/70 shadow-[0_24px_90px_rgba(2,6,23,0.5)] backdrop-blur-2xl">
          <CardHeader className="space-y-5 px-6 pb-4 pt-7 sm:px-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-300/10 shadow-inner shadow-amber-200/10">
              <ShieldAlert className="h-7 w-7 text-amber-200" />
            </div>

            <div className="space-y-3">
              <CardTitle className="text-2xl font-bold tracking-normal text-white sm:text-3xl">
                Startup configuration required
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6 text-slate-300">
                Symptom Scribe cannot start until the required browser environment variables are available. Add them to .env.local or your deployment environment, then restart the app.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-7 sm:px-8">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-100">
                <AlertTriangle className="h-4 w-4" />
                Missing required variables
              </div>

              <div className="flex flex-wrap gap-2">
                {diagnostics.missingRequired.map((variable) => (
                  <span
                    key={variable}
                    className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-sm font-medium text-amber-100"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </section>

            {diagnostics.warnings.length > 0 && (
              <section className="rounded-2xl border border-cyan-300/15 bg-cyan-300/8 p-5">
                <p className="mb-3 text-sm font-semibold text-cyan-100">Warnings</p>
                <ul className="space-y-2 text-sm leading-6 text-cyan-50/90">
                  {diagnostics.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm leading-6 text-slate-300">
              <p className="font-semibold text-white">What to do next</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                <li>Add the missing values to .env.local using the canonical variable names.</li>
                <li>Restart the Vite dev server so the new environment values are loaded.</li>
                <li>Use .env.example as the source of truth for required and optional keys.</li>
              </ol>
            </section>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="h-11 rounded-full bg-cyan-400 px-5 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload after fixing config
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StartupDiagnostics;
