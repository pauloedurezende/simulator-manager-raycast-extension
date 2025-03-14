import { Action, Icon, openExtensionPreferences } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { Device } from "../types";
import {
  executeSimulatorCommand,
  openSimulator,
  startAndroidEmulator,
  stopAndroidEmulator,
  openAndroidEmulator,
} from "../utils/simulator-commands";

interface DeviceActionsProps {
  device: Device;
  onRefresh: () => void;
}

export function IOSDeviceActions({ device, onRefresh }: DeviceActionsProps) {
  return (
    <>
      {device.status !== "Booted" && (
        <Action
          title="Boot Simulator"
          icon={Icon.Play}
          onAction={async () => {
            try {
              await executeSimulatorCommand("boot", device.id, "Simulator booted successfully");
              onRefresh();
            } catch (error) {
              showFailureToast(error);
            }
          }}
        />
      )}
      {device.status === "Booted" && (
        <Action
          title="Shutdown Simulator"
          icon={Icon.Stop}
          onAction={async () => {
            try {
              await executeSimulatorCommand("shutdown", device.id, "Simulator shut down successfully");
              onRefresh();
            } catch (error) {
              showFailureToast(error);
            }
          }}
        />
      )}
      <Action
        title="Open Simulator"
        icon={Icon.Eye}
        onAction={async () => {
          try {
            await openSimulator(device.id);
            onRefresh();
          } catch (error) {
            showFailureToast(error);
          }
        }}
      />
    </>
  );
}

// Componente para ações de dispositivos Android
export function AndroidDeviceActions({ device, onRefresh }: DeviceActionsProps) {
  return (
    <>
      {device.status !== "Booted" && (
        <Action
          title="Boot Emulator"
          icon={Icon.Play}
          onAction={async () => {
            try {
              await startAndroidEmulator(device.id);
              onRefresh();
            } catch (error) {
              showFailureToast(error);
            }
          }}
        />
      )}
      {device.status === "Booted" && (
        <Action
          title="Shutdown Emulator"
          icon={Icon.Stop}
          onAction={async () => {
            try {
              await stopAndroidEmulator(device.id);
              onRefresh();
            } catch (error) {
              showFailureToast(error);
            }
          }}
        />
      )}
      <Action
        title="Open Emulator"
        icon={Icon.Eye}
        onAction={() => {
          openAndroidEmulator(device.id);
          onRefresh();
        }}
      />
    </>
  );
}

export function CommonDeviceActions({ device, onRefresh }: DeviceActionsProps) {
  return (
    <>
      <Action
        title="Refresh Devices"
        icon={Icon.RotateClockwise}
        onAction={onRefresh}
        shortcut={{ modifiers: ["cmd"], key: "r" }}
      />
      <Action.CopyToClipboard title="Copy Device Id" content={device.id} />
      <Action
        title="Configure Android Sdk Path"
        icon={Icon.Gear}
        onAction={() => openExtensionPreferences()}
        shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
      />
    </>
  );
}
