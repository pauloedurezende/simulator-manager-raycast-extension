import { ActionPanel, Action, Icon, List, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CATEGORIES = [
  { id: "all", name: "All Devices" },
  { id: "ios", name: "iOS Simulators" },
  { id: "android", name: "Android Emulators" },
];

interface Device {
  id: string;
  name: string;
  status: string;
  type: string;
  runtime: string;
  category: string;
  deviceType: string; // iPhone, iPad, etc.
}

interface SimulatorDevice {
  udid: string;
  name: string;
  state: string;
  deviceTypeIdentifier?: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to determine device type from name
  const getDeviceType = (name: string): string => {
    if (name.includes("iPhone")) return "iPhone";
    if (name.includes("iPad")) return "iPad";
    if (name.includes("Apple TV")) return "Apple TV";
    if (name.includes("Apple Watch")) return "Apple Watch";
    if (name.includes("HomePod")) return "HomePod";
    if (name.includes("iPod")) return "iPod";
    if (name.includes("Mac")) return "Mac";
    return "Other";
  };

  // Function to fetch devices
  const fetchDevices = async () => {
    try {
      setIsLoading(true);

      // Fetch iOS simulators
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

      // For Android emulators, you would need to add a similar implementation
      // using "adb devices" or similar command
      // This is a placeholder for now
      const androidDevices: Device[] = [];

      setDevices([...iosDevices, ...androidDevices]);
    } catch (error) {
      console.error("Error fetching devices:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch devices",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDevices();

    // Set up a refresh interval (every 5 seconds)
    const intervalId = setInterval(fetchDevices, 5000);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const filteredDevices = devices.filter((device) => {
    const matchesSearch = device.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === "all" || device.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group devices by type
  const groupedDevices = filteredDevices.reduce(
    (acc, device) => {
      if (!acc[device.deviceType]) {
        acc[device.deviceType] = [];
      }
      acc[device.deviceType].push(device);
      return acc;
    },
    {} as Record<string, Device[]>,
  );

  // Sort device types for consistent ordering
  const deviceTypes = Object.keys(groupedDevices).sort((a, b) => {
    // Custom sort order
    const order = ["iPhone", "iPad", "Apple Watch", "Apple TV", "HomePod", "iPod", "Mac", "Other"];
    return order.indexOf(a) - order.indexOf(b);
  });

  // Function to get a user-friendly status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Booted":
        return "Running";
      case "Shutdown":
        return "Stopped";
      default:
        return status;
    }
  };

  // Function to get appropriate status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Booted":
        return Icon.CheckCircle;
      case "Shutdown":
        return Icon.Circle;
      default:
        return Icon.QuestionMark;
    }
  };

  // Function to get device type icon
  const getDeviceTypeIcon = (deviceType: string) => {
    switch (deviceType) {
      case "iPhone":
        return Icon.Mobile;
      case "iPad":
        return Icon.Mobile;
      case "Apple Watch":
        return Icon.Mobile;
      case "Apple TV":
        return Icon.Mobile;
      case "HomePod":
        return Icon.Mobile;
      case "Mac":
        return Icon.Mobile;
      default:
        return Icon.Mobile;
    }
  };

  // Execute a simulator command and refresh the list
  const executeSimulatorCommand = async (command: string, deviceId: string, successMessage: string) => {
    try {
      setIsLoading(true);
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
    } finally {
      fetchDevices();
    }
  };

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search devices..."
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by device type" value={selectedCategory} onChange={setSelectedCategory}>
          {CATEGORIES.map((category) => (
            <List.Dropdown.Item key={category.id} title={category.name} value={category.id} />
          ))}
        </List.Dropdown>
      }
    >
      {deviceTypes.map((deviceType) => (
        <List.Section key={deviceType} title={deviceType}>
          {groupedDevices[deviceType].map((device) => (
            <List.Item
              key={device.id}
              icon={getDeviceTypeIcon(device.deviceType)}
              title={device.name}
              subtitle={device.runtime}
              accessories={[
                {
                  icon: getStatusIcon(device.status),
                  text: getStatusLabel(device.status),
                  tooltip: `Status: ${device.status}`,
                },
              ]}
              actions={
                <ActionPanel>
                  {device.status !== "Booted" && (
                    <Action
                      title="Boot Simulator"
                      icon={Icon.Play}
                      onAction={() => {
                        if (device.category === "ios") {
                          executeSimulatorCommand("boot", device.id, "Simulator booted successfully");
                        }
                      }}
                    />
                  )}
                  {device.status === "Booted" && (
                    <Action
                      title="Shutdown Simulator"
                      icon={Icon.Stop}
                      onAction={() => {
                        if (device.category === "ios") {
                          executeSimulatorCommand("shutdown", device.id, "Simulator shut down successfully");
                        }
                      }}
                    />
                  )}
                  <Action
                    title="Open Simulator"
                    icon={Icon.Eye}
                    onAction={() => {
                      if (device.category === "ios") {
                        exec(`open -a Simulator --args -CurrentDeviceUDID ${device.id}`);
                        showToast({
                          style: Toast.Style.Success,
                          title: "Opening simulator",
                        });
                      }
                    }}
                  />
                  <Action
                    title="Refresh Devices"
                    icon={Icon.RotateClockwise}
                    onAction={fetchDevices}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                  <Action.CopyToClipboard title="Copy Device Id" content={device.id} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
