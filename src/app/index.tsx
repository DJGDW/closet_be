import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import styles from "../styles/login.styles";

export default function LoginScreen() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    if (!userId.trim() || !password) {
      setMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setMessage("로그인 중...");

    try {
      const response = await fetch(
        "http://192.168.219.107:8082:8080/user/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId.trim(),
            userPw: password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "아이디 또는 비밀번호를 확인해주세요.");
        return;
      }

      if (!data.accessToken) {
        setMessage("로그인 응답에 토큰이 없습니다.");
        return;
      }

      console.log("로그인 성공:", {
        userPk: data.userPk,
        userId: data.userId,
        nickname: data.nickname,
        tokenType: data.tokenType,
        expiresIn: data.expiresIn,
      });

      // 로그인 성공 시 피드 화면으로 이동
      router.replace("/feed");
    } catch (error) {
      console.error("로그인 요청 오류:", error);
      setMessage("서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해주세요.");
    }
  }

  return (
    <View style={styles.webBackground}>
      <View style={styles.screen}>
        {/* 로고 이미지 */}
        <Image
          source={require("../../assets/images/stylink-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* 로고 아래 문구 */}
        <Text style={styles.subtitle}>나에게 맞는 스타일을 연결하다</Text>

        {/* 아이디 */}
        <Text style={styles.idLabel}>아이디</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder="아이디를 입력해주세요"
            placeholderTextColor="#AAAAAA"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        {/* 비밀번호 */}
        <Text style={styles.passwordLabel}>비밀번호</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호를 입력해주세요"
            placeholderTextColor="#AAAAAA"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.showPassword}>
              {showPassword ? "숨기기" : "보기"}
            </Text>
          </Pressable>
        </View>

        {/* 로그인 버튼 */}
        <Pressable style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>로그인</Text>
        </Pressable>

        {/* 계정 링크 */}
        <View style={styles.links}>
          <Pressable onPress={() => setMessage("아이디 찾기는 준비 중입니다.")}>
            <Text style={styles.linkText}>아이디 찾기</Text>
          </Pressable>

          <Pressable
            onPress={() => setMessage("비밀번호 찾기는 준비 중입니다.")}
          >
            <Text style={styles.linkText}>비밀번호 찾기</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/signup-step1")}>
            <Text style={styles.signupText}>회원가입</Text>
          </Pressable>
        </View>

        {/* 오류 및 진행 메시지 */}
        {!!message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
}
