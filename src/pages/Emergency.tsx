import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, AlertTriangle, Hospital, MapPin, ExternalLink } from "lucide-react";

const Emergency = () => {
  const emergencyNumbers = [
    { country: "USA", number: "911", description: "Emergency Services" },
    { country: "UK", number: "999", description: "Emergency Services" },
    { country: "Europe", number: "112", description: "Emergency Services" },
    { country: "India", number: "102", description: "Ambulance" },
    { country: "Australia", number: "000", description: "Emergency Services" },
  ];

  const emergencySigns = [
    "Chest pain or pressure",
    "Difficulty breathing or shortness of breath",
    "Sudden numbness or weakness",
    "Confusion or trouble speaking",
    "Severe bleeding",
    "Severe allergic reaction",
    "Suicidal thoughts",
    "Severe burns",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          Emergency Resources
        </h1>
        <p className="text-muted-foreground">Quick access to emergency contacts and information</p>
      </div>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            When to Call Emergency Services
          </CardTitle>
          <CardDescription>
            If you or someone else experiences any of these symptoms, call emergency services immediately:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {emergencySigns.map((sign, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                {sign}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Emergency Numbers
          </CardTitle>
          <CardDescription>
            Contact emergency services in your region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emergencyNumbers.map((item, idx) => (
              <Card key={idx} className="bg-accent">
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{item.country}</p>
                  <p className="text-3xl font-bold text-primary mb-1">{item.number}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hospital className="w-5 h-5" />
              Find Nearby Hospitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => {
                window.open(
                  "https://www.google.com/maps/search/hospital+near+me",
                  "_blank"
                );
              }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Open Maps
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Crisis Hotlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <p className="font-semibold">National Suicide Prevention Lifeline</p>
              <p className="text-primary">1-800-273-8255</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold">Crisis Text Line</p>
              <p className="text-primary">Text HOME to 741741</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-accent">
        <CardHeader>
          <CardTitle>Important Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Always call emergency services first in a life-threatening situation</p>
          <p>• Stay on the line and follow dispatcher instructions</p>
          <p>• Provide your exact location if possible</p>
          <p>• Keep your emergency contacts updated in your profile</p>
          <p>• Have your medical information readily available</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Emergency;
