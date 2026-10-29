
import { LinearGradient } from "expo-linear-gradient";
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
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

import BellIcon from "../../assets/icons/bell.svg";
import PlusIcon from "../../assets/icons/plusicon.svg";

import { styles } from "../styles/feed.styles";

const API_BASE_URL = "http://192.168.0.5:8080";

type FeedPost = {
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

type RecommendedResponse = {
  content?: FeedPost[];
  data?: FeedPost[];
  posts?: FeedPost[];
};

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchRecommendedPosts = useCallback(async () => {
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
        `${API_BASE_URL}/post/recommended?page=0&size=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        setPosts([]);
        setErrorMessage(
          "로그인 인증이 만료되었어요. 다시 로그인해주세요."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          `추천 피드 요청 실패: HTTP ${response.status}`
        );
      }

      const result: FeedPost[] | RecommendedResponse =
        await response.json();

      const postList: FeedPost[] = Array.isArray(result)
        ? result
        : Array.isArray(result.content)
          ? result.content
          : Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.posts)
              ? result.posts
              : [];

      const validPosts = postList.filter(
        (post) =>
          post &&
          post.postPk != null &&
          typeof post.imageUrl === "string" &&
          post.imageUrl.length > 0
      );

      setPosts(validPosts);
    } catch (error) {
      console.error("추천 피드 불러오기 오류:", error);
      setErrorMessage(
        "피드를 불러오지 못했어요. 서버 연결을 확인하고 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendedPosts();
  }, [fetchRecommendedPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendedPosts();
  };

  // 게시물 이미지 클릭 → 게시물 상세 페이지
  const handlePostPress = (post: FeedPost) => {
    router.push({
      pathname: "/post/[postPk]",
      params: {
        postPk: String(post.postPk),
        stylistPk: String(post.stylistPk),
      },
    });
  };

  // 스타일리스트 정보 클릭 → 기존 스타일리스트 소개 페이지
  const handleStylistPress = (post: FeedPost) => {
    if (post.stylistPk == null) {
      Alert.alert(
        "안내",
        "스타일리스트 정보를 확인할 수 없습니다."
      );
      return;
    }

    router.push({
      pathname: "/stylist/[id]",
      params: {
        id: String(post.stylistPk),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.appFrame}>
        <View style={styles.header}>
          <View style={styles.logoArea}>
            <Image
              source={require("../../assets/images/stylink-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerIconButton}
              onPress={() => router.push("/create-post")}
              accessibilityRole="button"
              accessibilityLabel="게시물 작성"
            >
              <PlusIcon width={25} height={25} />
            </Pressable>

            <Pressable
              style={styles.headerIconButton}
              onPress={() =>
                Alert.alert(
                  "알림",
                  "알림 화면은 준비 중이에요."
                )
              }
              accessibilityRole="button"
              accessibilityLabel="알림"
            >
              <BellIcon width={23} height={23} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.feedScroll}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {loading ? (
            <View
              style={{
                paddingVertical: 48,
                alignItems: "center",
              }}
            >
              <ActivityIndicator
                size="large"
                color="#4D458B"
              />
              <Text
                style={{
                  marginTop: 12,
                  color: "#777777",
                }}
              >
                추천 스타일을 불러오는 중...
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
                onPress={fetchRecommendedPosts}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#4D458B",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                  }}
                >
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
              <Text style={{ color: "#777777" }}>
                아직 추천할 게시물이 없어요.
              </Text>
            </View>
          ) : (
            <View style={styles.feedGrid}>
              {posts.map((post) => (
                <View
                  key={post.postPk}
                  style={styles.postCard}
                >
                  {/* 이미지 영역: 게시물 상세 페이지 */}
                  <Pressable
                    onPress={() => handlePostPress(post)}
                    accessibilityRole="button"
                    accessibilityLabel={`${
                      post.styleName || "게시물"
                    } 상세 보기`}
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

                  {/* 기존 디자인 유지: 하단 정보 영역만 별도 클릭 */}
                  <Pressable
                    style={[
                      styles.stylistInfo,
                      {
                        zIndex: 2,
                        elevation: 2,
                      },
                    ]}
                    onPress={() => handleStylistPress(post)}
                    accessibilityRole="button"
                    accessibilityLabel={`${
                      post.stylistNickname || "스타일리스트"
                    } 프로필 보기`}
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

                    <View style={styles.stylistTextArea}>
                      <Text
                        style={styles.stylistName}
                        numberOfLines={1}
                      >
                        {post.stylistNickname ||
                          "스타일리스트"}
                      </Text>

                      <Text
                        style={styles.stylistStyle}
                        numberOfLines={1}
                      >
                        {post.styleName || "스타일"}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
