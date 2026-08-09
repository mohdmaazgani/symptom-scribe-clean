import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { meshNetwork } from "../mesh-network";

describe("Mesh Network Deadlock & Stale Peer Cleanup", () => {
  beforeEach(() => {
    meshNetwork.setNodeName("Test Peer Node");
  });

  afterEach(() => {
    meshNetwork.cleanupStalePeers();
  });

  it("should initialize node parameters and clean up stale peers without throwing", () => {
    expect(meshNetwork.getNodeId()).toBeDefined();
    expect(meshNetwork.getNodeName()).toBe("Test Peer Node");

    meshNetwork.cleanupStalePeers();
    const peers = meshNetwork.getPeers();
    expect(Array.isArray(peers)).toBe(true);
  });

  it("should handle offline simulation status changes gracefully", () => {
    meshNetwork.setOfflineSimulation(true);
    expect(meshNetwork.getOfflineSimulation()).toBe(true);
    expect(meshNetwork.isOnline()).toBe(false);

    meshNetwork.setOfflineSimulation(false);
    expect(meshNetwork.getOfflineSimulation()).toBe(false);
  });
});
