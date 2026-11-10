import { router } from "expo-router";
import { File as ExpoFile } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import styles from "../styles/stylist-register.styles";

const API_BASE_URL = "http://192.168.0.5:8080";

// 등록 화면(stylist-register.tsx)과 같은 선택지
const LOCATIONS = [
  { id: 1, name: "서울특별시" },
  { id: 2, name: "경기도" },
  { id: 3, name: "인천광역시" },
  { id: 4, name: "부산광역시" },
  { id: 5, name: "대구광역시" },
  { id: 6, name: "광주광역시" },
  { id: 7, name: "대전광역시" },
  { id: 8, name: "울산광역시" },
  { id: 9, name: "세종특별자치시" },
  { id: 10, name: "강원특별자치도" },
  { id: 11, name: "충청북도" },
  { id: 12, name: "충청남도" },
  { id: 13, name: "전북특별자치도" },
  { id: 14, name: "전라남도" },
  { id: 15, name: "경상북도" },
  { id: 16, name: "경상남도" },
  { id: 17, name: "제주특별자치도" },
];

const STYLE_TYPES = [
  { id: 1, name: "캐주얼" },
  { id: 2, name: "스트릿" },
  { id: 3, name: "미니멀" },
  { id: 4, name: "댄디" },
  { id: 5, name: "포멀" },
  { id: 6, name: "아메카지" },
  { id: 7, name: "빈티지" },
  { id: 8, name: "고프코어" },
  { id: 9, name: "Y2K" },
  { id: 10, name: "페미닌" },
  { id: 11, name: "모던" },
  { id: 12, name: "스포츠/애슬레저" },
];

const PLANS = [
  {
    id: 1,
    name: "베이직",
    tagline: "기본 상담 중심",
    description: "가볍게 시작하는 스타일 상담",
    features: ["채팅 상담", "코디 제안 1세트", "간단한 스타일 피드백"],
  },
  {
    id: 2,
    name: "스탠다드",
    tagline: "상담과 추천을 함께",
    description: "더 자세한 스타일 상담",
    features: [
      "채팅 + 영상 통화 (30분)",
      "코디 제안 2~3세트",
      "추천 상품 링크 제공",
    ],
  },
  {
    id: 3,
    name: "프리미엄",
    tagline: "집중 케어",
    description: "맞춤형 스타일링 솔루션",
    features: [
      "동행 쇼핑 (시간 협의)",
      "퍼스널 스타일 컨설팅",
      "맞춤 코디 제안 및 쇼핑 가이드",
    ],
  },
];

const MAX_STYLE_SELECTION = 5;

// 새로 고른 프로필 이미지 (저장할 때 PATCH /user/update로 업로드)
type PickedImage = {
  uri: string;
  file?: File;
  name: string;
  mimeType: string;
};

type PlanPrice = {
  selected: boolean;
  price: string;
};

// GET /stylist/me 응답 (StylistDetailResponseDto)
type MyStylistResponse = {
  nickname?: string;
  profilePic?: string | null;
  introduction?: string | null;
  locationName?: string | null;
  styleTypes?: { typePk: number; styleName?: string }[];
  plans?: { planPk: number; price: number }[];
};

const EMPTY_PLANS: Record<number, PlanPrice> = {
  1: { selected: false, price: "" },
  2: { selected: false, price: "" },
  3: { selected: false, price: "" },
};

// 웹에서는 Alert가 동작하지 않아서 window.alert로 대체
function showMessage(title: string, message: string, onClose?: () => void) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    onClose?.();
  } else {
    Alert.alert(title, message, [{ text: "확인", onPress: onClose }]);
  }
}

async function getAccessToken() {
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

export default function StylistEditScreen() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [nickname, setNickname] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [introduction, setIntroduction] = useState("");
  const [locationPk, setLocationPk] = useState<number | null>(null);
  const [styleTypePks, setStyleTypePks] = useState<number[]>([]);
  const [planPrices, setPlanPrices] =
    useState<Record<number, PlanPrice>>(EMPTY_PLANS);

  // 내 스타일리스트 정보 불러오기
  const loadMyInfo = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const token = await getAccessToken();
      if (!token) {
        setLoadError("로그인이 필요합니다. 다시 로그인해 주세요.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/stylist/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`내 정보 조회 실패 (${response.status})`);
      }

      const result = await response.json();
      const data: MyStylistResponse = result?.data ?? result?.result ?? result;

      setNickname(data.nickname || "");
      setProfilePic(data.profilePic ?? null);
      setIntroduction(data.introduction || "");

      // 서버는 지역 "이름"만 내려주므로 이름으로 locationPk를 찾음
      const location = LOCATIONS.find(
        (item) => item.name === (data.locationName || "").trim(),
      );
      setLocationPk(location ? location.id : null);

      setStyleTypePks(
        (data.styleTypes ?? [])
          .map((item) => Number(item.typePk))
          .filter((id) => STYLE_TYPES.some((style) => style.id === id)),
      );

      const nextPlans: Record<number, PlanPrice> = {
        1: { selected: false, price: "" },
        2: { selected: false, price: "" },
        3: { selected: false, price: "" },
      };
      (data.plans ?? []).forEach((plan) => {
        const planId = Number(plan.planPk);
        if (nextPlans[planId]) {
          nextPlans[planId] = {
            selected: true,
            price: String(plan.price ?? ""),
          };
        }
      });
      setPlanPrices(nextPlans);
    } catch (error) {
      console.error("내 스타일리스트 정보 조회 오류:", error);
      setLoadError(
        error instanceof Error ? error.message : "내 정보를 불러오지 못했어요.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyInfo();
  }, [loadMyInfo]);

  function toggleStyle(styleId: number) {
    if (styleTypePks.includes(styleId)) {
      setStyleTypePks(styleTypePks.filter((id) => id !== styleId));
      return;
    }

    if (styleTypePks.length >= MAX_STYLE_SELECTION) {
      showMessage(
        "전문 스타일",
        `전문 스타일은 최대 ${MAX_STYLE_SELECTION}개까지 선택할 수 있어요.`,
      );
      return;
    }

    setStyleTypePks([...styleTypePks, styleId]);
  }

  function togglePlan(planId: number) {
    setPlanPrices((current) => ({
      ...current,
      [planId]: {
        ...current[planId],
        selected: !current[planId].selected,
      },
    }));
  }

  function updatePlanPrice(planId: number, price: string) {
    const digitsOnly = price.replace(/[^0-9]/g, "").slice(0, 9);
    setPlanPrices((current) => ({
      ...current,
      [planId]: { ...current[planId], price: digitsOnly },
    }));
  }

  // 프로필 이미지 선택 (저장 전까지는 화면에만 미리보기)
  async function pickProfileImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showMessage(
          "사진 접근 권한",
          "프로필 사진을 선택하려면 사진 접근 권한이 필요해요.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      setPickedImage({
        uri: asset.uri,
        file: (asset as any).file as File | undefined,
        name: asset.fileName || `profile-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
      });
    } catch (error) {
      console.error("프로필 사진 선택 오류:", error);
      showMessage("오류", "사진을 불러오지 못했어요.");
    }
  }

  // PATCH /user/update : 유저 프로필 사진 변경 (스타일리스트도 같은 API 사용)
  // request(JSON)는 필수 항목이 없어서 {} 만 보내면 됨
  async function uploadProfileImage(token: string, image: PickedImage) {
    const formData = new FormData();

    formData.append(
      "request",
      new Blob([JSON.stringify({})], { type: "application/json" }),
    );

    if (Platform.OS === "web") {
      let imageFile = image.file;

      if (!imageFile) {
        const imageResponse = await fetch(image.uri);
        if (!imageResponse.ok) {
          throw new Error("선택한 이미지를 읽지 못했어요.");
        }
        const imageBlob = await imageResponse.blob();
        imageFile = new File([imageBlob], image.name, { type: image.mimeType });
      }

      formData.append("profileImage", imageFile, imageFile.name);
    } else {
      formData.append("profileImage", new ExpoFile(image.uri) as any);
    }

    const response = await fetch(`${API_BASE_URL}/user/update`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("프로필 사진 업로드 실패:", response.status, text);
      throw new Error(`프로필 사진을 저장하지 못했어요. (${response.status})`);
    }
  }

  // PUT /stylist/me (등록 API와 같은 요청 형식)
  async function handleSave() {
    if (locationPk === null) {
      showMessage("활동 지역", "활동 지역을 선택해 주세요.");
      return;
    }

    if (styleTypePks.length === 0) {
      showMessage("전문 스타일", "전문 스타일을 하나 이상 선택해 주세요.");
      return;
    }

    const selectedPlans = PLANS.filter((plan) => planPrices[plan.id].selected);

    if (selectedPlans.length === 0) {
      showMessage("서비스 플랜", "플랜을 하나 이상 선택해 주세요.");
      return;
    }

    for (const plan of selectedPlans) {
      const price = Number(planPrices[plan.id].price);
      if (!Number.isInteger(price) || price <= 0) {
        showMessage(
          "플랜 가격",
          `${plan.name} 플랜의 가격을 1원 이상 입력해 주세요.`,
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        showMessage(
          "로그인 필요",
          "로그인 정보가 없습니다. 다시 로그인해 주세요.",
        );
        return;
      }

      // 새 프로필 사진을 골랐다면 먼저 업로드 (실패하면 전체 저장을 중단)
      if (pickedImage) {
        await uploadProfileImage(token, pickedImage);
        setProfilePic(pickedImage.uri);
        setPickedImage(null);
      }

      const response = await fetch(`${API_BASE_URL}/stylist/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          introduction: introduction.trim() || null,
          locationPk,
          styleTypePks,
          plans: selectedPlans.map((plan) => ({
            planPk: plan.id,
            price: Number(planPrices[plan.id].price),
          })),
        }),
      });

      if (response.ok) {
        showMessage("수정 완료", "프로필이 수정되었어요.", () => router.back());
        return;
      }

      const responseText = await response.text();
      let errorMessage = "프로필 수정에 실패했어요.";

      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch {
          errorMessage = responseText;
        }
      }

      if (response.status === 401 || response.status === 403) {
        errorMessage = "로그인이 만료되었거나 수정 권한이 없어요.";
      }

      showMessage("수정 실패", errorMessage);
    } catch (error) {
      console.error("스타일리스트 정보 수정 오류:", error);

      if (
        error instanceof Error &&
        (error.message.startsWith("프로필 사진") ||
          error.message.startsWith("선택한 이미지"))
      ) {
        showMessage("프로필 사진", error.message);
      } else {
        showMessage(
          "서버 연결 실패",
          "서버 실행 상태와 네트워크 연결을 확인해 주세요.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="뒤로"
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>프로필 수정</Text>
      <View style={styles.backButton} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#51458C" />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <Text style={styles.sectionTitle}>불러오지 못했어요</Text>
          <Text style={[styles.helperText, { textAlign: "center" }]}>
            {loadError}
          </Text>
          <Pressable
            style={[
              styles.primaryButton,
              { paddingHorizontal: 28, marginTop: 10 },
            ]}
            onPress={loadMyInfo}
          >
            <Text style={styles.primaryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {renderHeader()}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 기본 정보 */}
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <Text style={styles.helperText}>
            {nickname ? `${nickname}님의 ` : ""}스타일리스트 정보를 수정할 수
            있어요.
          </Text>

          <Text style={styles.fieldLabel}>프로필 이미지</Text>
          <Pressable
            style={styles.imagePlaceholder}
            onPress={pickProfileImage}
            accessibilityRole="button"
            accessibilityLabel="프로필 이미지 변경"
          >
            {pickedImage || profilePic ? (
              <Image
                source={{ uri: pickedImage?.uri ?? (profilePic as string) }}
                style={{ width: "100%", height: "100%", borderRadius: 6 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.imagePlus}>＋</Text>
            )}
          </Pressable>
          <Text style={styles.helperText}>
            {pickedImage
              ? "저장하면 새 프로필 사진이 적용돼요."
              : "이미지를 눌러 프로필 사진을 바꿀 수 있어요."}
          </Text>

          <Text style={styles.fieldLabel}>소개글</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput, styles.introInput]}
            value={introduction}
            onChangeText={setIntroduction}
            placeholder="자신을 소개해주세요."
            placeholderTextColor="#AAAAAA"
            multiline
            maxLength={255}
            textAlignVertical="top"
          />

          <Text style={styles.fieldLabel}>활동 지역 *</Text>
          <View style={styles.locationGrid}>
            {LOCATIONS.map((location) => {
              const selected = locationPk === location.id;
              return (
                <Pressable
                  key={location.id}
                  style={[styles.locationChip, selected && styles.chipSelected]}
                  onPress={() => setLocationPk(location.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {location.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#EEEEEE",
              marginVertical: 28,
            }}
          />

          {/* 전문 분야 */}
          <Text style={styles.sectionTitle}>전문 분야</Text>

          <View style={styles.fieldHeaderRow}>
            <Text style={styles.fieldLabelInline}>전문 스타일 *</Text>
            <Text style={styles.fieldHint}>
              최대 {MAX_STYLE_SELECTION}개 선택
            </Text>
          </View>
          <View style={styles.styleGrid}>
            {STYLE_TYPES.map((style) => {
              const selected = styleTypePks.includes(style.id);
              return (
                <Pressable
                  key={style.id}
                  style={[styles.styleChip, selected && styles.chipSelected]}
                  onPress={() => toggleStyle(style.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {style.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#EEEEEE",
              marginVertical: 28,
            }}
          />

          {/* 서비스 플랜 */}
          <Text style={styles.sectionTitle}>서비스 플랜</Text>
          <Text style={styles.helperText}>
            플랜별 가격을 수정할 수 있어요. 이미 결제된 주문의 금액은 바뀌지
            않아요.
          </Text>

          {PLANS.map((plan) => {
            const planState = planPrices[plan.id];
            const formattedPrice = planState.price
              ? Number(planState.price).toLocaleString("ko-KR")
              : "";

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  planState.selected && styles.planCardSelected,
                ]}
              >
                <View style={styles.planHeader}>
                  <Pressable
                    style={styles.planHeadingPress}
                    onPress={() => togglePlan(plan.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: planState.selected }}
                  >
                    <View
                      style={[
                        styles.radio,
                        planState.selected && styles.radioSelected,
                      ]}
                    >
                      {planState.selected && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.planNameArea}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planDescription}>
                        {plan.description}
                      </Text>
                    </View>
                  </Pressable>

                  {planState.selected ? (
                    <View style={styles.priceChip}>
                      <TextInput
                        style={styles.priceInput}
                        value={formattedPrice}
                        onChangeText={(value) =>
                          updatePlanPrice(plan.id, value)
                        }
                        placeholder="가격 입력"
                        placeholderTextColor="#9A9A9A"
                        keyboardType="number-pad"
                      />
                      {formattedPrice !== "" && (
                        <Text style={styles.wonText}>원</Text>
                      )}
                    </View>
                  ) : (
                    <Pressable
                      style={styles.priceChip}
                      onPress={() => togglePlan(plan.id)}
                    >
                      <Text
                        style={[
                          styles.priceText,
                          formattedPrice === "" && styles.priceTextEmpty,
                        ]}
                      >
                        {formattedPrice ? `${formattedPrice}원` : "가격 입력"}
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.planDivider} />

                <View style={styles.featureList}>
                  {plan.features.map((feature) => (
                    <View key={feature} style={styles.featureRow}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.planTagline}>{plan.tagline}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}
        >
          <Pressable
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>저장하기</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}