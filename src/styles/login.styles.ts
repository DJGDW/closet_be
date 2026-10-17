import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  webBackground: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F2",
  },

  // Figma 프레임: 402 × 874 비율
  screen: {
    width: "100%",
    maxWidth: 402,
    aspectRatio: 402 / 874,
    backgroundColor: "#FFFFFF",
    position: "relative",
    overflow: "hidden",
  },

  // 로고 이미지
  logoImage: {
    position: "absolute",
    left: "29.1%",
    top: "11.33%",
    width: "41.55%",
    height: "6.38%",
  },

  // 로고 아래 문구
  subtitle: {
    position: "absolute",
    left: "32.59%",
    top: "18.65%",
    width: "35.07%",
    height: "1.49%",
    fontSize: 11,
    lineHeight: 13,
    color: "#888888",
    textAlign: "center",
    includeFontPadding: false,
  },

  // 아이디 라벨
  idLabel: {
    position: "absolute",
    left: "4.98%",
    top: "25.51%",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    color: "#222222",
    includeFontPadding: false,
  },

  // 아이디 입력창
  inputContainer: {
    position: "absolute",
    left: "4.98%",
    top: "28.03%",
    width: "90.04%",
    height: "5.49%",
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  input: {
    width: "100%",
    height: "100%",
    paddingHorizontal: "3.87%",
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    fontSize: 13,
    lineHeight: 15,
    color: "#222222",
  },

  // 비밀번호 라벨
  passwordLabel: {
    position: "absolute",
    left: "4.98%",
    top: "35.58%",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    color: "#222222",
    includeFontPadding: false,
  },

  // 비밀번호 입력창 바깥 테두리
  passwordContainer: {
    position: "absolute",
    left: "4.98%",
    top: "38.1%",
    width: "90.04%",
    height: "5.49%",
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: "3.87%",
    paddingRight: "4.5%",
    backgroundColor: "#FFFFFF",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 13,
    lineHeight: 15,
    color: "#222222",
    includeFontPadding: false,
  },

  showPassword: {
    fontSize: 10,
    lineHeight: 11,
    color: "#888888",
    includeFontPadding: false,
  },

  // 로그인 버튼
  loginButton: {
    position: "absolute",
    left: "4.98%",
    top: "46.34%",
    width: "90.04%",
    height: "5.69%",
    borderRadius: 7,
    backgroundColor: "#4D458B",
    justifyContent: "center",
    alignItems: "center",
  },

  loginButtonText: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    includeFontPadding: false,
  },

  // 계정 링크
  links: {
    position: "absolute",
    left: "21.39%",
    top: "54.58%",
    width: "55.6%",
    height: "1.49%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  linkText: {
    fontSize: 11,
    lineHeight: 13,
    color: "#777777",
    textAlign: "center",
    includeFontPadding: false,
  },

  signupText: {
    fontSize: 11,
    lineHeight: 13,
    color: "#777777",
    textAlign: "center",
    includeFontPadding: false,
  },

  separator: {
    display: "none",
  },

  // 오류 메시지
  message: {
    position: "absolute",
    left: "15%",
    top: "59.95%",
    width: "70%",
    fontSize: 11,
    lineHeight: 13,
    color: "#CC4444",
    textAlign: "center",
    includeFontPadding: false,
  },
});

export default styles;
