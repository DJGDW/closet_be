// API 서버 주소는 프로젝트 루트의 .env (EXPO_PUBLIC_API_URL)에서만 바꾼다.
const rawUrl = process.env.EXPO_PUBLIC_API_URL;

if (!rawUrl) {
  console.error(
    "EXPO_PUBLIC_API_URL이 설정되지 않았어요. 루트의 .env 파일을 확인하세요.",
  );
}

export const API_BASE_URL = (rawUrl ?? "").replace(/\/+$/, "");

// http -> ws, https -> wss 로 바꿔서 WebSocket 주소를 자동으로 만든다
export const WS_URL = `${API_BASE_URL.replace(/^http/, "ws")}/ws`;