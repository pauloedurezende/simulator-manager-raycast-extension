import { ActionPanel, Action, Icon, List } from "@raycast/api";
import { useState } from "react";

const CATEGORIES = [
  { id: "all", name: "All Devices" },
  { id: "ios", name: "iOS Simulators" },
  { id: "android", name: "Android Emulators" },
];

const ITEMS = Array.from(Array(10).keys()).map((key) => {
  return {
    id: key,
    icon: Icon.Mobile,
    title: "Item " + key,
    subtitle: "Item description " + key,
    accessory: "Detail",
    category: key % 2 === 0 ? "ios" : "android",
  };
});

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredItems = ITEMS.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <List
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
      {filteredItems.map((item) => (
        <List.Item
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          accessories={[
            {
              icon: Icon.Mobile,
              text: CATEGORIES.find((cat) => cat.id === item.category)?.name || "",
            },
            {
              icon: Icon.Text,
              text: item.accessory,
            },
          ]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={item.title} />
              <Action
                title="View Details"
                icon={Icon.Eye}
                onAction={() => console.log(`Viewing details for item ${item.id}`)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
