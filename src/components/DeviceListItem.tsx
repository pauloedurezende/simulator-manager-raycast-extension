import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { Device } from "../types";
import { getDeviceTypeIcon, getStatusIcon, getStatusLabel, getStatusColor } from "../utils/device-utils";
import { executeSimulatorCommand, openSimulator } from "../utils/simulator-commands";

interface DeviceListItemProps {
  device: Device;
  onRefresh: () => void;
}

export function DeviceListItem({ device, onRefresh }: DeviceListItemProps) {
  // Extract iOS version from runtime (e.g., "iOS-17-0" -> "iOS 17.0")
  const formattedVersion = device.runtime
    .replace("iOS-", "iOS ")
    .replace(/-/g, ".")
    .replace("tvOS-", "tvOS ")
    .replace("watchOS-", "watchOS ");

  return (
    <List.Item
      key={device.id}
      icon={getDeviceTypeIcon(device.deviceType)}
      title={device.name}
      accessories={[
        {
          text: formattedVersion,
          tooltip: `Version: ${formattedVersion}`,
        },
        {
          icon: { source: getStatusIcon(device.status), tintColor: getStatusColor(device.status) },
          text: { value: getStatusLabel(device.status), color: getStatusColor(device.status) },
          tooltip: `Status: ${device.status}`,
        },
      ]}
      actions={
        <ActionPanel>
          {device.status !== "Booted" && (
            <Action
              title="Boot Simulator"
              icon={Icon.Play}
              onAction={async () => {
                if (device.category === "ios") {
                  try {
                    await executeSimulatorCommand("boot", device.id, "Simulator booted successfully");
                    onRefresh();
                  } catch (error) {
                    console.error(error);
                  }
                }
              }}
            />
          )}
          {device.status === "Booted" && (
            <Action
              title="Shutdown Simulator"
              icon={Icon.Stop}
              onAction={async () => {
                if (device.category === "ios") {
                  try {
                    await executeSimulatorCommand("shutdown", device.id, "Simulator shut down successfully");
                    onRefresh();
                  } catch (error) {
                    console.error(error);
                  }
                }
              }}
            />
          )}
          <Action
            title="Open Simulator"
            icon={Icon.Eye}
            onAction={() => {
              if (device.category === "ios") {
                openSimulator(device.id);
              }
            }}
          />
          <Action
            title="Refresh Devices"
            icon={Icon.RotateClockwise}
            onAction={onRefresh}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
          <Action.CopyToClipboard title="Copy Device Id" content={device.id} />
        </ActionPanel>
      }
    />
  );
}
