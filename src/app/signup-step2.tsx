import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSignup } from "../signup-context";
import common from "../styles/signup-common.styles";
import styles from "../styles/signup-step2.styles";

type FieldKey = "height" | "weight";
type Errors = Partial<Record<FieldKey, string>>;

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
    return Object.keys(next).length === 0;
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
              입력한 신체 정보는 맞춤형 스타일링 및{"\n"}
              스타일리스트 매칭에 활용됩니다.
            </Text>
          </View>
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
