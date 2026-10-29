
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import styles from "../styles/search.styles";

const API_BASE_URL = "http://192.168.0.5:8080";

type ExplorePost = {
  postPk: number;
  imageUrl: string;
  styleName: string;
  ratioType?: string | null;
  stylistPk: number;
  stylistNickname: string;
  stylistRating?: number | null;
  viewCount?: number;
  likeCount?: number;
};

type SortType = "LATEST" | "LIKES";

const CATEGORIES = [
  "전체",
  "캐주얼",
  "스트릿",
  "미니멀",
  "댄디",
  "포멀",
  "아메카지",
  "이모키드",
  "빈티지",
  "고프코어",
  "Y2K",
  "페미닌",
  "모던",
  "스포츠/애슬레저",
];

const STYLE_ALIASES: Record<string, string[]> = {
  캐주얼: ["캐주얼", "casual"],
  스트릿: ["스트릿", "스트리트", "street"],
  미니멀: ["미니멀", "minimal"],
  댄디: ["댄디", "dandy"],
  포멀: ["포멀", "formal"],
  아메카지: ["아메카지", "아메리칸 캐주얼", "amekaji"],
  이모키드: ["이모키드", "emo"],
  빈티지: ["빈티지", "vintage"],
  고프코어: ["고프코어", "gorpcore"],
  Y2K: ["y2k"],
  페미닌: ["페미닌", "feminine"],
  모던: ["모던", "modern"],
  "스포츠/애슬레저": ["스포츠", "애슬레저", "sports", "athleisure"],
};

function matchesCategory(post: ExplorePost, category: string) {
  const searchable = `${post.styleName ?? ""} ${post.ratioType ?? ""}`
    .toLowerCase()
    .replace(/\s/g, "");

  const aliases = STYLE_ALIASES[category] ?? [category];

  return aliases.some((alias) =>
    searchable.includes(alias.toLowerCase().replace(/\s/g, ""))
  );
}

export default function SearchScreen() {
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [keyword, setKeyword] = useState("");

  // 메인 카테고리 다중 선택
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [sort, setSort] = useState<SortType>("LATEST");

  const [filterVisible, setFilterVisible] = useState(false);

  // 상세 필터는 적용 전까지 별도 상태로 관리
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftSort, setDraftSort] = useState<SortType>("LATEST");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchExplorePosts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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
          `${API_BASE_URL}/post/explore?page=0&size=50&sort=${sort}`,
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
          throw new Error(`게시물 요청 실패: HTTP ${response.status}`);
        }

        const result = await response.json();

        const postList: ExplorePost[] = Array.isArray(result)
          ? result
          : Array.isArray(result.content)
            ? result.content
            : Array.isArray(result.data)
              ? result.data
              : Array.isArray(result.posts)
                ? result.posts
                : [];

        setPosts(
          postList.filter(
            (post) =>
              post &&
              post.postPk != null &&
              typeof post.imageUrl === "string" &&
              post.imageUrl.trim().length > 0
          )
        );
      } catch (error) {
        console.error("탐색 게시물 불러오기 오류:", error);
        setErrorMessage(
          "게시물을 불러오지 못했어요. 서버 연결을 확인하고 다시 시도해주세요."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sort]
  );

  useEffect(() => {
    fetchExplorePosts();
  }, [fetchExplorePosts]);

  const filteredPosts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return posts.filter((post) => {
      const searchableText = [
        post.styleName ?? "",
        post.stylistNickname ?? "",
        post.ratioType ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        searchableText.includes(normalizedKeyword);

      // 선택한 카테고리 중 하나라도 일치하면 표시
      const matchesSelectedCategories =
        selectedCategories.length === 0 ||
        selectedCategories.some((category) =>
          matchesCategory(post, category)
        );

      return matchesKeyword && matchesSelectedCategories;
    });
  }, [posts, keyword, selectedCategories]);

  const toggleCategory = (
    category: string,
    current: string[],
    update: (categories: string[]) => void
  ) => {
    if (category === "전체") {
      update([]);
      return;
    }

    update(
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const openFilter = () => {
    setDraftCategories([...selectedCategories]);
    setDraftSort(sort);
    setFilterVisible(true);
  };

  const applyFilter = () => {
    setSelectedCategories([...draftCategories]);
    setSort(draftSort);
    setFilterVisible(false);
  };

  const resetFilters = () => {
    setKeyword("");
    setSelectedCategories([]);
    setDraftCategories([]);
    setDraftSort("LATEST");
    setSort("LATEST");
    setFilterVisible(false);
  };

  const openPostDetail = (item: ExplorePost) => {
  router.push({
    pathname: "/post/[postPk]",
    params: {
      postPk: String(item.postPk),
      stylistPk: String(item.stylistPk),
    },
  });
};

  const openStylistProfile = (stylistPk: number) => {
    router.push(`/stylist/${stylistPk}` as never);
  };



const renderPost = ({ item }: { item: ExplorePost }) => {
  const nickname = item.stylistNickname || "스타일리스트";
  const initial = nickname.trim().charAt(0) || "S";

  return (
    <View style={styles.postCard}>
      {/* 이미지 클릭: 게시물 상세 */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => openPostDetail(item)}
        accessibilityRole="button"
        accessibilityLabel="게시물 상세 보기"
      >
        <Image
          source={{ uri: item.imageUrl }}
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

        {/* 좋아요 수 */}
        <View style={styles.likeBadge} pointerEvents="none">
          <Ionicons
            name="heart-outline"
            size={13}
            color="#FFFFFF"
          />
          <Text style={styles.likeCount}>
            {item.likeCount ?? 0}
          </Text>
        </View>

        {/* 피드와 같은 하단 스타일리스트 정보 */}
        <View style={styles.stylistInfo} pointerEvents="none">
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>
              {initial.toUpperCase()}
            </Text>
          </View>

          <View style={styles.stylistTextArea}>
            <Text style={styles.stylistName} numberOfLines={1}>
              {nickname}
            </Text>

            <Text style={styles.stylistStyle} numberOfLines={1}>
              {item.styleName || "스타일"}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* 프로필 클릭: 스타일리스트 소개 */}
      <Pressable
        style={styles.profileHitArea}
        onPress={() => openStylistProfile(item.stylistPk)}
        accessibilityRole="button"
        accessibilityLabel={`${nickname} 프로필 보기`}
      />
    </View>
  );
};


  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>탐색</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#777777"
            />

            <TextInput
              style={styles.searchInput}
              value={keyword}
              onChangeText={setKeyword}
              placeholder="스타일 또는 스타일리스트 검색"
              placeholderTextColor="#999999"
              returnKeyType="search"
              autoCapitalize="none"
            />

            {keyword.length > 0 && (
              <Pressable
                onPress={() => setKeyword("")}
                accessibilityLabel="검색어 지우기"
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color="#AAAAAA"
                />
              </Pressable>
            )}
          </View>

          <Pressable
            style={styles.filterButton}
            onPress={openFilter}
            accessibilityRole="button"
            accessibilityLabel="필터 열기"
          >
            <Ionicons
              name="options-outline"
              size={22}
              color="#222222"
            />
          </Pressable>
        </View>

        <View style={styles.categoryArea}>
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => {
              const active =
                item === "전체"
                  ? selectedCategories.length === 0
                  : selectedCategories.includes(item);

              return (
                <Pressable
                  onPress={() =>
                    toggleCategory(
                      item,
                      selectedCategories,
                      setSelectedCategories
                    )
                  }
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.resultTitle}>관련 게시물</Text>
            <Text style={styles.resultCount}>
              {filteredPosts.length}개의 게시물
            </Text>
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={() => fetchExplorePosts(true)}
            accessibilityLabel="게시물 새로고침"
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color="#4D458B"
            />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#4D458B" />
            <Text style={styles.stateDescription}>
              게시물을 불러오는 중이에요.
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Ionicons
              name="cloud-offline-outline"
              size={42}
              color="#999999"
            />
            <Text style={styles.stateTitle}>
              불러오기에 실패했어요
            </Text>
            <Text style={styles.stateDescription}>
              {errorMessage}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => fetchExplorePosts()}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            key="explore-grid"
            data={filteredPosts}
            keyExtractor={(item) => String(item.postPk)}
            renderItem={renderPost}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchExplorePosts(true)}
                tintColor="#4D458B"
              />
            }
            ListEmptyComponent={
              <View style={styles.centerState}>
                <Ionicons
                  name="images-outline"
                  size={44}
                  color="#BBBBBB"
                />
                <Text style={styles.stateTitle}>
                  조건에 맞는 게시물이 없습니다.
                </Text>
                <Text style={styles.stateDescription}>
                  검색어나 카테고리를 변경해 보세요.
                </Text>

                <Pressable
                  style={styles.retryButton}
                  onPress={resetFilters}
                >
                  <Text style={styles.retryButtonText}>
                    검색 조건 초기화
                  </Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>

      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalOutside}
            onPress={() => setFilterVisible(false)}
            accessibilityLabel="필터 닫기"
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>필터</Text>

              <Pressable
                onPress={() => setFilterVisible(false)}
                accessibilityLabel="필터 닫기"
              >
                <Ionicons name="close" size={23} color="#222222" />
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>
              스타일 카테고리
            </Text>

            <Text style={styles.selectionHint}>
              여러 항목을 선택할 수 있어요.
            </Text>

            <View style={styles.filterCategoryGrid}>
              {CATEGORIES.filter(
                (category) => category !== "전체"
              ).map((category) => {
                const active = draftCategories.includes(category);

                return (
                  <Pressable
                    key={category}
                    style={[
                      styles.filterCategoryChip,
                      active && styles.filterCategoryChipActive,
                    ]}
                    onPress={() =>
                      toggleCategory(
                        category,
                        draftCategories,
                        setDraftCategories
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterCategoryText,
                        active && styles.filterCategoryTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.selectAllButton}
              onPress={() => setDraftCategories([])}
            >
              <Ionicons
                name={
                  draftCategories.length === 0
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={17}
                color="#4D458B"
              />
              <Text style={styles.selectAllText}>
                전체 카테고리 보기
              </Text>
            </Pressable>

            <View style={styles.modalDivider} />

            <Text style={styles.sectionTitle}>정렬 기준</Text>

            <Pressable
              style={styles.sortOption}
              onPress={() => setDraftSort("LATEST")}
            >
              <Text style={styles.sortOptionText}>최신순</Text>
              <Ionicons
                name={
                  draftSort === "LATEST"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={
                  draftSort === "LATEST" ? "#4D458B" : "#999999"
                }
              />
            </Pressable>

            <Pressable
              style={styles.sortOption}
              onPress={() => setDraftSort("LIKES")}
            >
              <Text style={styles.sortOptionText}>
                좋아요 많은 순
              </Text>
              <Ionicons
                name={
                  draftSort === "LIKES"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={
                  draftSort === "LIKES" ? "#4D458B" : "#999999"
                }
              />
            </Pressable>

          

            <View style={styles.modalButtonRow}>
              <Pressable
                style={styles.resetModalButton}
                onPress={() => {
                  setDraftCategories([]);
                  setDraftSort("LATEST");
                }}
              >
                <Text style={styles.resetModalButtonText}>
                  초기화
                </Text>
              </Pressable>

              <Pressable
                style={styles.applyButton}
                onPress={applyFilter}
              >
                <Text style={styles.applyButtonText}>
                  필터 적용
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
