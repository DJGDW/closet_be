import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import ImagePlaceholder from "../../assets/icons/image-placeholder.svg";
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

type SortType = "LATEST" | "LIKES" | "REVIEWS";

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: "LATEST", label: "최신순" },
  { key: "LIKES", label: "좋아요 많은 순" },
  { key: "REVIEWS", label: "후기 많은 순" },
];

// 포트폴리오 타일 높이 비율(너비 기준). 디자인의 2열 높이 다른 배치를 재현
const TILE_RATIOS = [1.07, 0.85, 0.96, 1.14, 0.87, 0.87];

// 한 줄 필터 칩 / 필터 시트에 쓰는 카테고리 (디자인 기준 12개)

const CATEGORIES = [
  "캐주얼",
  "스트릿",
  "미니멀",
  "댄디",
  "포멀",
  "아메카지",
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
    searchable.includes(alias.toLowerCase().replace(/\s/g, "")),
  );
}

export default function SearchScreen() {
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [keyword, setKeyword] = useState("");

  // 메인 카테고리 다중 선택
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [sort, setSort] = useState<SortType>("LATEST");

  const [filterVisible, setFilterVisible] = useState(false);
  // 필터 시트에서 적용한 상태 (true면 칩 줄 대신 적용 요약 줄을 보여줌)
  const [filterApplied, setFilterApplied] = useState(false);

  const insets = useSafeAreaInsets();

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
          },
        );

        if (response.status === 401 || response.status === 403) {
          setPosts([]);
          setErrorMessage("로그인 인증이 만료되었어요. 다시 로그인해주세요.");
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
              post.imageUrl.trim().length > 0,
          ),
        );
      } catch (error) {
        console.error("탐색 게시물 불러오기 오류:", error);
        setErrorMessage(
          "게시물을 불러오지 못했어요. 서버 연결을 확인하고 다시 시도해주세요.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sort],
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
        selectedCategories.some((category) => matchesCategory(post, category));

      return matchesKeyword && matchesSelectedCategories;
    });
  }, [posts, keyword, selectedCategories]);

  const toggleCategory = (
    category: string,
    current: string[],
    update: (categories: string[]) => void,
  ) => {
    update(
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
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
    setFilterApplied(draftCategories.length > 0 || draftSort !== "LATEST");
    setFilterVisible(false);
  };

  // 검색어에 맞는 스타일리스트 (게시물 대표 이미지로 표시)
  const matchedStylists = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return [];

    const map = new Map<number, ExplorePost>();
    posts.forEach((post) => {
      if (
        !map.has(post.stylistPk) &&
        (post.stylistNickname ?? "").toLowerCase().includes(normalizedKeyword)
      ) {
        map.set(post.stylistPk, post);
      }
    });

    return Array.from(map.values());
  }, [posts, keyword]);

  // 2열 포트폴리오 배치: 짝수 번째는 왼쪽, 홀수 번째는 오른쪽
  // (타일 너비는 열 너비를 따라가고, 높이는 aspectRatio로 결정)
  const gridColumns = useMemo(() => {
    const left: { post: ExplorePost; ratio: number }[] = [];
    const right: { post: ExplorePost; ratio: number }[] = [];

    filteredPosts.forEach((post, index) => {
      const entry = {
        post,
        ratio: TILE_RATIOS[index % TILE_RATIOS.length],
      };
      (index % 2 === 0 ? left : right).push(entry);
    });

    return [left, right];
  }, [filteredPosts]);

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

  const renderPost = (item: ExplorePost, ratio: number) => {
    const nickname = item.stylistNickname || "스타일리스트";
    const initial = nickname.trim().charAt(0) || "S";

    return (
      <View
        key={item.postPk}
        style={[styles.postCard, { aspectRatio: 1 / ratio }]}
      >
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
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.9)"]}
            locations={[0, 0.4, 1]}
            style={styles.imageGradient}
            pointerEvents="none"
          />

          {/* 좋아요 수 */}
          <View style={styles.likeBadge} pointerEvents="none">
            <Ionicons name="heart-outline" size={13} color="#FFFFFF" />
            <Text style={styles.likeCount}>{item.likeCount ?? 0}</Text>
          </View>

          {/* 피드와 같은 하단 스타일리스트 정보 */}
          <View style={styles.stylistInfo} pointerEvents="none">
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>{initial.toUpperCase()}</Text>
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

  const hasMatchedStylists = matchedStylists.length > 0;

  const appliedCategoryLabel =
    selectedCategories.length > 0 ? selectedCategories.join(" · ") : "전체";
  const appliedSortLabel =
    SORT_OPTIONS.find((option) => option.key === sort)?.label ?? "최신순";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>탐색</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={21} color="#222222" />

            <TextInput
              style={styles.searchInput}
              value={keyword}
              onChangeText={setKeyword}
              placeholder="스타일리스트, 스타일을 검색해보세요"
              placeholderTextColor="#9A9A9A"
              returnKeyType="search"
              autoCapitalize="none"
            />

            {keyword.length > 0 && (
              <Pressable
                onPress={() => setKeyword("")}
                accessibilityLabel="검색어 지우기"
              >
                <Ionicons name="close-circle" size={19} color="#AAAAAA" />
              </Pressable>
            )}
          </View>
        </View>

        {filterApplied ? (
          // 필터 적용 후: 칩 줄 대신 적용 요약 줄
          <Pressable
            style={styles.appliedRow}
            onPress={openFilter}
            accessibilityRole="button"
            accessibilityLabel="필터 변경"
          >
            <View style={styles.appliedChip}>
              <Text style={styles.appliedChipText} numberOfLines={1}>
                {appliedCategoryLabel}
              </Text>
            </View>

            <Text style={styles.appliedSortText}>{appliedSortLabel} •</Text>
          </Pressable>
        ) : (
          <View style={styles.categoryRow}>
            <FlatList
              horizontal
              style={styles.categoryScroll}
              data={["전체", ...CATEGORIES]}
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
                      item === "전체"
                        ? setSelectedCategories([])
                        : toggleCategory(
                            item,
                            selectedCategories,
                            setSelectedCategories,
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

            {/* 필터 버튼: 오른쪽에 고정, 칩이 이 버튼 아래로 지나가는 느낌 */}
            <View style={styles.filterDock} pointerEvents="box-none">
              <LinearGradient
                colors={["rgba(255,255,255,0)", "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterFade}
                pointerEvents="none"
              />

              <View style={styles.filterDockSolid}>
                <Pressable
                  style={styles.filterButton}
                  onPress={openFilter}
                  accessibilityRole="button"
                  accessibilityLabel="필터 열기"
                >
                  <MaterialCommunityIcons
                    name="filter-variant"
                    size={16}
                    color="#222222"
                  />
                  <Text style={styles.filterButtonText}>필터</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#4D458B" />
            <Text style={styles.stateDescription}>
              포트폴리오를 불러오는 중이에요.
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={42} color="#999999" />
            <Text style={styles.stateTitle}>불러오기에 실패했어요</Text>
            <Text style={styles.stateDescription}>{errorMessage}</Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => fetchExplorePosts()}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <ImagePlaceholder width={30} height={25} />
            </View>
            <Text style={styles.emptyText}>
              조건에 맞는 포트폴리오가 없습니다.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchExplorePosts(true)}
                tintColor="#4D458B"
              />
            }
          >
            {hasMatchedStylists && (
              <>
                <Text style={styles.sectionLabel}>프로필</Text>

                <FlatList
                  horizontal
                  data={matchedStylists}
                  keyExtractor={(item) => String(item.stylistPk)}
                  showsHorizontalScrollIndicator={false}
                  style={styles.profileListArea}
                  contentContainerStyle={styles.profileList}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.profileTile}
                      onPress={() => openStylistProfile(item.stylistPk)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.stylistNickname} 프로필 보기`}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.profileTileImage}
                        resizeMode="cover"
                      />
                    </Pressable>
                  )}
                />

                <View style={styles.divider} />
              </>
            )}

            <Text style={styles.sectionLabel}>최신 포트폴리오</Text>

            <View style={styles.gridRow}>
              {gridColumns.map((column, columnIndex) => (
                <View key={columnIndex} style={styles.gridColumn}>
                  {column.map(({ post, ratio }) => renderPost(post, ratio))}
                </View>
              ))}
            </View>
          </ScrollView>
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

          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, 0) + 27 },
            ]}
          >
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>필터</Text>

            <Text style={styles.sectionTitle}>스타일 카테고리</Text>

            <View style={styles.filterCategoryGrid}>
              {CATEGORIES.map((category) => {
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
                        setDraftCategories,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterCategoryText,
                        active && styles.filterCategoryTextActive,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.sectionTitle}>정렬 기준</Text>

            {SORT_OPTIONS.map((option) => {
              const selected = draftSort === option.key;

              return (
                <Pressable
                  key={option.key}
                  style={styles.sortOption}
                  onPress={() => setDraftSort(option.key)}
                >
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={selected ? "#222222" : "#6B6B6B"}
                  />
                  <Text style={styles.sortOptionText}>{option.label}</Text>
                </Pressable>
              );
            })}

            <Pressable style={styles.applyButton} onPress={applyFilter}>
              <Text style={styles.applyButtonText}>필터 적용</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
