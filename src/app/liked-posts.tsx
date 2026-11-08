import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

import { styles } from "../styles/feed.styles";

const API_BASE_URL = "http://192.168.0.5:8080";

type LikedPost = {
  postPk: number;
  imageUrl: string;
  styleName: string;
  ratioType?: string | null;
  stylistPk: number;
  stylistNickname: string;
  stylistRating?: number | null;
  viewCount?: number;
  likeCount?: number;
  recommendationScore?: number;
};

type LikedPostsResponse = {
  content?: LikedPost[];
  data?: LikedPost[] | { content?: LikedPost[] };
  posts?: LikedPost[];
};

export default function LikedPostsScreen() {
  const [posts, setPosts] = useState<LikedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchLikedPosts = useCallback(async () => {
    setErrorMessage("");

    try {
      let token: string | null;

      if (Platform.OS === "web") {
        token = localStorage.getItem("accessToken");
      } else {
        token = await SecureStore.getItemAsync("accessToken");
      }

      if (!token) {
        setPosts([]);
        setErrorMessage("로그인이 필요합니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/post/liked?page=0&size=50`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 401 || response.status === 403) {
        setPosts([]);
        setErrorMessage("로그인 인증이 만료되었어요. 다시 로그인해주세요.");
        return;
      }

      if (!response.ok) {
        throw new Error(`좋아요 게시물 요청 실패: HTTP ${response.status}`);
      }

      const result: LikedPostsResponse | LikedPost[] = await response.json();

      let postList: LikedPost[] = [];

      if (Array.isArray(result)) {
        postList = result;
      } else if (Array.isArray(result.content)) {
        postList = result.content;
      } else if (Array.isArray(result.data)) {
        postList = result.data;
      } else if (
        result.data &&
        !Array.isArray(result.data) &&
        Array.isArray(result.data.content)
      ) {
        postList = result.data.content;
      } else if (Array.isArray(result.posts)) {
        postList = result.posts;
      }

      const validPosts = postList.filter(
        (post) =>
          post &&
          post.postPk != null &&
          typeof post.imageUrl === "string" &&
          post.imageUrl.length > 0,
      );

      setPosts(validPosts);
    } catch (error) {
      console.error("좋아요 게시물 불러오기 오류:", error);
      setErrorMessage(
        "좋아요 게시물을 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLikedPosts();
  }, [fetchLikedPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLikedPosts();
  };

  const handlePostPress = (post: LikedPost) => {
    router.push({
      pathname: "/post/[postPk]",
      params: {
        postPk: String(post.postPk),
        stylistPk: String(post.stylistPk),
      },
    });
  };

  const handleStylistPress = (post: LikedPost) => {
    if (post.stylistPk == null) return;

    router.push({
      pathname: "/stylist/[id]",
      params: {
        id: String(post.stylistPk),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.appFrame}>
        {/* 상단 헤더 */}
        <View
          style={{
            height: 56,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: "#EEEEEE",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 40,
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 27, color: "#222222" }}>‹</Text>
          </Pressable>

          <Text
            style={{
              flex: 1,
              fontSize: 17,
              fontWeight: "700",
              color: "#222222",
              textAlign: "center",
              marginRight: 36,
            }}
          >
            좋아요 게시물
          </Text>
        </View>

        <ScrollView
          style={styles.feedScroll}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {loading ? (
            <View
              style={{
                paddingVertical: 48,
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#4D458B" />
              <Text style={{ marginTop: 12, color: "#777777" }}>
                좋아요 게시물을 불러오는 중...
              </Text>
            </View>
          ) : errorMessage ? (
            <View
              style={{
                paddingVertical: 48,
                paddingHorizontal: 20,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#777777",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                {errorMessage}
              </Text>

              <Pressable
                onPress={fetchLikedPosts}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#4D458B",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  다시 시도
                </Text>
              </Pressable>
            </View>
          ) : posts.length === 0 ? (
            <View
              style={{
                paddingVertical: 48,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 30, marginBottom: 10 }}>♡</Text>
              <Text style={{ color: "#777777" }}>
                아직 좋아요를 누른 게시물이 없어요.
              </Text>
            </View>
          ) : (
            <View style={styles.feedGrid}>
              {posts.map((post) => (
                <View key={post.postPk} style={styles.postCard}>
                  {/* 게시물 이미지 */}
                  <Pressable
                    onPress={() => handlePostPress(post)}
                    accessibilityRole="button"
                    accessibilityLabel={`${post.styleName || "게시물"} 상세 보기`}
                  >
                    <Image
                      source={{ uri: post.imageUrl }}
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
                  </Pressable>

                  {/* 스타일리스트 정보 */}
                  <Pressable
                    style={{
                      position: "absolute",
                      left: 8,
                      right: 6,
                      bottom: 31,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      zIndex: 2,
                      elevation: 2,
                    }}
                    onPress={() => handleStylistPress(post)}
                    accessibilityRole="button"
                    accessibilityLabel={`${post.stylistNickname || "스타일리스트"} 프로필 보기`}
                  >
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 17,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.9)",
                        backgroundColor: "rgba(255,255,255,0.18)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {(post.stylistNickname || "?")
                          .slice(0, 1)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: "700",
                          marginBottom: 2,
                        }}
                        numberOfLines={1}
                      >
                        {post.stylistNickname || "스타일리스트"}
                      </Text>

                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 10,
                        }}
                        numberOfLines={1}
                      >
                        {post.styleName || "스타일"}
                      </Text>
                    </View>
                  </Pressable>

                  {/* 게시물 전체 좋아요 수 */}
                  <View
                    style={{
                      position: "absolute",
                      left: 9,
                      bottom: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      zIndex: 3,
                      elevation: 3,
                    }}
                    pointerEvents="none"
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      ♥
                    </Text>

                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {post.likeCount ?? 0}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
