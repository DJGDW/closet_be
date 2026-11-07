
import { useRouter, usePathname } from "expo-router";
import {
  Pressable,
  View,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import HomeActiveIcon from "../../assets/icons/nav-home-active.svg";
import HomeIcon from "../../assets/icons/nav-home.svg";

import SearchActiveIcon from "../../assets/icons/nav-search-active.svg";
import SearchIcon from "../../assets/icons/nav-search.svg";

import ChatActiveIcon from "../../assets/icons/nav-chat-active.svg";
import ChatIcon from "../../assets/icons/nav-chat.svg";

import MyPageActiveIcon from "../../assets/icons/nav-mypage-active.svg";
import MyPageIcon from "../../assets/icons/nav-mypage.svg";

import { styles } from "../styles/feed.styles";

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

const TAB_ICONS = {
  home: {
    inactive: HomeIcon,
    active: HomeActiveIcon,
  },
  search: {
    inactive: SearchIcon,
    active: SearchActiveIcon,
  },
  chat: {
    inactive: ChatIcon,
    active: ChatActiveIcon,
  },
  mypage: {
    inactive: MyPageIcon,
    active: MyPageActiveIcon,
  },
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

console.log("[채팅 배지] 토큰 존재:", !!token);

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

console.log("[채팅 배지] HTTP 상태:", response.status);

const responseText = await response.text();

console.log("[채팅 배지] 서버 응답:", responseText);

if (!response.ok) {
  return;
}

const data = JSON.parse(responseText);

const totalUnread = Array.isArray(data)
  ? data.reduce(
      (total: number, room: any) =>
        total + (Number(room.unreadCount) || 0),
      0
    )
  : 0;

console.log("[채팅 배지] 최종 읽지 않은 메시지:", totalUnread);

setUnreadCount(totalUnread);
    } catch (error) {
      console.error("읽지 않은 채팅 수 조회 오류:", error);
    }
  }, []);

  // 최초 조회 + 10초마다 갱신
  // 화면 경로가 바뀌면 즉시 다시 조회
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
      style={[
        styles.bottomNav,
        {
          height: 66 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {(["home", "search", "chat", "mypage"] as TabKey[]).map((tab) => {
        const isActive = activeTab === tab;

        const Icon = isActive
          ? TAB_ICONS[tab].active
          : TAB_ICONS[tab].inactive;

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
            <View
              style={{
                width: 36,
                height: 36,
                position: "relative",
              }}
            >
              <Icon width={36} height={36} />

              {tab === "chat" && unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -7,
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
          </Pressable>
        );
      })}
    </View>
  );
}
