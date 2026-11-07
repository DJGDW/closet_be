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

const PURPLE = "#51458C";
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

  const { roomPk, name, readOnly } = useLocalSearchParams<{
    roomPk: string;
    name: string;
    readOnly?: string;
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

  // 채팅방 -> orderPk -> 주문 상태 조회
  // (백엔드에 주문 단건 조회 API가 없어서 구매 목록 / 판매 목록에서 찾는다)
  const fetchOrderInfo = useCallback(async () => {
    if (!roomId) return;

    try {
      const [activeRes, historyRes] = await Promise.all([
        authFetch("/chat/rooms"),
        authFetch("/chat/rooms/history"),
      ]);

      const rooms: { roomPk: number; orderPk?: number | null }[] = [];
      for (const res of [activeRes, historyRes]) {
        if (res && res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) rooms.push(...list);
        }
      }

      const room = rooms.find((r) => String(r.roomPk) === String(roomId));
      const orderPk = room?.orderPk;

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
          <Ionicons name="chevron-back" size={26} color="#222222" />
        </Pressable>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {(name || "스").charAt(0)}
          </Text>
        </View>

        <Text style={styles.headerName} numberOfLines={1}>
          {name || "스타일리스트"}
        </Text>

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
                    isMine
                      ? styles.myMessageWrapper
                      : styles.otherMessageWrapper,
                  ]}
                >
                  {!isMine && (
                    <View style={styles.smallProfile}>
                      <Text style={styles.smallProfileText}>
                        {(item.senderNickname || name || "스").charAt(0)}
                      </Text>
                    </View>
                  )}

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

                    <Text style={styles.messageTime}>
                      {formatTime(item.sendAt)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>아직 메시지가 없습니다.</Text>
          }
        />
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
            <Text style={styles.removeImageText}>✕</Text>
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
            <Ionicons name="add" size={30} color="#111111" />
          </Pressable>

          <TextInput
            style={styles.textInput}
            placeholder="메시지를 입력하세요."
            placeholderTextColor="#AAAAAA"
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
              <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      )}

      {!isReadOnly && showExtras && (
        <View style={styles.extrasPanel}>
          <Pressable style={styles.extraItem} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={25} color={PURPLE} />
            <Text style={styles.extraLabel}>카메라</Text>
          </Pressable>

          <Pressable style={styles.extraItem} onPress={pickImage}>
            <Ionicons name="image-outline" size={25} color={PURPLE} />
            <Text style={styles.extraLabel}>사진</Text>
          </Pressable>

          <Pressable style={styles.extraItem} onPress={startVideoCall}>
            <Ionicons name="videocam-outline" size={25} color={PURPLE} />
            <Text style={styles.extraLabel}>영상통화</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    width: 30,
    height: 40,
    marginRight: 6,
    justifyContent: "center",
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E6E6E6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerAvatarText: {
    color: "#888888",
    fontSize: 14,
    fontWeight: "700",
  },
  headerName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
  },
  headerCloseButton: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: PURPLE,
  },
  headerCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  headerWaitingButton: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PURPLE,
  },
  headerWaitingButtonText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "700",
  },
  messageList: {
    padding: 14,
    paddingBottom: 20,
  },
  dateDivider: {
    textAlign: "center",
    fontSize: 11,
    color: "#999999",
    marginTop: 4,
    marginBottom: 14,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-end",
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
    backgroundColor: "#E6E6E6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  smallProfileText: {
    color: "#888888",
    fontWeight: "bold",
  },
  messageContent: {
    maxWidth: "75%",
  },
  myMessageContent: {
    alignItems: "flex-end",
  },
  otherMessageContent: {
    alignItems: "flex-start",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  myBubble: {
    backgroundColor: PURPLE,
  },
  otherBubble: {
    backgroundColor: "#EEEEEE",
  },
  sentImage: {
    width: 220,
    height: 220,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: "#EAEAEA",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#222222",
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
    color: "#AAAAAA",
    marginTop: 4,
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 6,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    minHeight: 46,
    backgroundColor: "#F2F2F2",
    borderRadius: 23,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222222",
  },
  extrasPanel: {
    flexDirection: "row",
    gap: 7,
    paddingLeft: 39,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
  },
  extraItem: {
    width: 67,
    height: 67,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  extraLabel: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "700",
    color: "#222222",
  },
  imagePreviewContainer: {
    position: "relative",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
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
    width: 28,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginBottom: 1,
  },
  disabledSendButton: {
    opacity: 0.4,
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
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    backgroundColor: "#F3F1FA",
    borderRadius: 12,
    alignItems: "center",
  },
  closeIncomingBanner: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    backgroundColor: "#F3F1FA",
    borderRadius: 12,
  },
  closeActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  closeRejectButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#222222",
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
    height: 40,
    backgroundColor: "#51458C",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  closeAcceptText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: "#999999",
    marginTop: 50,
  },
});
