import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CloudSun, MapPin, Loader2, Wind, Thermometer, Gauge } from "lucide-react";
import { useEnvironmentalInsights } from "@/hooks/useEnvironmentalInsights";

interface EnvironmentalInsightsProps {
  symptomLogDates: string[];
}

export function EnvironmentalInsights({ symptomLogDates }: EnvironmentalInsightsProps) {
  const { t } = useTranslation();
  const {
    hasLocation,
    insight,
    loading,
    error,
    requestLocation,
    setManualLocation,
    clearLocation,
  } = useEnvironmentalInsights(symptomLogDates);

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setManualLocation({ latitude: lat, longitude: lon });
      setShowManualEntry(false);
    }
  };

  // Opt-in gate — never fetch anything until the user explicitly shares a location.
  if (!hasLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CloudSun className="h-5 w-5 text-primary" />
            {t("dashboard.environmentalInsights.title")}
          </CardTitle>
          <CardDescription>{t("dashboard.environmentalInsights.optInDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={requestLocation} className="w-full sm:w-auto">
            <MapPin className="mr-2 h-4 w-4" />
            {t("dashboard.environmentalInsights.useMyLocation")}
          </Button>
          {!showManualEntry ? (
            <button
              type="button"
              onClick={() => setShowManualEntry(true)}
              className="block text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t("dashboard.environmentalInsights.enterManually")}
            </button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="sm:w-32"
              />
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Longitude"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="sm:w-32"
              />
              <Button size="sm" onClick={handleManualSubmit}>
                Save
              </Button>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CloudSun className="h-5 w-5 text-primary" />
            {t("dashboard.environmentalInsights.title")}
          </CardTitle>
          <CardDescription>{t("dashboard.environmentalInsights.subtitle")}</CardDescription>
        </div>
        <button
          type="button"
          onClick={clearLocation}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {t("dashboard.environmentalInsights.forgetLocation")}
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !insight ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("dashboard.environmentalInsights.loading")}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : insight ? (
          <>
            <div className="flex flex-wrap gap-4 text-sm">
              {insight.snapshot.current.temperatureC !== null && (
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  {insight.snapshot.current.temperatureC.toFixed(1)}°C
                </div>
              )}
              {insight.snapshot.current.pressureMsl !== null && (
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  {insight.snapshot.current.pressureMsl.toFixed(0)} hPa
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Wind className="h-4 w-4 text-muted-foreground" />
                {insight.snapshot.dailyAqi.map((d) => (
                  <Badge
                    key={d.date}
                    variant={
                      typeof d.aqi === "number" && d.aqi >= 100 ? "destructive" : "secondary"
                    }
                    className="text-[10px]"
                    title={d.date}
                  >
                    {d.aqi ?? "—"}
                  </Badge>
                ))}
              </div>
            </div>

            {insight.message && (
              <p className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed">
                {insight.message}
              </p>
            )}

            {insight.totalLoggedDays === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("dashboard.environmentalInsights.noLogsYet")}
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default EnvironmentalInsights;
