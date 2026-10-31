import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = "http://192.168.219.107:8080";

type PortfolioPost = {
  postPk: number;
  imageUrl: string | null;
  stylistPk: number | string;
  stylistNickname?: string | null;
};

type ExploreResponse = {
  content?: PortfolioPost[];
};

export default function PortfolioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { width: screenWidth } = useWindowDimensions();

  const [posts, setPosts] = useState<PortfolioPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("스타일리스트 정보를 찾을 수 없습니다.");
      return;
    }

    let cancelled = false;

    const fetchPortfolios = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/post/explore?page=0&size=50&sort=latest`,
        );

        if (!response.ok) {
          throw new Error(`게시물 조회 실패 (${response.status})`);
        }

        const data = (await response.json()) as ExploreResponse;
        const content = Array.isArray(data.content) ? data.content : [];

        const filtered = content.filter(
          (post) =>
            String(post.stylistPk) === String(id) &&
            typeof post.imageUrl === "string" &&
            post.imageUrl.trim().length > 0,
        );

        if (!cancelled) {
          setPosts(filtered);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("포트폴리오 조회 실패:", e);
          setError(
            "포트폴리오를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPortfolios();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const gap = 6;
  const padding = 8;
  const columnWidth = (screenWidth - padding * 2 - gap) / 2;

  const imageStyle = (height: number) => ({
    width: "100%" as const,
    height,
    borderRadius: 7,
    backgroundColor: "#E7E5EC",
  });

  const leftPosts = posts.filter((_, index) => index % 2 === 0);
  const rightPosts = posts.filter((_, index) => index % 2 === 1);

  const renderPost = (post: PortfolioPost, index: number) => (
    <Pressable
      key={post.postPk}
      onPress={() => router.push(`/post/${post.postPk}` as never)}
    >
      <Image
        source={{ uri: post.imageUrl! }}
        resizeMode="cover"
        style={imageStyle(index % 3 === 0 ? 220 : 160)}
      />
    </Pressable>
  );

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
          <Text style={styles.stateText}>{error}</Text>

          <Pressable onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryText}>뒤로 가기</Text>
          </Pressable>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.stateContainer}>
          <Ionicons name="images-outline" size={28} color="#AAAAAA" />
          <Text style={styles.stateText}>등록된 포트폴리오가 없습니다.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: padding,
            paddingBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", gap }}>
            {/* 왼쪽 열 */}
            <View style={{ width: columnWidth, gap }}>
              {leftPosts.map((post, index) => renderPost(post, index))}
            </View>

            {/* 오른쪽 열 */}
            <View style={{ width: columnWidth, gap, paddingTop: 35 }}>
              {rightPosts.map((post, index) => renderPost(post, index + 1))}
            </View>
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
  },
  header: {
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
  stateContainer: {
    flex: 1,
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
