import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
import styles from "../styles/signup-step4.styles";

type ResultType = "success" | "error" | "";

const API_BASE_URL = "http://192.168.0.5:8080";

const STYLE_IDS: Record<string, number> = {
  캐주얼: 1,
  스트릿: 2,
  미니멀: 3,
  댄디: 4,
  포멀: 5,
  아메카지: 6,
  빈티지: 7,
  고프코어: 8,
  Y2K: 9,
  페미닌: 10,
  모던: 11,
  "스포츠/애슬레저": 12,
};

export default function SignupStep4() {
  const { data, updateData, resetData } = useSignup();

  const nickname = data.nickname;

  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
  const [checkedNickname, setCheckedNickname] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<ResultType>("");
  const [error, setError] = useState("");

  // 웹과 모바일 모두에서 안내 표시
  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 닉네임 입력 시 중복확인 결과 초기화
  const handleNicknameChange = (value: string) => {
    updateData({ nickname: value });
    setIsNicknameAvailable(false);
    setCheckedNickname("");
    setResultMessage("");
    setResultType("");
    setError("");
  };

  // 닉네임 중복확인
  const handleNicknameCheck = async () => {
    const trimmedNickname = nickname.trim();

    setError("");
    setResultMessage("");
    setResultType("");
    setIsNicknameAvailable(false);
    setCheckedNickname("");

    if (!trimmedNickname) {
      setError("닉네임을 입력해 주세요.");
      return;
    }

    if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
      setError("닉네임은 2~12자로 입력해 주세요.");
      return;
    }

    setIsChecking(true);

    try {
      const url =
        `${API_BASE_URL}/user/check-nickname?nickname=` +
        encodeURIComponent(trimmedNickname);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const available: unknown = await response.json();

      if (typeof available !== "boolean") {
        throw new Error("서버 응답 형식이 올바르지 않습니다.");
      }

      if (available) {
        setIsNicknameAvailable(true);
        setCheckedNickname(trimmedNickname);
        setResultMessage("사용 가능한 닉네임입니다.");
        setResultType("success");
      } else {
        setResultMessage("이미 사용 중인 닉네임입니다.");
        setResultType("error");
      }
    } catch (err) {
      console.error("닉네임 중복확인 오류:", err);
      setResultMessage(
        "서버 연결에 실패했습니다. 백엔드 실행 상태와 API 주소를 확인해 주세요.",
      );
      setResultType("error");
    } finally {
      setIsChecking(false);
    }
  };

  // 회원가입
  const handleComplete = async () => {
    if (isChecking || isSubmitting) return;

    const trimmedNickname = nickname.trim();

    setError("");

    if (!trimmedNickname) {
      setError("닉네임을 입력해 주세요.");
      return;
    }

    if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
      setError("닉네임은 2~12자로 입력해 주세요.");
      return;
    }

    if (!isNicknameAvailable || checkedNickname !== trimmedNickname) {
      setError("닉네임 중복확인을 먼저 진행해 주세요.");
      return;
    }

    // 필수 입력값 검사
    if (
      !data.userName.trim() ||
      !data.userId.trim() ||
      !data.userPw ||
      !data.phoneNumber.trim() ||
      !data.birthDate.trim() ||
      !data.email.trim() ||
      data.gender === null ||
      !data.tall.trim() ||
      !data.weight.trim()
    ) {
      showMessage(
        "회원가입 정보 확인",
        "이전 단계의 필수 입력 정보를 확인해 주세요.",
      );
      return;
    }

    if (data.selectedStyles.length === 0) {
      showMessage(
        "스타일 선택 확인",
        "선호하는 스타일을 하나 이상 선택해 주세요.",
      );
      return;
    }

    // 생년월일 형식 검사
    // 화면 입력값: YYYY.MM.DD
    // 백엔드 전송값: YYYY-MM-DD
    const rawBirthDate = data.birthDate.trim();
    const birthDate = rawBirthDate.replace(/\./g, "-");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      showMessage(
        "생년월일 확인",
        "생년월일을 YYYY.MM.DD 형식으로 입력해 주세요.",
      );
      return;
    }

    // 실제 존재하는 날짜인지 검사
    const [year, month, day] = birthDate.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      showMessage("생년월일 확인", "실제 존재하는 날짜를 입력해 주세요.");
      return;
    }

    const tall = Number(data.tall);
    const weight = Number(data.weight);

    if (!Number.isInteger(tall) || tall <= 0) {
      showMessage("키 확인", "키를 올바르게 입력해 주세요.");
      return;
    }

    if (!Number.isFinite(weight) || weight < 0.1) {
      showMessage("몸무게 확인", "몸무게를 올바르게 입력해 주세요.");
      return;
    }

    // 스타일 이름을 백엔드 ID로 변환
    const styleTypePks: number[] = [];

    for (const style of data.selectedStyles) {
      const styleId = STYLE_IDS[style];

      if (styleId === undefined) {
        showMessage(
          "스타일 정보 오류",
          `선택한 스타일 "${style}"의 ID를 찾을 수 없습니다.`,
        );
        return;
      }

      styleTypePks.push(styleId);
    }

    // UserSignupRequestDto 구조에 맞춘 요청 데이터
    const requestData = {
      userName: data.userName.trim(),
      userId: data.userId.trim(),
      userPw: data.userPw,
      phoneNumber: data.phoneNumber.replace(/\D/g, ""),
      birthDate,
      email: data.email.trim(),
      gender: data.gender,
      body: {
        tall,
        weight,
      },
      profilePic: null,
      nickname: trimmedNickname,
      styleTypePks,
    };

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append(
        "request",
        new Blob([JSON.stringify(requestData)], {
          type: "application/json",
        }),
      );

      console.log("회원가입 요청 시작:", {
        ...requestData,
        userPw: "***",
      });

      const response = await fetch(`${API_BASE_URL}/user/signup`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const responseText = await response.text();

        console.error("회원가입 API 응답 오류:", response.status, responseText);

        if (response.status === 400) {
          throw new Error(
            "입력 정보가 올바르지 않습니다. 생년월일, 키, 몸무게 및 필수 입력값을 확인해 주세요.",
          );
        }

        if (response.status === 409) {
          throw new Error("이미 사용 중인 아이디 또는 닉네임입니다.");
        }

        throw new Error(`회원가입에 실패했습니다. (HTTP ${response.status})`);
      }

      resetData();
      router.replace("/signup-step5");
    } catch (err) {
      console.error("회원가입 처리 오류:", err);

      const message =
        err instanceof Error
          ? err.message
          : "회원가입 중 알 수 없는 오류가 발생했습니다.";

      showMessage("회원가입 실패", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 이전 단계로 이동
  const handleBack = () => {
    if (isSubmitting) return;

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/signup-step3");
    }
  };

  return (
    <View style={common.webBackground}>
      <KeyboardAvoidingView
        style={common.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* 헤더 */}
        <View style={common.header}>
          <Pressable
            style={common.backButton}
            onPress={handleBack}
            disabled={isSubmitting}
          >
            <Text style={common.backIcon}>‹</Text>
            <Text style={common.headerTitle}>회원가입</Text>
          </Pressable>

          <Text style={common.stepText}>회원가입 4/4</Text>
        </View>

        {/* 진행 상태 */}
        <View style={common.progressRow}>
          <View style={[common.progressBar, common.progressActive]} />
          <View style={[common.progressBar, common.progressActive]} />
          <View style={[common.progressBar, common.progressActive]} />
          <View style={[common.progressBar, common.progressActive]} />
        </View>

        <ScrollView
          style={common.scrollView}
          contentContainerStyle={common.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 안내 문구 */}
          <View style={common.intro}>
            <Text style={common.heading}>프로필 설정</Text>
            <Text style={common.description}>
              서비스에서 사용할 프로필을 설정해주세요.
            </Text>
          </View>

          {/* 프로필 사진 */}
          <View style={styles.profileSection}>
            <Pressable
              style={styles.avatar}
              onPress={() =>
                showMessage(
                  "프로필 사진",
                  "사진 선택 기능은 아직 연결되지 않았습니다. 프로필 사진 없이 가입할 수 있습니다.",
                )
              }
              accessibilityLabel="프로필 사진 선택"
            >
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
              <Text style={styles.cameraMark}>+</Text>
            </Pressable>
          </View>

          {/* 닉네임 입력 */}
          <View style={common.field}>
            <Text style={common.label}>
              닉네임<Text style={styles.required}> *</Text>
            </Text>

            <View style={styles.nicknameRow}>
              <TextInput
                style={[
                  common.input,
                  styles.nicknameInput,
                  error ? common.inputError : null,
                ]}
                value={nickname}
                onChangeText={handleNicknameChange}
                placeholder="닉네임을 입력해주세요"
                placeholderTextColor="#B8B8B8"
                maxLength={12}
                autoCapitalize="none"
                editable={!isChecking && !isSubmitting}
              />

              <Pressable
                style={styles.duplicateButton}
                onPress={handleNicknameCheck}
                disabled={isChecking || isSubmitting}
              >
                <Text style={styles.duplicateButtonText}>
                  {isChecking ? "확인 중..." : "중복확인"}
                </Text>
              </Pressable>
            </View>

            {error ? <Text style={common.errorText}>{error}</Text> : null}

            {resultMessage ? (
              <Text
                style={{
                  color: resultType === "success" ? "green" : "#D93025",
                  marginTop: 6,
                  fontSize: 13,
                }}
              >
                {resultMessage}
              </Text>
            ) : null}
          </View>

          <Text style={styles.photoHint}>프로필 사진은 선택사항입니다.</Text>
        </ScrollView>

        {/* 가입 완료 버튼 */}
        <View style={common.footerBase}>
          <Pressable
            style={common.nextButton}
            onPress={handleComplete}
            disabled={isSubmitting || isChecking}
          >
            <Text style={common.nextButtonText}>
              {isSubmitting ? "가입 처리 중..." : "가입 완료"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
