import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "https://verbose-goggles-vpgr5446g7472pr5v-8080.app.github.dev";

type Following = {
  stylistPk: number;
  userName?: string;
  nickname?: string;
  profilePic?: string | null;
};

export default function FollowingScreen() {
  const [followingList, setFollowingList] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowing = useCallback(async () => {
    try {
      setLoading(true);

      const token =
        Platform.OS === "web"
          ? localStorage.getItem("accessToken")
          : await SecureStore.getItemAsync("accessToken");

      if (!token) {
        setFollowingList([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/follow`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`팔로잉 조회 실패 (HTTP ${response.status})`);
      }

      const result = await response.json();
      const list = result.data ?? result;

      setFollowingList(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("팔로잉 목록 조회 오류:", error);
      Alert.alert("조회 실패", "팔로잉 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>팔로잉</Text>

          <View style={styles.headerSide} />
        </View>

        <View style={styles.countArea}>
          <Text style={styles.countLabel}>팔로잉</Text>
          <Text style={styles.countNumber}>{followingList.length}</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#51478F" />
            <Text style={styles.emptyText}>목록을 불러오는 중...</Text>
          </View>
        ) : followingList.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              아직 팔로우한 스타일리스트가 없습니다.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {followingList.map((item) => (
              <Pressable
                key={item.stylistPk}
                style={styles.userRow}
                onPress={() =>
                  router.push({
                    pathname: "/stylist/[id]",
                    params: { id: String(item.stylistPk) },
                  })
                }
              >
                {item.profilePic ? (
                  <Image
                    source={{ uri: item.profilePic }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.profileInitial}>
                      {(item.nickname || item.userName || "?").slice(0, 1)}
                    </Text>
                  </View>
                )}

                <View style={styles.userInfo}>
                  <Text style={styles.nickname}>
                    {item.nickname || item.userName || "스타일리스트"}
                  </Text>

                  {item.userName ? (
                    <Text style={styles.userName}>@{item.userName}</Text>
                  ) : null}
                </View>

                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EAEAEA",
  },
  backButton: {
    width: 36,
    height: 40,
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 34,
    color: "#333333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },
  headerSide: {
    width: 36,
  },
  countArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
  },
  countLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  countNumber: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: "700",
    color: "#51478F",
  },
  listContent: {
    paddingHorizontal: 18,
  },
  userRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEEEEE",
  },
  profilePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0EDFC",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#51478F",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nickname: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },
  userName: {
    marginTop: 4,
    fontSize: 11,
    color: "#888888",
  },
  chevron: {
    fontSize: 22,
    color: "#999999",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
  },
});
