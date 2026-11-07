import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PURPLE = "#51458C";

export default function StylingCompleteScreen() {
  const router = useRouter();

  const {
    name,
    stylistName: stylistNameParam,
    roomPk,
    orderPk,
    serviceName: serviceNameParam,
    useDate,
    method,
  } = useLocalSearchParams<{
    name?: string;
    stylistName?: string;
    roomPk?: string;
    orderPk?: string;
    serviceName?: string;
    useDate?: string;
    method?: string;
  }>();

  const stylistName = stylistNameParam || name || "스타일리스트";
  const serviceName = serviceNameParam || "BASIC 스타일링 서비스";
  const usedDate =
    useDate || new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  const serviceMethod = method || "채팅 상담";

  const handleLater = () => router.replace("/chat");

  const handleReview = () => {
    if (!orderPk) {
      Alert.alert(
        "주문 정보 오류",
        "주문번호를 찾을 수 없습니다. 이전 화면에서 다시 접근해 주세요.",
      );
      return;
    }

    router.push({
      pathname: "/chat/review",
      params: {
        name: stylistName,
        roomPk: String(roomPk || ""),
        orderPk: String(orderPk),
        serviceName,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/chat")} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#222222" />
        </Pressable>

        <Text style={styles.headerTitle}>스타일링 완료</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={38} color={PURPLE} />
        </View>

        <Text style={styles.title}>스타일링이 완료되었습니다!</Text>
        <Text style={styles.subtitle}>서비스는 만족스러우셨나요?</Text>
        <Text style={styles.subtitle}>스타일리스트에게 후기를 남겨주세요.</Text>

        <View style={styles.profileCard}>
          <Text style={styles.cardLabel}>함께한 스타일리스트</Text>

          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color="#888888" />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.stylistName}>{stylistName}</Text>
                <Text style={styles.role}>스타일리스트</Text>
              </View>

              <Text style={styles.rating}>
                <Text style={{ color: "#F2B72C" }}>★</Text> 4.8 (152)
              </Text>

              <View style={styles.tags}>
                <Text style={styles.tag}>미니멀</Text>
                <Text style={styles.tag}>캐주얼</Text>
                <Text style={styles.tag}>데일리룩</Text>
              </View>
            </View>
          </View>

          <View style={styles.line} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>이용한 서비스</Text>
            <Text style={styles.infoValue}>{serviceName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>이용일</Text>
            <Text style={styles.infoValue}>{usedDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>진행 방식</Text>
            <Text style={styles.infoValue}>{serviceMethod}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            여러분의 후기는 다른 사용자에게 큰 도움이 됩니다.
          </Text>
          <Text style={styles.noticeText}>
            서비스 경험을 자유롭게 남겨주세요.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleReview}>
          <Text style={styles.primaryText}>후기 작성하기</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleLater}>
          <Text style={styles.secondaryText}>나중에 작성하기</Text>
        </Pressable>

        <Text style={styles.bottomHint}>
          스타일리스트 프로필을 확인하려면 카드를 눌러주세요.
        </Text>
      </ScrollView>
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
    paddingTop: 26,
    paddingBottom: 36,
    alignItems: "center",
  },

  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#A9A2C9",
    backgroundColor: "#F7F5FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 12,
    color: "#777777",
    lineHeight: 18,
  },

  profileCard: {
    width: "100%",
    backgroundColor: "#F5F3FA",
    borderColor: "#A9A2C9",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 14,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },

  stylistName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  role: {
    fontSize: 10,
    color: "#666666",
  },

  rating: {
    fontSize: 12,
    color: "#444444",
    marginTop: 4,
  },

  tags: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },

  tag: {
    fontSize: 10,
    color: "#555555",
    backgroundColor: "#E4E1EA",
    borderWidth: 1,
    borderColor: "#BDB8C9",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
  },

  line: {
    height: 1,
    backgroundColor: "#D7D3E1",
    marginVertical: 12,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  infoLabel: {
    fontSize: 11,
    color: "#777777",
  },

  infoValue: {
    fontSize: 11,
    color: "#333333",
    fontWeight: "700",
  },

  notice: {
    width: "100%",
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 14,
    marginBottom: 18,
  },

  noticeTitle: {
    fontSize: 11,
    color: "#555555",
    fontWeight: "600",
    marginBottom: 4,
  },

  noticeText: {
    fontSize: 10,
    color: "#777777",
  },

  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  secondaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  secondaryText: {
    color: "#222222",
    fontWeight: "700",
    fontSize: 15,
  },

  bottomHint: {
    fontSize: 9,
    color: "#AAAAAA",
    marginTop: 24,
    textAlign: "center",
  },
});
