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
import styles from "../styles/signup-step1.styles";

type Gender = "male" | "female" | null;
type FieldKey =
  | "name"
  | "gender"
  | "birthDate"
  | "phone"
  | "userId"
  | "password"
  | "email";
type Errors = Partial<Record<FieldKey, string>>;
type IdResultType = "success" | "error" | "";

export default function SignupStep1() {
  const { data, updateData } = useSignup();

  const [errors, setErrors] = useState<Errors>({});
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [isIdAvailable, setIsIdAvailable] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState("");
  const [idResultMessage, setIdResultMessage] = useState("");
  const [idResultType, setIdResultType] = useState<IdResultType>("");

  const name = data.userName;
  const gender: Gender =
    data.gender === 0 ? "male" : data.gender === 1 ? "female" : null;
  const birthDate = data.birthDate;
  const phone = data.phoneNumber;
  const userId = data.userId;
  const password = data.userPw;
  const email = data.email;

  const setName = (value: string) => updateData({ userName: value });

  const setGender = (value: Gender) =>
    updateData({
      gender: value === "male" ? 0 : value === "female" ? 1 : null,
    });

  const setBirthDate = (value: string) => updateData({ birthDate: value });

  const setPhone = (value: string) => updateData({ phoneNumber: value });

  const setUserId = (value: string) => updateData({ userId: value });

  const setPassword = (value: string) => updateData({ userPw: value });

  const setEmail = (value: string) => updateData({ email: value });

  const clearError = (key: FieldKey) => {
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const formatBirthDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    if (digits.length <= 4) return digits;

    if (digits.length <= 6) {
      return `${digits.slice(0, 4)}.${digits.slice(4)}`;
    }

    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 3) return digits;

    if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const validate = () => {
    const next: Errors = {};

    if (!name.trim()) {
      next.name = "이름을 입력해주세요.";
    }

    if (!gender) {
      next.gender = "성별을 선택해주세요.";
    }

    const digits = birthDate.replace(/\D/g, "");

    if (digits.length !== 8) {
      next.birthDate = "생년월일 8자리를 입력해주세요.";
    } else {
      const y = Number(digits.slice(0, 4));
      const m = Number(digits.slice(4, 6));
      const d = Number(digits.slice(6, 8));
      const date = new Date(y, m - 1, d);

      if (
        date.getFullYear() !== y ||
        date.getMonth() !== m - 1 ||
        date.getDate() !== d
      ) {
        next.birthDate = "올바른 생년월일을 입력해주세요.";
      }
    }

    if (!/^01[016789]\d{7,8}$/.test(phone.replace(/\D/g, ""))) {
      next.phone = "올바른 휴대폰 번호를 입력해주세요.";
    }

    if (!/^[a-zA-Z0-9_]{4,20}$/.test(userId)) {
      next.userId = "아이디는 영문, 숫자, 밑줄로 4~20자 입력해주세요.";
    } else if (!isIdAvailable || checkedUserId !== userId.trim()) {
      next.userId = "아이디 중복확인을 진행해주세요.";
    }

    if (password.length < 8) {
      next.password = "비밀번호를 8자 이상 입력해주세요.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "올바른 이메일 주소를 입력해주세요.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // 아이디를 수정하면 기존 중복확인 결과 초기화
  const handleUserIdChange = (value: string) => {
    setUserId(value);
    setIsIdAvailable(false);
    setCheckedUserId("");
    setIdResultMessage("");
    setIdResultType("");
    clearError("userId");
  };

  // 실제 백엔드 아이디 중복확인 API
  const handleIdCheck = async () => {
    const trimmedUserId = userId.trim();

    setIdResultMessage("");
    setIdResultType("");
    setIsIdAvailable(false);
    setCheckedUserId("");
    clearError("userId");

    if (!/^[a-zA-Z0-9_]{4,20}$/.test(trimmedUserId)) {
      setErrors((prev) => ({
        ...prev,
        userId: "아이디는 영문, 숫자, 밑줄로 4~20자 입력해주세요.",
      }));
      return;
    }

    setIsCheckingId(true);

    try {
      const url = `http://192.168.0.5:8080/user/check-id?userId=${encodeURIComponent(trimmedUserId)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const available: unknown = await response.json();

      if (typeof available !== "boolean") {
        throw new Error("서버 응답 형식이 올바르지 않습니다.");
      }

      if (available) {
        setIsIdAvailable(true);
        setCheckedUserId(trimmedUserId);
        setIdResultMessage("사용 가능한 아이디입니다.");
        setIdResultType("success");
      } else {
        setIsIdAvailable(false);
        setCheckedUserId("");
        setIdResultMessage("이미 사용 중인 아이디입니다.");
        setIdResultType("error");
      }
    } catch (err) {
      console.error("아이디 중복확인 오류:", err);

      setIsIdAvailable(false);
      setCheckedUserId("");
      setIdResultMessage(
        "서버 연결에 실패했습니다. 백엔드 실행 상태와 API 주소를 확인해주세요.",
      );
      setIdResultType("error");
    } finally {
      setIsCheckingId(false);
    }
  };

  const handlePhoneVerification = () => {
    if (!/^01[016789]\d{7,8}$/.test(phone.replace(/\D/g, ""))) {
      setErrors((prev) => ({
        ...prev,
        phone: "올바른 휴대폰 번호를 입력해주세요.",
      }));
      return;
    }

    Alert.alert("휴대폰 인증", "휴대폰 인증 API가 아직 연결되지 않았습니다.");
  };

  const renderError = (key: FieldKey) =>
    errors[key] ? <Text style={common.errorText}>{errors[key]}</Text> : null;

  const renderField = (
    label: string,
    key: FieldKey,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    options: {
      secureTextEntry?: boolean;
      keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
      maxLength?: number;
    } = {},
  ) => (
    <View style={common.field} key={key}>
      <Text style={common.label}>
        {label}
        <Text style={styles.required}> *</Text>
      </Text>

      <TextInput
        style={[common.input, errors[key] ? common.inputError : null]}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          clearError(key);
        }}
        placeholder={placeholder}
        placeholderTextColor="#B8B8B8"
        secureTextEntry={options.secureTextEntry}
        keyboardType={options.keyboardType ?? "default"}
        maxLength={options.maxLength}
        autoCapitalize="none"
      />

      {renderError(key)}
    </View>
  );

  const renderActionField = (
    label: string,
    key: "phone" | "userId",
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    buttonText: string,
    onButtonPress: () => void,
  ) => (
    <View style={common.field} key={key}>
      <Text style={common.label}>
        {label}
        <Text style={styles.required}> *</Text>
      </Text>

      <View style={styles.actionRow}>
        <TextInput
          style={[
            common.input,
            styles.actionInput,
            errors[key] ? common.inputError : null,
          ]}
          value={value}
          onChangeText={(text) => {
            onChangeText(key === "phone" ? formatPhone(text) : text);
            clearError(key);
          }}
          placeholder={placeholder}
          placeholderTextColor="#B8B8B8"
          keyboardType={key === "phone" ? "phone-pad" : "default"}
          autoCapitalize="none"
          editable={key === "userId" ? !isCheckingId : true}
        />

        <Pressable
          style={styles.actionButton}
          onPress={onButtonPress}
          disabled={key === "userId" && isCheckingId}
        >
          <Text style={styles.actionButtonText}>
            {key === "userId" && isCheckingId ? "확인 중..." : buttonText}
          </Text>
        </Pressable>
      </View>

      {renderError(key)}

      {key === "userId" && idResultMessage ? (
        <Text
          style={{
            color: idResultType === "success" ? "green" : "#D93025",
            marginTop: 6,
            fontSize: 13,
          }}
        >
          {idResultMessage}
        </Text>
      ) : null}
    </View>
  );

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

          <Text style={common.stepText}>회원가입 1/4</Text>
        </View>

        <View style={common.progressRow}>
          <View style={[common.progressBar, common.progressActive]} />
          <View style={common.progressBar} />
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
            <Text style={common.heading}>기본정보</Text>
            <Text style={common.description}>
              회원가입을 위한 기본 정보를 입력해주세요.
            </Text>
          </View>

          {renderField("이름", "name", name, setName, "이름을 입력해주세요")}

          <View style={common.field}>
            <Text style={common.label}>
              성별<Text style={styles.required}> *</Text>
            </Text>

            <View style={styles.genderRow}>
              {(["male", "female"] as const).map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.genderOption,
                    gender === item ? styles.genderSelected : null,
                    errors.gender ? common.inputError : null,
                  ]}
                  onPress={() => {
                    setGender(item);
                    clearError("gender");
                  }}
                >
                  <View style={styles.radioOuter}>
                    {gender === item && <View style={styles.radioInner} />}
                  </View>

                  <Text style={styles.genderText}>
                    {item === "male" ? "남성" : "여성"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {renderError("gender")}
          </View>

          {renderField(
            "생년월일",
            "birthDate",
            birthDate,
            (value) => setBirthDate(formatBirthDate(value)),
            "YYYY.MM.DD",
            { keyboardType: "numeric", maxLength: 10 },
          )}

          {renderActionField(
            "휴대폰 번호",
            "phone",
            phone,
            setPhone,
            "010-0000-0000",
            "인증하기",
            handlePhoneVerification,
          )}

          {renderActionField(
            "아이디",
            "userId",
            userId,
            handleUserIdChange,
            "아이디를 입력해주세요",
            "중복확인",
            handleIdCheck,
          )}

          {renderField(
            "비밀번호",
            "password",
            password,
            setPassword,
            "비밀번호 8자 이상",
            { secureTextEntry: true },
          )}

          {renderField(
            "이메일",
            "email",
            email,
            setEmail,
            "이메일을 입력해주세요",
            { keyboardType: "email-address" },
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={common.footerBase}>
          <Pressable
            style={common.nextButton}
            onPress={() => {
              if (validate()) {
                router.push("/signup-step2");
              }
            }}
          >
            <Text style={common.nextButtonText}>다음</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
