import { List, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { CATEGORIES } from "./constants";
import { DeviceList } from "./components/DeviceList";
import { SearchBar } from "./components/SearchBar";
import { useDeviceManager } from "./hooks/useDeviceManager";
import { useCategoryManager } from "./hooks/useCategoryManager";

interface Preferences {
  androidSdkPath?: string;
  deviceTypesToDisplay: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");

  const preferences = getPreferenceValues<Preferences>();
  const deviceTypesToDisplay = preferences.deviceTypesToDisplay || "all";

  const { selectedCategory, handleCategoryChange, showDropdown } = useCategoryManager(deviceTypesToDisplay);

  const { devices, isLoading, fetchDevices } = useDeviceManager({
    deviceTypesToDisplay,
    selectedCategory,
    searchText,
  });

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search devices..."
      searchBarAccessory={
        <SearchBar
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          categories={CATEGORIES}
          showDropdown={showDropdown}
        />
      }
    >
      <DeviceList devices={devices} onRefresh={fetchDevices} />
    </List>
  );
}
