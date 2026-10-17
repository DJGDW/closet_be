import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSignup } from "../signup-context";
import common from "../styles/signup-common.styles";
import styles from "../styles/signup-step3.styles";

const STYLE_OPTIONS = [
  "캐주얼",
  "스트릿",
  "미니멀",
  "댄디",
  "포멀",
  "아메카지",
  "빈티지",
  "고프코어",
  "Y2K",
  "페미닌",
  "모던",
  "스포츠/애슬레저",
];

export default function SignupStep3() {
  const { data, updateData } = useSignup();

  const selectedStyles = data.selectedStyles;

  const setSelectedStyles = (styles: string[]) => {
    updateData({ selectedStyles: styles });
  };
  const [error, setError] = useState("");

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter((item) => item !== style));
      return;
    }

    if (selectedStyles.length >= 3) {
      Alert.alert("알림", "스타일은 최대 3개까지 선택할 수 있어요.");
      return;
    }

    setSelectedStyles([...selectedStyles, style]);
  };

  const handleNext = () => {
    if (selectedStyles.length === 0) {
      setError("선호하는 스타일을 하나 이상 선택해주세요.");
      return;
    }

    router.push("/signup-step4");
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
          <Text style={common.stepText}>회원가입 3/4</Text>
        </View>

        <View style={common.progressRow}>
          <View style={[common.progressBar, common.progressActive]} />
          <View style={[common.progressBar, common.progressActive]} />
          <View style={[common.progressBar, common.progressActive]} />
          <View style={common.progressBar} />
        </View>

        <ScrollView
          style={common.scrollView}
          contentContainerStyle={common.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={common.intro}>
            <Text style={common.heading}>선호스타일</Text>
            <Text style={common.description}>
              선호하는 스타일을 최대 3개까지 선택해주세요.
            </Text>
          </View>

          <View style={styles.countRow}>
            <Text style={styles.countLabel}>선호 스타일</Text>
            <Text style={styles.count}>
              <Text style={styles.countNumber}>{selectedStyles.length}</Text>
              /3
            </Text>
          </View>

          <View style={styles.optionsGrid}>
            {STYLE_OPTIONS.map((item) => {
              const selected = selectedStyles.includes(item);

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.option,
                    selected ? styles.optionSelected : null,
                  ]}
                  onPress={() => toggleStyle(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected ? styles.optionTextSelected : null,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={common.errorText}>{error}</Text> : null}

          <Text style={styles.helperText}>
            선택한 스타일은 향후 스타일리스트 및 포트폴리오 추천에 활용됩니다.
          </Text>
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
