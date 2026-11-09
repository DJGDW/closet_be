// 앱 전체에서 공통으로 쓰는 디자인 기준값 (색 / 둥글기 / 글자 크기 / 여백)
// 새 화면이나 수정하는 화면에서는 직접 색 코드를 쓰지 말고 여기 값을 가져다 쓰세요.

export const palette = {
  primary: "#51458C", // 메인 보라
  primaryDark: "#3F3570",
  primarySoft: "#F4F2FA", // 연한 보라 배경
  primaryLine: "#D9D4EC",

  text: "#1A1A1F", // 기본 글자
  textSub: "#6B6B76", // 보조 글자
  textMute: "#A1A1AB", // 흐린 글자 / 안내문

  line: "#ECECF1", // 구분선, 테두리
  surface: "#F6F6F9", // 카드/입력창 배경
  background: "#FFFFFF",

  danger: "#D14343",
  dangerSoft: "#FDECEC",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  caption: 11,
  small: 12,
  body: 14,
  title: 16,
  heading: 20,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;
