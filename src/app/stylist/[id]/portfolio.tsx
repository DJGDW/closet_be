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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.0.5:8080";

// 모자이크 배치 값 (디자인 402px 프레임 기준)
const MAX_WIDTH = 402;
const GRID_GAP = 8;
const GRID_SIDE = 10;

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
  const { width: windowWidth } = useWindowDimensions();

  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [posts, setPosts] = useState<PortfolioPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 타일 크기 계산: 3열 기준 한 칸(unit)을 잡고 큰 타일은 2칸 + 간격
  const contentWidth = Math.min(windowWidth, MAX_WIDTH) - GRID_SIDE * 2;
  const unit = (contentWidth - GRID_GAP * 2) / 3;
  const smallHeight = Math.round(unit * 1.03);
  const bigWidth = unit * 2 + GRID_GAP;
  const bigHeight = smallHeight * 2 + GRID_GAP;
  const rowHeight = Math.round(unit * 1.17);

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

  const renderTile = (post: PortfolioPost, width: number, height: number) => (
    <Pressable
      key={post.postPk}
      style={[styles.tile, { width, height }]}
      onPress={() => handlePostPress(post)}
      accessibilityRole="button"
      accessibilityLabel="포트폴리오 게시물 보기"
    >
      <Image
        source={{ uri: post.imageUrl! }}
        style={styles.tileImage}
        resizeMode="cover"
      />
    </Pressable>
  );

  // 3개씩 한 묶음: 짝수 묶음은 [큰 타일 + 작은 타일 2개], 홀수 묶음은 [작은 타일 3개]
  const renderGroups = () => {
    const groups = [];

    for (let start = 0; start < posts.length; start += 3) {
      const chunk = posts.slice(start, start + 3);
      const groupIndex = start / 3;

      if (groupIndex % 2 === 0) {
        groups.push(
          <View key={`group-${start}`} style={styles.featureGroup}>
            {renderTile(chunk[0], bigWidth, bigHeight)}

            <View style={styles.stackColumn}>
              {chunk[1] ? renderTile(chunk[1], unit, smallHeight) : null}
              {chunk[2] ? renderTile(chunk[2], unit, smallHeight) : null}
            </View>
          </View>,
        );
      } else {
        groups.push(
          <View key={`group-${start}`} style={styles.rowGroup}>
            {chunk.map((post) => renderTile(post, unit, rowHeight))}
          </View>,
        );
      }
    }

    return groups;
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
          <View style={styles.portfolioGrid}>{renderGroups()}</View>

          <Text style={styles.footerHint}>
            스크롤하여 더 많은 포트폴리오 보기
          </Text>
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
    maxWidth: MAX_WIDTH,
    height: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  headerRightSpace: {
    width: 26,
  },

  portfolioScroll: {
    flex: 1,
    width: "100%",
    maxWidth: MAX_WIDTH,
    backgroundColor: "#FFFFFF",
  },

  portfolioContent: {
    paddingHorizontal: GRID_SIDE,
    paddingTop: 10,
    paddingBottom: 18,
  },

  portfolioGrid: {
    gap: GRID_GAP,
  },

  featureGroup: {
    flexDirection: "row",
    gap: GRID_GAP,
  },

  stackColumn: {
    gap: GRID_GAP,
  },

  rowGroup: {
    flexDirection: "row",
    gap: GRID_GAP,
  },

  tile: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#DCDCDC",
    backgroundColor: "#E9E9E9",
    overflow: "hidden",
  },

  tileImage: {
    width: "100%",
    height: "100%",
  },

  footerHint: {
    marginTop: 16,
    fontSize: 10,
    color: "#AAAAAA",
    textAlign: "center",
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
