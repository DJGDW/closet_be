import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "https://verbose-goggles-vpgr5446g7472pr5v-8080.app.github.dev";

export default function ReviewScreen() {
  const router = useRouter();

  const { name, roomPk, orderPk } = useLocalSearchParams<{
    name?: string;
    roomPk?: string;
    orderPk?: string;
  }>();

  const stylistName = name || "스타일리스트";

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const getAccessToken = async () => {
    if (Platform.OS === "web") {
      return localStorage.getItem("accessToken");
    }

    return await SecureStore.getItemAsync("accessToken");
  };

  const handleSubmitReview = async () => {
    if (!orderPk) {
      Alert.alert(
        "주문 정보 오류",
        "주문번호를 찾을 수 없습니다. 이전 화면에서 다시 접근해 주세요.",
      );
      return;
    }

    if (content.trim().length > 255) {
      Alert.alert("입력 오류", "리뷰는 255자 이내로 작성해 주세요.");
      return;
    }

    try {
      setLoading(true);

      const accessToken = await getAccessToken();

      if (!accessToken) {
        Alert.alert("로그인 필요", "로그인 후 리뷰를 작성해 주세요.");
        router.replace("./index");
        return;
      }

      const formData = new FormData();

      formData.append(
        "request",
        new Blob(
          [
            JSON.stringify({
              rate: rating,
              content: content.trim(),
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
          Alert.alert(
            "인증 오류",
            "로그인이 만료되었습니다. 다시 로그인해 주세요.",
          );
          router.replace("./index");
          return;
        }

        if (response.status === 400) {
          Alert.alert(
            "리뷰 작성 실패",
            responseData?.message ||
              "이미 리뷰를 작성했거나 리뷰 작성이 가능한 주문이 아닙니다.",
          );
          return;
        }

        Alert.alert(
          "오류",
          responseData?.message || "리뷰 작성에 실패했습니다.",
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

      Alert.alert(
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
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
          >
            <Text style={[styles.star, star <= rating && styles.activeStar]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>리뷰 작성</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImage}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>

          <Text style={styles.stylistName}>{stylistName} 스타일리스트</Text>

          <Text style={styles.reviewGuide}>
            서비스는 어떠셨나요? 솔직한 리뷰를 남겨주세요.
          </Text>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>서비스 만족도</Text>

          {renderStars()}

          <Text style={styles.ratingText}>
            {rating === 5
              ? "최고였어요!"
              : rating === 4
                ? "만족스러웠어요"
                : rating === 3
                  ? "보통이었어요"
                  : rating === 2
                    ? "아쉬웠어요"
                    : "별로였어요"}
          </Text>
        </View>

        <View style={styles.reviewSection}>
          <View style={styles.reviewTitleRow}>
            <Text style={styles.sectionTitle}>리뷰 내용</Text>
            <Text style={styles.characterCount}>{content.length}/255</Text>
          </View>

          <TextInput
            style={styles.reviewInput}
            placeholder={
              "스타일리스트 서비스에 대한 경험을 자유롭게 작성해 주세요.\n(선택사항)"
            }
            placeholderTextColor="#999999"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={255}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            작성한 리뷰는 다른 사용자에게 공개됩니다.
          </Text>
          <Text style={styles.noticeText}>
            리뷰는 등록 후 수정하거나 삭제할 수 없습니다.
          </Text>
          <Text style={styles.noticeText}>
            욕설 및 비방 표현은 제한될 수 있습니다.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmitReview}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "등록 중..." : "리뷰 등록하기"}
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 20,
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  backButton: {
    width: 32,
    justifyContent: "center",
  },

  backText: {
    fontSize: 32,
    color: "#222222",
    lineHeight: 36,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
  },

  headerRight: {
    width: 32,
  },

  profileSection: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 30,
  },

  profileImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  profileEmoji: {
    fontSize: 34,
  },

  stylistName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
  },

  reviewGuide: {
    fontSize: 13,
    color: "#888888",
  },

  ratingSection: {
    alignItems: "center",
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    marginHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
  },

  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    gap: 8,
  },

  star: {
    fontSize: 40,
    color: "#DDDDDD",
  },

  activeStar: {
    color: "#FFD54F",
  },

  ratingText: {
    fontSize: 14,
    color: "#777777",
    marginTop: 12,
  },

  reviewSection: {
    marginHorizontal: 20,
    marginTop: 28,
  },

  reviewTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  characterCount: {
    fontSize: 12,
    color: "#999999",
  },

  reviewInput: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: "#222222",
    backgroundColor: "#FAFAFA",
  },

  noticeContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },

  noticeText: {
    fontSize: 12,
    color: "#999999",
    lineHeight: 20,
  },

  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  submitButton: {
    height: 54,
    backgroundColor: "#222222",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
