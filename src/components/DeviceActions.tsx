import { Action, Icon, openExtensionPreferences } from "@raycast/api";
import { Device } from "../types";
import {
  startAndroidEmulator,
  stopAndroidEmulator,
  bootAndOpenSimulator,
  shutdownSimulator,
} from "../utils/simulator-commands";
import { executeWithErrorHandling } from "../utils";

const ACTION_TITLES = {
  BOOT_IOS: "Boot Simulator",
  SHUTDOWN_IOS: "Shutdown Simulator",
  OPEN_IOS: "Open Simulator",
  BOOT_ANDROID: "Boot Emulator",
  SHUTDOWN_ANDROID: "Shutdown Emulator",
  OPEN_ANDROID: "Open Emulator",
  REFRESH: "Refresh Devices",
  COPY_ID: "Copy Device Id",
  CONFIGURE: "Configure Android Sdk Path",
};

interface DeviceActionsProps {
  device: Device;
  onRefresh: () => void;
}

export function IOSDeviceActions({ device, onRefresh }: DeviceActionsProps) {
  const bootDevice = async () => bootAndOpenSimulator(device.id);
  const shutdownDevice = async () => shutdownSimulator(device.id);

  return (
    <>
      {device.status !== "Booted" && (
        <Action
          title={ACTION_TITLES.BOOT_IOS}
          icon={Icon.Play}
          onAction={() => executeWithErrorHandling(bootDevice, onRefresh)}
        />
      )}
      {device.status === "Booted" && (
        <Action
          title={ACTION_TITLES.SHUTDOWN_IOS}
          icon={Icon.Stop}
          onAction={() => executeWithErrorHandling(shutdownDevice, onRefresh)}
        />
      )}
    </>
  );
}

export function AndroidDeviceActions({ device, onRefresh }: DeviceActionsProps) {
  const bootEmulator = () => startAndroidEmulator(device.id);
  const shutdownEmulator = () => stopAndroidEmulator(device.id);

  return (
    <>
      {device.status !== "Booted" && (
        <Action
          title={ACTION_TITLES.BOOT_ANDROID}
          icon={Icon.Play}
          onAction={() => executeWithErrorHandling(bootEmulator, onRefresh)}
        />
      )}
      {device.status === "Booted" && (
        <Action
          title={ACTION_TITLES.SHUTDOWN_ANDROID}
          icon={Icon.Stop}
          onAction={() => executeWithErrorHandling(shutdownEmulator, onRefresh)}
        />
      )}
    </>
  );
}

export function CommonDeviceActions({ device, onRefresh }: DeviceActionsProps) {
  return (
    <>
      <Action
        title={ACTION_TITLES.REFRESH}
        icon={Icon.RotateClockwise}
        onAction={onRefresh}
        shortcut={{ modifiers: ["cmd"], key: "r" }}
      />
      <Action.CopyToClipboard
        title={ACTION_TITLES.COPY_ID}
        content={device.id}
        shortcut={{ modifiers: ["cmd"], key: "i" }}
      />
      <Action
        title={ACTION_TITLES.CONFIGURE}
        icon={Icon.Gear}
        onAction={() => openExtensionPreferences()}
        shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
      />
    </>
  );
}
