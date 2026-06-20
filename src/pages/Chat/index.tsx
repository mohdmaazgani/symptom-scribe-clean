import ChatInterface from "@/components/ChatInterface";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Chat = () => {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-foreground">AI Health Assistant</h1>
        <p className="text-muted-foreground">Describe your symptoms for instant AI analysis</p>
      </div>

      <div className="flex-1 min-h-0 bg-card rounded-xl shadow-soft border border-border overflow-hidden">
        <ChatInterface />
      </div>

      <Alert className="shrink-0 border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-sm">
          <strong>Medical Disclaimer:</strong> This provides general information only.
          Always seek professional medical advice for diagnosis or treatment.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Chat;
