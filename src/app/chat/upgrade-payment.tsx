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
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.219.107:8080";
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

export default function UpgradePaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderPk?: string;
    currentPlanTier?: string;
    currentPrice?: string;
    stylistName?: string;
    roomPk?: string;
  }>();

  const orderPk = Array.isArray(params.orderPk)
    ? params.orderPk[0]
    : params.orderPk;
  const currentPlanTier = Array.isArray(params.currentPlanTier)
    ? params.currentPlanTier[0]
    : params.currentPlanTier;
  const stylistName = Array.isArray(params.stylistName)
    ? params.stylistName[0]
    : params.stylistName;
  const roomPk = Array.isArray(params.roomPk)
    ? params.roomPk[0]
    : params.roomPk;

  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [selectedPlanPk, setSelectedPlanPk] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 서버가 현재 주문 기준으로 상위 플랜만 반환하므로 별도 등급 판별은 하지 않습니다.
  const availablePlans = plans;

  const selectedPlan =
    availablePlans.find(
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

      console.log("업그레이드 가능 플랜 조회 응답:", payload);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={styles.loadingText}>
          업그레이드 플랜을 불러오는 중입니다.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>
        <Text style={styles.headerTitle}>플랜 업그레이드</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          {stylistName || "스타일리스트"}님의 서비스 플랜을 변경합니다.
        </Text>

        <View style={styles.currentPlan}>
          <Text style={styles.smallLabel}>현재 이용 중인 플랜</Text>
          <Text style={styles.currentPlanName}>{currentPlanTier}</Text>
        </View>

        <Text style={styles.sectionTitle}>업그레이드할 플랜 선택</Text>

        {availablePlans.map((plan) => {
          const selected =
            Number(selectedPlanPk) === Number(plan.stylistPlanPk);
          return (
            <Pressable
              key={plan.stylistPlanPk}
              onPress={() => setSelectedPlanPk(Number(plan.stylistPlanPk))}
              style={[styles.planCard, selected && styles.selectedPlanCard]}
            >
              <View style={styles.radio}>
                {selected && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{plan.planTier}</Text>
                {!!plan.description && (
                  <Text style={styles.planDescription}>{plan.description}</Text>
                )}
                <Text style={styles.planPrice}>
                  추가 결제 금액 ₩
                  {Number(plan.upgradeAmount).toLocaleString("ko-KR")}
                </Text>
              </View>
              {selected && (
                <Ionicons name="checkmark-circle" size={20} color={PURPLE} />
              )}
            </Pressable>
          );
        })}

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <Text style={styles.notice}>
          실제 결제 차액은 서버에서 계산합니다. 기존 플랜 가격을 다시 결제하지
          않습니다.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleUpgradePayment}
          disabled={!selectedPlan || paying}
          style={[
            styles.payButton,
            (!selectedPlan || paying) && styles.disabledButton,
          ]}
        >
          <Text style={styles.payButtonText}>
            {paying ? "결제창을 여는 중..." : "선택한 플랜으로 업그레이드"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  loadingText: { marginTop: 12, fontSize: 12, color: "#888888" },
  header: {
    height: 52,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEF1",
  },
  headerTitle: { fontSize: 17, fontWeight: "800" as const, color: "#292633" },
  content: { padding: 18, paddingBottom: 24 },
  subtitle: { fontSize: 13, color: "#777481", marginBottom: 18 },
  currentPlan: {
    backgroundColor: "#F6F6F7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  smallLabel: { fontSize: 11, color: "#888888" },
  currentPlanName: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: "#292633",
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: "#292633",
    marginBottom: 12,
  },
  planCard: {
    borderWidth: 1,
    borderColor: "#E1DEE7",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 10,
  },
  selectedPlanCard: {
    borderWidth: 2,
    borderColor: PURPLE,
    backgroundColor: "#FAF9FF",
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: PURPLE,
    marginRight: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: PURPLE },
  planName: { fontSize: 14, fontWeight: "800" as const, color: "#292633" },
  planDescription: { fontSize: 11, color: "#777481", marginTop: 5 },
  planPrice: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: PURPLE,
    marginTop: 7,
  },
  errorText: { color: "#D14343", fontSize: 12, marginTop: 10 },
  notice: { color: "#888888", fontSize: 11, lineHeight: 17, marginTop: 16 },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEF1",
  },
  payButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  disabledButton: { opacity: 0.45 },
  payButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" as const },
};
