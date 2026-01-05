import { registerDevMenuItems as registerDevMenuItemsClient } from "expo-dev-client";
import { File, Paths } from "expo-file-system";
import { reloadAsync } from "expo-updates";

export function registerDevMenuItems() {
  if (!__DEV__) return;

  registerDevMenuItemsClient([
    {
      name: "Reset local DB",
      shouldCollapse: true,
      callback: () => {
        void (async () => {
          new File(Paths.document, "SQLite", "zkb-budget.db").delete();
          await reloadAsync();
        })();
      },
    },
  ]);
}
