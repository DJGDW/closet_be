import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { palette } from "../../styles/theme";

const PURPLE = palette.primary;
const API_BASE_URL = "http://192.168.219.107:8080";

type ChatMessage = {
  msgPk: number;
  senderPk: number;
  senderNickname: string;
  senderProfilePic?: string | null;
  msgType: number;
  msgContent: string;
  sendAt: string;
  isRead: number;
  imageUrls?: string[];
};

type OrderInfo = {
  orderPk: number;
  processStatus: number;
  completionRequesterUserPk: number | null;
  orderName?: string;
  price?: number;
  isBuyer: boolean;
};

type LoginUser = {
  userPk: number;
  userId: string;
  nickname: string;
};

async function getAccessToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem("accessToken");
  }
  return SecureStore.getItemAsync("accessToken");
}

async function getLoginUser(): Promise<LoginUser | null> {
  try {
    let value: string | null;

    if (Platform.OS === "web") {
      value = localStorage.getItem("loginUser");
    } else {
      value = await SecureStore.getItemAsync("loginUser");
    }

    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function formatTime(value: string) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 웹에서도 보이도록 알림 표시 (React Native Alert는 웹에서 동작하지 않음)
function showMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function isSameDay(a: string, b: string) {
  const first = new Date(a);
  const second = new Date(b);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

// 날짜 구분선 문구: 오늘이면 "오늘", 아니면 "YYYY.MM.DD"
function formatDayLabel(value: string) {
  const date = new Date(value);

  if (isSameDay(value, new Date().toISOString())) {
    return "오늘";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}.${month}.${day}`;
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    roomPk,
    name,
    readOnly,
    stylistPk: stylistPkParam,
  } = useLocalSearchParams<{
    roomPk: string;
    name: string;
    readOnly?: string;
    stylistPk?: string;
  }>();

  const roomId = roomPk;
  const isReadOnly = readOnly === "true";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myUserPk, setMyUserPk] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionMessagePk, setActionMessagePk] = useState<number | null>(null);
  const [editingMessagePk, setEditingMessagePk] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [processingMessage, setProcessingMessage] = useState(false);
  // 서비스 종료(= 주문 완료) 요청 상태: 서버의 order.processStatus 기준
  // 1 진행중 / 2 완료요청됨 / 3 완료됨
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [closing, setClosing] = useState(false);
  // 문의 채팅방 여부 / 이 문의가 연결된 스타일리스트 PK (서비스 등록하기 버튼용)
  const [isInquiryRoom, setIsInquiryRoom] = useState(false);
  const [inquiryStylistPk, setInquiryStylistPk] = useState<string>(
    stylistPkParam ? String(stylistPkParam) : "",
  );
  const handledCompletedRef = useRef(false);

  const closeRequestState: "idle" | "waiting" | "incoming" =
    !orderInfo || myUserPk === null
      ? "idle"
      : orderInfo.processStatus === 2
        ? orderInfo.completionRequesterUserPk === myUserPk
          ? "waiting"
          : "incoming"
        : "idle";

  const authFetch = useCallback(async (path: string, init?: RequestInit) => {
    const token = await getAccessToken();
    if (!token) return null;

    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  }, []);

  // 채팅 목록에서 다시 들어와도 버튼이 동작하도록 방별 스타일리스트 PK를 기기에 기억
  useEffect(() => {
    if (!roomId) return;
    const key = `inquiryStylist_${roomId}`;

    (async () => {
      try {
        if (stylistPkParam) {
          const value = String(stylistPkParam);
          if (Platform.OS === "web") localStorage.setItem(key, value);
          else await SecureStore.setItemAsync(key, value);
          return;
        }

        const saved =
          Platform.OS === "web"
            ? localStorage.getItem(key)
            : await SecureStore.getItemAsync(key);
        if (saved) setInquiryStylistPk((prev) => prev || saved);
      } catch (error) {
        console.error("스타일리스트 정보 저장/조회 실패:", error);
      }
    })();
  }, [roomId, stylistPkParam]);

  // 문의 채팅방에서 서비스 등록하기: 스타일리스트 프로필(플랜 선택 → 결제)로 이동
  const goToRegisterService = () => {
    if (!inquiryStylistPk) {
      const msg =
        "스타일리스트 정보를 찾지 못했어요. 스타일리스트 프로필에서 서비스를 신청해 주세요.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("알림", msg);
      return;
    }

    router.push(`/stylist/${inquiryStylistPk}` as any);
  };

  // 채팅방 -> orderPk -> 주문 상태 조회
  // (백엔드에 주문 단건 조회 API가 없어서 구매 목록 / 판매 목록에서 찾는다)
  const fetchOrderInfo = useCallback(async () => {
    if (!roomId) return;

    try {
      const [activeRes, historyRes] = await Promise.all([
        authFetch("/chat/rooms"),
        authFetch("/chat/rooms/history"),
      ]);

      const rooms: {
        roomPk: number;
        orderPk?: number | null;
        roomType?: number;
        stylistPk?: number | null;
      }[] = [];
      for (const res of [activeRes, historyRes]) {
        if (res && res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) rooms.push(...list);
        }
      }

      const room = rooms.find((r) => String(r.roomPk) === String(roomId));
      const orderPk = room?.orderPk;

      setIsInquiryRoom(!!room && !orderPk && Number(room.roomType) === 1);

      // 백엔드가 방 목록에 stylistPk를 내려주면 그 값을 우선 사용
      if (room?.stylistPk != null) {
        setInquiryStylistPk(String(room.stylistPk));
      }

      if (!orderPk) {
        setOrderInfo(null); // 문의 채팅방: 서비스 종료 대상 아님
        return;
      }

      const [buyRes, saleRes] = await Promise.all([
        authFetch("/order"),
        authFetch("/order/sales"),
      ]);

      let found: OrderInfo | null = null;

      if (buyRes && buyRes.ok) {
        const list = await buyRes.json();
        const order = Array.isArray(list)
          ? list.find((o: any) => o.orderPk === orderPk)
          : null;
        if (order) {
          found = {
            orderPk,
            processStatus: order.processStatus,
            completionRequesterUserPk: order.completionRequesterUserPk ?? null,
            orderName: order.orderName,
            price: order.price,
            isBuyer: true,
          };
        }
      }

      if (!found && saleRes && saleRes.ok) {
        const list = await saleRes.json();
        const order = Array.isArray(list)
          ? list.find((o: any) => o.orderPk === orderPk)
          : null;
        if (order) {
          found = {
            orderPk,
            processStatus: order.processStatus,
            completionRequesterUserPk: order.completionRequesterUserPk ?? null,
            orderName: order.orderName,
            price: order.price,
            isBuyer: false,
          };
        }
      }

      setOrderInfo(found);
    } catch (error) {
      console.error("주문 상태 조회 오류:", error);
    }
  }, [roomId, authFetch]);

  const goToServiceComplete = useCallback(
    (info: OrderInfo) => {
      router.replace({
        pathname: "/chat/complete",
        params: {
          name: String(name || "스타일리스트"),
          stylistName: String(name || "스타일리스트"),
          roomPk: String(roomId || ""),
          orderPk: String(info.orderPk),
          serviceName: info.orderName || "스타일링 서비스",
          useDate: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
          method: "채팅 상담",
        },
      } as any);
    },
    [router, name, roomId],
  );

  // 주문이 완료(3)되면 구매자는 완료 화면으로, 스타일리스트는 채팅 목록으로 이동
  useEffect(() => {
    if (!orderInfo || orderInfo.processStatus !== 3) return;
    if (isReadOnly || handledCompletedRef.current) return;
    handledCompletedRef.current = true;

    if (orderInfo.isBuyer) {
      goToServiceComplete(orderInfo);
    } else {
      showMessage("서비스 종료", "서비스가 종료되었어요.");
      router.replace("/chat");
    }
  }, [orderInfo, isReadOnly, goToServiceComplete, router]);

  // 요청 / 수락 / 거절 공통 호출
  const callCompletionApi = async (
    action: "request" | "confirm" | "reject",
    successMessage?: string,
  ) => {
    if (!orderInfo || closing) return;

    try {
      setClosing(true);

      const response = await authFetch(
        `/order/${orderInfo.orderPk}/complete/${action}`,
        { method: "PATCH" },
      );

      if (!response) {
        showMessage("로그인 필요", "로그인 후 이용해주세요.");
        router.replace("/");
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error("서비스 종료 API 실패:", response.status, text);
        showMessage("오류", `처리에 실패했어요. (${response.status})`);
        return;
      }

      if (successMessage) showMessage("서비스 종료", successMessage);
      await fetchOrderInfo();
    } catch (error) {
      console.error("서비스 종료 API 오류:", error);
      showMessage("오류", "서버 연결에 실패했어요.");
    } finally {
      setClosing(false);
    }
  };

  const requestServiceClose = () => {
    const run = () =>
      callCompletionApi("request", "상대방에게 서비스 종료를 요청했어요.");

    if (Platform.OS === "web") {
      if (window.confirm("상대방에게 서비스 종료를 요청할까요?")) run();
    } else {
      Alert.alert("서비스 종료", "상대방에게 서비스 종료를 요청할까요?", [
        { text: "취소", style: "cancel" },
        { text: "종료 요청", onPress: run },
      ]);
    }
  };

  const acceptServiceClose = () => callCompletionApi("confirm");
  const rejectServiceClose = () =>
    callCompletionApi("reject", "서비스 종료 요청을 거절했어요.");

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const token = await getAccessToken();

      if (!token) {
        Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
        router.replace("/");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/chat/${roomId}/messages`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        Alert.alert("인증 만료", "다시 로그인해주세요.");
        router.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error(`메시지 조회 실패 (${response.status})`);
      }

      const data: ChatMessage[] = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("메시지 조회 오류:", error);
      Alert.alert("오류", "메시지를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [roomId, router]);

  const markAsRead = useCallback(async () => {
    if (!roomId) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      await fetch(`${API_BASE_URL}/chat/${roomId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("읽음 처리 오류:", error);
    }
  }, [roomId]);

  useEffect(() => {
    getLoginUser().then((user) => {
      if (user?.userPk) setMyUserPk(user.userPk);
    });

    fetchMessages();
    markAsRead();
  }, [fetchMessages, markAsRead]);

  // 서비스 종료 요청 상태 불러오기 + 상대방 응답 확인을 위해 5초마다 갱신
  useEffect(() => {
    if (isReadOnly) return;

    fetchOrderInfo();
    const timer = setInterval(fetchOrderInfo, 5000);
    return () => clearInterval(timer);
  }, [fetchOrderInfo, isReadOnly]);

  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showExtras, setShowExtras] = useState(false);

  const pickImage = async () => {
    setShowExtras(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    setShowExtras(false);

    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          showMessage(
            "카메라 접근 권한",
            "사진을 촬영하려면 카메라 접근 권한이 필요해요.",
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("카메라 실행 오류:", error);
      showMessage("오류", "카메라를 실행하지 못했어요.");
    }
  };

  // 플랜 업그레이드: 구매자 + 서비스 진행 중(processStatus 1)일 때만 가능
  const canUpgradePlan =
    !!orderInfo && orderInfo.isBuyer && orderInfo.processStatus === 1;

  const goToUpgradePlan = () => {
    if (!orderInfo) return;
    setShowExtras(false);

    router.push({
      pathname: "/chat/upgrade-payment",
      params: {
        orderPk: String(orderInfo.orderPk),
        currentPlanTier: String(orderInfo.orderName || ""),
        currentPrice: String(orderInfo.price ?? ""),
        stylistName: String(name || "스타일리스트"),
        roomPk: String(roomId || ""),
      },
    } as any);
  };

  const startVideoCall = () => {
    setShowExtras(false);
    showMessage("영상통화", "영상통화 기능은 준비 중이에요.");
  };

  const sendMessage = async () => {
    const trimmed = input.trim();

    if (!trimmed || sending || !roomId) return;

    setSending(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/chat/${roomId}/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          msgContent: trimmed,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `전송 실패 (${response.status})`);
      }

      setInput("");
      await fetchMessages();
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      Alert.alert(
        "전송 실패",
        "메시지를 보내지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setSending(false);
    }
  };

  const updateMessage = async (msgPk: number) => {
    const trimmed = editText.trim();
    if (!trimmed || processingMessage || !roomId) return;

    setProcessingMessage(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/chat/${roomId}/message/${msgPk}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ msgContent: trimmed }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `수정 실패 (${response.status})`);
      }

      setEditingMessagePk(null);
      setActionMessagePk(null);
      setEditText("");
      await fetchMessages();
    } catch (error) {
      console.error("메시지 수정 오류:", error);
      Alert.alert("수정 실패", "메시지를 수정하지 못했습니다.");
    } finally {
      setProcessingMessage(false);
    }
  };

  const deleteMessage = async (msgPk: number) => {
    if (processingMessage || !roomId) return;

    const confirmed =
      Platform.OS === "web"
        ? window.confirm("이 메시지를 삭제할까요?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("메시지 삭제", "이 메시지를 삭제할까요?", [
              { text: "취소", style: "cancel", onPress: () => resolve(false) },
              {
                text: "삭제",
                style: "destructive",
                onPress: () => resolve(true),
              },
            ]);
          });
    if (!confirmed) return;

    setProcessingMessage(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/chat/${roomId}/message/${msgPk}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `삭제 실패 (${response.status})`);
      }

      setActionMessagePk(null);
      await fetchMessages();
    } catch (error) {
      console.error("메시지 삭제 오류:", error);
      Alert.alert("삭제 실패", "메시지를 삭제하지 못했습니다.");
    } finally {
      setProcessingMessage(false);
    }
  };

  const sendImage = async () => {
    if (!selectedImage || sending || !roomId) return;

    setSending(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
        return;
      }

      const formData = new FormData();

      if (Platform.OS === "web") {
        const imageResponse = await fetch(selectedImage.uri);
        const blob = await imageResponse.blob();

        formData.append(
          "images",
          new File([blob], selectedImage.fileName || "image.jpg", {
            type: blob.type || "image/jpeg",
          }),
        );
      } else {
        formData.append("images", {
          uri: selectedImage.uri,
          name: selectedImage.fileName || "image.jpg",
          type: selectedImage.mimeType || "image/jpeg",
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/chat/${roomId}/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `이미지 전송 실패 (${response.status})`);
      }

      setSelectedImage(null);
      await fetchMessages();
    } catch (error) {
      console.error("이미지 전송 오류:", error);
      Alert.alert(
        "전송 실패",
        "이미지를 보내지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60 + insets.top}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: 60 + insets.top },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="chevron-back" size={26} color={palette.text} />
        </Pressable>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {(name || "스").charAt(0)}
          </Text>
        </View>

        <View style={styles.headerTextArea}>
          <Text style={styles.headerName} numberOfLines={1}>
            {name || "스타일리스트"}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {isReadOnly
              ? "종료된 채팅"
              : orderInfo
                ? "서비스 진행중"
                : isInquiryRoom
                  ? "문의 상담"
                  : "스타일링 상담"}
          </Text>
        </View>

        {!isReadOnly && orderInfo && closeRequestState === "idle" && (
          <Pressable
            style={styles.headerCloseButton}
            onPress={requestServiceClose}
            disabled={closing}
          >
            <Text style={styles.headerCloseButtonText}>서비스 종료</Text>
          </Pressable>
        )}
      </View>

      {!isReadOnly && isInquiryRoom && !orderInfo && (
        <View style={styles.registerBanner}>
          <View style={styles.registerTextArea}>
            <Text style={styles.registerTitle}>서비스를 시작해 볼까요?</Text>
            <Text style={styles.registerDesc}>
              플랜을 고르고 바로 결제할 수 있어요
            </Text>
          </View>

          <Pressable
            style={styles.registerButton}
            onPress={goToRegisterService}
            accessibilityRole="button"
            accessibilityLabel="서비스 등록하기"
          >
            <Text style={styles.registerButtonText}>등록하기</Text>
          </Pressable>
        </View>
      )}

      {!isReadOnly && closeRequestState === "waiting" && (
        <View style={styles.closeWaitingBanner}>
          <Text style={styles.closeWaitingTitle}>
            서비스 종료 요청을 보냈어요
          </Text>
          <Text style={styles.closeWaitingDesc}>
            상대방이 수락하면 서비스가 종료돼요.
          </Text>
        </View>
      )}

      {!isReadOnly && closeRequestState === "incoming" && (
        <View style={styles.closeIncomingBanner}>
          <Text style={styles.closeWaitingTitle}>
            상대방이 서비스 종료를 요청했어요
          </Text>
          <Text style={styles.closeWaitingDesc}>
            수락하면 서비스가 종료되고 채팅이 닫혀요.
          </Text>
          <View style={styles.closeActions}>
            <Pressable
              style={styles.closeRejectButton}
              onPress={rejectServiceClose}
              disabled={closing}
            >
              <Text style={styles.closeRejectText}>거절</Text>
            </Pressable>
            <Pressable
              style={styles.closeAcceptButton}
              onPress={acceptServiceClose}
              disabled={closing}
            >
              <Text style={styles.closeAcceptText}>수락</Text>
            </Pressable>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.msgPk)}
          contentContainerStyle={styles.messageList}
          inverted={false}
          renderItem={({ item, index }) => {
            const isMine = myUserPk !== null && item.senderPk === myUserPk;
            const previous = index > 0 ? messages[index - 1] : null;
            const showDateDivider =
              !previous || !isSameDay(previous.sendAt, item.sendAt);

            // 같은 사람이 같은 시각에 연달아 보낸 메시지는 하나로 묶어서 보여준다 (표시만)
            const next =
              index < messages.length - 1 ? messages[index + 1] : null;
            const sameMinute = (a: string, b: string) =>
              formatTime(a) === formatTime(b) && isSameDay(a, b);
            const isFirstOfGroup =
              showDateDivider ||
              !previous ||
              previous.senderPk !== item.senderPk ||
              !sameMinute(previous.sendAt, item.sendAt);
            const isLastOfGroup =
              !next ||
              next.senderPk !== item.senderPk ||
              !sameMinute(next.sendAt, item.sendAt);

            return (
              <View>
                {showDateDivider && (
                  <Text style={styles.dateDivider}>
                    {formatDayLabel(item.sendAt)}
                  </Text>
                )}
                <View
                  style={[
                    styles.messageWrapper,
                    !isLastOfGroup && styles.messageWrapperGrouped,
                    isMine
                      ? styles.myMessageWrapper
                      : styles.otherMessageWrapper,
                  ]}
                >
                  {!isMine &&
                    (isFirstOfGroup ? (
                      <View style={styles.smallProfile}>
                        <Text style={styles.smallProfileText}>
                          {(item.senderNickname || name || "스").charAt(0)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.smallProfileSpacer} />
                    ))}

                  <View
                    style={[
                      styles.messageContent,
                      isMine
                        ? styles.myMessageContent
                        : styles.otherMessageContent,
                    ]}
                  >
                    <Pressable
                      onPress={() => {
                        if (isMine && !isReadOnly) {
                          setActionMessagePk(
                            actionMessagePk === item.msgPk ? null : item.msgPk,
                          );
                        }
                      }}
                      onLongPress={() => {
                        if (isMine && !isReadOnly)
                          setActionMessagePk(item.msgPk);
                      }}
                      style={[
                        styles.bubble,
                        isMine ? styles.myBubble : styles.otherBubble,
                        isLastOfGroup
                          ? isMine
                            ? styles.myBubbleTail
                            : styles.otherBubbleTail
                          : null,
                      ]}
                    >
                      {editingMessagePk === item.msgPk ? (
                        <View style={styles.editBox}>
                          <TextInput
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            style={styles.editInput}
                          />
                          <View style={styles.editActions}>
                            <Pressable
                              onPress={() => {
                                setEditingMessagePk(null);
                                setActionMessagePk(null);
                              }}
                            >
                              <Text style={styles.editCancel}>취소</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => updateMessage(item.msgPk)}
                              disabled={!editText.trim() || processingMessage}
                            >
                              <Text style={styles.editSave}>
                                {processingMessage ? "완료 중" : "완료"}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : item.imageUrls && item.imageUrls.length > 0 ? (
                        <View>
                          {item.imageUrls.map((imageUrl, index) => (
                            <Image
                              key={`${item.msgPk}-${index}`}
                              source={{ uri: imageUrl }}
                              style={styles.sentImage}
                              resizeMode="cover"
                            />
                          ))}
                          {!!item.msgContent && (
                            <Text
                              style={[
                                styles.messageText,
                                isMine
                                  ? styles.myMessageText
                                  : styles.otherMessageText,
                              ]}
                            >
                              {item.msgContent}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.messageText,
                            isMine
                              ? styles.myMessageText
                              : styles.otherMessageText,
                          ]}
                        >
                          {item.msgContent}
                        </Text>
                      )}
                    </Pressable>

                    {!isReadOnly &&
                      isMine &&
                      actionMessagePk === item.msgPk &&
                      editingMessagePk !== item.msgPk && (
                        <View style={styles.messageActions}>
                          {!item.imageUrls?.length && (
                            <Pressable
                              onPress={() => {
                                setEditText(item.msgContent);
                                setEditingMessagePk(item.msgPk);
                              }}
                            >
                              <Text style={styles.actionText}>수정</Text>
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => deleteMessage(item.msgPk)}
                            disabled={processingMessage}
                          >
                            <Text style={styles.deleteActionText}>
                              {processingMessage ? "처리 중" : "삭제"}
                            </Text>
                          </Pressable>
                        </View>
                      )}

                    {isLastOfGroup && (
                      <Text style={styles.messageTime}>
                        {formatTime(item.sendAt)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCircle}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={28}
                  color={PURPLE}
                />
              </View>
              <Text style={styles.emptyText}>아직 메시지가 없습니다.</Text>
              <Text style={styles.emptySub}>먼저 인사를 건네 보세요 👋</Text>
            </View>
          }
        />
      )}

      {isReadOnly && (
        <View
          style={[styles.readOnlyBar, { paddingBottom: 12 + insets.bottom }]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={14}
            color={palette.textSub}
          />
          <Text style={styles.readOnlyText}>종료된 채팅은 읽기만 가능해요</Text>
        </View>
      )}

      {!isReadOnly && selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />

          <Pressable
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {!isReadOnly && (
        <View style={styles.inputContainer}>
          <Pressable
            style={styles.imageButton}
            onPress={() => setShowExtras((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={
              showExtras ? "부가 기능 닫기" : "부가 기능 열기"
            }
          >
            <Ionicons
              name={showExtras ? "close" : "add"}
              size={24}
              color={palette.primary}
            />
          </Pressable>

          <TextInput
            style={styles.textInput}
            placeholder="메시지를 입력하세요."
            placeholderTextColor={palette.textMute}
            value={input}
            onChangeText={setInput}
            onFocus={() => setShowExtras(false)}
            multiline
          />

          <Pressable
            style={[
              styles.sendButton,
              ((!input.trim() && !selectedImage) || sending) &&
                styles.disabledSendButton,
            ]}
            onPress={selectedImage ? sendImage : sendMessage}
            disabled={(!input.trim() && !selectedImage) || sending}
            accessibilityRole="button"
            accessibilityLabel={selectedImage ? "사진 전송" : "메시지 전송"}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="arrow-up"
                size={20}
                color={
                  (!input.trim() && !selectedImage) || sending
                    ? palette.textMute
                    : "#FFFFFF"
                }
              />
            )}
          </Pressable>
        </View>
      )}

      {!isReadOnly && showExtras && (
        <View style={styles.extrasPanel}>
          <Pressable style={styles.extraItem} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color={PURPLE} />
            <Text style={styles.extraLabel}>카메라</Text>
          </Pressable>

          <Pressable style={styles.extraItem} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={PURPLE} />
            <Text style={styles.extraLabel}>사진</Text>
          </Pressable>

          <Pressable style={styles.extraItem} onPress={startVideoCall}>
            <Ionicons name="videocam-outline" size={24} color={PURPLE} />
            <Text style={styles.extraLabel}>영상통화</Text>
          </Pressable>

          {canUpgradePlan && (
            <Pressable style={styles.extraItem} onPress={goToUpgradePlan}>
              <Ionicons
                name="arrow-up-circle-outline"
                size={25}
                color={PURPLE}
              />
              <Text style={styles.extraLabel}>업그레이드</Text>
            </Pressable>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FB",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: palette.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  backButton: {
    width: 34,
    height: 40,
    marginRight: 4,
    justifyContent: "center",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.primaryLine,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerAvatarText: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  headerTextArea: {
    flexShrink: 1,
    justifyContent: "center",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
  },
  headerSub: {
    fontSize: 11,
    color: palette.textMute,
    marginTop: 1,
  },
  headerCloseButton: {
    marginLeft: "auto",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PURPLE,
  },
  headerCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  registerBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 2,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 16,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.primaryLine,
  },
  registerTextArea: {
    flex: 1,
    marginRight: 8,
  },
  registerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.text,
  },
  registerDesc: {
    fontSize: 11.5,
    color: palette.textSub,
    marginTop: 2,
  },
  registerButton: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  headerWaitingButton: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PURPLE,
  },
  headerWaitingButtonText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "700",
  },
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
  },
  dateDivider: {
    alignSelf: "center",
    overflow: "hidden",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: palette.textSub,
    backgroundColor: "#ECECF3",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
    marginBottom: 16,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-start",
  },
  messageWrapperGrouped: {
    marginBottom: 3,
  },
  myMessageWrapper: {
    justifyContent: "flex-end",
  },
  otherMessageWrapper: {
    justifyContent: "flex-start",
  },
  smallProfile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.primaryLine,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  smallProfileSpacer: {
    width: 32,
    marginRight: 8,
  },
  smallProfileText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  messageContent: {
    maxWidth: "76%",
  },
  myMessageContent: {
    alignItems: "flex-end",
  },
  otherMessageContent: {
    alignItems: "flex-start",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  myBubbleTail: {
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
  },
  otherBubbleTail: {
    borderBottomLeftRadius: 6,
  },
  sentImage: {
    width: 220,
    height: 220,
    borderRadius: 14,
    marginBottom: 4,
    backgroundColor: palette.line,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 21,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: palette.text,
  },
  messageActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 5,
  },
  actionText: {
    color: "#777777",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  deleteActionText: {
    color: "#E54848",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  editBox: {
    minWidth: 180,
  },
  editInput: {
    minWidth: 180,
    maxWidth: 260,
    minHeight: 50,
    color: "#222222",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 14,
    marginTop: 8,
  },
  editCancel: {
    color: "#FFFFFF",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  editSave: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  messageTime: {
    fontSize: 10,
    color: palette.textMute,
    marginTop: 4,
    marginHorizontal: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: palette.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    minHeight: 44,
    backgroundColor: palette.surface,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.text,
  },
  extrasPanel: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 20,
    backgroundColor: palette.background,
  },
  extraItem: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  extraLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: palette.text,
  },
  imagePreviewContainer: {
    position: "relative",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: palette.background,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 14,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    left: 100,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: palette.line,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  serviceCloseButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    height: 44,
    borderWidth: 1,
    borderColor: "#51458C",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  serviceCloseButtonText: {
    color: "#51458C",
    fontSize: 14,
    fontWeight: "700",
  },
  closeWaitingBanner: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 2,
    padding: 14,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.primaryLine,
    borderRadius: 16,
    alignItems: "center",
  },
  closeIncomingBanner: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 2,
    padding: 14,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.primaryLine,
    borderRadius: 16,
  },
  closeActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  closeRejectButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.primaryLine,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  closeRejectText: { color: "#222222", fontWeight: "700", fontSize: 14 },
  closeWaitingTitle: {
    color: "#51458C",
    fontWeight: "700",
    fontSize: 14,
  },
  closeWaitingDesc: {
    color: "#777777",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  closeCancelButton: {
    marginTop: 8,
    padding: 6,
  },
  closeCancelText: {
    color: "#777777",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  closeActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  closeDeclineButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#AAAAAA",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  closeDeclineText: {
    color: "#666666",
    fontWeight: "600",
  },
  closeAcceptButton: {
    flex: 1,
    height: 42,
    backgroundColor: PURPLE,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeAcceptText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: palette.textMute,
  },
  readOnlyBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 12,
    backgroundColor: palette.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
  },
  readOnlyText: {
    fontSize: 12.5,
    color: palette.textSub,
  },
});
