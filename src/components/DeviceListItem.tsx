import { ActionPanel, List } from "@raycast/api";
import { Device } from "../types";
import { getDeviceTypeIcon, getStatusIcon, getStatusLabel, getStatusColor } from "../utils";
import { IOSDeviceActions, AndroidDeviceActions, CommonDeviceActions } from "./DeviceActions";
import { formatDeviceVersion } from "../utils";

interface DeviceListItemProps {
  device: Device;
  onRefresh: () => void;
}

export function DeviceListItem({ device, onRefresh }: DeviceListItemProps) {
  const formattedVersion = formatDeviceVersion(device.runtime, device.category);

  return (
    <List.Item
      key={device.id}
      icon={getDeviceTypeIcon(device.deviceType)}
      title={device.name}
      subtitle={device.deviceType}
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
          {/* Render specific actions based on device category */}
          {device.category === "ios" && <IOSDeviceActions device={device} onRefresh={onRefresh} />}
          {device.category === "android" && <AndroidDeviceActions device={device} onRefresh={onRefresh} />}

          {/* Common actions for all devices */}
          <CommonDeviceActions device={device} onRefresh={onRefresh} />
        </ActionPanel>
      }
    />
  );
}
