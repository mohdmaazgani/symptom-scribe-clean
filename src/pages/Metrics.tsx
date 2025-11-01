import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Heart, Thermometer, Weight, Droplet, Wind } from "lucide-react";

const metricTypes = [
  { value: "blood_pressure", label: "Blood Pressure", icon: Activity, unit: "mmHg" },
  { value: "heart_rate", label: "Heart Rate", icon: Heart, unit: "bpm" },
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°F" },
  { value: "weight", label: "Weight", icon: Weight, unit: "lbs" },
  { value: "blood_sugar", label: "Blood Sugar", icon: Droplet, unit: "mg/dL" },
  { value: "oxygen_saturation", label: "Oxygen Saturation", icon: Wind, unit: "%" },
];

const Metrics = () => {
  const [metricType, setMetricType] = useState("");
  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricType || (!value && metricType !== "blood_pressure")) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let metricValue: any = {};
      if (metricType === "blood_pressure") {
        metricValue = { systolic: parseInt(systolic), diastolic: parseInt(diastolic) };
      } else {
        metricValue = { value: parseFloat(value) };
      }

      const { error } = await supabase.from("health_metrics").insert({
        user_id: user.id,
        metric_type: metricType,
        value: metricValue,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Metric Recorded",
        description: "Your health metric has been saved successfully.",
      });

      // Reset form
      setValue("");
      setSystolic("");
      setDiastolic("");
      setNotes("");
    } catch (error) {
      console.error("Error saving metric:", error);
      toast({
        title: "Error",
        description: "Failed to save health metric",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Metrics</h1>
        <p className="text-muted-foreground">Track your vital signs and health measurements</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricTypes.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.value}
              className={`cursor-pointer transition-all hover-scale ${
                metricType === metric.value ? "border-primary bg-accent" : ""
              }`}
              onClick={() => setMetricType(metric.value)}
            >
              <CardContent className="pt-6 text-center">
                <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{metric.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record New Measurement</CardTitle>
          <CardDescription>Enter your latest health metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Metric Type</Label>
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric type" />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {metricType && (
              <>
                {metricType === "blood_pressure" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="systolic">Systolic</Label>
                      <Input
                        id="systolic"
                        type="number"
                        placeholder="120"
                        value={systolic}
                        onChange={(e) => setSystolic(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diastolic">Diastolic</Label>
                      <Input
                        id="diastolic"
                        type="number"
                        placeholder="80"
                        value={diastolic}
                        onChange={(e) => setDiastolic(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      Value ({metricTypes.find((m) => m.value === metricType)?.unit})
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.1"
                      placeholder="Enter value"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    type="text"
                    placeholder="Any additional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Record Metric"}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Metrics;
