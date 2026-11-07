import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.219.107:8080";
const PURPLE = "#6246A1";

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

  const [confirming, setConfirming] = useState(false);
  const isFailed = params.fail === "true" || Boolean(params.code);
  const formattedAmount = Number(params.amount || 0).toLocaleString("ko-KR");

  const returnToChat = () => {
    router.replace({
      pathname: "/chat/[roomPk]",
      params: {
        roomPk: String(params.roomPk || ""),
        name: String(params.stylistName || "스타일리스트"),
      },
    } as any);
  };

  const confirmUpgrade = async () => {
    if (confirming) return;

    if (!params.paymentKey || !params.orderId || !params.amount) {
      Alert.alert(
        "결제 정보 오류",
        "토스 결제 승인 정보가 전달되지 않았습니다. 결제 내역을 확인해 주세요.",
      );
      return;
    }

    try {
      setConfirming(true);
      const token =
        Platform.OS === "web"
          ? localStorage.getItem("accessToken")
          : await SecureStore.getItemAsync("accessToken");

      if (!token) {
        Alert.alert("로그인 필요", "다시 로그인해주세요.");
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

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          result?.message || `업그레이드 승인 실패 (${response.status})`,
        );
      }

      Alert.alert(
        "업그레이드 완료",
        "서비스 플랜이 성공적으로 변경되었습니다.",
      );
      returnToChat();
    } catch (error) {
      console.error("업그레이드 결제 승인 오류:", error);
      Alert.alert(
        "승인 처리 실패",
        error instanceof Error
          ? error.message
          : "업그레이드 승인을 처리하지 못했습니다.",
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, isFailed && styles.failedCircle]}>
        <Text style={[styles.icon, isFailed && styles.failedIcon]}>
          {isFailed ? "!" : "✓"}
        </Text>
      </View>

      <Text style={styles.title}>
        {isFailed
          ? "결제가 완료되지 않았습니다."
          : "업그레이드 결제가 완료되었습니다."}
      </Text>

      <Text style={styles.description}>
        {isFailed
          ? String(params.message || "결제가 취소되었거나 실패했습니다.")
          : "결제 승인 처리를 완료하면 서비스 플랜이 변경됩니다."}
      </Text>

      {!isFailed && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>스타일리스트</Text>
            <Text style={styles.value}>
              {params.stylistName || "스타일리스트"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>변경 플랜</Text>
            <Text style={styles.value}>
              {params.serviceName || "상위 플랜"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.totalLabel}>결제 금액</Text>
            <Text style={styles.amount}>₩{formattedAmount}</Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {!isFailed ? (
          <Pressable
            style={styles.primaryButton}
            onPress={confirmUpgrade}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>업그레이드 승인 완료하기</Text>
            )}
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={returnToChat}>
            <Text style={styles.primaryText}>채팅방으로 돌아가기</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  failedCircle: { backgroundColor: "#FDECEC" },
  icon: { fontSize: 46, fontWeight: "bold", color: PURPLE },
  failedIcon: { color: "#D14343" },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222222",
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: "#777777",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 26,
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#F8F8FA",
    borderRadius: 12,
    padding: 18,
    marginBottom: 28,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 7,
  },
  label: { fontSize: 12, color: "#777777" },
  value: {
    fontSize: 12,
    color: "#222222",
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
  },
  divider: { height: 1, backgroundColor: "#E5E5E8", marginVertical: 8 },
  totalLabel: { fontSize: 13, color: "#222222", fontWeight: "700" },
  amount: { fontSize: 18, color: PURPLE, fontWeight: "800" },
  actions: { width: "100%" },
  primaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
