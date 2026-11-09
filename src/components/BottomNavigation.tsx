import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "../styles/feed.styles";
import { palette } from "../styles/theme";

const API_BASE_URL = "http://192.168.0.5:8080";

type TabKey = "home" | "search" | "chat" | "mypage";

type ChatRoom = {
  roomPk: number;
  unreadCount: number;
};

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

async function getAccessToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem("accessToken");
  }

  return SecureStore.getItemAsync("accessToken");
}

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [unreadCount, setUnreadCount] = useState(0);

  // 전체 채팅방의 읽지 않은 메시지 수 조회
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = await getAccessToken();

      if (!token) {
        setUnreadCount(0);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      const data: ChatRoom[] = await response.json();

      const totalUnread = Array.isArray(data)
        ? data.reduce(
            (total, room) => total + (Number(room.unreadCount) || 0),
            0,
          )
        : 0;

      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("읽지 않은 채팅 수 조회 오류:", error);
    }
  }, []);

  // 최초 조회 + 10초마다 갱신, 화면 경로가 바뀌면 즉시 다시 조회
  useEffect(() => {
    fetchUnreadCount();

    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchUnreadCount, pathname]);

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
            accessibilityLabel={
              tab === "chat"
                ? `${TAB_LABELS[tab]}, 읽지 않은 메시지 ${unreadCount}개`
                : TAB_LABELS[tab]
            }
            accessibilityState={{ selected: isActive }}
          >
            <View style={{ position: "relative" }}>
              <Ionicons name={iconName} size={23} color={color} />

              {tab === "chat" && unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -9,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    borderRadius: 9,
                    backgroundColor: "#FF3B30",
                    borderWidth: 1.5,
                    borderColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>

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