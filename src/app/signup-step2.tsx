import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSignup } from "../signup-context";
import common from "../styles/signup-common.styles";
import styles from "../styles/signup-step2.styles";

type FieldKey = "height" | "weight";
type Errors = Partial<Record<FieldKey, string>>;

// 상세 신체 정보 (백엔드 body: chestSize, waistSize, shoulderWidth, hips, thigh, calf, leg)
type DetailKey =
  | "waistSize"
  | "shoulderWidth"
  | "chestSize"
  | "hips"
  | "thigh"
  | "calf"
  | "leg";

const DETAIL_FIELDS: { key: DetailKey; label: string }[] = [
  { key: "waistSize", label: "허리둘레" },
  { key: "shoulderWidth", label: "어깨너비" },
  { key: "chestSize", label: "가슴둘레" },
  { key: "hips", label: "엉덩이둘레" },
  { key: "thigh", label: "허벅지둘레" },
  { key: "calf", label: "종아리둘레" },
  { key: "leg", label: "다리 안쪽 길이" },
];

const DETAIL_MIN = 10;
const DETAIL_MAX = 300;

const extra = StyleSheet.create({
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 14,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },
  detailTitleHint: {
    fontSize: 11,
    fontWeight: "400",
    color: "#777777",
  },
  detailSub: {
    fontSize: 11,
    color: "#888888",
    marginTop: 3,
  },
  laterButton: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 6,
    backgroundColor: "#EEEBF8",
    alignItems: "center",
    justifyContent: "center",
  },
  laterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#51458C",
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  detailCell: {
    width: "48%",
  },
  detailLabel: {
    fontSize: 13,
    color: "#222222",
    marginBottom: 6,
  },
  smallInput: {
    height: 48,
  },
});

export default function SignupStep2() {
  const { data, updateData } = useSignup();

  const height = data.tall;
  const weight = data.weight;

  const setHeight = (value: string) => {
    updateData({ tall: value });
  };

  const setWeight = (value: string) => {
    updateData({ weight: value });
  };
  const [errors, setErrors] = useState<Errors>({});
  const [detailError, setDetailError] = useState("");
  const [invalidDetailKeys, setInvalidDetailKeys] = useState<DetailKey[]>([]);

  const updateValue = (field: FieldKey, value: string) => {
    let cleaned = value.replace(/[^0-9.]/g, "");
    const dot = cleaned.indexOf(".");

    if (dot !== -1) {
      cleaned =
        cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
    }

    if (field === "height") setHeight(cleaned);
    else setWeight(cleaned);

    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // 상세 신체 정보는 cm 단위 정수만 받는다 (백엔드가 Integer)
  const updateDetail = (key: DetailKey, value: string) => {
    updateData({ [key]: value.replace(/[^0-9]/g, "").slice(0, 3) });
    setDetailError("");
    setInvalidDetailKeys((prev) => prev.filter((item) => item !== key));
  };

  const getDetail = (key: DetailKey) => String(data[key] ?? "");

  const validate = () => {
    const next: Errors = {};
    const h = Number(height);
    const w = Number(weight);

    if (!height.trim()) {
      next.height = "키를 입력해주세요.";
    } else if (!Number.isFinite(h) || h < 80 || h > 250) {
      next.height = "키를 80~250cm 사이로 입력해주세요.";
    }

    if (!weight.trim()) {
      next.weight = "몸무게를 입력해주세요.";
    } else if (!Number.isFinite(w) || w < 20 || w > 300) {
      next.weight = "몸무게를 20~300kg 사이로 입력해주세요.";
    }

    setErrors(next);

    // 상세 신체 정보: 모두 입력하거나 모두 비워야 한다 (백엔드 검증과 동일)
    const filledKeys = DETAIL_FIELDS.filter(
      (field) => getDetail(field.key).trim() !== "",
    ).map((field) => field.key);

    let detailOk = true;

    if (filledKeys.length > 0 && filledKeys.length < DETAIL_FIELDS.length) {
      setDetailError(
        "상세 신체 정보는 모두 입력하거나 모두 비워주세요. 나중에 입력하려면 '나중에 가입할래요'를 눌러주세요.",
      );
      setInvalidDetailKeys(
        DETAIL_FIELDS.filter((field) => !filledKeys.includes(field.key)).map(
          (field) => field.key,
        ),
      );
      detailOk = false;
    } else if (filledKeys.length === DETAIL_FIELDS.length) {
      const outOfRange = DETAIL_FIELDS.filter((field) => {
        const n = Number(getDetail(field.key));
        return !Number.isInteger(n) || n < DETAIL_MIN || n > DETAIL_MAX;
      }).map((field) => field.key);

      if (outOfRange.length > 0) {
        setDetailError(
          `상세 신체 정보는 ${DETAIL_MIN}~${DETAIL_MAX}cm 사이의 숫자로 입력해주세요.`,
        );
        setInvalidDetailKeys(outOfRange);
        detailOk = false;
      }
    }

    if (detailOk) {
      setDetailError("");
      setInvalidDetailKeys([]);
    }

    return Object.keys(next).length === 0 && detailOk;
  };

  const renderMeasurementField = (
    label: string,
    field: FieldKey,
    value: string,
    unit: string,
    placeholder: string,
  ) => (
    <View style={common.field} key={field}>
      <Text style={common.label}>
        {label}
        <Text style={styles.required}> *</Text>
      </Text>

      <View
        style={[
          common.input,
          styles.inputContainer,
          errors[field] ? common.inputError : null,
        ]}
      >
        <TextInput
          style={styles.measurementInput}
          value={value}
          onChangeText={(text) => updateValue(field, text)}
          placeholder={placeholder}
          placeholderTextColor="#B8B8B8"
          keyboardType="decimal-pad"
          accessibilityLabel={`${label} ${unit}`}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>

      {errors[field] ? (
        <Text style={common.errorText}>{errors[field]}</Text>
      ) : null}
    </View>
  );

  const renderDetailField = (field: { key: DetailKey; label: string }) => (
    <View key={field.key} style={extra.detailCell}>
      <Text style={extra.detailLabel}>{field.label}</Text>

      <View
        style={[
          common.input,
          styles.inputContainer,
          extra.smallInput,
          invalidDetailKeys.includes(field.key) ? common.inputError : null,
        ]}
      >
        <TextInput
          style={styles.measurementInput}
          value={getDetail(field.key)}
          onChangeText={(text) => updateDetail(field.key, text)}
          placeholder={field.label}
          placeholderTextColor="#C4C4C4"
          keyboardType="number-pad"
          maxLength={3}
          accessibilityLabel={`${field.label} cm`}
        />
        <Text style={styles.unit}>cm</Text>
      </View>
    </View>
  );

  // 상세 신체 정보를 비우고 다음 단계로
  const handleSkipDetail = () => {
    updateData({
      waistSize: "",
      shoulderWidth: "",
      chestSize: "",
      hips: "",
      thigh: "",
      calf: "",
      leg: "",
    });
    setDetailError("");
    setInvalidDetailKeys([]);

    // 키/몸무게는 필수라서 이 둘은 그대로 검사
    const next: Errors = {};
    const h = Number(height);
    const w = Number(weight);

    if (!height.trim()) next.height = "키를 입력해주세요.";
    else if (!Number.isFinite(h) || h < 80 || h > 250)
      next.height = "키를 80~250cm 사이로 입력해주세요.";

    if (!weight.trim()) next.weight = "몸무게를 입력해주세요.";
    else if (!Number.isFinite(w) || w < 20 || w > 300)
      next.weight = "몸무게를 20~300kg 사이로 입력해주세요.";

    setErrors(next);

    if (Object.keys(next).length === 0) router.push("/signup-step3");
  };

  const handleNext = () => {
    if (validate()) router.push("/signup-step3");
  };

  return (
    <View style={common.webBackground}>
      <KeyboardAvoidingView
        style={common.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={common.header}>
          <Pressable style={common.backButton} onPress={() => router.back()}>
            <Text style={common.backIcon}>‹</Text>
            <Text style={common.headerTitle}>회원가입</Text>
          </Pressable>
          <Text style={common.stepText}>회원가입 2/4</Text>
        </View>

        <View style={common.progressRow}>
          <View style={[common.progressBar, common.progressActive]} />
          <View style={[common.progressBar, common.progressActive]} />
          <View style={common.progressBar} />
          <View style={common.progressBar} />
        </View>

        <ScrollView
          style={common.scrollView}
          contentContainerStyle={common.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={common.intro}>
            <Text style={common.heading}>신체사이즈</Text>
            <Text style={common.description}>
              맞춤형 스타일링을 위한 기본 신체 정보를 입력해주세요.
            </Text>
          </View>

          {renderMeasurementField(
            "키",
            "height",
            height,
            "cm",
            "키를 입력해주세요",
          )}

          {renderMeasurementField(
            "몸무게",
            "weight",
            weight,
            "kg",
            "몸무게를 입력해주세요",
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              상세 신체 정보로 체형을 추정해 나에게 맞는 스타일리스트를
              추천해요.
            </Text>
          </View>

          {/* 상세 신체 정보 (선택) */}
          <View style={extra.detailHeaderRow}>
            <View>
              <Text style={extra.detailTitle}>
                상세 신체 정보{" "}
                <Text style={extra.detailTitleHint}>(선택)</Text>
              </Text>
              <Text style={extra.detailSub}>
                입력하지 않아도 가입할 수 있어요.
              </Text>
            </View>

            <Pressable
              style={extra.laterButton}
              onPress={handleSkipDetail}
              accessibilityRole="button"
              accessibilityLabel="상세 신체 정보 나중에 입력하고 다음으로"
            >
              <Text style={extra.laterButtonText}>나중에 가입할래요</Text>
            </Pressable>
          </View>

          <View style={extra.detailGrid}>
            {DETAIL_FIELDS.map(renderDetailField)}
          </View>

          {detailError ? (
            <Text style={[common.errorText, { marginTop: 10 }]}>
              {detailError}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={styles.previousButton}
            onPress={() => router.back()}
          >
            <Text style={styles.previousButtonText}>이전</Text>
          </Pressable>

          <Pressable
            style={[common.nextButton, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={common.nextButtonText}>다음</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}