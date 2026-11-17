
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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

import { API_BASE_URL } from "../../config/api";

type PostDetail = {
  profileImage: string | null;
  stylistNickname: string;
  imageUrl: string;
  likeCount: number;
  styleName: string;
  hashtags: string[];
  ratioType: string;
  stylistPk: number;
};

type ReactionCount = {
  likeCount: number;
  dislikeCount: number;
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

  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // 로그인한 스타일리스트 PK
  const [myStylistPk, setMyStylistPk] = useState<number | null>(null);

  // 게시물 메뉴 표시 여부
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 본인 게시물인지 확인
  const isOwner =
    post !== null &&
    myStylistPk !== null &&
    post.stylistPk === myStylistPk;

  const getAccessToken = async (): Promise<string | null> => {
    if (Platform.OS === "web") {
      return localStorage.getItem("accessToken");
    }

    return await SecureStore.getItemAsync("accessToken");
  };

  // 내 스타일리스트 정보 조회
  const fetchMyStylistInfo = useCallback(async () => {
    try {
      const token = await getAccessToken();

      if (!token) {
        setMyStylistPk(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/stylist/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setMyStylistPk(null);
        return;
      }

      const result = await response.json();
      const data = result.data ?? result;

      setMyStylistPk(
        data.stylistPk != null ? Number(data.stylistPk) : null,
      );
    } catch (error) {
      console.error("내 스타일리스트 정보 조회 오류:", error);
      setMyStylistPk(null);
    }
  }, []);

  // 게시물 좋아요 개수 조회
  const fetchReactionCount = useCallback(async () => {
    if (!postPk) return;

    const token = await getAccessToken();

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/post/${encodeURIComponent(postPk)}/reaction`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      throw new Error(
        `좋아요 개수 조회에 실패했습니다. (HTTP ${response.status})`,
      );
    }

    const result: ReactionCount = await response.json();

    setPost((current) =>
      current
        ? {
            ...current,
            likeCount: Number(result.likeCount ?? 0),
          }
        : current,
    );
  }, [postPk]);

  // 게시물 상세 정보 조회
  const fetchPostDetail = useCallback(async () => {
    if (!postPk) {
      setErrorMessage("게시물 번호를 확인할 수 없습니다.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setErrorMessage("");

      const token = await getAccessToken();

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
        },
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "게시물을 조회할 권한이 없습니다. 로그인을 확인해주세요.",
          );
        }

        if (response.status === 404) {
          throw new Error("게시물을 찾을 수 없습니다.");
        }

        throw new Error(
          `게시물 조회에 실패했습니다. (HTTP ${response.status})`,
        );
      }

      const result = await response.json();
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
        stylistPk: Number(detail.stylistPk),
      });

      try {
        await fetchReactionCount();
      } catch (reactionError) {
        console.error("좋아요 개수 조회 오류:", reactionError);
      }
    } catch (error) {
      console.error("게시물 상세 조회 오류:", error);

      setPost(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "게시물을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postPk, fetchReactionCount]);

  useEffect(() => {
    fetchMyStylistInfo();
    fetchPostDetail();
  }, [fetchMyStylistInfo, fetchPostDetail]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPostDetail();
  };

  // 게시물 수정 화면으로 이동
  const handleEditPost = () => {
    if (!postPk) return;

    setMenuVisible(false);

    router.push({
      pathname: "/create-post",
      params: {
        editPostPk: String(postPk),
      },
    });
  };

  // 게시물 삭제
  const handleDeletePost = async () => {
    if (!postPk || deleteLoading) return;

    const token = await getAccessToken();

    if (!token) {
      Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/post/${encodeURIComponent(postPk)}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `게시물 삭제에 실패했습니다. (HTTP ${response.status})`,
        );
      }

      setMenuVisible(false);

      if (Platform.OS === "web") {
        window.alert("게시물이 삭제되었습니다.");
      } else {
        Alert.alert("삭제 완료", "게시물이 삭제되었습니다.");
      }

      router.back();
    } catch (error) {
      console.error("게시물 삭제 오류:", error);

      const message =
        error instanceof Error
          ? error.message
          : "게시물 삭제 중 오류가 발생했습니다.";

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("삭제 실패", message);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // 삭제 확인
  const confirmDeletePost = () => {
    setMenuVisible(false);

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "정말 이 게시물을 삭제하시겠습니까?\n삭제한 게시물은 복구할 수 없습니다.",
      );

      if (confirmed) {
        handleDeletePost();
      }

      return;
    }

    Alert.alert(
      "게시물 삭제",
      "정말 이 게시물을 삭제하시겠습니까?\n삭제한 게시물은 복구할 수 없습니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: handleDeletePost,
        },
      ],
    );
  };

  // 좋아요 토글
  const handleLikePress = async () => {
    if (!post || likeLoading || !postPk) return;

    const token = await getAccessToken();

    if (!token) {
      Alert.alert("로그인 필요", "좋아요 기능은 로그인 후 이용할 수 있습니다.");
      return;
    }

    const previousLiked = isLiked;
    const previousCount = post.likeCount;
    const nextLiked = !previousLiked;

    setIsLiked(nextLiked);

    setPost((current) =>
      current
        ? {
            ...current,
            likeCount: Math.max(
              0,
              current.likeCount + (nextLiked ? 1 : -1),
            ),
          }
        : current,
    );

    setLikeLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/post/${encodeURIComponent(postPk)}/reaction`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reactionType: 0,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `좋아요 처리에 실패했습니다. (HTTP ${response.status})`,
        );
      }

      await fetchReactionCount();
    } catch (error) {
      console.error("좋아요 처리 오류:", error);

      setIsLiked(previousLiked);

      setPost((current) =>
        current
          ? {
              ...current,
              likeCount: previousCount,
            }
          : current,
      );

      Alert.alert(
        "좋아요 처리 실패",
        error instanceof Error
          ? error.message
          : "잠시 후 다시 시도해주세요.",
      );
    } finally {
      setLikeLoading(false);
    }
  };

  const handleProfilePress = () => {
    if (!stylistPk) {
      Alert.alert(
        "스타일리스트 정보",
        "스타일리스트 번호가 전달되지 않았습니다.",
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
      <StatusBar barStyle="dark-content" />

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

          {isOwner ? (
            <Pressable
              style={styles.headerButton}
              onPress={() => setMenuVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="게시물 메뉴"
            >
              <Text style={styles.moreIcon}>⋮</Text>
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
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
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.42)"]}
                locations={[0, 1]}
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

              <Pressable
                style={styles.likeArea}
                onPress={handleLikePress}
                disabled={likeLoading}
                accessibilityRole="button"
                accessibilityLabel={isLiked ? "좋아요 취소" : "좋아요"}
              >
                <Text style={styles.likeCount}>
                  {post.likeCount.toLocaleString("ko-KR")}
                </Text>

                <Text
                  style={[styles.heartIcon, isLiked && styles.heartIconActive]}
                >
                  ♥
                </Text>
              </Pressable>
            </View>

            <View style={styles.detailPanel}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>스타일</Text>

                <View style={styles.tagList}>
                  {post.styleName.trim() ? (
                    renderTag(post.styleName, 0)
                  ) : (
                    <Text style={styles.emptyText}>
                      등록된 스타일이 없습니다.
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>체형 보완</Text>

                <View style={styles.tagList}>
                  {post.ratioType.trim() ? (
                    renderTag(post.ratioType, 0)
                  ) : (
                    <Text style={styles.emptyText}>
                      등록된 체형 정보가 없습니다.
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>해시태그</Text>

                <View style={styles.hashtagList}>
                  {post.hashtags.length > 0 ? (
                    post.hashtags.map((hashtag, index) => (
                      <Text
                        key={`${hashtag}-${index}`}
                        style={styles.hashtagText}
                      >
                        {hashtag.startsWith("#") ? hashtag : `#${hashtag}`}
                      </Text>
                    ))
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

      {/* 게시물 수정 / 삭제 메뉴 */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.menuContainer}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.menuTitle}>게시물 관리</Text>

            <Pressable
              style={styles.menuItem}
              onPress={handleEditPost}
            >
              <Text style={styles.menuItemText}>게시물 수정</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuItem}
              onPress={confirmDeletePost}
              disabled={deleteLoading}
            >
              <Text style={styles.deleteMenuText}>
                {deleteLoading ? "삭제 중..." : "게시물 삭제"}
              </Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuItem}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.cancelMenuText}>취소</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    aspectRatio: 0.67,
    position: "relative",
    backgroundColor: "#E7E7E7",
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
    height: "18%",
  },
  profileArea: {
    position: "absolute",
    left: 11,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    maxWidth: "72%",
  },
  profileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },
  profilePlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  profileInitial: {
    color: "#4D458B",
    fontSize: 15,
    fontWeight: "700",
  },
  profileTextArea: {
    flexShrink: 1,
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  profileRole: {
    color: "#FFFFFF",
    fontSize: 10,
    marginTop: 4,
  },
  likeArea: {
    position: "absolute",
    right: 11,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heartIcon: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  heartIconActive: {
    color: "#FF4D6D",
  },
  likeCount: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  detailPanel: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    marginBottom: 8,
    color: "#222222",
    fontSize: 13,
    fontWeight: "700",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    minHeight: 26,
    paddingHorizontal: 12,
    paddingVertical: 5,
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#4D458B",
  },
  tagText: {
    color: "#3F3680",
    fontSize: 11,
    fontWeight: "600",
  },
  hashtagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 6,
    rowGap: 4,
  },
  hashtagText: {
    color: "#7C6DE0",
    fontSize: 11,
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

  // 게시물 메뉴 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  menuContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
    paddingBottom: 12,
  },
  menuItem: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  deleteMenuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5484D",
  },
  cancelMenuText: {
    fontSize: 14,
    color: "#777777",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EEEEEE",
  },
});
