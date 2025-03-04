import { Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "all", name: "All Devices" },
  { id: "ios", name: "iOS Simulators" },
  { id: "android", name: "Android Emulators" },
];

export const DEVICE_TYPE_ORDER = ["iPhone", "iPad", "Apple Watch", "Apple TV", "HomePod", "iPod", "Mac", "Other"];

export const REFRESH_INTERVAL = 5000;
