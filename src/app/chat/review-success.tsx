import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";

const PURPLE = "#51458C";

export default function ReviewCompleteScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    name?: string;
    stylistName?: string;
    serviceName?: string;
    roomPk?: string;
    stylistPk?: string;
  }>();

  const stylistName = String(
    params.stylistName || params.name || "스타일리스트",
  );

  const serviceName = String(params.serviceName || "BASIC 스타일링 서비스");

  const goToStylistProfile = () => {
    if (params.stylistPk) {
      router.push(`/stylist/${params.stylistPk}` as any);
    } else {
      router.back();
    }
  };

  const goToMain = () => {
    router.replace("/(tabs)" as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>리뷰 등록 완료</Text>
          <View style={styles.headerDivider} />
        </View>

        <View style={styles.successArea}>
          <Ionicons name="cloud-upload-outline" size={68} color="#000000" />

          <Text style={styles.successTitle}>리뷰가 등록되었습니다!</Text>

          <Text style={styles.successDescription}>
            소중한 리뷰를 남겨주셔서 감사합니다.
            {"\n"}더 좋은 스타일링 경험을 위해 노력하겠습니다.
          </Text>
        </View>

        <View style={styles.stylistCard}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={38} color="#BDBDBD" />
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.stylistName}>{stylistName}</Text>
              <Text style={styles.stylistLabel}>스타일리스트</Text>
            </View>

            <Text style={styles.serviceName}>{serviceName}</Text>

            <Text style={styles.serviceTags}>
              개인 스타일 분석 · 코디 추천 · 상품 추천
            </Text>
          </View>

          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#F5B82E" />
            <Text style={styles.ratingText}>4.8 (152)</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <Pressable style={styles.primaryButton} onPress={goToStylistProfile}>
          <Text style={styles.primaryButtonText}>스타일리스트 프로필 보기</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={goToMain}>
          <Text style={styles.secondaryButtonText}>메인으로 이동</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },

  header: {
    paddingTop: 14,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
  },

  headerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E5E5",
    marginTop: 16,
  },

  successArea: {
    alignItems: "center",
    paddingTop: 62,
    paddingBottom: 34,
  },

  successTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
  },

  successDescription: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    color: "#888888",
  },

  stylistCard: {
    minHeight: 98,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F2FA",
    borderWidth: 1,
    borderColor: "#E0DCEB",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 14,
  },

  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 10,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  stylistName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },

  stylistLabel: {
    marginLeft: 3,
    fontSize: 9,
    color: "#666666",
  },

  serviceName: {
    marginTop: 5,
    fontSize: 12,
    color: "#333333",
  },

  serviceTags: {
    marginTop: 3,
    fontSize: 9,
    color: "#888888",
  },

  rating: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
  },

  ratingText: {
    marginLeft: 3,
    fontSize: 9,
    color: "#555555",
  },

  bottomButtons: {
    paddingHorizontal: 15,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 8,
    backgroundColor: "#FFFFFF",
  },

  primaryButton: {
    height: 43,
    borderRadius: 9,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  secondaryButton: {
    height: 43,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: "#222222",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },
});
