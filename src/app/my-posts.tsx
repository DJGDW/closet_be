
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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
import { API_BASE_URL } from "../config/api";

type MyPost = {
  postPk: number;
  imageUrl: string;
  likeCount: number;
  ratioType: string;
  styleName: string;
  stylistNickname: string;
  stylistPk: number;
  stylistRating: number;
  viewCount: number;
};

export default function MyPostsScreen() {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [selectedPostPks, setSelectedPostPks] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 로그인 토큰 가져오기
  const getAccessToken = async () => {
    if (Platform.OS === "web") {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token")
      );
    }

    return await SecureStore.getItemAsync("accessToken");
  };

  // 내 게시글 불러오기
  const fetchMyPosts = useCallback(async () => {
    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(
        `${API_BASE_URL}/post/my?page=0&size=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `게시글 조회 실패 (${response.status})`
        );
      }

      const result = await response.json();
      const data = result.data ?? result;

      setPosts(Array.isArray(data.content) ? data.content : []);
    } catch (error: any) {
      console.error("내 게시글 조회 오류:", error);
      showAlert(
        "오류",
        error.message || "게시글을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 화면에 다시 진입할 때 목록 갱신
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMyPosts();
    }, [fetchMyPosts])
  );

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 새로고침
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyPosts();
  };

  // 선택 모드 종료
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedPostPks([]);
  };

  // 게시글 선택 / 선택 해제
  const toggleSelectPost = (postPk: number) => {
    setSelectedPostPks((prev) =>
      prev.includes(postPk)
        ? prev.filter((id) => id !== postPk)
        : [...prev, postPk]
    );
  };

  // 전체 선택 / 전체 해제
  const toggleSelectAll = () => {
    if (selectedPostPks.length === posts.length) {
      setSelectedPostPks([]);
    } else {
      setSelectedPostPks(posts.map((post) => post.postPk));
    }
  };

  // 게시글 상세 화면 이동
  const openPostDetail = (post: MyPost) => {
    if (selectMode) {
      toggleSelectPost(post.postPk);
      return;
    }

    router.push({
      pathname: "/post/[postPk]",
      params: {
        postPk: String(post.postPk),
        stylistPk: String(post.stylistPk),
      },
    } as any);
  };

  // 삭제 확인
  const confirmDelete = () => {
    if (selectedPostPks.length === 0) {
      showAlert("알림", "삭제할 게시글을 선택해주세요.");
      return;
    }

    const message = `선택한 게시글 ${selectedPostPks.length}개를 삭제하시겠습니까?`;

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        handleBulkDelete();
      }
    } else {
      Alert.alert("게시글 삭제", message, [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: handleBulkDelete,
        },
      ]);
    }
  };

  // 선택한 게시글 순차 삭제
  const handleBulkDelete = async () => {
    if (deleting || selectedPostPks.length === 0) return;

    setDeleting(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const failedIds: number[] = [];

      for (const postPk of selectedPostPks) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/post/${postPk}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            failedIds.push(postPk);
          }
        } catch {
          failedIds.push(postPk);
        }
      }

      await fetchMyPosts();
      setSelectedPostPks([]);
      setSelectMode(false);

      if (failedIds.length === 0) {
        showAlert("삭제 완료", "선택한 게시글을 모두 삭제했습니다.");
      } else {
        showAlert(
          "일부 삭제 실패",
          `${selectedPostPks.length - failedIds.length}개 삭제 완료\n${failedIds.length}개 삭제 실패`
        );
      }
    } catch (error: any) {
      console.error("게시글 삭제 오류:", error);
      showAlert(
        "삭제 실패",
        error.message || "게시글 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>게시글 관리</Text>

        <Pressable
          style={styles.modeButton}
          onPress={() => {
            if (selectMode) {
              exitSelectMode();
            } else {
              setSelectMode(true);
            }
          }}
        >
          <Text style={styles.modeButtonText}>
            {selectMode ? "취소" : "선택"}
          </Text>
        </Pressable>
      </View>

      {/* 선택 모드 툴바 */}
      {selectMode && (
        <View style={styles.selectToolbar}>
          <Pressable
            style={styles.selectAllButton}
            onPress={toggleSelectAll}
          >
            <View
              style={[
                styles.checkbox,
                selectedPostPks.length === posts.length &&
                  posts.length > 0 &&
                  styles.checkboxActive,
              ]}
            >
              {selectedPostPks.length === posts.length &&
                posts.length > 0 && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
            </View>

            <Text style={styles.selectAllText}>전체 선택</Text>
          </Pressable>

          <View style={styles.deleteArea}>
            <Text style={styles.selectedCount}>
              {selectedPostPks.length}개 선택
            </Text>

            <Pressable
              style={[
                styles.deleteButton,
                (selectedPostPks.length === 0 || deleting) &&
                  styles.deleteButtonDisabled,
              ]}
              disabled={selectedPostPks.length === 0 || deleting}
              onPress={confirmDelete}
            >
              {deleting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>삭제</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* 게시글 목록 */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4D458B" />
          <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>▧</Text>
          <Text style={styles.emptyTitle}>등록된 게시글이 없습니다.</Text>
          <Text style={styles.emptyDescription}>
            작성한 게시글이 이곳에 표시됩니다.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#4D458B"]}
            />
          }
        >
          <View style={styles.listInfo}>
            <Text style={styles.postCount}>
              전체 게시글 {posts.length}개
            </Text>
            <Text style={styles.listGuide}>
              {selectMode
                ? "삭제할 게시글을 선택해주세요."
                : "게시글을 누르면 상세 화면으로 이동합니다."}
            </Text>
          </View>

          <View style={styles.grid}>
            {posts.map((post) => {
              const isSelected = selectedPostPks.includes(post.postPk);

              return (
                <Pressable
                  key={post.postPk}
                  style={styles.postItem}
                  onPress={() => openPostDetail(post)}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: post.imageUrl }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />

                    {selectMode && (
                      <View
                        style={[
                          styles.selectionOverlay,
                          isSelected && styles.selectionOverlayActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            styles.imageCheckbox,
                            isSelected && styles.checkboxActive,
                          ]}
                        >
                          {isSelected && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.postInfo}>
                    <Text style={styles.styleName} numberOfLines={1}>
                      {post.styleName}
                    </Text>

                    <View style={styles.likeInfo}>
                      <Text style={styles.likeIcon}>♡</Text>
                      <Text style={styles.likeCount}>
                        {post.likeCount}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  backText: {
    fontSize: 36,
    lineHeight: 40,
    color: "#222222",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },

  modeButton: {
    width: 40,
    alignItems: "flex-end",
  },

  modeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4D458B",
  },

  selectToolbar: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#C8C8C8",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxActive: {
    backgroundColor: "#4D458B",
    borderColor: "#4D458B",
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  selectAllText: {
    fontSize: 14,
    color: "#333333",
  },

  deleteArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  selectedCount: {
    fontSize: 13,
    color: "#777777",
  },

  deleteButton: {
    height: 34,
    minWidth: 58,
    paddingHorizontal: 14,
    borderRadius: 7,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },

  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  listInfo: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
  },

  postCount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
  },

  listGuide: {
    marginTop: 5,
    fontSize: 12,
    color: "#999999",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "flex-start",
  },

  postItem: {
    width: "33.3333%",
    paddingHorizontal: 4,
    marginBottom: 14,
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 0.78,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#F3F3F3",
  },

  postImage: {
    width: "100%",
    height: "100%",
  },

  selectionOverlay: {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "rgba(0,0,0,0.15)",
  alignItems: "flex-end",
  padding: 7,
},

  selectionOverlayActive: {
    backgroundColor: "rgba(77,69,139,0.25)",
  },

  imageCheckbox: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  postInfo: {
    paddingTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  styleName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#333333",
  },

  likeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },

  likeIcon: {
    fontSize: 15,
    color: "#888888",
  },

  likeCount: {
    marginLeft: 2,
    fontSize: 11,
    color: "#888888",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#888888",
  },

  emptyIcon: {
    fontSize: 48,
    color: "#CCCCCC",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },

  emptyDescription: {
    marginTop: 8,
    fontSize: 13,
    color: "#999999",
  },
});
