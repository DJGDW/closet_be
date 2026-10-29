
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { MOCK_STYLISTS, type Stylist } from "../../data/stylists";

const API_BASE_URL = "http://192.168.0.5:8080";

type ExplorePost = {
  postPk: number;
  imageUrl: string | null;
  styleName?: string | null;
  ratioType?: string | null;
  stylistPk: number | string;
  stylistNickname?: string | null;
  stylistRating?: number | null;
  viewCount?: number;
  likeCount?: number;
};

type ExploreResponse = {
  content?: ExplorePost[];
};

type RegisteredProfile = {
  introduction?: string;
  locationPk?: number | string | null;
  styleTypePks?: Array<number | string>;
  plans?: Array<{
    name?: string;
    description?: string;
    price?: number;
    color?: string;
  }>;
};

async function readStoredProfile(): Promise<RegisteredProfile | null> {
  try {
    let raw: string | null = null;

    if (Platform.OS === "web") {
      raw =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("myStylistProfile")
          : null;
    } else {
      raw = await SecureStore.getItemAsync("myStylistProfile");
    }

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as RegisteredProfile;
  } catch (error) {
    console.error("스타일리스트 프로필 불러오기 실패:", error);
    return null;
  }
}

export default function StylistDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const baseStylist = MOCK_STYLISTS.find(
    (item) => String(item.id) === String(id)
  );

  const [registeredProfile, setRegisteredProfile] =
    useState<RegisteredProfile | null>(null);

  const [portfolios, setPortfolios] = useState<ExplorePost[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState("");

  useEffect(() => {
    let active = true;

    readStoredProfile().then((profile) => {
      if (active) {
        setRegisteredProfile(profile);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const loadPortfolios = useCallback(async () => {
    if (!id) {
      setPortfolios([]);
      setPortfolioLoading(false);
      setPortfolioError("스타일리스트 정보를 찾을 수 없습니다.");
      return;
    }

    setPortfolioLoading(true);
    setPortfolioError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/post/explore?page=0&size=50&sort=latest`
      );

      if (!response.ok) {
        throw new Error(
          `게시물 조회 실패 (${response.status})`
        );
      }

      const data = (await response.json()) as ExploreResponse;
      const posts = Array.isArray(data.content) ? data.content : [];

      const matchedPosts = posts.filter(
        (post) =>
          String(post.stylistPk) === String(id) &&
          typeof post.imageUrl === "string" &&
          post.imageUrl.trim().length > 0
      );

      setPortfolios(matchedPosts);
    } catch (error) {
      console.error("포트폴리오 조회 실패:", error);
      setPortfolioError(
        "포트폴리오를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      setPortfolioLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  if (!baseStylist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            스타일리스트 정보를 찾을 수 없습니다.
          </Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>뒤로 가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const stylist: Stylist = {
    ...baseStylist,
    introduction:
      registeredProfile?.introduction?.trim() ||
      baseStylist.introduction,
    services:
      registeredProfile?.plans &&
      registeredProfile.plans.length > 0
        ? registeredProfile.plans.map((plan, index) => ({
            name: plan.name || ["BASIC", "SILVER", "GOLD"][index] || `PLAN ${index + 1}`,
            description:
              plan.description || "스타일링 서비스",
            price:
              typeof plan.price === "number" ? plan.price : 0,
            color:
              plan.color ||
              ["#8275E8", "#68AAB5", "#D99A35"][index % 3],
          }))
        : baseStylist.services,
  };

  const visiblePortfolios = portfolios.slice(0, 3);

  const formatPrice = (price: number) =>
    `${price.toLocaleString("ko-KR")}원`;

  const goToPortfolio = () => {
    router.push({
      pathname: "/stylist/[id]/portfolio",
      params: { id: String(id) },
    });
  };

  const goToPayment = (serviceName?: string) => {
    router.push({
      pathname: "/stylist/[id]/payment",
      params: {
        id: String(id),
        ...(serviceName ? { service: serviceName } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.headerBack}
        >
          <Ionicons
            name="chevron-back"
            size={25}
            color="#222222"
          />
        </Pressable>

        <Text style={styles.headerTitle}>스타일리스트</Text>

        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <Image
            source={stylist.image}
            style={styles.profileImage}
            resizeMode="cover"
          />

          <Text style={styles.stylistName}>{stylist.name}</Text>

          <View style={styles.categoryRow}>
            {stylist.categories.map((category) => (
              <View key={category} style={styles.categoryChip}>
                <Text style={styles.categoryText}>
                  #{category}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons
                name="star"
                size={16}
                color="#F5B544"
              />
              <Text style={styles.statText}>
                {stylist.rating.toFixed(1)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons
                name="heart-outline"
                size={17}
                color="#555555"
              />
              <Text style={styles.statText}>
                {stylist.likes.toLocaleString("ko-KR")}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color="#555555"
              />
              <Text style={styles.statText}>
                리뷰 {stylist.reviews}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>소개</Text>
          <Text style={styles.introduction}>
            {stylist.introduction}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>포트폴리오</Text>

            <Pressable
              onPress={goToPortfolio}
              style={styles.moreButton}
              hitSlop={8}
            >
              <Text style={styles.moreText}>더보기</Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color="#777777"
              />
            </Pressable>
          </View>

          {portfolioLoading ? (
            <View style={styles.portfolioState}>
              <ActivityIndicator
                size="small"
                color="#8275E8"
              />
              <Text style={styles.stateText}>
                포트폴리오를 불러오는 중입니다.
              </Text>
            </View>
          ) : portfolioError ? (
            <View style={styles.portfolioState}>
              <Text style={styles.stateText}>
                {portfolioError}
              </Text>

              <Pressable
                onPress={loadPortfolios}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : visiblePortfolios.length === 0 ? (
            <View style={styles.portfolioState}>
              <Ionicons
                name="images-outline"
                size={28}
                color="#AAAAAA"
              />
              <Text style={styles.stateText}>
                등록된 포트폴리오가 없습니다.
              </Text>
            </View>
          ) : (
            <View style={styles.portfolioGrid}>
              {visiblePortfolios.map((post) => (
                <Pressable
                  key={post.postPk}
                  style={styles.portfolioItem}
                  onPress={() => {
                    router.push({
                      pathname: "/stylist/[id]/portfolio",
                      params: {
                        id: String(id),
                        postPk: String(post.postPk),
                      },
                    });
                  }}
                >
                  <Image
                    source={{ uri: post.imageUrl! }}
                    style={styles.portfolioImage}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>스타일링 서비스</Text>

          {stylist.services.map((service, index) => (
            <View
              key={`${service.name}-${index}`}
              style={styles.serviceCard}
            >
              <View
                style={[
                  styles.serviceBadge,
                  { backgroundColor: service.color },
                ]}
              >
                <Text style={styles.serviceBadgeText}>
                  {service.name}
                </Text>
              </View>

              <View style={styles.serviceInfo}>
                <Text style={styles.serviceDescription}>
                  {service.description}
                </Text>
                <Text style={styles.servicePrice}>
                  {formatPrice(service.price)}
                </Text>
              </View>

              <Pressable
                style={styles.applyButton}
                onPress={() => goToPayment(service.name)}
              >
                <Text style={styles.applyButtonText}>신청</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            style={styles.primaryButton}
            onPress={() => goToPayment()}
          >
            <Text style={styles.primaryButtonText}>
              스타일링 신청하기
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
  headerBack: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
  },
  headerRightSpace: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomWidth: 8,
    borderBottomColor: "#F7F7F7",
  },
  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#EEEEEE",
  },
  stylistName: {
    marginTop: 14,
    fontSize: 21,
    fontWeight: "700",
    color: "#222222",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    gap: 7,
  },
  categoryChip: {
    backgroundColor: "#F4F2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryText: {
    fontSize: 12,
    color: "#8275E8",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 13,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statText: {
    fontSize: 13,
    color: "#555555",
  },
  statDivider: {
    height: 13,
    width: 1,
    backgroundColor: "#DDDDDD",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    borderBottomWidth: 8,
    borderBottomColor: "#F7F7F7",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 14,
  },
  introduction: {
    fontSize: 14,
    lineHeight: 23,
    color: "#555555",
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -12,
  },
  moreText: {
    fontSize: 13,
    color: "#777777",
  },
  portfolioGrid: {
    flexDirection: "row",
    gap: 9,
  },
  portfolioItem: {
    flex: 1,
    aspectRatio: 0.78,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  portfolioImage: {
    width: "100%",
    height: "100%",
  },
  portfolioState: {
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
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
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EAEAEA",
    gap: 12,
  },
  serviceBadge: {
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 7,
  },
  serviceBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceDescription: {
    fontSize: 13,
    color: "#555555",
    lineHeight: 19,
  },
  servicePrice: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
  },
  applyButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#8275E8",
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8275E8",
  },
  primaryButton: {
    marginTop: 22,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#8275E8",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
  },
  backButton: {
    marginTop: 18,
    backgroundColor: "#8275E8",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
