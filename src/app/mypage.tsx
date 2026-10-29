
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../styles/mypage.styles";

type LoginUser = {
  userPk?: number;
  userId?: string;
  nickname?: string;
  tokenType?: string;
};

export default function MyPageScreen() {
  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);

  useEffect(() => {
    async function loadLoginUser() {
  try {
    const savedUser =
      Platform.OS === "web"
        ? localStorage.getItem("loginUser")
        : await SecureStore.getItemAsync("loginUser");

    if (savedUser) {
      setLoginUser(JSON.parse(savedUser) as LoginUser);
    }
  } catch (error) {
    console.error("로그인 사용자 정보 조회 오류:", error);
  }
}

    loadLoginUser();
  }, []);

  const nickname = loginUser?.nickname || "닉네임";
  const userId = loginUser?.userId || "";

  const showNotReady = (feature: string) => {
    Alert.alert(feature, `${feature} 화면은 준비 중이에요.`);
  };
  const [isStylist, setIsStylist] = useState(false);
  const [checkingStylist, setCheckingStylist] = useState(true);

  useEffect(() => {
  const checkStylist = async () => {
    try {
      const accessToken =
        Platform.OS === "web"
          ? localStorage.getItem("accessToken")
          : await SecureStore.getItemAsync("accessToken");

      if (!accessToken) {
        setIsStylist(false);
        return;
      }

      const response = await fetch(
        "http://192.168.0.5:8080/stylist/check",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setIsStylist(data.isStylist ?? data.stylist ?? false);
    } catch (error) {
      console.error("스타일리스트 등록 여부 확인 실패:", error);
    } finally {
      setCheckingStylist(false);
    }
  };

  checkStylist();
}, []);

  

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content"  />

      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerSide} />

          <Text style={styles.headerTitle}>마이페이지</Text>

          <Pressable
            style={styles.settingsButton}
           onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="설정"
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {nickname}
              </Text>

              <Text style={styles.profileId} numberOfLines={1}>
                {userId ? `@${userId}` : ""}
              </Text>
            </View>

            <Pressable
              style={styles.followStat}
              onPress={() => showNotReady("팔로워")}
            >
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>팔로워</Text>
            </Pressable>

            <Pressable
              style={styles.followStat}
              onPress={() => showNotReady("팔로잉")}
            >
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>팔로잉</Text>
            </Pressable>
          </View>

         <Pressable
  style={[
    styles.stylistButton,
    isStylist && styles.stylistEditButton,
  ]}
  onPress={() => {
    if (checkingStylist) return;

    if (isStylist) {
      router.push("/stylist-edit");
    } else {
      router.push("/stylist-register");
    }
  }}
>
  <Text
    style={[
      styles.stylistButtonText,
      isStylist && styles.stylistEditButtonText,
    ]}
  >
    {checkingStylist
      ? "확인 중..."
      : isStylist
        ? "스타일리스트 프로필 수정"
        : "스타일리스트 등록하기"}
  </Text>
</Pressable>

          <View style={styles.menuList}>
            <Pressable
              style={styles.menuRow}
              onPress={() => showNotReady("좋아요 게시물")}
            >
              <View style={styles.menuLabelArea}>
                <Text style={styles.menuIcon}>♡</Text>
                <Text style={styles.menuLabel}>좋아요 게시물</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuCount}>12</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.menuRow}
              onPress={() => showNotReady("구매내역")}
            >
              <View style={styles.menuLabelArea}>
                <Text style={styles.menuIcon}>□</Text>
                <Text style={styles.menuLabel}>구매내역</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuCount}>3</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.menuRow}
              onPress={() => showNotReady("판매내역")}
            >
              <View style={styles.menuLabelArea}>
                <Text style={styles.menuIcon}>□</Text>
                <Text style={styles.menuLabel}>판매내역</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuCount}>5</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
