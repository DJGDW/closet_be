
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styles/stylist-register.styles";

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

const PLANS = [
  {
    id: 1,
    name: "브론즈",
    englishName: "BRONZE",
    description: "기본적인 스타일 상담",
    features: ["채팅 상담", "최대 1회 스타일 제안", "간단한 스타일 피드백"],
  },
  {
    id: 2,
    name: "실버",
    englishName: "SILVER",
    description: "더 자세한 스타일 상담",
    features: ["채팅 + 영상 통화", "최대 2~3회 스타일 제안", "추천 상품 및 코디 제공"],
  },
  {
    id: 3,
    name: "골드",
    englishName: "GOLD",
    description: "맞춤형 스타일링 솔루션",
    features: ["맞춤 스타일 상담", "퍼스널 스타일링 컨설팅", "코디 제안 및 쇼핑 가이드"],
  },
];

const CUSTOMER_GROUPS = ["10대", "20대", "30대", "40대 이상"];

type PlanPrice = {
  selected: boolean;
  price: string;
};

export default function StylistRegisterScreen() {
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

  function toggleCustomerGroup(group: string) {
    setSelectedCustomerGroups((current) =>
      current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group],
    );
  }

  function toggleStyle(styleId: number) {
    setStyleTypePks((current) =>
      current.includes(styleId)
        ? current.filter((id) => id !== styleId)
        : [...current, styleId],
    );
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
    const digitsOnly = price.replace(/[^0-9]/g, "");
    setPlanPrices((current) => ({
      ...current,
      [planId]: { ...current[planId], price: digitsOnly },
    }));
  }

  function showMessage(title: string, message: string) {
    Alert.alert(title, message);
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
        showMessage("플랜 가격", `${plan.name} 플랜의 가격을 1원 이상 입력해 주세요.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const accessToken =
        Platform.OS === "web"
          ? localStorage.getItem("accessToken")
          : await SecureStore.getItemAsync("accessToken");

      if (!accessToken) {
        showMessage("로그인 필요", "로그인 정보가 없습니다. 다시 로그인해 주세요.");
        return;
      }

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

  if (Platform.OS === "web") {
    localStorage.setItem(
      "myStylistProfile",
      JSON.stringify(profileData),
    );
  } else {
    await SecureStore.setItemAsync(
      "myStylistProfile",
      JSON.stringify(profileData),
    );
  }

  showMessage("등록 완료", "스타일리스트 등록이 완료되었습니다.");
  router.replace("/mypage");
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
        errorMessage = "로그인이 만료되었거나 등록 권한이 없습니다. 다시 로그인해 주세요.";
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
                  step > item && styles.progressCircleComplete,
                ]}
              >
                <Text
                  style={[
                    styles.progressNumber,
                    (step === item || step > item) && styles.progressNumberActive,
                  ]}
                >
                  {item}
                </Text>
              </View>
              <Text style={[styles.progressLabel, step === item && styles.progressLabelActive]}>
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
                스타일리스트로 사용할 기본 정보를 입력해 주세요.
              </Text>

              <Text style={styles.fieldLabel}>프로필 이미지</Text>
              <Pressable
                style={styles.imagePlaceholder}
                onPress={() =>
                  showMessage(
                    "프로필 이미지",
                    "이미지 업로드 API가 준비되면 연결할 수 있어요.",
                  )
                }
              >
                <Text style={styles.imagePlus}>＋</Text>
              </Pressable>

              <Text style={styles.fieldLabel}>소개글</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={introduction}
                onChangeText={setIntroduction}
                placeholder="자신을 소개해 주세요."
                placeholderTextColor="#AAAAAA"
                multiline
                maxLength={255}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{introduction.length}/255</Text>

              <Text style={styles.fieldLabel}>주요 고객층 (선택)</Text>
              <View style={styles.customerRow}>
                {CUSTOMER_GROUPS.map((group) => {
                  const selected = selectedCustomerGroups.includes(group);
                  return (
                    <Pressable
                      key={group}
                      style={[styles.customerChip, selected && styles.chipSelected]}
                      onPress={() => toggleCustomerGroup(group)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {group}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>활동 지역 *</Text>
              <Text style={styles.helperText}>활동할 지역을 하나 선택해 주세요.</Text>
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
                        style={[styles.chipText, selected && styles.chipTextSelected]}
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
                주로 다루는 스타일을 선택해 주세요. 여러 개 선택할 수 있어요.
              </Text>

              <Text style={styles.fieldLabel}>전문 스타일 * (복수 선택)</Text>
              <View style={styles.styleGrid}>
                {STYLE_TYPES.map((style) => {
                  const selected = styleTypePks.includes(style.id);
                  return (
                    <Pressable
                      key={style.id}
                      style={[styles.styleChip, selected && styles.chipSelected]}
                      onPress={() => toggleStyle(style.id)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {style.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>선택한 스타일</Text>
              <Text style={styles.selectedSummary}>
                {styleTypePks.length
                  ? STYLE_TYPES.filter((style) => styleTypePks.includes(style.id))
                      .map((style) => style.name)
                      .join(" · ")
                  : "선택한 스타일이 여기에 표시됩니다."}
              </Text>

              <Text style={styles.fieldLabel}>전문 분야 소개 (선택)</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={specialtyIntroduction}
                onChangeText={setSpecialtyIntroduction}
                placeholder="전문 분야와 스타일링 방향을 소개해 주세요."
                placeholderTextColor="#AAAAAA"
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                이 소개글은 현재 등록 API에서 저장되지 않습니다.
              </Text>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>서비스 플랜 설정</Text>
              <Text style={styles.helperText}>
                제공할 서비스 플랜을 선택하고 각 플랜의 가격을 입력해 주세요.
              </Text>

              {PLANS.map((plan) => {
                const planState = planPrices[plan.id];
                return (
                  <View
                    key={plan.id}
                    style={[styles.planCard, planState.selected && styles.planCardSelected]}
                  >
                    <Pressable
                      style={styles.planHeader}
                      onPress={() => togglePlan(plan.id)}
                    >
                      <View style={styles.planHeadingLeft}>
                        <View style={[styles.radio, planState.selected && styles.radioSelected]}>
                          {planState.selected && <View style={styles.radioDot} />}
                        </View>
                        <View style={styles.planNameArea}>
                          <Text style={styles.planName}>{plan.name}</Text>
                          <Text style={styles.planDescription}>{plan.description}</Text>
                        </View>
                      </View>
                      <Text style={styles.planCode}>{plan.englishName}</Text>
                    </Pressable>

                    {planState.selected && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>서비스 가격</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={planState.price}
                          onChangeText={(value) => updatePlanPrice(plan.id, value)}
                          placeholder="가격 입력"
                          placeholderTextColor="#AAAAAA"
                          keyboardType="number-pad"
                          maxLength={9}
                        />
                        <Text style={styles.wonText}>원</Text>
                      </View>
                    )}

                    <View style={styles.featureList}>
                      {plan.features.map((feature) => (
                        <Text key={feature} style={styles.featureText}>
                          ✓  {feature}
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              })}

              <Text style={styles.helperText}>
                선택한 플랜은 최소 1개 이상이어야 하며, 가격은 1원 이상 입력해야 해요.
              </Text>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
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

