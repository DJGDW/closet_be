
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import styles from "../styles/login.styles";

export default function LoginScreen() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleLogin() {
    if (isLoggingIn) return;

    if (!userId.trim() || !password) {
      setMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoggingIn(true);
    setMessage("로그인 중...");

    try {
      const response = await fetch(
        "http://192.168.0.5:8080/user/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId.trim(),
            userPw: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ?? "아이디 또는 비밀번호를 확인해주세요."
        );
        return;
      }

      if (!data.accessToken) {
        setMessage("로그인 응답에 토큰이 없습니다.");
        return;
      }

      const loginUser = JSON.stringify({
        userPk: data.userPk,
        userId: data.userId,
        nickname: data.nickname,
        tokenType: data.tokenType,
      });

      if (Platform.OS === "web") {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("loginUser", loginUser);
      } else {
        await SecureStore.setItemAsync(
          "accessToken",
          data.accessToken
        );
        await SecureStore.setItemAsync(
          "loginUser",
          loginUser
        );
      }

      setMessage("로그인 성공!");

      router.replace("/feed");
    } catch (error) {
      console.error("로그인 오류:", error);
      setMessage(
        "서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해주세요."
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <View style={styles.webBackground}>
      <View style={styles.screen}>
        <Image
          source={require("../../assets/images/stylink-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>
          나에게 맞는 스타일을 연결하다
        </Text>

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
            editable={!isLoggingIn}
            returnKeyType="next"
          />
        </View>

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
            editable={!isLoggingIn}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoggingIn}
          >
            <Text style={styles.showPassword}>
              {showPassword ? "숨기기" : "보기"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoggingIn}
        >
          <Text style={styles.loginButtonText}>
            {isLoggingIn ? "로그인 중..." : "로그인"}
          </Text>
        </Pressable>

        <View style={styles.links}>
          <Pressable
            onPress={() =>
              setMessage("아이디 찾기는 준비 중입니다.")
            }
          >
            <Text style={styles.linkText}>아이디 찾기</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setMessage("비밀번호 찾기는 준비 중입니다.")
            }
          >
            <Text style={styles.linkText}>비밀번호 찾기</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/signup-step1")}
          >
            <Text style={styles.signupText}>회원가입</Text>
          </Pressable>
        </View>

        {!!message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </View>
  );
}
