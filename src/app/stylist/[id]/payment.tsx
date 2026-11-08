import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.219.107:8080";
const TOSS_CLIENT_KEY = "test_ck_c19w7vBoxDeUvpgeSDlJHtMJUy9H7c7XDl";
const PURPLE = "#51458C";

const PAYMENT_METHODS = [
  { id: "card", label: "신용카드", detail: "카드 결제" },
  { id: "kakao", label: "카카오페이", detail: "" },
  { id: "naver", label: "네이버페이", detail: "" },
  { id: "transfer", label: "무통장입금", detail: "" },
];

type PlanDto = {
  // 스타일리스트별 플랜 PK (주문 생성 API에 필요). planPk는 공통 플랜 종류 PK라 주문에 쓰면 안 됨
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
  styleTypes: unknown[];
  plans: PlanDto[];
  postCount: number;
  followerCount: number;
};

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

export default function PaymentScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id: string | string[];
    planPk: string | string[];
  }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const planPk = Array.isArray(params.planPk)
    ? params.planPk[0]
    : params.planPk;

  const [stylist, setStylist] = useState<StylistDetailResponse | null>(null);

  const [selectedService, setSelectedService] = useState<PlanDto | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [paying, setPaying] = useState(false);

  // 실제 스타일리스트 및 서비스 정보 조회
  const loadPaymentInfo = useCallback(async () => {
    if (!id || !planPk) {
      setErrorMessage("결제할 서비스 정보를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

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

      if (response.status === 401 || response.status === 403) {
        throw new Error("로그인 인증이 만료되었어요. 다시 로그인해주세요.");
      }

      if (!response.ok) {
        throw new Error(`스타일리스트 정보 조회 실패 (${response.status})`);
      }

      const result = await response.json();

      const detail: StylistDetailResponse =
        result.data ?? result.result ?? result;

      const plan = (detail.plans ?? []).find(
        (item) => String(item.planPk) === String(planPk),
      );

      if (!plan) {
        throw new Error("선택한 서비스 정보를 찾을 수 없습니다.");
      }

      setStylist(detail);
      setSelectedService(plan);
    } catch (error) {
      console.error("결제 정보 조회 오류:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "결제 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, planPk]);

  useEffect(() => {
    loadPaymentInfo();
  }, [loadPaymentInfo]);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
        }}
        edges={["top"]}
      >
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={{ marginTop: 12, fontSize: 12, color: "#888888" }}>
          결제 정보를 불러오는 중입니다.
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage || !stylist || !selectedService) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        edges={["top"]}
      >
        <StatusBar barStyle="dark-content" />

        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Ionicons name="alert-circle-outline" size={38} color="#999999" />

          <Text
            style={{
              textAlign: "center",
              marginTop: 12,
              color: "#777481",
              fontSize: 13,
            }}
          >
            {errorMessage || "결제할 서비스 정보를 찾을 수 없습니다."}
          </Text>

          <Pressable
            onPress={loadPaymentInfo}
            style={{
              marginTop: 16,
              paddingHorizontal: 18,
              paddingVertical: 10,
              backgroundColor: "#F1EEFC",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: PURPLE, fontSize: 12 }}>다시 시도</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const price = Number(selectedService.price) || 0;

  const handlePayment = async () => {
    if (!agreed || paying) return;

    if (paymentMethod !== "card") {
      Alert.alert(
        "결제 수단 안내",
        "현재 테스트 결제는 신용카드만 지원합니다. 신용카드를 선택해 주세요.",
      );
      return;
    }

    if (!price || price <= 0) {
      Alert.alert(
        "결제 금액 오류",
        "서비스 결제 금액이 0원입니다. 플랜 정보를 확인해 주세요.",
      );
      return;
    }

    try {
      setPaying(true);
      const token = await getAccessToken();
      if (!token) throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");

      // 주문은 '스타일리스트별 플랜 PK(stylistPlanPk)'로 만들어야 해당 스타일리스트에게 결제됨
      const stylistPlanPk = Number(selectedService.stylistPlanPk);
      if (!Number.isFinite(stylistPlanPk) || stylistPlanPk <= 0) {
        throw new Error(
          "플랜 정보를 불러오지 못했어요. 앱을 새로고침하거나 백엔드를 최신으로 업데이트한 뒤 다시 시도해 주세요.",
        );
      }

      // 1) 백엔드에서 주문 생성
      const orderResponse = await fetch(`${API_BASE_URL}/order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stylistPlanPk }),
      });

      const orderResult = await orderResponse.json().catch(() => null);
      if (!orderResponse.ok) {
        throw new Error(
          orderResult?.message || `주문 생성 실패 (${orderResponse.status})`,
        );
      }

      const order = orderResult?.data ?? orderResult?.result ?? orderResult;
      const orderId = String(order?.orderId ?? "");
      const amount = Number(order?.amount);

      if (!orderId || !Number.isFinite(amount) || amount <= 0) {
        console.error("주문 응답 확인 필요:", orderResult);
        throw new Error(
          "서버에서 주문번호 또는 결제 금액을 올바르게 받지 못했습니다.",
        );
      }

      // 2) Toss 결제창 호출
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({
        customerKey: `styLink_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      });

      const successUrl = `${window.location.origin}/stylist/${id}/payment-success`;
      const failUrl = `${window.location.origin}/stylist/${id}/payment-success`;

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName: String(
          order?.orderName ||
            `${stylist.nickname} ${selectedService.planTier} 스타일링 서비스`,
        ),
        successUrl,
        failUrl,
      });
    } catch (error) {
      console.error("토스 결제 실행 오류:", error);
      Alert.alert(
        "결제 실행 실패",
        error instanceof Error ? error.message : "결제창을 열지 못했습니다.",
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* 상단 헤더 */}
      <View
        style={{
          height: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#EEEEF1",
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>

        <Text style={{ fontSize: 17, fontWeight: "800", color: "#292633" }}>
          결제
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 18,
        }}
      >
        {/* 서비스 정보 */}
        <Text style={sectionTitle}>서비스 정보</Text>

        <View
          style={{
            marginTop: 12,
            padding: 15,
            borderRadius: 12,
            backgroundColor: "#F6F6F7",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {stylist.profilePic ? (
            <Image
              source={{ uri: stylist.profilePic }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#E7E5EC",
                marginRight: 12,
              }}
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#E7E5EC",
                marginRight: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={27} color="#AAA6B2" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: "#292633",
                }}
              >
                {stylist.nickname}
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  color: "#777481",
                  marginLeft: 4,
                }}
              >
                스타일리스트
              </Text>

              <View style={{ flex: 1 }} />

              <Ionicons name="star" size={12} color="#F5B82E" />

              <Text
                style={{
                  fontSize: 11,
                  color: "#55515D",
                  marginLeft: 3,
                }}
              >
                {(stylist.rating ?? 0).toFixed(1)}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 12,
                color: "#292633",
                marginTop: 6,
                fontWeight: "500",
              }}
            >
              {selectedService.planTier} 스타일링 서비스
            </Text>

            <Text
              style={{
                fontSize: 10,
                color: "#777481",
                marginTop: 4,
                lineHeight: 15,
              }}
            >
              {selectedService.description}
            </Text>
          </View>
        </View>

        {/* 결제 금액 */}
        <Text style={[sectionTitle, { marginTop: 22 }]}>결제 금액</Text>

        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: "#F6F6F7",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: "#55515D" }}>서비스 가격</Text>

            <Text style={{ fontSize: 12, color: "#292633" }}>
              ₩{price.toLocaleString("ko-KR")}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#E4E2E8",
              marginVertical: 11,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#292633" }}>
              최종 결제 금액
            </Text>

            <Text style={{ fontSize: 15, fontWeight: "800", color: "#292633" }}>
              ₩{price.toLocaleString("ko-KR")}
            </Text>
          </View>
        </View>

        {/* 결제 수단 */}
        <Text style={[sectionTitle, { marginTop: 22 }]}>결제 수단</Text>

        <View style={{ marginTop: 12, gap: 8 }}>
          {PAYMENT_METHODS.map((method) => {
            const selected = paymentMethod === method.id;

            return (
              <Pressable
                key={method.id}
                onPress={() => setPaymentMethod(method.id)}
                style={{
                  minHeight: 50,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? PURPLE : "#DEDBE3",
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <View
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: 9,
                    borderWidth: selected ? 0 : 1,
                    borderColor: "#B8B5BE",
                    backgroundColor: selected ? PURPLE : "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  {selected && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  )}
                </View>

                <Text
                  style={{
                    fontSize: 12,
                    color: "#292633",
                    fontWeight: selected ? "600" : "400",
                  }}
                >
                  {method.label}
                </Text>

                <View style={{ flex: 1 }} />

                {method.id === "kakao" && (
                  <View
                    style={{
                      backgroundColor: "#FEEA91",
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#66551B" }}>
                      카카오페이
                    </Text>
                  </View>
                )}

                {method.id === "naver" && (
                  <View
                    style={{
                      backgroundColor: "#E4F4E8",
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#477A52" }}>
                      네이버페이
                    </Text>
                  </View>
                )}

                {method.detail !== "" && (
                  <Text style={{ fontSize: 10, color: "#777481" }}>
                    {method.detail}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 약관 동의 */}
        <Pressable
          onPress={() => setAgreed((current) => !current)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 18,
            gap: 7,
          }}
        >
          <Ionicons
            name={agreed ? "checkbox" : "square-outline"}
            size={15}
            color={agreed ? PURPLE : "#B8B5BE"}
          />

          <Text style={{ fontSize: 10, color: "#898692" }}>
            결제 진행 및 서비스 이용약관에 동의합니다.
          </Text>
        </Pressable>
      </ScrollView>

      {/* 하단 결제 영역 */}
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Pressable
          onPress={handlePayment}
          disabled={!agreed || paying}
          style={{
            height: 52,
            borderRadius: 9,
            backgroundColor: PURPLE,
            alignItems: "center",
            justifyContent: "center",
            opacity: agreed && !paying ? 1 : 0.75,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
            {paying
              ? "결제창을 여는 중..."
              : `₩${price.toLocaleString("ko-KR")} 결제하기`}
          </Text>
        </Pressable>

        <Text
          style={{
            fontSize: 9,
            color: "#96929E",
            textAlign: "center",
            marginTop: 8,
            marginBottom: 2,
          }}
        >
          안전한 결제를 위해 결제 정보는 암호화되어 처리됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const sectionTitle = {
  fontSize: 15,
  fontWeight: "800" as const,
  color: "#292633",
};
