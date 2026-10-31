import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { MOCK_STYLISTS, type Stylist } from "../../data/stylists";

const API_BASE_URL = "http://192.168.219.107:8080";

type ExplorePost = {
  postPk: number;
  imageUrl: string | null;
  stylistPk: number | string;
  stylistNickname?: string | null;
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

    if (!raw) return null;

    return JSON.parse(raw) as RegisteredProfile;
  } catch (error) {
    console.error("스타일리스트 프로필 불러오기 실패:", error);
    return null;
  }
}

export default function StylistProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const baseStylist = MOCK_STYLISTS.find(
    (item) => String(item.id) === String(id),
  );

  const [selectedService, setSelectedService] = useState("BASIC");
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
        `${API_BASE_URL}/post/explore?page=0&size=50&sort=latest`,
      );

      if (!response.ok) {
        throw new Error(`게시물 조회 실패 (${response.status})`);
      }

      const data = (await response.json()) as ExploreResponse;
      const posts = Array.isArray(data.content) ? data.content : [];

      const matchedPosts = posts.filter(
        (post) =>
          String(post.stylistPk) === String(id) &&
          typeof post.imageUrl === "string" &&
          post.imageUrl.trim().length > 0,
      );

      setPortfolios(matchedPosts);
    } catch (error) {
      console.error("포트폴리오 조회 실패:", error);
      setPortfolioError(
        "포트폴리오를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <StatusBar barStyle="dark-content" />
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>
        <Text style={{ textAlign: "center", marginTop: 40 }}>
          스타일리스트 정보를 찾을 수 없습니다.
        </Text>
      </SafeAreaView>
    );
  }

  const stylist: Stylist = {
    ...baseStylist,
    introduction:
      registeredProfile?.introduction?.trim() || baseStylist.introduction,
    services:
      registeredProfile?.plans && registeredProfile.plans.length > 0
        ? registeredProfile.plans.map((plan, index) => ({
            name:
              plan.name ||
              ["BASIC", "SILVER", "GOLD"][index] ||
              `PLAN ${index + 1}`,
            description: plan.description || "스타일링 서비스",
            price: typeof plan.price === "number" ? plan.price : 0,
            color: plan.color || ["#8275E8", "#68AAB5", "#D99A35"][index % 3],
          }))
        : baseStylist.services,
  };

  const selectedServiceData =
    stylist.services.find((service) => service.name === selectedService) ||
    stylist.services[0];

  const visiblePortfolios = portfolios.slice(0, 3);

  const goToPortfolio = () => {
    router.push({
      pathname: "/stylist/[id]/portfolio",
      params: { id: String(id) },
    });
  };

  const goToPayment = () => {
    if (!selectedServiceData) return;

    router.push({
      pathname: "/stylist/[id]/payment",
      params: {
        id: String(id),
        service: selectedServiceData.name,
      },
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 상단 헤더 */}
      <View
        style={{
          height: 48,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#F0EEF4",
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            marginRight: 26,
            fontSize: 16,
            fontWeight: "700",
            color: "#292633",
          }}
        >
          스타일리스트 프로필
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* 프로필 */}
        <Image
          source={stylist.image}
          style={{
            width: "100%",
            height: 190,
            backgroundColor: "#E7E5EC",
          }}
          resizeMode="cover"
        />

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#292633" }}>
              {stylist.name}
            </Text>
            <Ionicons name="checkmark-circle" size={17} color="#4A9AC8" />
          </View>

          {/* 스타일 카테고리 */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 8,
            }}
          >
            {stylist.categories.map((category) => (
              <View
                key={category}
                style={{
                  backgroundColor: "#F1EEFC",
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontSize: 11, color: "#51458C" }}>
                  #{category}
                </Text>
              </View>
            ))}
          </View>

          {/* 평점 및 리뷰 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 10,
            }}
          >
            <Ionicons name="star" size={15} color="#F5A623" />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#292633" }}>
              {stylist.rating.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 12, color: "#898692" }}>
              ({stylist.reviews}개 리뷰)
            </Text>
          </View>

          {/* 자기소개 */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#292633",
              marginTop: 18,
              marginBottom: 7,
            }}
          >
            자기소개
          </Text>

          <Text style={{ fontSize: 12, lineHeight: 19, color: "#66636E" }}>
            {stylist.introduction}
          </Text>

          <View
            style={{
              height: 1,
              backgroundColor: "#E7E5EC",
              marginVertical: 16,
            }}
          />

          {/* 서비스 선택 */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#292633",
              marginBottom: 10,
            }}
          >
            제공 서비스
          </Text>

          {stylist.services.map((service) => {
            const isSelected = selectedService === service.name;

            return (
              <Pressable
                key={service.name}
                onPress={() => setSelectedService(service.name)}
                style={{
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected
                    ? service.color
                    : service.color + "66",
                  borderRadius: 13,
                  paddingHorizontal: 15,
                  paddingVertical: 11,
                  marginBottom: 8,
                  backgroundColor: isSelected
                    ? service.color + "12"
                    : service.color + "08",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: service.color,
                      }}
                    >
                      {service.name}
                    </Text>

                    <Text
                      style={{
                        fontSize: 11,
                        color: "#85818D",
                        marginTop: 5,
                      }}
                    >
                      {service.description}
                    </Text>

                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "800",
                        color: "#292633",
                        marginTop: 5,
                      }}
                    >
                      ₩{service.price.toLocaleString("ko-KR")}
                    </Text>
                  </View>

                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: service.color,
                      borderRadius: 9,
                      paddingHorizontal: 13,
                      paddingVertical: 8,
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: service.color,
                      }}
                    >
                      {isSelected ? "선택됨" : "선택하기"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* 포트폴리오 */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#292633" }}>
              포트폴리오
            </Text>

            <Pressable onPress={goToPortfolio} hitSlop={8}>
              <Text style={{ fontSize: 12, color: "#777481" }}>더보기 ›</Text>
            </Pressable>
          </View>

          {portfolioLoading ? (
            <View
              style={{
                minHeight: 110,
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <ActivityIndicator size="small" color="#8275E8" />
              <Text style={{ fontSize: 12, color: "#888888" }}>
                포트폴리오를 불러오는 중입니다.
              </Text>
            </View>
          ) : portfolioError ? (
            <View
              style={{
                minHeight: 110,
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 12, color: "#888888" }}>
                {portfolioError}
              </Text>

              <Pressable
                onPress={loadPortfolios}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#F4F2FF",
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: "#8275E8" }}>
                  다시 시도
                </Text>
              </Pressable>
            </View>
          ) : visiblePortfolios.length === 0 ? (
            <View
              style={{
                minHeight: 110,
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Ionicons name="images-outline" size={28} color="#AAAAAA" />
              <Text style={{ fontSize: 12, color: "#888888" }}>
                등록된 포트폴리오가 없습니다.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 7 }}>
              {visiblePortfolios.map((post) => (
                <Pressable
                  key={post.postPk}
                  style={{
                    flex: 1,
                    height: 120,
                    borderRadius: 7,
                    overflow: "hidden",
                    backgroundColor: "#E7E5EC",
                  }}
                  onPress={() => router.push(`/post/${post.postPk}` as never)}
                >
                  <Image
                    source={{ uri: post.imageUrl! }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: "#F0EEF4",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            flex: 1,
            height: 46,
            borderRadius: 8,
            backgroundColor: "#F1EEFC",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#51458C" }}>
            문의하기
          </Text>
        </Pressable>

        <Pressable
          onPress={goToPayment}
          style={{
            flex: 1.6,
            height: 46,
            borderRadius: 8,
            backgroundColor: "#51458C",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
            서비스 신청하기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
