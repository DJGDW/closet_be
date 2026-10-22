
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import styles from "../styles/search.styles";
import { COLORS } from "../styles/feed.styles";

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

type SortType = "최신순" | "좋아요 많은 순" | "후기 많은 순";

type Stylist = {
  id: string;
  name: string;
  categories: string[];
  image: string;
  likes: number;
  reviews: number;
};

const MOCK_STYLISTS: Stylist[] = [
  {
    id: "1",
    name: "gar_dxx",
    categories: ["미니멀", "캐주얼", "모던"],
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
    likes: 125,
    reviews: 32,
  },
  {
    id: "2",
    name: "jaewon",
    categories: ["스트릿", "캐주얼"],
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600",
    likes: 240,
    reviews: 56,
  },
  {
    id: "3",
    name: "seoyeon_96",
    categories: ["페미닌", "미니멀"],
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
    likes: 310,
    reviews: 81,
  },
  {
    id: "4",
    name: "jun50_park",
    categories: ["댄디", "모던", "포멀"],
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600",
    likes: 180,
    reviews: 42,
  },
  {
    id: "5",
    name: "yujinchoi",
    categories: ["빈티지", "캐주얼"],
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600",
    likes: 98,
    reviews: 21,
  },
  {
    id: "6",
    name: "정현우",
    categories: ["스트릿", "고프코어"],
    image:
      "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600",
    likes: 420,
    reviews: 103,
  },
  {
    id: "7",
    name: "min_daily",
    categories: ["미니멀", "모던"],
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600",
    likes: 155,
    reviews: 37,
  },
  {
    id: "8",
    name: "street_h",
    categories: ["스트릿", "Y2K"],
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600",
    likes: 275,
    reviews: 68,
  },
];

export default function SearchScreen() {
  const [keyword, setKeyword] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [sortType, setSortType] = useState<SortType>("최신순");
  const [draftSortType, setDraftSortType] = useState<SortType>("최신순");

  const filteredStylists = useMemo(() => {
    let result = MOCK_STYLISTS.filter((stylist) => {
      const matchesKeyword = stylist.name
        .toLowerCase()
        .includes(keyword.trim().toLowerCase());

      const matchesCategories =
        selectedCategories.length === 0 ||
        selectedCategories.some((category) =>
          stylist.categories.includes(category)
        );

      return matchesKeyword && matchesCategories;
    });

    if (sortType === "좋아요 많은 순") {
      result = [...result].sort((a, b) => b.likes - a.likes);
    } else if (sortType === "후기 많은 순") {
      result = [...result].sort((a, b) => b.reviews - a.reviews);
    }

    return result;
  }, [keyword, selectedCategories, sortType]);

  const openFilter = () => {
    setDraftCategories([...selectedCategories]);
    setDraftSortType(sortType);
    setFilterVisible(true);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const toggleDraftCategory = (category: string) => {
    setDraftCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const applyFilter = () => {
    setSelectedCategories([...draftCategories]);
    setSortType(draftSortType);
    setFilterVisible(false);
  };

  const modalPreviewCount = MOCK_STYLISTS.filter((stylist) => {
    const matchesKeyword = stylist.name
      .toLowerCase()
      .includes(keyword.trim().toLowerCase());

    const matchesCategories =
      draftCategories.length === 0 ||
      draftCategories.some((category) =>
        stylist.categories.includes(category)
      );

    return matchesKeyword && matchesCategories;
  }).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.screenContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>탐색</Text>

          <Pressable onPress={openFilter} style={styles.headerIcon}>
            <Ionicons
              name="options-outline"
              size={23}
              color={COLORS.text}
            />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.subText}
          />

          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="스타일리스트, 스타일을 검색해보세요"
            placeholderTextColor="#999999"
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
          />

          {keyword.length > 0 && (
            <Pressable onPress={() => setKeyword("")}>
              <Ionicons
                name="close-circle"
                size={19}
                color={COLORS.subText}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.categoryArea}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            <Pressable
              onPress={() => setSelectedCategories([])}
              style={[
                styles.categoryChip,
                selectedCategories.length === 0 &&
                  styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategories.length === 0 &&
                    styles.categoryTextActive,
                ]}
              >
                전체
              </Text>
            </Pressable>

            {CATEGORIES.map((category) => {
              const active = selectedCategories.includes(category);

              return (
                <Pressable
                  key={category}
                  onPress={() => toggleCategory(category)}
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
                    {category}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable style={styles.filterChip} onPress={openFilter}>
              <Ionicons
                name="options-outline"
                size={15}
                color={COLORS.text}
              />
              <Text style={styles.filterChipText}>필터</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>최신 포트폴리오</Text>

          <Pressable style={styles.sortButton} onPress={openFilter}>
            <Text style={styles.sortText}>{sortType}</Text>
            <Ionicons
              name="chevron-down"
              size={13}
              color={COLORS.subText}
            />
          </Pressable>
        </View>

        <FlatList
          data={filteredStylists}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.stylistCard}>
              <Image
                source={{ uri: item.image }}
                style={styles.stylistImage}
              />

              <View style={styles.imageShade} />

              <View style={styles.stylistInfo}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.avatar}
                />

                <View style={styles.stylistTextArea}>
                  <Text style={styles.stylistName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <Text style={styles.stylistCategory} numberOfLines={1}>
                    {item.categories.join(" · ")}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="image-outline"
                  size={29}
                  color={COLORS.subText}
                />
              </View>

              <Text style={styles.emptyTitle}>
                조건에 맞는 포트폴리오가 없습니다.
              </Text>

              <Text style={styles.emptyDescription}>
                검색어나 카테고리를 변경해 보세요.
              </Text>

              <Pressable
                style={styles.resetButton}
                onPress={() => {
                  setKeyword("");
                  setSelectedCategories([]);
                  setSortType("최신순");
                }}
              >
                <Text style={styles.resetButtonText}>조건 초기화</Text>
              </Pressable>
            </View>
          }
        />

        <Modal
          visible={filterVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterVisible(false)}
        >
          <View style={styles.modalRoot}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setFilterVisible(false)}
            />

            <View style={styles.filterSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>필터</Text>

                <Pressable onPress={() => setFilterVisible(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.text}
                  />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetScrollContent}
              >
                <Text style={styles.sectionTitle}>스타일 카테고리</Text>

                <View style={styles.filterCategoryGrid}>
                  {CATEGORIES.map((category) => {
                    const active = draftCategories.includes(category);

                    return (
                      <Pressable
                        key={category}
                        onPress={() => toggleDraftCategory(category)}
                        style={[
                          styles.filterCategory,
                          active && styles.filterCategoryActive,
                        ]}
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

                <View style={styles.sheetDivider} />

                <Text style={styles.sectionTitle}>정렬 기준</Text>

                {(
                  [
                    "최신순",
                    "좋아요 많은 순",
                    "후기 많은 순",
                  ] as SortType[]
                ).map((option) => {
                  const active = draftSortType === option;

                  return (
                    <Pressable
                      key={option}
                      style={styles.sortOption}
                      onPress={() => setDraftSortType(option)}
                    >
                      <View style={styles.radioOuter}>
                        {active && <View style={styles.radioInner} />}
                      </View>

                      <Text style={styles.sortOptionText}>{option}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.sheetFooter}>
                <Pressable
                  style={styles.clearButton}
                  onPress={() => {
                    setDraftCategories([]);
                    setDraftSortType("최신순");
                  }}
                >
                  <Text style={styles.clearButtonText}>초기화</Text>
                </Pressable>

                <Pressable
                  style={styles.applyButton}
                  onPress={applyFilter}
                >
                  <Text style={styles.applyButtonText}>
                    필터 적용 ({modalPreviewCount})
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
