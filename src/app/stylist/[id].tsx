import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.0.5:8080";

type StyleTypeDto = {
  typePk: number;
  styleName: string;
  styleCode: string;
};

type PlanDto = {
  stylistPlanPk?: number;
  planPk: number;
  planTier: string;
  planCode: string;
  description: string;
  price: number;
};

type StylistDetailResponse = {
  nickname: string;
  profilePic: string | null;
  introduction: string | null;
  rating: number | null;
  locationName: string | null;
  styleTypes: StyleTypeDto[];
  plans: PlanDto[];
  postCount: number;
  followerCount: number;
};

type ExplorePost = {
  postPk: number;
  imageUrl: string | null;
  stylistPk: number | string;
  stylistNickname?: string | null;
};

type Service = {
  name: string;
  description: string;
  price: number;
  color: string;
};

const SERVICE_COLORS = ["#8275E8", "#68AAB5", "#D99A35"];

async function getAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    }

    return await SecureStore.getItemAsync("accessToken");
  } catch (error) {
    console.error("로그인 토큰 조회 실패:", error);
    return null;
  }
}

export default function StylistProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [stylist, setStylist] = useState<StylistDetailResponse | null>(null);
  const [introExpanded, setIntroExpanded] = useState(false);

  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState("");

  const [selectedService, setSelectedService] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [unfollowModalVisible, setUnfollowModalVisible] = useState(false);

  const [portfolios, setPortfolios] = useState<ExplorePost[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState("");

  // 스타일리스트 상세정보 조회
  const loadStylistDetail = useCallback(async () => {
    if (!id) {
      setDetailError("스타일리스트 정보를 찾을 수 없습니다.");
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setDetailError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
      }

      const response = await fetch(`${API_BASE_URL}/stylist/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`스타일리스트 상세정보 조회 실패 (${response.status})`);
      }

      const data = await response.json();

      // API가 직접 DTO를 반환하는 경우
      const detail: StylistDetailResponse = data.data ?? data.result ?? data;

      setStylist(detail);

      // 실제 서비스 목록의 첫 번째 항목을 기본 선택
      if (detail.plans && detail.plans.length > 0) {
        setSelectedService(detail.plans[0].planCode);
      } else {
        setSelectedService("");
      }
    } catch (error) {
      console.error("스타일리스트 상세정보 조회 실패:", error);

      setDetailError(
        error instanceof Error
          ? error.message
          : "스타일리스트 정보를 불러오지 못했습니다.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, [id]);

  // 포트폴리오 게시물 조회
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
      const token = await getAccessToken();

      if (!token) {
        throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
      }

      const response = await fetch(
        `${API_BASE_URL}/post/explore?page=0&size=50&sort=LATEST`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`게시물 조회 실패 (${response.status})`);
      }

      const data = await response.json();

      const posts: ExplorePost[] = Array.isArray(data)
        ? data
        : Array.isArray(data.content)
          ? data.content
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.posts)
              ? data.posts
              : [];

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
        error instanceof Error
          ? error.message
          : "포트폴리오를 불러오지 못했습니다.",
      );
    } finally {
      setPortfolioLoading(false);
    }
  }, [id]);

  // 현재 스타일리스트 팔로우 여부 확인
  const loadFollowStatus = useCallback(async () => {
    if (!id) return;

    try {
      const token = await getAccessToken();

      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/follow`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`팔로잉 목록 조회 실패 (${response.status})`);
      }

      const data = await response.json();

      const followings = Array.isArray(data)
        ? data
        : (data.data ?? data.result ?? []);

      const following = followings.some(
        (item: { stylistPk: number | string }) =>
          String(item.stylistPk) === String(id),
      );

      setIsFollowing(following);
    } catch (error) {
      console.error("팔로우 상태 조회 실패:", error);
    }
  }, [id]);

  // 팔로우 실행
  const handleFollow = async () => {
    if (!id || followLoading) return;

    setFollowLoading(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${API_BASE_URL}/follow/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`팔로우 실패 (${response.status})`);
      }

      setIsFollowing(true);

      setStylist((prev) =>
        prev
          ? {
              ...prev,
              followerCount: (prev.followerCount ?? 0) + 1,
            }
          : prev,
      );
    } catch (error) {
      console.error("팔로우 실패:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  // 언팔로우 실행
  const handleUnfollow = async () => {
    if (!id || followLoading) return;

    setFollowLoading(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`${API_BASE_URL}/follow/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`언팔로우 실패 (${response.status})`);
      }

      setIsFollowing(false);
      setUnfollowModalVisible(false);

      setStylist((prev) =>
        prev
          ? {
              ...prev,
              followerCount: Math.max(0, (prev.followerCount ?? 0) - 1),
            }
          : prev,
      );
    } catch (error) {
      console.error("언팔로우 실패:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    loadStylistDetail();
    loadPortfolios();
    loadFollowStatus();
  }, [loadStylistDetail, loadPortfolios, loadFollowStatus]);

  // 스타일리스트 프로필 공유
  const handleShare = async () => {
    const nickname = stylist?.nickname || "스타일리스트";
    const title = `${nickname} 스타일리스트`;

    try {
      if (Platform.OS === "web") {
        const url = window.location.href;

        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title, text: title, url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          window.alert("프로필 링크가 복사되었어요.");
        } else {
          window.alert(url);
        }
        return;
      }

      await Share.share({ message: `${title}의 프로필을 확인해 보세요.` });
    } catch (error) {
      // 사용자가 공유를 취소한 경우도 여기로 오므로 조용히 무시
      console.log("공유 취소 또는 실패:", error);
    }
  };

  const goToPortfolio = () => {
    router.push({
      pathname: "/stylist/[id]/portfolio",
      params: { id: String(id) },
    });
  };

  const [inquiryLoading, setInquiryLoading] = useState(false);

  const showMessage = (message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(message);
    } else {
      Alert.alert("알림", message);
    }
  };

  // 문의하기: 문의 채팅방을 만들거나(이미 있으면 기존 방) 열기
  const handleInquiry = async () => {
    if (inquiryLoading || !id) return;

    try {
      setInquiryLoading(true);
      const token = await getAccessToken();

      if (!token) {
        router.replace("/");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/chat/inquiry/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.message || `문의 채팅방을 열지 못했어요 (${response.status})`,
        );
      }

      const roomPk = await response.json();

      router.push({
        pathname: "/chat/[roomPk]",
        params: {
          roomPk: String(roomPk),
          name: stylist?.nickname || "스타일리스트",
          stylistPk: String(id),
          readOnly: "false",
        },
      } as any);
    } catch (error) {
      console.error("문의하기 오류:", error);
      showMessage(
        error instanceof Error ? error.message : "문의 채팅방을 열지 못했어요.",
      );
    } finally {
      setInquiryLoading(false);
    }
  };

  const goToPayment = () => {
    if (!selectedServiceData || !stylist) return;

    const selectedPlan = stylist.plans.find(
      (plan) => plan.planCode === selectedService,
    );

    if (!selectedPlan) return;

    router.push({
      pathname: "/stylist/[id]/payment",
      params: {
        id: String(id),
        planPk: String(selectedPlan.planPk),
      },
    });
  };

  if (detailLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#8275E8" />
        <Text style={{ marginTop: 12, fontSize: 12, color: "#888888" }}>
          스타일리스트 정보를 불러오는 중입니다.
        </Text>
      </SafeAreaView>
    );
  }

  if (detailError || !stylist) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <StatusBar barStyle="dark-content" />

        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Ionicons name="alert-circle-outline" size={38} color="#999999" />

          <Text
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "#777481",
              textAlign: "center",
            }}
          >
            {detailError || "스타일리스트 정보를 찾을 수 없습니다."}
          </Text>

          <Pressable
            onPress={loadStylistDetail}
            style={{
              marginTop: 16,
              paddingHorizontal: 18,
              paddingVertical: 10,
              backgroundColor: "#F1EEFC",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#51458C", fontSize: 12 }}>다시 시도</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const services: Service[] = (stylist.plans ?? []).map((plan, index) => ({
    name: plan.planTier || plan.planCode || `PLAN ${index + 1}`,
    description: plan.description || "스타일링 서비스",
    price: typeof plan.price === "number" ? plan.price : 0,
    color: SERVICE_COLORS[index % SERVICE_COLORS.length],
  }));

  const selectedServiceData =
    services.find(
      (service, index) =>
        (stylist.plans[index]?.planCode || service.name) === selectedService,
    ) || services[0];

  const visiblePortfolios = portfolios.slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={[]}>
      <StatusBar barStyle="dark-content" />

      {/* 뒤로 가기 (대표 이미지 위에 겹쳐서 표시) */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 12,
          zIndex: 10,
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.75)",
        }}
      >
        <Ionicons name="chevron-back" size={24} color="#292633" />
      </Pressable>

      {/* 공유 버튼 (대표 이미지 위, 오른쪽 위) */}
      <Pressable
        onPress={handleShare}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="프로필 공유"
        style={{
          position: "absolute",
          top: insets.top + 8,
          right: 12,
          zIndex: 10,
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.75)",
        }}
      >
        <Ionicons name="share-social-outline" size={20} color="#292633" />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* 프로필 이미지 */}
        {stylist.profilePic ? (
          <Image
            source={{ uri: stylist.profilePic }}
            style={{
              width: "100%",
              height: 210 + insets.top,
              backgroundColor: "#E2E2E2",
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 210 + insets.top,
              backgroundColor: "#E2E2E2",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" size={65} color="#B7B3C0" />
          </View>
        )}

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {/* 이름 */}
          {/* 이름 + 팔로우 버튼 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#292633",
                }}
              >
                {stylist.nickname}
              </Text>

              <Ionicons name="checkmark-circle" size={19} color="#3D91A8" />
            </View>

            <Pressable
              disabled={followLoading}
              onPress={() => {
                if (isFollowing) {
                  setUnfollowModalVisible(true);
                } else {
                  handleFollow();
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 88,
                height: 34,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: isFollowing ? "#F1EEFC" : "#51458C",
              }}
            >
              {followLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? "#51458C" : "#FFFFFF"}
                />
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: isFollowing ? "#51458C" : "#FFFFFF",
                    }}
                  >
                    {isFollowing ? "팔로잉" : "팔로우"}
                  </Text>

                  {isFollowing && (
                    <Ionicons
                      name="chevron-down"
                      size={13}
                      color="#51458C"
                      style={{ marginLeft: 3 }}
                    />
                  )}
                </>
              )}
            </Pressable>
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
            {(stylist.styleTypes ?? []).map((style) => (
              <View
                key={style.typePk}
                style={{
                  backgroundColor: "#F0F0F0",
                  borderRadius: 14,
                  paddingHorizontal: 11,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontSize: 11, color: "#666666" }}>
                  #{style.styleName}
                </Text>
              </View>
            ))}
          </View>

          {/* 평점 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 10,
            }}
          >
            <Ionicons name="star" size={17} color="#F5A623" />

            <Text style={{ fontSize: 15, fontWeight: "700", color: "#292633" }}>
              {(stylist.rating ?? 0).toFixed(1)}
            </Text>
          </View>

          {/* 활동 정보 */}
          <View
            style={{
              flexDirection: "row",
              gap: 18,
              marginTop: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: "#898692" }}>
              게시물 {stylist.postCount ?? 0}
            </Text>

            <Text style={{ fontSize: 12, color: "#898692" }}>
              팔로워 {stylist.followerCount ?? 0}
            </Text>
          </View>

          {/* 위치 */}
          {stylist.locationName ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 9,
              }}
            >
              <Ionicons name="location-outline" size={14} color="#898692" />
              <Text style={{ fontSize: 12, color: "#898692" }}>
                {stylist.locationName}
              </Text>
            </View>
          ) : null}

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

          <Text
            style={{ fontSize: 12, lineHeight: 19, color: "#66636E" }}
            numberOfLines={introExpanded ? undefined : 4}
          >
            {stylist.introduction || "등록된 자기소개가 없습니다."}
          </Text>

          {(stylist.introduction ?? "").length > 90 && (
            <Pressable
              onPress={() => setIntroExpanded((current) => !current)}
              hitSlop={8}
              style={{ alignSelf: "flex-end", marginTop: 4 }}
            >
              <Text style={{ fontSize: 11, color: "#898692" }}>
                {introExpanded ? "접기" : "더보기"}
              </Text>
            </Pressable>
          )}

          <View
            style={{
              height: 1,
              backgroundColor: "#E7E5EC",
              marginVertical: 16,
            }}
          />

          {/* 포트폴리오 */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
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
            <View style={{ flexDirection: "row", gap: 8 }}>
              {visiblePortfolios.map((post) => (
                <Pressable
                  key={post.postPk}
                  style={{
                    flex: 1,
                    height: 76,
                    borderRadius: 4,
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

          {/* 서비스 선택 */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#292633",
              marginTop: 22,
              marginBottom: 10,
            }}
          >
            서비스 등급
          </Text>

          {services.length === 0 ? (
            <Text style={{ fontSize: 12, color: "#888888", marginBottom: 12 }}>
              등록된 서비스가 없습니다.
            </Text>
          ) : (
            services.map((service, index) => {
              const planCode = stylist.plans[index]?.planCode || service.name;
              const isSelected = selectedService === planCode;

              return (
                <Pressable
                  key={stylist.plans[index]?.planPk ?? planCode}
                  onPress={() => setSelectedService(planCode)}
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
            })
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
          onPress={handleInquiry}
          disabled={inquiryLoading}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 8,
            backgroundColor: "#F2F2F2",
            alignItems: "center",
            justifyContent: "center",
            opacity: inquiryLoading ? 0.6 : 1,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#333333" }}>
            {inquiryLoading ? "여는 중..." : "문의하기"}
          </Text>
        </Pressable>

        <Pressable
          onPress={goToPayment}
          disabled={!selectedServiceData}
          style={{
            flex: 1.5,
            height: 44,
            borderRadius: 8,
            backgroundColor: selectedServiceData ? "#51458C" : "#BDB9CA",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
            서비스 신청하기
          </Text>
        </Pressable>
      </View>
      {/* 언팔로우 확인 모달 */}
      <Modal
        visible={unfollowModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUnfollowModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 35,
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              padding: 22,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#292633",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {stylist.nickname}님을 언팔로우할까요?
            </Text>

            <Pressable
              disabled={followLoading}
              onPress={handleUnfollow}
              style={{
                width: "100%",
                height: 42,
                borderRadius: 8,
                backgroundColor: "#51458C",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 9,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                언팔로우
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setUnfollowModalVisible(false)}
              style={{
                width: "100%",
                height: 42,
                borderRadius: 8,
                backgroundColor: "#F1EEFC",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#51458C",
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                취소
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
