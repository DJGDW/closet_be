import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";

const PURPLE = "#6246a1";
const API_BASE_URL = "http://192.168.219.107:8080";

export default function PaymentSuccessScreen() {
  const router = useRouter();

  const {
    id,
    stylistName,
    serviceName,
    paymentMethod,
    paymentKey,
    orderId,
    amount,
  } = useLocalSearchParams<{
    id?: string;
    stylistName?: string;
    serviceName?: string;
    paymentMethod?: string;
    paymentKey?: string;
    orderId?: string;
    amount?: string;
  }>();

  const [confirming, setConfirming] = useState(false);
  const formattedPrice = Number(amount || 0).toLocaleString("ko-KR");

  return (
    <View style={styles.container}>
      {/* 완료 아이콘 */}
      <View style={styles.iconContainer}>
        <Text style={styles.checkIcon}>✓</Text>
      </View>

      {/* 결제 완료 안내 */}
      <Text style={styles.title}>결제가 완료되었습니다!</Text>

      <Text style={styles.description}>
        스타일링 서비스 결제가 정상적으로 완료되었어요.
        {"\n"}
        이제 스타일리스트와 상담을 시작해 보세요.
      </Text>

      {/* 결제 정보 */}
      <View style={styles.paymentInfo}>
        <Text style={styles.sectionTitle}>결제 정보</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>스타일리스트</Text>
          <Text style={styles.infoValue}>{stylistName || "스타일리스트"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>서비스</Text>
          <Text style={styles.infoValue}>
            {serviceName || "스타일링 서비스"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>결제 수단</Text>
          <Text style={styles.infoValue}>
            {paymentMethod || "선택한 결제 수단"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.totalLabel}>총 결제 금액</Text>
          <Text style={styles.totalPrice}>₩{formattedPrice}</Text>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.chatButton}
          onPress={async () => {
            if (confirming) return;

            if (!paymentKey || !orderId || !amount) {
              Alert.alert(
                "결제 정보 오류",
                "토스 결제 승인 정보가 전달되지 않았습니다. 결제 내역을 확인해 주세요.",
              );
              console.error("토스 리다이렉트 파라미터 누락:", {
                paymentKey: Boolean(paymentKey),
                orderId,
                amount,
              });
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
                `${API_BASE_URL}/order/payment/confirm`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    paymentKey: String(paymentKey),
                    orderId: String(orderId),
                    amount: Number(amount),
                  }),
                },
              );

              const result = await response.json().catch(() => null);
              if (!response.ok) {
                throw new Error(
                  result?.message || `결제 승인 실패 (${response.status})`,
                );
              }

              const data = result?.data ?? result?.result ?? result;
              if (!data?.roomPk || !data?.orderPk) {
                console.error("결제 승인 응답:", result);
                throw new Error(
                  "결제 승인 후 주문 채팅방 정보를 받지 못했습니다.",
                );
              }

              router.replace({
                pathname: "/chat/[roomPk]",
                params: {
                  roomPk: String(data.roomPk),
                  orderPk: String(data.orderPk),
                  name: String(stylistName || "스타일리스트"),
                  serviceName: String(serviceName || "스타일링 서비스"),
                },
              } as any);
            } catch (error) {
              console.error("결제 승인/채팅 연결 오류:", error);
              Alert.alert(
                "처리 실패",
                error instanceof Error
                  ? error.message
                  : "결제 승인 처리 중 오류가 발생했습니다.",
              );
            } finally {
              setConfirming(false);
            }
          }}
        >
          <Text style={styles.chatButtonText}>
            {confirming ? "결제 승인 처리 중..." : "스타일리스트와 채팅하기"}
          </Text>
        </Pressable>
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

  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  checkIcon: {
    fontSize: 48,
    color: PURPLE,
    fontWeight: "bold",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  paymentInfo: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 20,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  infoLabel: {
    fontSize: 14,
    color: "#777777",
  },

  infoValue: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222222",
  },

  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: PURPLE,
  },

  buttonContainer: {
    width: "100%",
  },

  chatButton: {
    height: 52,
    borderRadius: 9,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  chatButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  homeButton: {
    height: 52,
    borderRadius: 9,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  homeButtonText: {
    fontSize: 15,
    color: "#555555",
    fontWeight: "600",
  },
});
