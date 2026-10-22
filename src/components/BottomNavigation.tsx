
import { useRouter, usePathname } from "expo-router";
import { Alert, Pressable, View } from "react-native";

import HomeActiveIcon from "../../assets/icons/nav-home-active.svg";
import HomeIcon from "../../assets/icons/nav-home.svg";

import SearchActiveIcon from "../../assets/icons/nav-search-active.svg";
import SearchIcon from "../../assets/icons/nav-search.svg";

import ChatActiveIcon from "../../assets/icons/nav-chat-active.svg";
import ChatIcon from "../../assets/icons/nav-chat.svg";

import MyPageActiveIcon from "../../assets/icons/nav-mypage-active.svg";
import MyPageIcon from "../../assets/icons/nav-mypage.svg";

import { styles } from "../styles/feed.styles";

type TabKey = "home" | "search" | "chat" | "mypage";

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

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab: TabKey =
    pathname === "/search"
      ? "search"
      : pathname === "/chat"
        ? "chat"
        : pathname === "/mypage"
          ? "mypage"
          : "home";

  const handleTabPress = (tab: TabKey) => {
    if (tab === "home") {
      if (pathname !== "/feed") {
        router.replace("/feed");
      }
      return;
    }

    if (tab === "search") {
      if (pathname !== "/search") {
        router.push("/search");
      }
      return;
    }

    if (tab === "chat") {
      Alert.alert("채팅", "채팅 화면은 아직 준비 중이에요.");
      return;
    }

    if (tab === "mypage") {
      Alert.alert("마이페이지", "마이페이지 화면은 아직 준비 중이에요.");
    }
  };

  return (
    <View style={styles.bottomNav}>
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
            accessibilityLabel={TAB_LABELS[tab]}
            accessibilityState={{ selected: isActive }}
          >
            <Icon width={36} height={36} />
          </Pressable>
        );
      })}
    </View>
  );
}
