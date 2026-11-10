import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.0.5:8080";
const TOSS_CLIENT_KEY = "test_ck_c19w7vBoxDeUvpgeSDlJHtMJUy9H7c7XDl";
const PURPLE = "#51458C";

// GET /order/{orderPk}/upgrade-plans 응답 DTO
// stylistPlanPk는 업그레이드 결제 생성 API에 전달해야 하는 PK입니다.
type PlanDto = {
  stylistPlanPk: number;
  planPk: number;
  planTier: string;
  planCode: string;
  description?: string;
  price: number;
  upgradeAmount: number;
};

async function getAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    }
    return await SecureStore.getItemAsync("accessToken");
  } catch {
    return null;
  }
}

function won(value: number | string | undefined | null) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `₩${number.toLocaleString("ko-KR")}`;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function UpgradePaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderPk?: string;
    currentPlanTier?: string;
    currentPrice?: string;
    stylistName?: string;
    roomPk?: string;
  }>();

  const orderPk = firstParam(params.orderPk);
  const currentPlanTier = firstParam(params.currentPlanTier);
  const currentPrice = firstParam(params.currentPrice);
  const stylistName = firstParam(params.stylistName);
  const roomPk = firstParam(params.roomPk);

  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [selectedPlanPk, setSelectedPlanPk] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 서버가 현재 주문 기준으로 상위 플랜만 반환하므로 별도 등급 판별은 하지 않습니다.
  const selectedPlan =
    plans.find(
      (plan) => Number(plan.stylistPlanPk) === Number(selectedPlanPk),
    ) ?? null;

  const loadPlans = useCallback(async () => {
    if (!orderPk) {
      setErrorMessage("주문 정보가 없습니다. 채팅방에서 다시 진입해주세요.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");

      // 현재 주문 기준으로 업그레이드 가능한 상위 플랜만 백엔드에서 조회합니다.
      const response = await fetch(
        `${API_BASE_URL}/order/${orderPk}/upgrade-plans`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          errorPayload?.message ||
            `업그레이드 가능 플랜 조회 실패 (${response.status})`,
        );
      }

      const payload = await response.json();
      const responseData = payload?.data ?? payload?.result ?? payload;
      const nextPlans: PlanDto[] = Array.isArray(responseData)
        ? responseData
        : [];

      setPlans(nextPlans);
      setSelectedPlanPk(
        nextPlans.length > 0 ? Number(nextPlans[0].stylistPlanPk) : null,
      );

      if (nextPlans.length === 0) {
        setErrorMessage(
          "현재 주문에서 업그레이드할 수 있는 상위 플랜이 없습니다.",
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "플랜 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [orderPk]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleUpgradePayment = async () => {
    if (!selectedPlan || !orderPk || paying) return;

    if (Platform.OS !== "web") {
      Alert.alert(
        "결제 안내",
        "현재 토스 결제는 웹 환경에서만 지원돼요. 웹에서 진행해 주세요.",
      );
      return;
    }

    try {
      setPaying(true);
      const token = await getAccessToken();
      if (!token) throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");

      // 업그레이드 금액과 주문번호는 서버에서 계산·발급합니다.
      const response = await fetch(`${API_BASE_URL}/order/${orderPk}/upgrade`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stylistPlanPk: Number(selectedPlan.stylistPlanPk),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.message || `업그레이드 주문 생성 실패 (${response.status})`,
        );
      }

      const order = payload?.data ?? payload?.result ?? payload;
      const orderId = String(order?.orderId ?? "");
      const amount = Number(order?.amount);
      const orderName = String(
        order?.orderName || `${currentPlanTier} → ${selectedPlan.planTier}`,
      );

      if (!orderId || !Number.isFinite(amount) || amount <= 0) {
        console.error("업그레이드 주문 응답 확인 필요:", payload);
        throw new Error(
          "서버에서 업그레이드 주문번호 또는 결제 금액을 받지 못했습니다.",
        );
      }

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({
        customerKey: `styLink_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      });

      const query = new URLSearchParams({
        orderPk: String(orderPk),
        roomPk: String(roomPk || ""),
        stylistName: String(stylistName || "스타일리스트"),
        serviceName: orderName,
      }).toString();

      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/chat/upgrade-payment-success?${query}`;
      const failUrl = `${baseUrl}/chat/upgrade-payment-success?${query}&fail=true`;

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName,
        successUrl,
        failUrl,
      });
    } catch (error) {
      console.error("플랜 업그레이드 결제 오류:", error);
      Alert.alert(
        "업그레이드 결제 실패",
        error instanceof Error ? error.message : "결제창을 열지 못했습니다.",
      );
    } finally {
      setPaying(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={styles.back}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
      >
        <Ionicons name="chevron-back" size={24} color="#222222" />
      </Pressable>

      <Text style={styles.headerTitle}>플랜 업그레이드</Text>
      <View style={styles.back} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.stateText}>
            업그레이드 플랜을 불러오는 중이에요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 불러오기 실패 또는 업그레이드할 상위 플랜 없음
  if (plans.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.center}>
          <View style={styles.emptyCircle}>
            <Ionicons name="arrow-up-outline" size={30} color="#9A9A9A" />
          </View>
          <Text style={styles.emptyTitle}>업그레이드할 수 없어요</Text>
          <Text style={styles.stateText}>
            {errorMessage || "업그레이드할 수 있는 상위 플랜이 없습니다."}
          </Text>

          <View style={styles.emptyActions}>
            <Pressable style={styles.outlineButton} onPress={loadPlans}>
              <Text style={styles.outlineButtonText}>다시 시도</Text>
            </Pressable>
            <Pressable
              style={styles.solidSmallButton}
              onPress={() => router.back()}
            >
              <Text style={styles.solidSmallButtonText}>채팅방으로</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const extraAmount = selectedPlan ? Number(selectedPlan.upgradeAmount) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          {stylistName || "스타일리스트"}님과 진행 중인 서비스 플랜을 더 높은
          플랜으로 바꿀 수 있어요.
        </Text>

        {/* 현재 플랜 */}
        <View style={styles.currentCard}>
          <View>
            <Text style={styles.cardLabel}>현재 이용 중인 플랜</Text>
            <Text style={styles.currentName}>{currentPlanTier || "-"}</Text>
          </View>

          {!!currentPrice && (
            <Text style={styles.currentPrice}>{won(currentPrice)}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>업그레이드할 플랜 선택</Text>

        {plans.map((plan) => {
          const selected =
            Number(selectedPlanPk) === Number(plan.stylistPlanPk);

          return (
            <Pressable
              key={plan.stylistPlanPk}
              onPress={() => setSelectedPlanPk(Number(plan.stylistPlanPk))}
              style={[styles.planCard, selected && styles.planCardSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Ionicons
                name={selected ? "radio-button-on" : "radio-button-off"}
                size={21}
                color={selected ? PURPLE : "#8A8A8A"}
              />

              <View style={styles.planInfo}>
                <View style={styles.planTop}>
                  <Text style={styles.planName}>{plan.planTier}</Text>
                  <Text style={styles.planPrice}>{won(plan.price)}</Text>
                </View>

                {!!plan.description && (
                  <Text style={styles.planDescription}>{plan.description}</Text>
                )}

                <View style={styles.extraBadge}>
                  <Text style={styles.extraBadgeText}>
                    +{won(plan.upgradeAmount)} 추가 결제
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* 결제 금액 요약 */}
        {selectedPlan && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>선택한 플랜 가격</Text>
              <Text style={styles.summaryValue}>{won(selectedPlan.price)}</Text>
            </View>

            {!!currentPrice && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>이미 결제한 금액</Text>
                <Text style={styles.summaryValue}>-{won(currentPrice)}</Text>
              </View>
            )}

            <View style={styles.summaryLine} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>추가 결제 금액</Text>
              <Text style={styles.totalValue}>{won(extraAmount)}</Text>
            </View>
          </View>
        )}

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            기존에 결제한 금액은 차감되고, 차액만 결제돼요.
          </Text>
          <Text style={styles.noticeText}>
            업그레이드는 서비스가 진행 중일 때만 가능해요.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleUpgradePayment}
          disabled={!selectedPlan || paying}
          style={[
            styles.payButton,
            (!selectedPlan || paying) && styles.payButtonDisabled,
          ]}
        >
          {paying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              {selectedPlan
                ? `${won(extraAmount)} 결제하고 업그레이드`
                : "플랜을 선택해 주세요"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },

  back: { width: 24 },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 28,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#777777",
    marginBottom: 18,
  },

  currentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F3FA",
    borderWidth: 1,
    borderColor: "#A9A2C9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 26,
  },

  cardLabel: { fontSize: 11, color: "#777777" },

  currentName: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
  },

  currentPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444444",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 12,
  },

  planCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  planCardSelected: {
    borderWidth: 1.5,
    borderColor: PURPLE,
    backgroundColor: "#F5F3FA",
  },

  planInfo: { flex: 1 },

  planTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  planName: { fontSize: 15, fontWeight: "800", color: "#222222" },

  planPrice: { fontSize: 14, fontWeight: "700", color: "#222222" },

  planDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: "#777777",
  },

  extraBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: "#E4E1EA",
    borderWidth: 1,
    borderColor: "#BDB8C9",
  },

  extraBadgeText: { fontSize: 11, fontWeight: "700", color: PURPLE },

  summaryCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F4F4F4",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 5,
  },

  summaryLabel: { fontSize: 12, color: "#777777" },

  summaryValue: { fontSize: 12, fontWeight: "600", color: "#333333" },

  summaryLine: {
    height: 1,
    backgroundColor: "#DDDDDD",
    marginVertical: 8,
  },

  totalLabel: { fontSize: 13, fontWeight: "700", color: "#222222" },

  totalValue: { fontSize: 18, fontWeight: "800", color: PURPLE },

  notice: { marginTop: 16, gap: 4 },

  noticeText: { fontSize: 11, lineHeight: 17, color: "#999999" },

  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    backgroundColor: "#FFFFFF",
  },

  payButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },

  payButtonDisabled: { opacity: 0.45 },

  payButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  stateText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: "#888888",
    textAlign: "center",
  },

  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  emptyActions: { flexDirection: "row", gap: 8, marginTop: 22 },

  outlineButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },

  outlineButtonText: { fontSize: 14, fontWeight: "700", color: "#222222" },

  solidSmallButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },

  solidSmallButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
