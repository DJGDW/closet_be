
import { useState } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../styles/settings.styles";

const SETTINGS_ITEMS = [
  "계정 설정",
  "알림 설정",
  "결제수단 관리",
  "개인정보 관리",
  "앱 정보",
  "고객센터",
  "자주 묻는 질문",
];

export default function SettingsScreen() {
  const [loggingOut, setLoggingOut] = useState(false);

  function showNotReady(title: string) {
    if (Platform.OS === "web") {
      window.alert(`${title} 화면은 준비 중이에요.`);
      return;
    }

    Alert.alert(title, `${title} 화면은 준비 중이에요.`);
  }

  async function handleLogout() {
    if (loggingOut) return;

    const confirmLogout = async () => {
      try {
        setLoggingOut(true);

        if (Platform.OS === "web") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("loginUser");
        } else {
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("loginUser");
        }

        router.replace("/");
      } catch (error) {
        console.error("로그아웃 오류:", error);

        if (Platform.OS === "web") {
          window.alert("로그아웃 중 오류가 발생했어요.");
        } else {
          Alert.alert("오류", "로그아웃 중 오류가 발생했어요.");
        }
      } finally {
        setLoggingOut(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("로그아웃 하시겠어요?")) {
        await confirmLogout();
      }
      return;
    }

    Alert.alert("로그아웃", "로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: () => {
          void confirmLogout();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>설정</Text>

          <View style={styles.headerSide} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.menuList}>
            {SETTINGS_ITEMS.map((item, index) => (
              <Pressable
                key={item}
                style={[
                  styles.menuRow,
                  index === SETTINGS_ITEMS.length - 1 &&
                    styles.lastMenuRow,
                ]}
                onPress={() => showNotReady(item)}
                accessibilityRole="button"
              >
                <Text style={styles.menuLabel}>{item}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loggingOut}
            accessibilityRole="button"
          >
            <Text style={styles.logoutText}>
              {loggingOut ? "로그아웃 중..." : "로그아웃"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
