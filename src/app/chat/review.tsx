import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.219.107:8080";
const PURPLE = "#51458C";

// 서버 한도(255자)에 맞춘 입력 규칙
const MIN_CONTENT_LENGTH = 10;
const MAX_CONTENT_LENGTH = 255;

const RATING_LABELS: Record<number, string> = {
  1: "매우 불만족",
  2: "불만족",
  3: "보통",
  4: "만족",
  5: "매우 만족",
};

function showMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { name, roomPk, orderPk, serviceName } = useLocalSearchParams<{
    name?: string;
    roomPk?: string;
    orderPk?: string;
    serviceName?: string;
  }>();

  const stylistName = name || "스타일리스트";
  const serviceTitle = serviceName || "스타일링 서비스";

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const getAccessToken = async () => {
    if (Platform.OS === "web") {
      return localStorage.getItem("accessToken");
    }

    return await SecureStore.getItemAsync("accessToken");
  };

  const handleAttachPhoto = () => {
    showMessage("사진 첨부", "사진 첨부 기능은 준비 중이에요.");
  };

  const handleSubmitReview = async () => {
    if (!orderPk) {
      showMessage(
        "주문 정보 오류",
        "주문번호를 찾을 수 없습니다. 이전 화면에서 다시 접근해 주세요.",
      );
      return;
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length < MIN_CONTENT_LENGTH) {
      showMessage(
        "입력 오류",
        `후기 내용을 ${MIN_CONTENT_LENGTH}자 이상 작성해 주세요.`,
      );
      return;
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      showMessage(
        "입력 오류",
        `후기는 ${MAX_CONTENT_LENGTH}자 이내로 작성해 주세요.`,
      );
      return;
    }

    try {
      setLoading(true);

      const accessToken = await getAccessToken();

      if (!accessToken) {
        showMessage("로그인 필요", "로그인 후 후기를 작성해 주세요.");
        router.replace("/");
        return;
      }

      const formData = new FormData();

      formData.append(
        "request",
        new Blob(
          [
            JSON.stringify({
              rate: rating,
              content: trimmedContent,
            }),
          ],
          { type: "application/json" },
        ),
      );

      const response = await fetch(`${API_BASE_URL}/review/${orderPk}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const responseData = await response.json().catch(() => null);

      console.log("===== 리뷰 API 확인 =====");
      console.log("orderPk:", orderPk);
      console.log("응답 상태:", response.status);
      console.log("응답 내용:", responseData);
      console.log("===== 확인 완료 =====");

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          showMessage(
            "인증 오류",
            "로그인이 만료되었습니다. 다시 로그인해 주세요.",
          );
          router.replace("/");
          return;
        }

        if (response.status === 400) {
          showMessage(
            "후기 작성 실패",
            responseData?.message ||
              "이미 후기를 작성했거나 후기 작성이 가능한 주문이 아닙니다.",
          );
          return;
        }

        showMessage(
          "오류",
          responseData?.message || "후기 작성에 실패했습니다.",
        );
        return;
      }

      console.log("리뷰 등록 성공! 페이지 이동 시도");

      router.replace({
        pathname: "/chat/review-success",
        params: {
          name: String(name || "스타일리스트"),
          roomPk: String(roomPk || ""),
          orderPk: String(orderPk || ""),
        },
      });
    } catch (error) {
      console.error("리뷰 등록 오류:", error);

      showMessage(
        "네트워크 오류",
        "서버와 연결할 수 없습니다. 서버 실행 상태를 확인해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => setRating(star)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${star}점`}
          >
            <Text style={[styles.star, star <= rating && styles.activeStar]}>
              ★
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: 52 + insets.top },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="chevron-back" size={26} color="#222222" />
        </Pressable>

        <Text style={styles.headerTitle}>후기 작성</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 스타일리스트 정보 카드 */}
        <View style={styles.stylistCard}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={36} color="#BDBDBD" />
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.stylistName}>{stylistName}</Text>
              <Text style={styles.stylistLabel}>스타일리스트</Text>
            </View>

            <Text style={styles.serviceName}>{serviceTitle}</Text>

            <Text style={styles.serviceTags}>
              개인 스타일 분석 · 코디 추천 · 상품 추천
            </Text>
          </View>
        </View>

        {/* 서비스 만족도 */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>서비스 만족도 *</Text>

          {renderStars()}

          <Text style={styles.ratingText}>
            {rating}점 · {RATING_LABELS[rating]}
          </Text>
        </View>

        {/* 후기 내용 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>후기 내용 *</Text>

          <View style={styles.reviewBox}>
            <TextInput
              style={styles.reviewInput}
              placeholder={"스타일링 경험에 대한 솔직한 후기를\n작성해주세요."}
              placeholderTextColor="#AAAAAA"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={MAX_CONTENT_LENGTH}
              textAlignVertical="top"
            />

            <View style={styles.reviewMetaRow}>
              <Text style={styles.reviewMetaText}>
                최소 {MIN_CONTENT_LENGTH}자 이상
              </Text>
              <Text style={styles.reviewMetaText}>
                {content.length} / {MAX_CONTENT_LENGTH}
              </Text>
            </View>
          </View>
        </View>

        {/* 사진 첨부 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사진 첨부 (선택)</Text>
          <Text style={styles.photoGuide}>
            스타일링 결과 사진을 첨부하면 다른 사용자에게 도움이 됩니다.
          </Text>

          <View style={styles.photoRow}>
            <Pressable
              style={styles.photoAddTile}
              onPress={handleAttachPhoto}
              accessibilityRole="button"
              accessibilityLabel="사진 추가"
            >
              <Ionicons name="add" size={26} color="#999999" />
            </Pressable>

            {[1, 2, 3].map((slot) => (
              <View key={slot} style={styles.photoTile}>
                <Text style={styles.photoTileText}>이미지</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: Math.max(insets.bottom, 12) + 4 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            (loading || pressed) && styles.disabledButton,
          ]}
          onPress={handleSubmitReview}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "등록 중..." : "후기 등록하기"}
          </Text>
        </Pressable>

        <Text style={styles.bottomHint}>
          등록 후 수정/삭제 정책은 마이페이지에서 확인할 수 있어요.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  backButton: {
    width: 32,
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
  },

  headerRight: {
    width: 32,
  },

  stylistCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },

  profileImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  stylistName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  stylistLabel: {
    marginLeft: 4,
    fontSize: 10,
    color: "#666666",
  },

  serviceName: {
    marginTop: 6,
    fontSize: 13,
    color: "#333333",
  },

  serviceTags: {
    marginTop: 4,
    fontSize: 10,
    color: "#888888",
  },

  ratingSection: {
    alignItems: "center",
    marginTop: 26,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },

  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },

  star: {
    fontSize: 38,
    color: "#333333",
  },

  activeStar: {
    color: "#F5C542",
  },

  ratingText: {
    fontSize: 11,
    color: "#777777",
    marginTop: 8,
  },

  section: {
    marginTop: 26,
  },

  reviewBox: {
    marginTop: 10,
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  reviewInput: {
    flex: 1,
    minHeight: 100,
    padding: 0,
    fontSize: 13,
    lineHeight: 19,
    color: "#222222",
  },

  reviewMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  reviewMetaText: {
    fontSize: 10,
    color: "#999999",
  },

  photoGuide: {
    marginTop: 6,
    fontSize: 10,
    color: "#999999",
  },

  photoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  photoAddTile: {
    width: 74,
    height: 74,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  photoTile: {
    width: 74,
    height: 74,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  photoTileText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#888888",
  },

  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
  },

  submitButton: {
    height: 54,
    backgroundColor: PURPLE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  bottomHint: {
    marginTop: 8,
    fontSize: 10,
    color: "#999999",
    textAlign: "center",
  },
});
