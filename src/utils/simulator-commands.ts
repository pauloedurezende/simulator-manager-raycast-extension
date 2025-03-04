// utils/simulator-commands.ts
import { showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { Device, SimulatorDevice } from "../types";
import { getDeviceType } from "./device-utils";
import { homedir } from "os";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

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

// Find Android SDK tools
function findAndroidSdkTool(toolName: string): string | null {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;

  const possiblePaths = [
    // Direct paths
    `/usr/local/bin/${toolName}`,

    // From ANDROID_HOME
    androidHome ? join(androidHome, "platform-tools", toolName) : null,
    androidHome ? join(androidHome, "emulator", toolName) : null,
    androidHome ? join(androidHome, "tools", toolName) : null,
    androidHome ? join(androidHome, "tools/bin", toolName) : null,

    // Common locations
    join(homedir(), "Library/Android/sdk/platform-tools", toolName),
    join(homedir(), "Library/Android/sdk/emulator", toolName),
    join(homedir(), "Library/Android/sdk/tools", toolName),
    join(homedir(), "Library/Android/sdk/tools/bin", toolName),

    // Linux/Windows common locations
    join(homedir(), "Android/Sdk/platform-tools", toolName),
    join(homedir(), "Android/Sdk/emulator", toolName),
    join(homedir(), "Android/Sdk/tools", toolName),
    join(homedir(), "Android/Sdk/tools/bin", toolName),
  ].filter(Boolean) as string[];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

// Fetch Android emulators
export async function fetchAndroidDevices(): Promise<Device[]> {
  try {
    // Find emulator and adb executables
    const emulatorPath = findAndroidSdkTool("emulator");
    const adbPath = findAndroidSdkTool("adb");

    if (!emulatorPath) {
      console.warn("Android emulator executable not found");
      return [];
    }

    // Get list of available AVDs
    const { stdout: avdListOutput } = await execAsync(`${emulatorPath} -list-avds`);
    const avdNames = avdListOutput.trim().split("\n").filter(Boolean);

    if (avdNames.length === 0) {
      console.warn("No Android Virtual Devices found");
      return [];
    }

    // Initialize running devices array
    let runningDevices: string[] = [];

    // Get running emulators if adb is available
    if (adbPath) {
      try {
        const { stdout: adbDevicesOutput } = await execAsync(`${adbPath} devices`);
        runningDevices = adbDevicesOutput
          .split("\n")
          .slice(1) // Skip the first line which is the header
          .filter((line) => line.includes("emulator-") && line.includes("device"))
          .map((line) => line.split("\t")[0]); // Get the device ID
      } catch (error) {
        console.warn("Error getting running Android emulators:", error);
        // Continue with empty running devices list
      }
    } else {
      console.warn("Android Debug Bridge (adb) not found, cannot determine running emulators");
    }

    // Read AVD config files to get more details
    const androidDevices: Device[] = [];

    for (const avdName of avdNames) {
      // Try to find the AVD config file
      const avdConfigPath = join(homedir(), ".android/avd", `${avdName}.avd/config.ini`);
      let deviceType = "Android Phone";
      let androidVersion = "Unknown";

      if (existsSync(avdConfigPath)) {
        const configContent = readFileSync(avdConfigPath, "utf-8");

        // Extract device type (phone/tablet)
        // Check for small_phone, medium_phone, etc.
        if (configContent.match(/hw\.device\.name\s*=\s*.*small_phone/)) {
          deviceType = "Android Phone";
        } else if (configContent.match(/hw\.device\.name\s*=\s*.*medium_phone/)) {
          deviceType = "Android Phone";
        } else if (configContent.match(/hw\.device\.name\s*=\s*.*large_phone/)) {
          deviceType = "Android Phone";
        } else if (configContent.match(/hw\.device\.name\s*=\s*.*pixel_[0-9]/)) {
          deviceType = "Android Phone";
        } else if (configContent.match(/hw\.device\.name\s*=\s*.*tablet/)) {
          deviceType = "Android Tablet";
        } else if (configContent.match(/hw\.device\.name\s*=\s*.*tv/)) {
          deviceType = "Android TV";
        } else if (configContent.match(/hw\.device\.name\s*=\s*.*wear/)) {
          deviceType = "Android Wear";
        }

        // Extract Android version from image.sysdir.1 property
        // This handles paths like system-images/android-35/google_apis/arm64-v8a/
        const androidVersionMatch = configContent.match(/image\.sysdir\.1\s*=\s*.*android-(\d+)/);
        if (androidVersionMatch && androidVersionMatch[1]) {
          const apiLevel = parseInt(androidVersionMatch[1]);
          androidVersion = `Android ${getAndroidVersionFromApiLevel(apiLevel)}`;
        } else {
          // Fallback to target property if image.sysdir.1 is not found
          const apiLevelMatch = configContent.match(/target\s*=\s*([0-9]+)/);
          if (apiLevelMatch && apiLevelMatch[1]) {
            const apiLevel = parseInt(apiLevelMatch[1]);
            androidVersion = `Android ${getAndroidVersionFromApiLevel(apiLevel)}`;
          }
        }

        // If we still don't have a version, try to extract it from the AVD name
        if (androidVersion === "Unknown") {
          const apiLevelInName = avdName.match(/API_(\d+)/i) || avdName.match(/Android_(\d+)/i);
          if (apiLevelInName && apiLevelInName[1]) {
            const apiLevel = parseInt(apiLevelInName[1]);
            androidVersion = `Android ${getAndroidVersionFromApiLevel(apiLevel)}`;
          }
        }
      }

      // Check if this emulator is running
      // This is a simplistic approach - in reality, we'd need to map AVD names to emulator IDs
      const isRunning = runningDevices.length > 0 && runningDevices.some((id) => id.includes("emulator"));

      androidDevices.push({
        id: avdName,
        name: avdName,
        status: isRunning ? "Booted" : "Shutdown",
        type: deviceType,
        runtime: androidVersion,
        category: "android",
        deviceType,
      });
    }

    return androidDevices;
  } catch (error) {
    console.error("Error fetching Android devices:", error);
    // Return empty array instead of throwing to avoid breaking iOS functionality
    return [];
  }
}

// Helper function to convert API level to Android version
function getAndroidVersionFromApiLevel(apiLevel: number): string {
  const versionMap: Record<number, string> = {
    35: "15.0", // Android U
    34: "14.0", // Android Upside Down Cake
    33: "13.0", // Android Tiramisu
    32: "12.1", // Android 12L
    31: "12.0", // Android Snow Cone
    30: "11.0", // Android Red Velvet Cake
    29: "10.0", // Android Quince Tart
    28: "9.0", // Android Pie
    27: "8.1", // Android Oreo
    26: "8.0", // Android Oreo
    25: "7.1", // Android Nougat
    24: "7.0", // Android Nougat
    23: "6.0", // Android Marshmallow
    22: "5.1", // Android Lollipop
    21: "5.0", // Android Lollipop
    // Add more mappings as needed
  };

  return versionMap[apiLevel] || `API ${apiLevel}`;
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
