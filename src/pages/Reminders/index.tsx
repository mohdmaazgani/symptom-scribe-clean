import { Bell, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReminderManager from "@/components/reminders/ReminderManager";
import ReminderHistory from "@/components/reminders/ReminderHistory";

const Reminders = () => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Symptom Reminders</h1>
        <p className="text-muted-foreground">
          Stay consistent with your symptom tracking by scheduling recurring
          reminders.
        </p>
      </div>

      <Tabs defaultValue="reminders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Reminders</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders">
          <ReminderManager />
        </TabsContent>

        <TabsContent value="history">
          <ReminderHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reminders;
