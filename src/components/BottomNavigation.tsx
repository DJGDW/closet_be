import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "../styles/feed.styles";
import { palette } from "../styles/theme";

type TabKey = "home" | "search" | "chat" | "mypage";

const TAB_LABELS: Record<TabKey, string> = {
  home: "홈",
  search: "검색",
  chat: "채팅",
  mypage: "마이페이지",
};
type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<TabKey, { inactive: IconName; active: IconName }> = {
  home: { inactive: "home-outline", active: "home" },
  search: { inactive: "search-outline", active: "search" },
  chat: {
    inactive: "chatbubble-ellipses-outline",
    active: "chatbubble-ellipses",
  },
  mypage: { inactive: "person-outline", active: "person" },
};

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const activeTab: TabKey =
    pathname === "/search"
      ? "search"
      : pathname.startsWith("/chat")
        ? "chat"
        : pathname === "/mypage"
          ? "mypage"
          : "home";

  const handleTabPress = (tab: TabKey) => {
    switch (tab) {
      case "home":
        if (pathname !== "/feed") {
          router.replace("/feed");
        }
        break;

      case "search":
        if (pathname !== "/search") {
          router.push("/search");
        }
        break;

      case "chat":
        if (pathname !== "/chat") {
          router.push("/chat");
        }
        break;

      case "mypage":
        if (pathname !== "/mypage") {
          router.push("/mypage");
        }
        break;
    }
  };

  return (
    <View
      style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 6) }]}
    >
      {(["home", "search", "chat", "mypage"] as TabKey[]).map((tab) => {
        const isActive = activeTab === tab;
        const iconName = isActive
          ? TAB_ICONS[tab].active
          : TAB_ICONS[tab].inactive;
        const color = isActive ? palette.primary : palette.textMute;

        return (
          <Pressable
            key={tab}
            style={styles.navItem}
            onPress={() => handleTabPress(tab)}
            accessibilityRole="button"
            accessibilityLabel={TAB_LABELS[tab]}
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons name={iconName} size={23} color={color} />
            <Text
              style={[
                styles.navLabel,
                { color },
                isActive && styles.navLabelActive,
              ]}
              numberOfLines={1}
            >
              {TAB_LABELS[tab]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
