
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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = "http://192.168.0.5:8080";

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
  const { id } = useLocalSearchParams<{ id: string }>();

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
          `${API_BASE_URL}/post/explore?page=0&size=50&sort=latest`
        );

        if (!response.ok) {
          throw new Error(`게시물 조회 실패 (${response.status})`);
        }

        const data: ExploreResponse = await response.json();
        const content = Array.isArray(data.content) ? data.content : [];

        const filtered = content.filter(
          (post) =>
            String(post.stylistPk) === String(id) &&
            typeof post.imageUrl === "string" &&
            post.imageUrl.trim().length > 0
        );

        if (!cancelled) {
          setPosts(filtered);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "포트폴리오를 불러오지 못했습니다."
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

  const gap = 9;

  const leftPosts = posts.filter((_, index) => index % 2 === 0);
  const rightPosts = posts.filter((_, index) => index % 2 === 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/feed")} hitSlop={10}>
          <Ionicons name="chevron-back" size={25} color="#222222" />
        </Pressable>

        <Text style={styles.headerTitle}>포트폴리오</Text>

        <View style={styles.headerRightSpace} />
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color="#8275E8" />
          <Text style={styles.stateText}>
            포트폴리오를 불러오는 중입니다.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>{error}</Text>

          <Pressable
            onPress={() => router.back()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>뒤로 가기</Text>
          </Pressable>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.stateContainer}>
          <Ionicons name="images-outline" size={28} color="#AAAAAA" />
          <Text style={styles.stateText}>
            등록된 포트폴리오가 없습니다.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.portfolioGrid, { gap }]}>
            {/* 왼쪽 열 */}
            <View style={[styles.portfolioColumn, { gap }]}>
              {leftPosts.map((post) => (
                <Pressable
                  key={post.postPk}
                  style={styles.portfolioItem}
                  onPress={() =>
                    router.push(`/post/${post.postPk}` as never)
                  }
                >
                  <Image
                    source={{ uri: post.imageUrl! }}
                    style={styles.portfolioImage}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>

            {/* 오른쪽 열 */}
            <View style={[styles.portfolioColumn, { gap }]}>
              {rightPosts.map((post) => (
                <Pressable
                  key={post.postPk}
                  style={styles.portfolioItem}
                  onPress={() =>
                    router.push(`/post/${post.postPk}` as never)
                  }
                >
                  <Image
                    source={{ uri: post.imageUrl! }}
                    style={styles.portfolioImage}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
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
    width: 25,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  portfolioGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  portfolioColumn: {
    flex: 1,
  },
  // 스타일리스트 소개 페이지와 동일한 이미지 영역
  portfolioItem: {
    width: "100%",
    aspectRatio: 0.78,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  // 이미지가 부모 영역에 맞춰 표시됨
  portfolioImage: {
    width: "100%",
    height: "100%",
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
