
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.0.5:8080";

type PostDetail = {
  profileImage: string | null;
  stylistNickname: string;
  imageUrl: string;
  likeCount: number;
  styleName: string;
  hashtags: string[];
  ratioType: string;
};

export default function PostDetailScreen() {
  const { postPk, stylistPk } = useLocalSearchParams<{
    postPk: string;
    stylistPk?: string;
  }>();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchPostDetail = useCallback(async () => {
    if (!postPk) {
      setErrorMessage("게시물 번호를 확인할 수 없습니다.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setErrorMessage("");

      let token: string | null;

      if (Platform.OS === "web") {
        token = localStorage.getItem("accessToken");
      } else {
        token = await SecureStore.getItemAsync("accessToken");
      }

      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/post/${encodeURIComponent(postPk)}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("게시물을 조회할 권한이 없습니다. 로그인을 확인해주세요.");
        }

        if (response.status === 404) {
          throw new Error("게시물을 찾을 수 없습니다.");
        }

        throw new Error(
          `게시물 조회에 실패했습니다. (HTTP ${response.status})`
        );
      }

      const result = await response.json();

      // API가 객체 또는 data 안에 객체를 반환하는 경우 모두 처리
      const detail: PostDetail = result.data ?? result;

      if (!detail || typeof detail.imageUrl !== "string") {
        throw new Error("게시물 응답 형식이 올바르지 않습니다.");
      }

      setPost({
        profileImage: detail.profileImage ?? null,
        stylistNickname: detail.stylistNickname ?? "스타일리스트",
        imageUrl: detail.imageUrl,
        likeCount: Number(detail.likeCount ?? 0),
        styleName: detail.styleName ?? "",
        hashtags: Array.isArray(detail.hashtags) ? detail.hashtags : [],
        ratioType: detail.ratioType ?? "",
      });
    } catch (error) {
      console.error("게시물 상세 조회 오류:", error);

      setPost(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "게시물을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postPk]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPostDetail();
  };

  const handleProfilePress = () => {
    if (!stylistPk) {
      Alert.alert(
        "스타일리스트 정보",
        "스타일리스트 번호가 전달되지 않았습니다."
      );
      return;
    }

    router.push({
      pathname: "/stylist/[id]",
      params: { id: String(stylistPk) },
    });
  };

  const renderTag = (label: string, index: number) => (
    <View key={`${label}-${index}`} style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>게시물</Text>

          <Pressable
            style={styles.headerButton}
            onPress={() =>
              Alert.alert("게시물", "게시물 메뉴는 추후 연결할 예정입니다.")
            }
            accessibilityRole="button"
            accessibilityLabel="게시물 메뉴"
          >
            <Text style={styles.moreIcon}>⋮</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#4D458B" />
            <Text style={styles.stateText}>게시물을 불러오는 중...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{errorMessage}</Text>

            <Pressable
              onPress={() => {
                setLoading(true);
                fetchPostDetail();
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : post ? (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            <View style={styles.hero}>
              <Image
                source={{ uri: post.imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />

              <LinearGradient
                colors={[
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.08)",
                  "rgba(0,0,0,0.68)",
                ]}
                locations={[0, 0.58, 1]}
                style={styles.heroGradient}
                pointerEvents="none"
              />

              <Pressable
                style={styles.profileArea}
                onPress={handleProfilePress}
                accessibilityRole="button"
                accessibilityLabel={`${post.stylistNickname} 스타일리스트 프로필 보기`}
              >
                {post.profileImage ? (
                  <Image
                    source={{ uri: post.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.profileInitial}>
                      {(post.stylistNickname || "?").slice(0, 1)}
                    </Text>
                  </View>
                )}

                <View style={styles.profileTextArea}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {post.stylistNickname}
                  </Text>
                  <Text style={styles.profileRole}>스타일리스트</Text>
                </View>
              </Pressable>

              <View style={styles.likeArea} pointerEvents="none">
                <Text style={styles.heartIcon}>♥</Text>
                <Text style={styles.likeCount}>
                  {post.likeCount.toLocaleString("ko-KR")}
                </Text>
              </View>
            </View>

            <View style={styles.detailPanel}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>스타일</Text>

                <View style={styles.tagList}>
                  {post.styleName.trim()
                    ? renderTag(post.styleName, 0)
                    : <Text style={styles.emptyText}>등록된 스타일이 없습니다.</Text>}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>체형 보완</Text>

                <View style={styles.tagList}>
                  {post.ratioType.trim()
                    ? renderTag(post.ratioType, 0)
                    : <Text style={styles.emptyText}>등록된 체형 정보가 없습니다.</Text>}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>해시태그</Text>

                <View style={styles.hashtagList}>
                  {post.hashtags.length > 0 ? (
                    post.hashtags.map((hashtag, index) =>
                      renderTag(
                        hashtag.startsWith("#") ? hashtag : `#${hashtag}`,
                        index
                      )
                    )
                  ) : (
                    <Text style={styles.emptyText}>
                      등록된 해시태그가 없습니다.
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        ) : null}
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
    height: 54,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EAEAEA",
  },
  headerButton: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 35,
    lineHeight: 39,
    color: "#292929",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#252525",
  },
  moreIcon: {
    fontSize: 27,
    lineHeight: 30,
    color: "#292929",
  },
  content: {
    flex: 1,
  },
  hero: {
    width: "100%",
    height: undefined,
    aspectRatio: 0.72,
    position: "relative",
    backgroundColor: "#EAE8ED",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "38%",
  },
  profileArea: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    maxWidth: "72%",
  },
  profileImage: {
    width: 34,
    height: 34,
    borderRadius: 20,
    backgroundColor: "#EAEAEA",
  },
  profilePlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  profileInitial: {
    color: "#4D458B",
    fontSize: 14,
    fontWeight: "700",
  },
  profileTextArea: {
    flexShrink: 1,
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  profileRole: {
    color: "#FFFFFF",
    fontSize: 10,
    marginTop: 3,
  },
  likeArea: {
    position: "absolute",
    right: 12,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heartIcon: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  likeCount: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  detailPanel: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 7,
    color: "#242424",
    fontSize: 13,
    fontWeight: "700",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    minHeight: 24,
    paddingHorizontal: 11,
    paddingVertical: 5,
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#F0EDFC",
    borderWidth: 1,
    borderColor: "#E5DFFC",
  },
  tagText: {
    color: "#4D458B",
    fontSize: 10,
    fontWeight: "500",
  },
  hashtagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  emptyText: {
    color: "#999999",
    fontSize: 11,
    paddingVertical: 5,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  stateText: {
    marginTop: 12,
    fontSize: 13,
    color: "#777777",
  },
  errorText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "#666666",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: "#4D458B",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
