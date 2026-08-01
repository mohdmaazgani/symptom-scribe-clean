import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, decryptMetric, decryptSymptom, encryptMetric, encryptSymptom } from "@/lib/offline-db";
import { whenEncryptionReady, getSearchKey } from "@/lib/encryption";
import { encryptBackupData, decryptBackupData } from "@/lib/backup-utils";
import { supabase } from "@/integrations/supabase/client";
import { syncOfflineData } from "@/lib/offline-db";
import { invalidateCache } from "@/lib/cached-queries";

const BackupRestore = () => {
  const { toast } = useToast();
  
  // Backup state
  const [backupPassword, setBackupPassword] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  // Restore state
  const [restorePassword, setRestorePassword] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const handleBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupPassword || backupPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Please enter a password of at least 6 characters for the backup.",
        variant: "destructive"
      });
      return;
    }
    
    setIsBackingUp(true);
    try {
      const key = await whenEncryptionReady();
      
      // Fetch all local records
      const metrics = await db.healthMetrics.toArray();
      const symptoms = await db.symptomHistory.toArray();
      
      // Decrypt to plain JSON
      const decryptedMetrics = await Promise.all(
        metrics.map(record => decryptMetric(record, key))
      );
      const decryptedSymptoms = await Promise.all(
        symptoms.map(record => decryptSymptom(record, key))
      );
      
      const payload = {
        metrics: decryptedMetrics,
        symptoms: decryptedSymptoms,
        version: 1,
        timestamp: new Date().toISOString()
      };
      
      const jsonStr = JSON.stringify(payload);
      
      // Encrypt with user provided password
      const encryptedBlob = await encryptBackupData(jsonStr, backupPassword);
      
      // Trigger download
      const blob = new Blob([encryptedBlob], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `symptom-scribe-backup-${new Date().toISOString().slice(0, 10)}.enc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Complete",
        description: "Your data has been successfully exported and encrypted.",
      });
      setBackupPassword("");
    } catch (error) {
      console.error("Backup failed:", error);
      toast({
        title: "Backup Failed",
        description: "An error occurred while creating the backup.",
        variant: "destructive"
      });
    } finally {
      setIsBackingUp(false);
    }
  };
  
  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restorePassword || !restoreFile) {
      toast({
        title: "Validation Error",
        description: "Please provide both the backup file and the password.",
        variant: "destructive"
      });
      return;
    }
    
    setIsRestoring(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in to restore data.");

      const fileContent = await restoreFile.text();
      
      // Decrypt backup
      const decryptedJsonStr = await decryptBackupData(fileContent, restorePassword);
      const payload = JSON.parse(decryptedJsonStr);
      
      if (!payload.metrics || !payload.symptoms) {
        throw new Error("Invalid backup payload format.");
      }
      
      const activeKey = await whenEncryptionReady();
      const activeSearchKey = getSearchKey();
      
      // Re-encrypt and save to Dexie
      for (const m of payload.metrics) {
        // override user_id to current user to prevent cross-account leakage
        m.user_id = user.id;
        m.pending_sync = 1; 
        const encrypted = await encryptMetric(m, activeKey, activeSearchKey);
        await db.healthMetrics.put(encrypted);
      }
      
      for (const s of payload.symptoms) {
        s.user_id = user.id;
        s.pending_sync = 1;
        const encrypted = await encryptSymptom(s, activeKey, activeSearchKey);
        await db.symptomHistory.put(encrypted);
      }
      
      // Trigger sync
      syncOfflineData().catch(console.error);
      
      // Invalidate queries so UI refreshes
      await invalidateCache("health_metrics");
      await invalidateCache("symptom_history");
      
      toast({
        title: "Restore Successful",
        description: `Restored ${payload.metrics.length} metrics and ${payload.symptoms.length} symptoms.`,
      });
      setRestorePassword("");
      setRestoreFile(null);
      // reset file input
      const fileInput = document.getElementById("restore-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
    } catch (error: any) {
      console.error("Restore failed:", error);
      toast({
        title: "Restore Failed",
        description: error.message || "An error occurred while restoring. Please check your password.",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Encrypted Backup
          </CardTitle>
          <CardDescription>
            Download your health records. Protect the file with a strong password. You will need this password to restore your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBackup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-password">Backup Password</Label>
              <Input
                id="backup-password"
                type="password"
                placeholder="Enter a strong password (min 6 chars)"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isBackingUp} className="w-full">
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Backup File
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Restore Backup
          </CardTitle>
          <CardDescription>
            Restore your health records from a previous backup file. Existing records with the same IDs will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRestore} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restore-file">Backup File</Label>
              <Input
                id="restore-file"
                type="file"
                accept=".enc,application/octet-stream"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restore-password">Backup Password</Label>
              <Input
                id="restore-password"
                type="password"
                placeholder="Enter the password used to create the backup"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="secondary" disabled={isRestoring || !restoreFile} className="w-full">
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring Data...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Restore Data
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;
