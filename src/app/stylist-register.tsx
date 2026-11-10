import { router } from "expo-router";
import { File as ExpoFile } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
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
import { PLANS } from "../constants/plans";

const API_BASE_URL = "http://192.168.0.5:8080";

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

const CUSTOMER_GROUPS = ["10대", "20대", "30대", "40대 이상"];

const MAX_STYLE_SELECTION = 5;

// 새로 고른 프로필 이미지 (등록 성공 후 PATCH /user/update로 업로드)
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

export default function StylistRegisterScreen() {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [introduction, setIntroduction] = useState("");
  const [specialtyIntroduction, setSpecialtyIntroduction] = useState("");
  const [selectedCustomerGroups, setSelectedCustomerGroups] = useState<string[]>([]);
  const [locationPk, setLocationPk] = useState<number | null>(null);
  const [styleTypePks, setStyleTypePks] = useState<number[]>([]);
  const [planPrices, setPlanPrices] = useState<Record<number, PlanPrice>>({
    1: { selected: true, price: "15000" },
    2: { selected: false, price: "30000" },
    3: { selected: false, price: "" },
  });
  const [submitting, setSubmitting] = useState(false);

  // 현재 프로필 사진(GET /user/me)과 새로 고른 사진
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);

  // 현재 내 프로필 사진 불러오기 (실패해도 등록에는 영향 없음)
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const result = await response.json();
        const data = result?.data ?? result?.result ?? result;
        setProfilePic(data?.profilePic ?? null);
      } catch (error) {
        console.error("내 프로필 사진 조회 오류:", error);
      }
    })();
  }, []);

  // 프로필 이미지 선택 (등록 완료 전까지는 화면에만 미리보기)
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

  function toggleCustomerGroup(group: string) {
    setSelectedCustomerGroups((current) =>
      current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group],
    );
  }

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

  function goNext() {
    if (step === 1) {
      if (locationPk === null) {
        showMessage("활동 지역", "활동 지역을 선택해 주세요.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (styleTypePks.length === 0) {
        showMessage("전문 스타일", "전문 스타일을 하나 이상 선택해 주세요.");
        return;
      }
      setStep(3);
    }
  }

  async function handleRegister() {
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
      const accessToken = await getAccessToken();

      if (!accessToken) {
        showMessage(
          "로그인 필요",
          "로그인 정보가 없습니다. 다시 로그인해 주세요.",
        );
        return;
      }

      // 1. 스타일리스트 등록
      const response = await fetch(`${API_BASE_URL}/stylist/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
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

      if (response.status === 201) {
        const profileData = {
          introduction: introduction.trim(),
          locationPk,
          styleTypePks,
          plans: selectedPlans.map((plan) => ({
            planPk: plan.id,
            price: Number(planPrices[plan.id].price),
          })),
        };

        // 피드의 게시물 작성 버튼이 스타일리스트 여부 판별에 사용
        if (Platform.OS === "web") {
          localStorage.setItem("myStylistProfile", JSON.stringify(profileData));
        } else {
          await SecureStore.setItemAsync(
            "myStylistProfile",
            JSON.stringify(profileData),
          );
        }

        // 2. 새 프로필 사진을 골랐다면 업로드 (등록은 이미 완료된 상태)
        let photoFailed = false;

        if (pickedImage) {
          try {
            await uploadProfileImage(accessToken, pickedImage);
          } catch (error) {
            console.error("등록 후 프로필 사진 업로드 오류:", error);
            photoFailed = true;
          }
        }

        showMessage(
          "등록 완료",
          photoFailed
            ? "스타일리스트 등록은 완료되었어요. 프로필 사진은 저장하지 못했으니 프로필 수정에서 다시 설정해 주세요."
            : "스타일리스트 등록이 완료되었습니다.",
          () => router.replace("/mypage"),
        );
        return;
      }

      const responseText = await response.text();
      let errorMessage = "스타일리스트 등록에 실패했습니다.";

      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch {
          errorMessage = responseText;
        }
      }

      if (response.status === 401 || response.status === 403) {
        errorMessage =
          "로그인이 만료되었거나 등록 권한이 없습니다. 다시 로그인해 주세요.";
      } else if (response.status === 409) {
        errorMessage = "이미 스타일리스트로 등록되어 있는지 확인해 주세요.";
      }

      showMessage("등록 실패", errorMessage);
    } catch (error) {
      console.error("스타일리스트 등록 오류:", error);
      showMessage(
        "서버 연결 실패",
        "서버 실행 상태와 네트워크 연결을 확인해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const previewUri = pickedImage?.uri ?? profilePic;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
            accessibilityRole="button"
            accessibilityLabel="뒤로"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>스타일리스트 등록하기</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.progressArea}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.progressItem}>
              <View
                style={[
                  styles.progressCircle,
                  step === item && styles.progressCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.progressNumber,
                    step === item && styles.progressNumberActive,
                  ]}
                >
                  {item}
                </Text>
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  step === item && styles.progressLabelActive,
                ]}
              >
                {["기본 정보", "전문 분야", "서비스 설정"][item - 1]}
              </Text>
            </View>
          ))}
          <View style={styles.progressLine} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>기본 정보 입력</Text>
              <Text style={styles.helperText}>
                스타일리스트로 사용할 정보를 입력해주세요.
              </Text>

              <Text style={styles.fieldLabel}>프로필 이미지</Text>
              <Pressable
                style={styles.imagePlaceholder}
                onPress={pickProfileImage}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="프로필 이미지 변경"
              >
                {previewUri ? (
                  <Image
                    source={{ uri: previewUri }}
                    style={{ width: "100%", height: "100%", borderRadius: 6 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.imagePlus}>＋</Text>
                )}
              </Pressable>
              <Text style={styles.helperText}>
                {pickedImage
                  ? "등록을 완료하면 새 프로필 사진이 적용돼요."
                  : "회원가입 때 설정한 프로필 사진과 같아요. 눌러서 바꿀 수 있어요."}
              </Text>

              <Text style={styles.fieldLabel}>소개글 *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.multilineInput,
                  styles.introInput,
                ]}
                value={introduction}
                onChangeText={setIntroduction}
                placeholder="자신을 소개해주세요."
                placeholderTextColor="#AAAAAA"
                multiline
                maxLength={255}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>주요 고객층 (선택)</Text>
              <View style={styles.customerRow}>
                {CUSTOMER_GROUPS.map((group) => {
                  const selected = selectedCustomerGroups.includes(group);
                  return (
                    <Pressable
                      key={group}
                      style={[
                        styles.customerChip,
                        group === "40대 이상" && styles.customerChipWide,
                        selected && styles.chipSelected,
                      ]}
                      onPress={() => toggleCustomerGroup(group)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected && styles.chipTextSelected,
                        ]}
                      >
                        {group}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>활동 지역 *</Text>
              <Text style={styles.helperText}>
                활동할 지역을 하나 선택해 주세요.
              </Text>
              <View style={styles.locationGrid}>
                {LOCATIONS.map((location) => {
                  const selected = locationPk === location.id;
                  return (
                    <Pressable
                      key={location.id}
                      style={[
                        styles.locationChip,
                        selected && styles.chipSelected,
                      ]}
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
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>전문 분야 선택</Text>
              <Text style={styles.helperText}>
                주로 다루는 스타일과 전문 분야를 선택해주세요.
              </Text>

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

              <Text style={styles.fieldLabel}>선택한 스타일</Text>
              <Text style={styles.selectedSummary}>
                {styleTypePks.length
                  ? STYLE_TYPES.filter((style) =>
                      styleTypePks.includes(style.id),
                    )
                      .map((style) => style.name)
                      .join(" · ")
                  : "선택한 스타일이 여기에 표시됩니다."}
              </Text>

              <Text style={styles.fieldLabel}>전문 분야 소개</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={specialtyIntroduction}
                onChangeText={setSpecialtyIntroduction}
                placeholder="자신 있는 스타일이나 코디 특징을 작성해주세요."
                placeholderTextColor="#AAAAAA"
                multiline
                textAlignVertical="top"
              />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>서비스 플랜 설정</Text>
              <Text style={styles.helperText}>
                플랜별 제공 내용과 가격을 설정해 주세요.
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
                          {planState.selected && (
                            <View style={styles.radioDot} />
                          )}
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
                            {formattedPrice
                              ? `${formattedPrice}원`
                              : "가격 입력"}
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
            </>
          )}
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}
        >
          <Pressable
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={step === 3 ? handleRegister : goNext}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {step === 3 ? "등록 완료" : "다음"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}