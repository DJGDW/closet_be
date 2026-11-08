
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from "react-native-webview";
import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";

const API_BASE_URL = "https://verbose-goggles-vpgr5446g7472pr5v-8080.app.github.dev";
const TOSS_CLIENT_KEY = "test_ck_c19w7vBoxDeUvpgeSDlJHtMJUy9H7c7XDl";
const PURPLE = "#51458C";

const PAYMENT_METHODS = [
  { id: "card", label: "신용카드", detail: "카드 결제" },
  { id: "kakao", label: "카카오페이", detail: "" },
  { id: "naver", label: "네이버페이", detail: "" },
  { id: "transfer", label: "무통장입금", detail: "" },
];

type PlanDto = {
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

const sectionTitle = {
  fontSize: 14,
  fontWeight: "800" as const,
  color: "#292633",
};

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

  const paymentHandledRef = useRef(false);
  const externalLaunchUrlRef = useRef<string | null>(null);

  const [stylist, setStylist] =
    useState<StylistDetailResponse | null>(null);
  const [selectedService, setSelectedService] =
    useState<PlanDto | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState("");

  const loadPaymentInfo = useCallback(async (): Promise<void> => {
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
    void loadPaymentInfo();
  }, [loadPaymentInfo]);

  const closePaymentWebView = (): void => {
    setPaymentHtml("");
    setPaying(false);
  };

  // intent:// 주소를 실제 앱 딥링크로 변환하고 실행
  const openExternalApp = async (url: string): Promise<void> => {
    if (!url) return;

    if (externalLaunchUrlRef.current === url) {
      console.log("이미 실행을 요청한 외부 앱 주소:", url);
      return;
    }

    externalLaunchUrlRef.current = url;

    try {
      let targetUrl = url;
      let fallbackUrl: string | null = null;

      if (url.startsWith("intent://")) {
        const intentData = url.split("#Intent;")[1] ?? "";

        const scheme = intentData.match(/scheme=([^;]+)/)?.[1];
        const fallbackMatch = intentData.match(
          /S\.browser_fallback_url=([^;]+)/,
        );

        if (fallbackMatch?.[1]) {
          try {
            fallbackUrl = decodeURIComponent(fallbackMatch[1]);
          } catch {
            fallbackUrl = fallbackMatch[1];
          }
        }

        if (!scheme) {
          throw new Error("외부 앱 실행에 필요한 scheme 정보가 없습니다.");
        }

        targetUrl = url
          .replace(/^intent:\/\//, `${scheme}://`)
          .split("#Intent;")[0];

        console.log("변환된 외부 앱 주소:", targetUrl);
      }

      try {
        await Linking.openURL(targetUrl);
        console.log("외부 앱 실행 요청 성공:", targetUrl);
        return;
      } catch (error) {
        console.error("외부 앱 딥링크 실행 실패:", error);

        if (fallbackUrl) {
          await Linking.openURL(fallbackUrl);
          return;
        }

        throw error;
      }
    } catch (error) {
      console.error("외부 앱 실행 오류:", error);

      externalLaunchUrlRef.current = null;

      Alert.alert(
        "앱 실행 실패",
        "카카오톡 앱이 설치되어 있는지 확인해 주세요. 앱이 설치되어 있다면 카카오톡을 최신 버전으로 업데이트한 뒤 다시 시도해 주세요.",
      );
    }
  };

  // 백엔드 결제 승인
  const confirmTossPayment = async (
    paymentKey: string,
    orderId: string,
    amount: number,
  ): Promise<void> => {
    const token = await getAccessToken();

    if (!token) {
      throw new Error("로그인이 필요합니다.");
    }

    const response = await fetch(
      `${API_BASE_URL}/order/payment/confirm`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message || `결제 승인 실패 (${response.status})`,
      );
    }

    setPaymentHtml("");
    setPaying(false);

    router.replace({
      pathname: "/stylist/[id]/payment-success",
      params: {
        id: String(id),
        planPk: String(planPk),
      },
    });
  };

  // 결제 성공 및 실패 주소 처리
  // stylinkapp://payment-success 형식에서는 payment-success가 hostname에 들어간다.
  const handleWebViewNavigation = (url: string): boolean => {
    if (!url) return true;

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      console.log("URL 파싱 실패:", url);
      return true;
    }

    const path = parsedUrl.pathname.replace(/\/+$/, "");
    const host = parsedUrl.hostname;

    const isSuccess =
      path.endsWith("/payment-success") ||
      host === "payment-success";

    const isFail =
      path.endsWith("/payment-fail") ||
      host === "payment-fail";

    if (!isSuccess && !isFail) {
      return true;
    }

    console.log("결제 리다이렉트 감지:", {
      url,
      host,
      path,
      isSuccess,
      isFail,
    });

    if (paymentHandledRef.current) {
      console.log("이미 처리한 결제 리다이렉트:", url);
      return false;
    }

    paymentHandledRef.current = true;

    if (isFail) {
      const message =
        parsedUrl.searchParams.get("message") ||
        "결제가 취소되었거나 실패했습니다.";

      closePaymentWebView();
      Alert.alert("결제 실패", message);
      return false;
    }

    const paymentKey = parsedUrl.searchParams.get("paymentKey");
    const orderId = parsedUrl.searchParams.get("orderId");
    const amount = Number(parsedUrl.searchParams.get("amount"));

    if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
      console.error("결제 성공 URL 파라미터 오류:", {
        paymentKey,
        orderId,
        amount,
        url,
      });

      closePaymentWebView();
      Alert.alert(
        "결제 오류",
        "결제 결과 정보가 올바르지 않습니다. 결제 내역을 확인해 주세요.",
      );
      return false;
    }

    console.log("결제 성공 정보 확인:", {
      orderId,
      amount,
      paymentKeyReceived: Boolean(paymentKey),
    });

    void confirmTossPayment(paymentKey, orderId, amount).catch((error) => {
      console.error("결제 승인 오류:", error);

      closePaymentWebView();

      Alert.alert(
        "결제 승인 실패",
        error instanceof Error
          ? error.message
          : "결제 승인에 실패했습니다.",
      );
    });

    return false;
  };

  const handlePayment = async (): Promise<void> => {
    if (!agreed || paying) return;

    if (paymentMethod !== "card") {
      Alert.alert(
        "결제 수단 안내",
        "현재 테스트 결제는 신용카드만 지원합니다. 신용카드를 선택해 주세요.",
      );
      return;
    }

    const price = Number(selectedService?.price) || 0;

    if (!price || price <= 0) {
      Alert.alert("결제 금액 오류", "결제 금액을 확인해 주세요.");
      return;
    }

    try {
      setPaying(true);
      paymentHandledRef.current = false;
      externalLaunchUrlRef.current = null;

      const token = await getAccessToken();

      if (!token) {
        throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
      }

      // 1. 주문 생성
      const orderResponse = await fetch(`${API_BASE_URL}/order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stylistPlanPk: Number(planPk),
        }),
      });

      const orderResult = await orderResponse.json().catch(() => null);

      if (!orderResponse.ok) {
        throw new Error(
          orderResult?.message ||
            `주문 생성 실패 (${orderResponse.status})`,
        );
      }

      const order =
        orderResult?.data ?? orderResult?.result ?? orderResult;

      const orderId = String(order?.orderId ?? "");
      const amount = Number(order?.amount);

      const orderName = String(
        order?.orderName ||
          `${stylist!.nickname} ${selectedService!.planTier} 스타일링 서비스`,
      );

      if (!orderId || !Number.isFinite(amount) || amount <= 0) {
        console.error("주문 응답 확인 필요:", orderResult);
        throw new Error("서버에서 주문 정보를 올바르게 받지 못했습니다.");
      }

      // 2. 결제 성공 및 실패 리다이렉트 주소
      const successUrl = Linking.createURL("payment-success");
      const failUrl = Linking.createURL("payment-fail");

      console.log("토스 successUrl:", successUrl);
      console.log("토스 failUrl:", failUrl);

      const safeOrderId = JSON.stringify(orderId);
      const safeOrderName = JSON.stringify(orderName);
      const safeClientKey = JSON.stringify(TOSS_CLIENT_KEY);
      const safeCustomerKey = JSON.stringify(
        `styLink_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      );
      const safeSuccessUrl = JSON.stringify(successUrl);
      const safeFailUrl = JSON.stringify(failUrl);

      // 3. 토스 JavaScript SDK HTML
      const html = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>StyLink 결제</title>
          <script src="https://js.tosspayments.com/v2/standard"></script>
          <style>
            body {
              font-family: sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              color: #51458C;
            }
          </style>
        </head>
        <body>
          <p>토스 결제창을 준비하고 있습니다.</p>

          <script>
            async function startPayment() {
              try {
                if (typeof TossPayments !== "function") {
                  throw new Error("토스 결제 SDK를 불러오지 못했습니다.");
                }

                const tossPayments = TossPayments(${safeClientKey});

                const payment = tossPayments.payment({
                  customerKey: ${safeCustomerKey}
                });

                await payment.requestPayment({
                  method: "CARD",
                  amount: {
                    currency: "KRW",
                    value: ${amount}
                  },
                  orderId: ${safeOrderId},
                  orderName: ${safeOrderName},
                  successUrl: ${safeSuccessUrl},
                  failUrl: ${safeFailUrl}
                });
              } catch (error) {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({
                    type: "ERROR",
                    message: error.message || "결제창 실행에 실패했습니다."
                  })
                );
              }
            }

            startPayment();
          </script>
        </body>
        </html>
      `;

      setPaymentHtml(html);
    } catch (error) {
      console.error("토스 결제 실행 오류:", error);

      setPaying(false);

      Alert.alert(
        "결제 실행 실패",
        error instanceof Error
          ? error.message
          : "결제창을 열지 못했습니다.",
      );
    }
  };

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
            onPress={() => void loadPaymentInfo()}
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
            <Text style={{ fontSize: 12, color: "#55515D" }}>
              서비스 가격
            </Text>

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
          onPress={() => void handlePayment()}
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

      {/* WebView 결제창 */}
      {paymentHtml !== "" && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            backgroundColor: "#FFFFFF",
          }}
        >
          <View
            style={{
              height: 48,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#EEEEF1",
            }}
          >
            <Pressable onPress={closePaymentWebView} hitSlop={10}>
              <Ionicons name="close" size={25} color="#292633" />
            </Pressable>

            <Text
              style={{
                marginLeft: 16,
                fontSize: 15,
                fontWeight: "700",
                color: "#292633",
              }}
            >
              토스 결제
            </Text>
          </View>

          <WebView
            source={{ html: paymentHtml }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={["*"]}
            setSupportMultipleWindows={true}
            onMessage={(event: WebViewMessageEvent): void => {
              try {
                const data = JSON.parse(event.nativeEvent.data);

                if (data.type === "ERROR") {
                  closePaymentWebView();

                  Alert.alert(
                    "결제 실행 실패",
                    data.message || "결제창을 열지 못했습니다.",
                  );
                }
              } catch (error) {
                console.error("WebView 메시지 오류:", error);
              }
            }}
            onShouldStartLoadWithRequest={(
              request: WebViewNavigation,
            ): boolean => {
              const url = request.url;

              console.log("WebView 이동 요청:", url);

              // 결제 성공/실패 주소를 가장 먼저 처리
              if (
                url.includes("payment-success") ||
                url.includes("payment-fail")
              ) {
                return handleWebViewNavigation(url);
              }

              // 외부 앱 실행 주소
              if (
                url.startsWith("intent://") ||
                url.startsWith("kakaotalk://") ||
                url.startsWith("kakaopay://") ||
                url.startsWith("market://") ||
                url.startsWith("tel:") ||
                url.startsWith("mailto:")
              ) {
                void openExternalApp(url);
                return false;
              }

              return true;
            }}
            onOpenWindow={(event): void => {
              const url = event.nativeEvent.targetUrl;

              console.log("WebView 새 창 요청:", url);

              if (url) {
                // 새 창 요청에도 성공/실패 주소가 올 수 있으므로 먼저 검사
                if (
                  url.includes("payment-success") ||
                  url.includes("payment-fail")
                ) {
                  handleWebViewNavigation(url);
                  return;
                }

                void openExternalApp(url);
              }
            }}
            onError={(event): void => {
              const nativeEvent = event.nativeEvent;
              const errorUrl = nativeEvent.url ?? "";

              // 결제 성공/실패 딥링크는 WebView 오류가 나더라도
              // 앱 내부 결제 결과 처리 함수로 전달한다.
              if (
                errorUrl.includes("payment-success") ||
                errorUrl.includes("payment-fail")
              ) {
                console.log(
                  "WebView 오류에서 결제 리다이렉트 감지:",
                  errorUrl,
                );

                handleWebViewNavigation(errorUrl);
                return;
              }

              // 외부 앱 스킴 오류는 앱 실행 함수로 전달
              if (nativeEvent.code === -10) {
                console.log("외부 앱 스킴 오류 감지:", errorUrl);

                if (
                  errorUrl.startsWith("intent://") ||
                  errorUrl.startsWith("kakaotalk://") ||
                  errorUrl.startsWith("kakaopay://") ||
                  errorUrl.startsWith("market://")
                ) {
                  void openExternalApp(errorUrl);
                }

                return;
              }

              console.error("결제 WebView 오류:", nativeEvent);

              closePaymentWebView();

              Alert.alert(
                "오류",
                "결제 페이지를 불러오지 못했습니다.",
              );
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
