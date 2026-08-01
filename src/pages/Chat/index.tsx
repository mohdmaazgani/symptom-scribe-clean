import ChatInterface from "@/components/chat/ChatInterface";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bot } from "lucide-react";

const Chat = () => {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="shrink-0 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow shrink-0">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            AI Health Assistant
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe your symptoms for instant AI analysis
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 chat-glass rounded-2xl overflow-hidden">
        <ChatInterface />
      </div>

      <Alert className="shrink-0 border-destructive/30 bg-destructive/5 rounded-xl">
        <AlertCircle className="h-4 w-4 text-destructive/80" />
        <AlertDescription className="text-sm text-muted-foreground">
          <strong className="text-foreground">Medical Disclaimer:</strong> This provides general
          information only. Always seek professional medical advice for diagnosis or treatment.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Chat;
