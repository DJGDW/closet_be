import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.219.107:8080";
const PURPLE = "#51458C";

type Status = "confirming" | "done" | "error" | "failed";

export default function UpgradePaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderPk?: string;
    roomPk?: string;
    stylistName?: string;
    serviceName?: string;
    paymentKey?: string;
    orderId?: string;
    amount?: string;
    fail?: string;
    code?: string;
    message?: string;
  }>();

  // 토스 결제가 취소/실패해서 돌아온 경우
  const isFailed = params.fail === "true" || Boolean(params.code);

  const [status, setStatus] = useState<Status>(
    isFailed ? "failed" : "confirming",
  );
  const [errorMessage, setErrorMessage] = useState("");
  // 결제 승인 API가 두 번 호출되지 않도록 막는 용도
  const startedRef = useRef(false);

  const formattedAmount = Number(params.amount || 0).toLocaleString("ko-KR");
  const stylistName = String(params.stylistName || "스타일리스트");

  const returnToChat = () => {
    router.replace({
      pathname: "/chat/[roomPk]",
      params: {
        roomPk: String(params.roomPk || ""),
        name: stylistName,
      },
    } as any);
  };

  // 결제 승인 → 서버에서 플랜 변경
  const confirmUpgrade = useCallback(async () => {
    if (!params.paymentKey || !params.orderId || !params.amount) {
      setErrorMessage(
        "토스 결제 승인 정보가 전달되지 않았어요. 결제 내역을 확인해 주세요.",
      );
      setStatus("error");
      return;
    }

    try {
      setStatus("confirming");
      setErrorMessage("");

      const token =
        Platform.OS === "web"
          ? localStorage.getItem("accessToken")
          : await SecureStore.getItemAsync("accessToken");

      if (!token) {
        router.replace("/");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/order/upgrade/payment/confirm`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey: String(params.paymentKey),
            orderId: String(params.orderId),
            amount: Number(params.amount),
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.message || `업그레이드 승인 실패 (${response.status})`,
        );
      }

      setStatus("done");
    } catch (error) {
      console.error("업그레이드 결제 승인 오류:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "업그레이드 승인을 처리하지 못했어요.",
      );
      setStatus("error");
    }
  }, [params.paymentKey, params.orderId, params.amount, router]);

  // 결제 완료 후 돌아오면 자동으로 승인 처리
  useEffect(() => {
    if (isFailed || startedRef.current) return;
    startedRef.current = true;
    confirmUpgrade();
  }, [isFailed, confirmUpgrade]);

  const isDone = status === "done";
  const isProblem = status === "failed" || status === "error";

  const title =
    status === "confirming"
      ? "업그레이드를 처리하고 있어요"
      : isDone
        ? "플랜 업그레이드가 완료되었습니다!"
        : status === "failed"
          ? "결제가 완료되지 않았어요"
          : "업그레이드 처리에 실패했어요";

  const description =
    status === "confirming"
      ? "잠시만 기다려 주세요."
      : isDone
        ? "변경된 플랜으로 스타일링이 계속 진행돼요."
        : status === "failed"
          ? String(params.message || "결제가 취소되었거나 실패했어요.")
          : errorMessage;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.back} />
        <Text style={styles.headerTitle}>플랜 업그레이드</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.body}>
        <View style={[styles.circle, isProblem && styles.circleProblem]}>
          {status === "confirming" ? (
            <ActivityIndicator size="large" color={PURPLE} />
          ) : isDone ? (
            <Ionicons name="checkmark" size={38} color={PURPLE} />
          ) : (
            <Ionicons name="alert" size={36} color="#D14343" />
          )}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {!isProblem && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>스타일리스트</Text>
              <Text style={styles.infoValue}>{stylistName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>변경 플랜</Text>
              <Text style={styles.infoValue}>
                {params.serviceName || "상위 플랜"}
              </Text>
            </View>

            <View style={styles.line} />

            <View style={styles.infoRow}>
              <Text style={styles.totalLabel}>추가 결제 금액</Text>
              <Text style={styles.totalValue}>₩{formattedAmount}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {status === "error" && (
          <Pressable style={styles.outlineButton} onPress={confirmUpgrade}>
            <Text style={styles.outlineText}>다시 시도</Text>
          </Pressable>
        )}

        {status !== "confirming" && (
          <Pressable style={styles.primaryButton} onPress={returnToChat}>
            <Text style={styles.primaryText}>채팅방으로 돌아가기</Text>
          </Pressable>
        )}
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

  headerTitle: { fontSize: 16, fontWeight: "700", color: "#222222" },

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  circle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "#A9A2C9",
    backgroundColor: "#F7F5FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  circleProblem: {
    borderColor: "#F0B9B9",
    backgroundColor: "#FDECEC",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222222",
    textAlign: "center",
  },

  description: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: "#777777",
    textAlign: "center",
  },

  infoCard: {
    width: "100%",
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F3FA",
    borderWidth: 1,
    borderColor: "#A9A2C9",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
  },

  infoLabel: { fontSize: 12, color: "#777777" },

  infoValue: {
    maxWidth: "65%",
    fontSize: 12,
    fontWeight: "700",
    color: "#333333",
    textAlign: "right",
  },

  line: { height: 1, backgroundColor: "#D7D3E1", marginVertical: 8 },

  totalLabel: { fontSize: 13, fontWeight: "700", color: "#222222" },

  totalValue: { fontSize: 18, fontWeight: "800", color: PURPLE },

  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 8,
  },

  primaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  outlineButton: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },

  outlineText: { color: "#222222", fontSize: 15, fontWeight: "700" },
});
