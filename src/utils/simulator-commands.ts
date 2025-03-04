import { showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { Device, SimulatorDevice } from "../types";
import { getDeviceType } from "./device-utils";

export const execAsync = promisify(exec);

// Fetch iOS simulators
export async function fetchIOSDevices(): Promise<Device[]> {
  try {
    const { stdout: simulatorsOutput } = await execAsync("xcrun simctl list devices --json");
    const simulatorsData = JSON.parse(simulatorsOutput);

    const iosDevices: Device[] = [];

    // Process iOS simulators
    Object.entries(simulatorsData.devices).forEach(([runtime, deviceList]) => {
      // Type assertion to help TypeScript understand the structure
      const devices = deviceList as SimulatorDevice[];

      devices.forEach((device) => {
        const deviceType = getDeviceType(device.name);
        iosDevices.push({
          id: device.udid,
          name: device.name,
          status: device.state,
          type: device.deviceTypeIdentifier || "",
          runtime: runtime.replace("com.apple.CoreSimulator.SimRuntime.", ""),
          category: "ios",
          deviceType,
        });
      });
    });

    return iosDevices;
  } catch (error) {
    console.error("Error fetching iOS devices:", error);
    throw error;
  }
}

// Fetch Android emulators (placeholder)
export async function fetchAndroidDevices(): Promise<Device[]> {
  // This is a placeholder for Android emulator fetching
  // You would implement this using ADB or similar
  return [];
}

// Execute a simulator command
export async function executeSimulatorCommand(
  command: string,
  deviceId: string,
  successMessage: string,
): Promise<void> {
  try {
    await execAsync(`xcrun simctl ${command} ${deviceId}`);
    showToast({
      style: Toast.Style.Success,
      title: successMessage,
    });
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: `Failed to ${command} simulator`,
      message: String(error),
    });
    throw error;
  }
}

// Open a simulator
export function openSimulator(deviceId: string): void {
  exec(`open -a Simulator --args -CurrentDeviceUDID ${deviceId}`);
  showToast({
    style: Toast.Style.Success,
    title: "Opening simulator",
  });
}
