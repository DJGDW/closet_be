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

type Follower = {
  userPk: number;
  userName?: string;
  nickname?: string;
  profilePic?: string | null;
};

export default function FollowersScreen() {
  const [followerList, setFollowerList] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowers = useCallback(async () => {
    try {
      setLoading(true);

      const token =
        Platform.OS === "web"
          ? localStorage.getItem("accessToken")
          : await SecureStore.getItemAsync("accessToken");

      if (!token) {
        setFollowerList([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/follow/followers`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`팔로워 조회 실패 (HTTP ${response.status})`);
      }

      const result = await response.json();
      const list = result.data ?? result;

      setFollowerList(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("팔로워 목록 조회 오류:", error);
      Alert.alert("조회 실패", "팔로워 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>팔로워</Text>

          <View style={styles.headerSide} />
        </View>

        <View style={styles.countArea}>
          <Text style={styles.countLabel}>팔로워</Text>
          <Text style={styles.countNumber}>{followerList.length}</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#51478F" />
            <Text style={styles.emptyText}>목록을 불러오는 중...</Text>
          </View>
        ) : followerList.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              아직 나를 팔로우한 사용자가 없습니다.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {followerList.map((item) => (
              <View key={item.userPk} style={styles.userRow}>
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
                    {item.nickname || item.userName || "사용자"}
                  </Text>

                  {item.userName ? (
                    <Text style={styles.userName}>@{item.userName}</Text>
                  ) : null}
                </View>
              </View>
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
