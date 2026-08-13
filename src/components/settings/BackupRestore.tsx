import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DownloadCloud, UploadCloud, Lock } from "lucide-react";
import { db, type OfflineMetric, type OfflineSymptom } from "@/lib/offline-db";

const BackupRestore = () => {
  const [backupPassword, setBackupPassword] = useState("");
  const [restorePassword, setRestorePassword] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();

  const handleBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a password for the backup.",
      });
      return;
    }

    try {
      setIsBackingUp(true);
      const metrics = await db.healthMetrics.toArray();
      const symptoms = await db.symptomHistory.toArray();

      const payload = JSON.stringify({ metrics, symptoms });

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(backupPassword),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        new TextEncoder().encode(payload)
      );

      const exportObj = {
        salt: Array.from(salt),
        iv: Array.from(iv),
        ciphertext: Array.from(new Uint8Array(ciphertext)),
      };

      const blob = new Blob([JSON.stringify(exportObj)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `symptom-scribe-backup-${new Date().toISOString().split("T")[0]}.enc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Backup downloaded successfully.",
      });
      setBackupPassword("");
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create backup.",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!restorePassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the password before selecting a backup file.",
      });
      e.target.value = "";
      return;
    }

    try {
      setIsRestoring(true);
      const fileText = await file.text();
      const exportObj = JSON.parse(fileText);

      if (!exportObj.salt || !exportObj.iv || !exportObj.ciphertext) {
        throw new Error("Invalid backup file format");
      }

      const salt = new Uint8Array(exportObj.salt);
      const iv = new Uint8Array(exportObj.iv);
      const ciphertext = new Uint8Array(exportObj.ciphertext);

      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(restorePassword),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );

      const payload = JSON.parse(new TextDecoder().decode(decrypted));

      if (payload.metrics && Array.isArray(payload.metrics)) {
        await db.healthMetrics.bulkPut(
          payload.metrics.map((m: OfflineMetric) => ({ ...m, pending_sync: 1 }))
        );
      }
      if (payload.symptoms && Array.isArray(payload.symptoms)) {
        await db.symptomHistory.bulkPut(
          payload.symptoms.map((s: OfflineSymptom) => ({ ...s, pending_sync: 1 }))
        );
      }

      toast({
        title: "Success",
        description: "Backup restored successfully.",
      });
      setRestorePassword("");
      e.target.value = "";
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to restore backup. Incorrect password or invalid file.",
      });
      e.target.value = "";
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Backup</CardTitle>
          <CardDescription>
            Export your health metrics and symptom history to an encrypted file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBackup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-password">Backup Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="backup-password"
                  type="password"
                  placeholder="Enter a secure password"
                  className="pl-9"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  disabled={isBackingUp}
                />
              </div>
            </div>
            <Button type="submit" disabled={isBackingUp}>
              <DownloadCloud className="w-4 h-4 mr-2" />
              {isBackingUp ? "Creating Backup..." : "Export Backup"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restore Backup</CardTitle>
          <CardDescription>
            Restore your health data from a previously exported .enc file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restore-password">Restore Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="restore-password"
                  type="password"
                  placeholder="Enter the backup password"
                  className="pl-9"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  disabled={isRestoring}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restore-file">Select Backup File (.enc)</Label>
              <Input
                id="restore-file"
                type="file"
                accept=".enc"
                onChange={handleRestore}
                disabled={isRestoring}
              />
            </div>
            {isRestoring && (
              <Button disabled className="w-full sm:w-auto">
                <UploadCloud className="w-4 h-4 mr-2" />
                Restoring...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;
