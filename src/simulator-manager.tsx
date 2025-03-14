import { List, getPreferenceValues } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState, useEffect } from "react";
import { Device } from "./types";
import { CATEGORIES, DEVICE_TYPE_ORDER, REFRESH_INTERVAL } from "./constants";
import { filterDevices, groupDevicesByType } from "./utils";
import { fetchIOSDevices, fetchAndroidDevices } from "./utils/simulator-commands";
import { DeviceListItem } from "./components/DeviceListItem";

// Define the interface for preferences
interface Preferences {
  androidSdkPath?: string;
  deviceTypesToDisplay: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get user preferences
  const preferences = getPreferenceValues<Preferences>();
  const deviceTypesToDisplay = preferences.deviceTypesToDisplay || "all";

  // Set the selected category based on the preference
  // If deviceTypesToDisplay is "ios" or "android", force that selection
  // Otherwise, allow user selection (default to "all")
  const [selectedCategory, setSelectedCategory] = useState<string>(
    deviceTypesToDisplay !== "all" ? deviceTypesToDisplay : "all",
  );

  // Function to fetch all devices
  const fetchDevices = async () => {
    try {
      setIsLoading(true);

      let iosDevices: Device[] = [];
      let androidDevices: Device[] = [];

      // Fetch iOS simulators if needed
      if (deviceTypesToDisplay === "all" || deviceTypesToDisplay === "ios") {
        iosDevices = await fetchIOSDevices();
      }

      // Fetch Android emulators if needed
      if (deviceTypesToDisplay === "all" || deviceTypesToDisplay === "android") {
        androidDevices = await fetchAndroidDevices();
      }

      setDevices([...iosDevices, ...androidDevices]);
    } catch (error) {
      console.error("Error fetching devices:", error);
      showFailureToast(error, { title: "Failed to fetch devices" });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle category change - only allowed when deviceTypesToDisplay is "all"
  const handleCategoryChange = (newCategory: string) => {
    if (deviceTypesToDisplay === "all") {
      setSelectedCategory(newCategory);
    }
  };

  // Initial fetch and set up refresh interval
  useEffect(() => {
    fetchDevices();

    // Set up a refresh interval
    const intervalId = setInterval(fetchDevices, REFRESH_INTERVAL);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [deviceTypesToDisplay]); // Re-fetch when deviceTypesToDisplay changes

  // When deviceTypesToDisplay changes, update selectedCategory to match
  useEffect(() => {
    if (deviceTypesToDisplay !== "all") {
      setSelectedCategory(deviceTypesToDisplay);
    }
  }, [deviceTypesToDisplay]);

  // Filter and group devices
  const filteredDevices = filterDevices(devices, searchText, selectedCategory);
  const groupedDevices = groupDevicesByType(filteredDevices);

  // Sort device types for consistent ordering
  const deviceTypes = Object.keys(groupedDevices).sort((a, b) => {
    const indexA = DEVICE_TYPE_ORDER.indexOf(a);
    const indexB = DEVICE_TYPE_ORDER.indexOf(b);

    // If both types are in the order array, sort by their positions
    if (indexA >= 0 && indexB >= 0) {
      return indexA - indexB;
    }

    // If only a is in the order array, it comes first
    if (indexA >= 0) {
      return -1;
    }

    // If only b is in the order array, it comes first
    if (indexB >= 0) {
      return 1;
    }

    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });

  // Determine dropdown visibility based on preference
  const showDropdown = deviceTypesToDisplay === "all";

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search devices..."
      searchBarAccessory={
        showDropdown ? (
          <List.Dropdown tooltip="Filter by device type" value={selectedCategory} onChange={handleCategoryChange}>
            {CATEGORIES.map((category) => (
              <List.Dropdown.Item key={category.id} title={category.name} value={category.id} />
            ))}
          </List.Dropdown>
        ) : null
      }
    >
      {deviceTypes.map((deviceType) => (
        <List.Section key={deviceType} title={deviceType}>
          {groupedDevices[deviceType].map((device) => (
            <DeviceListItem key={device.id} device={device} onRefresh={fetchDevices} />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
