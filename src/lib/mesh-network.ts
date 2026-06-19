import { db, type MeshAlert } from "./offline-db";
import {
  getP2PSigningKeys,
  signPayload,
  verifyPayload,
} from "./encryption";
import { supabase } from "@/integrations/supabase/client";

export interface MeshPeer {
  id: string;
  name: string;
  lastSeen: number;
}

type MeshMessage =
  | { type: "PING"; senderId: string; senderName: string }
  | { type: "PONG"; senderId: string; senderName: string }
  | {
      type: "ALERT";
      alert: Omit<MeshAlert, "pending_sync">;
      publicKeyJwk: JsonWebKey;
      signature: string;
    }
  | { type: "ALERT_SYNCED"; alertId: string };

class MeshNetworkManager {
  private channel: BroadcastChannel | null = null;
  private peers: Map<string, MeshPeer> = new Map();
  private nodeId: string = "";
  private nodeName: string = "";
  private listeners: Set<() => void> = new Set();
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  private isOfflineSimulated: boolean = false;

  constructor() {
    // Generate a unique node ID for this tab session
    this.nodeId = "peer-" + Math.random().toString(36).substring(2, 9);
    this.isOfflineSimulated = localStorage.getItem("symptom_scribe_offline_sim") === "true";

    if (typeof window !== "undefined") {
      this.channel = new BroadcastChannel("symptom_scribe_mesh_channel");
      this.channel.onmessage = (e) => this.handleMessage(e.data);

      // Start ping loop for peer discovery
      this.startDiscovery();

      // Listen for online events to relay pending alerts
      window.addEventListener("online", () => this.syncMeshAlerts());
      
      // Attempt initial sync if online
      if (this.isOnline()) {
        this.syncMeshAlerts();
      }

      // Tear down intervals and channel when the tab closes
      window.addEventListener("beforeunload", () => this.destroy());
    }
  }

  public setNodeName(name: string) {
    this.nodeName = name || "Anonymous User";
  }

  public getNodeId(): string {
    return this.nodeId;
  }

  public getNodeName(): string {
    return this.nodeName;
  }

  public isOnline(): boolean {
    if (this.isOfflineSimulated) return false;
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  public setOfflineSimulation(simulated: boolean) {
    this.isOfflineSimulated = simulated;
    localStorage.setItem("symptom_scribe_offline_sim", simulated ? "true" : "false");
    this.notifyListeners();

    if (!simulated && navigator.onLine) {
      this.syncMeshAlerts();
    }
  }

  public getOfflineSimulation(): boolean {
    return this.isOfflineSimulated;
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  public getPeers(): MeshPeer[] {
    const now = Date.now();
    // Clean up stale peers (older than 25 seconds)
    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > 25000) {
        this.peers.delete(id);
      }
    }
    return Array.from(this.peers.values());
  }

  private startDiscovery() {
    // Discovery Ping every 10 seconds
    const ping = () => {
      this.postMessage({
        type: "PING",
        senderId: this.nodeId,
        senderName: this.nodeName || "Local Node",
      });
    };

    ping();
    this.pingIntervalId = setInterval(ping, 10000);

    // Housekeeping cleanup every 5 seconds
    this.cleanupIntervalId = setInterval(() => {
      const activePeersCountBefore = this.peers.size;
      this.getPeers(); // triggers cleanup
      if (this.peers.size !== activePeersCountBefore) {
        this.notifyListeners();
      }
    }, 5000);
  }

  public destroy() {
    if (this.pingIntervalId !== null) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }

  private postMessage(msg: MeshMessage) {
    if (this.channel) {
      this.channel.postMessage(msg);
    }
  }

  private async handleMessage(msg: MeshMessage) {
    if (!msg || typeof msg !== "object") return;

    switch (msg.type) {
      case "PING":
        if (msg.senderId !== this.nodeId) {
          this.peers.set(msg.senderId, {
            id: msg.senderId,
            name: msg.senderName,
            lastSeen: Date.now(),
          });
          this.notifyListeners();
          
          // Respond with Pong
          this.postMessage({
            type: "PONG",
            senderId: this.nodeId,
            senderName: this.nodeName || "Local Node",
          });
        }
        break;

      case "PONG":
        if (msg.senderId !== this.nodeId) {
          const existed = this.peers.has(msg.senderId);
          this.peers.set(msg.senderId, {
            id: msg.senderId,
            name: msg.senderName,
            lastSeen: Date.now(),
          });
          if (!existed) {
            this.notifyListeners();
          }
        }
        break;

      case "ALERT":
        await this.handleAlertMessage(msg);
        break;

      case "ALERT_SYNCED":
        await this.handleAlertSyncedMessage(msg.alertId);
        break;
    }
  }

  private async handleAlertMessage(msg: {
    type: "ALERT";
    alert: Omit<MeshAlert, "pending_sync">;
    publicKeyJwk: JsonWebKey;
    signature: string;
  }) {
    const { alert, publicKeyJwk, signature } = msg;

    // Verify ECDSA signature to prevent spoofing/spam
    const payloadString = this.getAlertPayloadString(alert);
    const isValid = await verifyPayload(payloadString, signature, publicKeyJwk);

    if (!isValid) {
      console.warn("Invalid signature for emergency mesh alert:", alert.id);
      return;
    }

    // Check if we already have this alert
    const existing = await db.pendingEmergencyMesh.get(alert.id);
    if (existing) {
      return; // Already processed, avoid infinite loop
    }

    // Save to local IndexedDB
    const localAlert: MeshAlert = {
      ...alert,
      publicKeyJwk,
      signature,
      pending_sync: this.isOnline() ? 0 : 1, // Need to sync if currently offline
    };

    await db.pendingEmergencyMesh.put(localAlert);
    this.notifyListeners();

    // Trigger local audio or custom notification event in UI
    const event = new CustomEvent("mesh-alert-received", { detail: localAlert });
    window.dispatchEvent(event);

    // Rebroadcast to other tabs/windows (flood routing)
    this.postMessage(msg);

    // If we are online, act as a gateway and immediately relay it!
    if (this.isOnline()) {
      this.relayAlert(localAlert);
    }
  }

  private async handleAlertSyncedMessage(alertId: string) {
    const existing = await db.pendingEmergencyMesh.get(alertId);
    if (existing && existing.pending_sync === 1) {
      await db.pendingEmergencyMesh.update(alertId, { pending_sync: 0 });
      this.notifyListeners();
      
      const event = new CustomEvent("mesh-sync-completed", { detail: alertId });
      window.dispatchEvent(event);
    }
  }

  private getAlertPayloadString(alert: Omit<MeshAlert, "pending_sync">): string {
    // Reconstruct normalized string for signature verification
    return JSON.stringify({
      id: alert.id,
      sender_id: alert.sender_id,
      sender_name: alert.sender_name,
      latitude: alert.latitude,
      longitude: alert.longitude,
      timestamp: alert.timestamp,
      contact_phone: alert.contact_phone,
      contact_name: alert.contact_name,
    });
  }

  public async triggerEmergencyAlert(
    latitude: number | null,
    longitude: number | null,
    contactName: string,
    contactPhone: string
  ): Promise<MeshAlert> {
    const keys = await getP2PSigningKeys();

    const alert: Omit<MeshAlert, "pending_sync"> = {
      id: crypto.randomUUID(),
      sender_id: this.nodeId,
      sender_name: this.nodeName || "Local Node",
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      contact_name: contactName,
      contact_phone: contactPhone,
      signature: "",
      publicKeyJwk: await crypto.subtle.exportKey("jwk", keys.publicKey),
    };

    const payloadString = this.getAlertPayloadString(alert);
    const signature = await signPayload(payloadString, keys.privateKey);

    const fullAlert: MeshAlert = {
      ...alert,
      signature,
      pending_sync: this.isOnline() ? 0 : 1,
    };

    // Store in our own local Dexie table
    await db.pendingEmergencyMesh.put(fullAlert);
    this.notifyListeners();

    // Broadcast packet locally to all peers
    this.postMessage({
      type: "ALERT",
      alert: {
        id: alert.id,
        sender_id: alert.sender_id,
        sender_name: alert.sender_name,
        latitude,
        longitude,
        timestamp: alert.timestamp,
        contact_name: alert.contact_name,
        contact_phone: alert.contact_phone,
        signature,
        publicKeyJwk: alert.publicKeyJwk,
      },
      publicKeyJwk: alert.publicKeyJwk,
      signature,
    });

    // If online, send directly to Edge Function
    if (this.isOnline()) {
      this.relayAlert(fullAlert);
    }

    return fullAlert;
  }

  private async relayAlert(alert: MeshAlert) {
    try {
      console.log(`Mesh Gateway: Relaying alert ${alert.id} to cloud...`);
      const { data, error } = await supabase.functions.invoke("broadcast-emergency", {
        body: {
          latitude: alert.latitude ?? undefined,
          longitude: alert.longitude ?? undefined,
          sender_name: alert.sender_name,
          contact_phone: alert.contact_phone,
          contact_name: alert.contact_name,
        },
      });

      if (error) throw error;

      console.log(`Mesh Gateway: Successfully relayed alert ${alert.id}!`);
      
      // Update local storage status
      await db.pendingEmergencyMesh.update(alert.id, { pending_sync: 0 });
      this.notifyListeners();

      // Notify other tabs that it is synced
      this.postMessage({
        type: "ALERT_SYNCED",
        alertId: alert.id,
      });

      const event = new CustomEvent("mesh-sync-completed", { detail: alert.id });
      window.dispatchEvent(event);
    } catch (err) {
      console.error(`Mesh Gateway: Failed to relay alert ${alert.id}:`, err);
    }
  }

  public async syncMeshAlerts() {
    if (!this.isOnline()) return;

    try {
      const unsyncedAlerts = await db.pendingEmergencyMesh
        .where("pending_sync")
        .equals(1)
        .toArray();

      if (unsyncedAlerts.length === 0) return;

      console.log(`Mesh Gateway: Found ${unsyncedAlerts.length} unsynced alerts in mesh queue.`);
      for (const alert of unsyncedAlerts) {
        await this.relayAlert(alert);
      }
    } catch (err) {
      console.error("Failed to query unsynced mesh alerts:", err);
    }
  }
}

export const meshNetwork = new MeshNetworkManager();
