import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.219.107:8080";

type PortfolioPost = {
  postPk: number;
  imageUrl: string | null;
  stylistPk: number | string;
  stylistNickname?: string | null;
};

type PortfolioResponse = {
  content?: PortfolioPost[];
  data?: PortfolioPost[];
  posts?: PortfolioPost[];
};

async function getAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    }

    return await SecureStore.getItemAsync("accessToken");
  } catch (error) {
    console.error("로그인 토큰 조회 실패:", error);
    return null;
  }
}

export default function PortfolioScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [posts, setPosts] = useState<PortfolioPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 해당 스타일리스트의 포트폴리오 조회
  const fetchPortfolios = useCallback(async () => {
    if (!id) {
      setPosts([]);
      setLoading(false);
      setError("스타일리스트 정보를 찾을 수 없습니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
      }

      const response = await fetch(
        `${API_BASE_URL}/post/explore?page=0&size=50&sort=LATEST`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`게시물 조회 실패 (${response.status})`);
      }

      const result: PortfolioResponse | PortfolioPost[] = await response.json();

      const content: PortfolioPost[] = Array.isArray(result)
        ? result
        : Array.isArray(result.content)
          ? result.content
          : Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.posts)
              ? result.posts
              : [];

      // 현재 스타일리스트가 등록한 게시물만 필터링
      const filtered = content.filter(
        (post) =>
          String(post.stylistPk) === String(id) &&
          typeof post.imageUrl === "string" &&
          post.imageUrl.trim().length > 0,
      );

      setPosts(filtered);
    } catch (error) {
      console.error("포트폴리오 조회 실패:", error);

      setError(
        error instanceof Error
          ? error.message
          : "포트폴리오를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  // 게시물 상세 페이지 이동
  const handlePostPress = (post: PortfolioPost) => {
    router.push(`/post/${post.postPk}` as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>

        <Text style={styles.headerTitle}>포트폴리오</Text>

        <View style={styles.headerRightSpace} />
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color="#8275E8" />
          <Text style={styles.stateText}>포트폴리오를 불러오는 중입니다.</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Ionicons name="cloud-offline-outline" size={32} color="#AAAAAA" />

          <Text style={styles.stateText}>{error}</Text>

          <Pressable onPress={fetchPortfolios} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.stateContainer}>
          <Ionicons name="images-outline" size={28} color="#AAAAAA" />
          <Text style={styles.stateText}>등록된 포트폴리오가 없습니다.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.portfolioScroll}
          contentContainerStyle={styles.portfolioContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.portfolioGrid}>
            {posts.map((post) => (
              <Pressable
                key={post.postPk}
                style={styles.postCard}
                onPress={() => handlePostPress(post)}
              >
                <Image
                  source={{ uri: post.imageUrl! }}
                  style={styles.postImage}
                  resizeMode="cover"
                />

                <LinearGradient
                  colors={[
                    "rgba(0,0,0,0)",
                    "rgba(0,0,0,0.2)",
                    "rgba(0,0,0,0.9)",
                  ]}
                  locations={[0, 0.4, 1]}
                  style={styles.imageGradient}
                  pointerEvents="none"
                />

                {post.stylistNickname ? (
                  <View style={styles.stylistInfo}>
                    <View style={styles.profileCircle}>
                      <Text style={styles.profileInitial}>
                        {post.stylistNickname.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>

                    <Text style={styles.stylistName} numberOfLines={1}>
                      {post.stylistNickname}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  header: {
    width: "100%",
    maxWidth: 402,
    height: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
  },

  headerRightSpace: {
    width: 26,
  },

  portfolioScroll: {
    flex: 1,
    width: "100%",
    maxWidth: 402,
    backgroundColor: "#FFFFFF",
  },

  portfolioContent: {
    paddingHorizontal: 7,
    paddingTop: 1,
    paddingBottom: 14,
  },

  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    columnGap: 3,
    rowGap: 3,
  },

  postCard: {
    width: "48.8%",
    marginBottom: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
  },

  postImage: {
    width: "100%",
    aspectRatio: 0.76,
    backgroundColor: "#F2F2F2",
  },

  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "45%",
  },

  stylistInfo: {
    position: "absolute",
    left: 8,
    right: 6,
    bottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  profileCircle: {
    width: 30,
    height: 30,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  stylistName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  stateContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 10,
  },

  stateText: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    lineHeight: 20,
  },

  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F4F2FF",
    borderRadius: 8,
  },

  retryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8275E8",
  },
});
