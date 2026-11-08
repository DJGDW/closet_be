
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
import { Client } from "@stomp/stompjs";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PURPLE = "#8B5CF6";
const API_BASE_URL = "http://192.168.0.5:8080";

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

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
  const [calling, setCalling] = useState(false);

  const handledCallEvents = useRef(new Set<string>());

  const [closeRequestState, setCloseRequestState] = useState<
    "idle" | "waiting" | "incoming"
  >("idle");

  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // --------------------------------------------------
  // 영상통화 화면 이동
  // --------------------------------------------------

  const navigateToVideoCall = useCallback(
    (callPk: number, isCaller: boolean) => {
      router.push({
        pathname: "/video-call",
        params: {
          roomPk: String(roomId),
          callPk: String(callPk),
          isCaller: String(isCaller),
        },
      });
    },
    [roomId, router]
  );

  // --------------------------------------------------
  // 영상통화 수락 / 거절 REST API
  // --------------------------------------------------

  const respondToVideoCall = useCallback(
    async (callPk: number, action: "accept" | "reject") => {
      try {
        const token = await getAccessToken();

        if (!token) {
          Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
          return;
        }

        const requestUrl =
          `${API_BASE_URL}/chat/${roomId}/video-call/${callPk}/${action}`;

        console.log("영상통화 응답 요청:", requestUrl);

        const response = await fetch(requestUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const responseText = await response.text();

        console.log("영상통화 응답 상태:", response.status);
        console.log("영상통화 응답 내용:", responseText);

        let result: any = null;

        try {
          result = responseText ? JSON.parse(responseText) : null;
        } catch {
          result = responseText;
        }

        if (!response.ok) {
  console.error("========== 영상통화 요청 실패 ==========");
  console.error("요청 URL:", `${API_BASE_URL}/chat/${roomId}/video-call`);
  console.error("HTTP 상태:", response.status);
  console.error("서버 원본 응답:", responseText);
  console.error("파싱된 응답:", result);
  console.error("========================================");

  throw new Error(
    responseText || `통화 요청 실패 (${response.status})`
  );
}

        if (action === "accept") {
          console.log("영상통화 수락 성공:", callPk);

          navigateToVideoCall(callPk, false);
          return;
        }

        Alert.alert("영상통화", "요청을 거절했습니다.");
      } catch (error) {
        console.error("영상통화 응답 오류:", error);

        Alert.alert(
          "영상통화 응답 실패",
          error instanceof Error
            ? error.message
            : "서버와 통신할 수 없습니다."
        );
      }
    },
    [roomId, navigateToVideoCall]
  );

  // --------------------------------------------------
  // 영상통화 WebSocket 이벤트 처리
  // --------------------------------------------------

  const handleVideoCallEvent = useCallback(
    (event: any) => {
      console.log("영상통화 WebSocket 이벤트:", event);

      // WebRTC OFFER / ANSWER / ICE는 이 화면에서 처리하지 않음
      if (event.signalType) {
        return;
      }

      const callPk = Number(event.callPk);
      const initiatorUserPk = Number(event.initiatorUserPk);
      const callStatus = Number(event.callStatus);

      if (!callPk || !myUserPk) {
        console.log("영상통화 이벤트 필수값 누락:", event);
        return;
      }

      const eventKey = `${callPk}-${callStatus}`;

      if (handledCallEvents.current.has(eventKey)) {
        return;
      }

      handledCallEvents.current.add(eventKey);

      // 0: REQUESTED
      // 상대방이 나에게 영상통화를 요청한 경우
      if (callStatus === 0 && initiatorUserPk !== myUserPk) {
        const accept = async () => {
          await respondToVideoCall(callPk, "accept");
        };

        const reject = async () => {
          await respondToVideoCall(callPk, "reject");
        };

        if (Platform.OS === "web") {
          const confirmed = window.confirm(
            "영상통화 요청이 왔습니다. 수락할까요?"
          );

          if (confirmed) {
            accept();
          } else {
            reject();
          }
        } else {
          Alert.alert(
            "영상통화 요청",
            "상대방이 영상통화를 요청했습니다.",
            [
              {
                text: "거절",
                style: "cancel",
                onPress: reject,
              },
              {
                text: "수락",
                onPress: accept,
              },
            ],
            { cancelable: false }
          );
        }

        return;
      }

      // 1: ACCEPTED
      // 내가 요청한 영상통화를 상대방이 수락한 경우
      if (callStatus === 1 && initiatorUserPk === myUserPk) {
        console.log("상대방이 영상통화를 수락했습니다.");

        navigateToVideoCall(callPk, true);
        return;
      }

      // 2: REJECTED
      if (callStatus === 2 && initiatorUserPk === myUserPk) {
        Alert.alert("영상통화", "상대방이 요청을 거절했습니다.");
        return;
      }

      // 3: ENDED
      if (callStatus === 3) {
        Alert.alert("영상통화", "영상통화가 종료되었습니다.");
        return;
      }

      // 4: MISSED
      if (callStatus === 4 && initiatorUserPk === myUserPk) {
        Alert.alert("영상통화", "상대방이 응답하지 않았습니다.");
        return;
      }

      // 5: CANCELED
      if (callStatus === 5 && initiatorUserPk !== myUserPk) {
        Alert.alert("영상통화", "상대방이 요청을 취소했습니다.");
      }
    },
    [myUserPk, respondToVideoCall, navigateToVideoCall]
  );

  // --------------------------------------------------
  // 상담 종료 요청
  // --------------------------------------------------

  const requestServiceClose = () => {
    const confirmClose = () => {
      setCloseRequestState("waiting");

      Alert.alert(
        "상담 종료 요청",
        "종료 요청 UI 확인용입니다. 아직 백엔드 API가 연결되지 않아 상대방에게 전달되지는 않습니다.",
        [{ text: "확인" }]
      );
    };

    if (Platform.OS === "web") {
      if (window.confirm("상대방에게 상담 종료를 요청할까요?")) {
        confirmClose();
      }
    } else {
      Alert.alert("상담 종료", "상대방에게 상담 종료를 요청할까요?", [
        { text: "취소", style: "cancel" },
        { text: "종료 요청", onPress: confirmClose },
      ]);
    }
  };

  const cancelServiceClose = () => {
    setCloseRequestState("idle");
  };

  const goToServiceComplete = () => {
    router.push({
      pathname: "/chat/complete",
      params: {
        name: String(name || "스타일리스트"),
        stylistName: String(name || "스타일리스트"),
        roomPk: String(roomId || ""),
        orderPk: "1",
        serviceName: "BASIC 스타일링 서비스",
        useDate: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
        method: "채팅 상담",
      },
    } as any);
  };

  // --------------------------------------------------
  // 메시지 조회
  // --------------------------------------------------

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const token = await getAccessToken();

      if (!token) {
        Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
        router.replace("/");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/chat/${roomId}/messages`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

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

  // --------------------------------------------------
  // 읽음 처리
  // --------------------------------------------------

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

  // --------------------------------------------------
  // 초기 데이터 로딩
  // --------------------------------------------------

  useEffect(() => {
    getLoginUser().then((user) => {
      if (user?.userPk) {
        setMyUserPk(user.userPk);
      }
    });

    fetchMessages();
    markAsRead();
  }, [fetchMessages, markAsRead]);

  // --------------------------------------------------
  // 영상통화 WebSocket 연결
  // --------------------------------------------------

  useEffect(() => {
    if (!myUserPk) return;

    let cancelled = false;
    let client: Client | null = null;

    const connectWebSocket = async () => {
      try {
        const token = await getAccessToken();

        if (!token || cancelled) return;

        client = new Client({
          brokerURL: "ws://192.168.0.5:8080/ws",

          connectHeaders: {
            Authorization: `Bearer ${token}`,
          },

          reconnectDelay: 5000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,

          onConnect: () => {
            console.log("영상통화 WebSocket 연결 성공");

            client?.subscribe(
              "/user/queue/video-call",
              (message) => {
                try {
                  const event = JSON.parse(message.body);

                  handleVideoCallEvent(event);
                } catch (error) {
                  console.error(
                    "영상통화 이벤트 파싱 오류:",
                    error
                  );
                }
              }
            );

            console.log("영상통화 이벤트 구독 완료");
          },

          onStompError: (frame) => {
            console.error(
              "WebSocket STOMP 오류:",
              frame.headers
            );

            console.error("오류 내용:", frame.body);
          },

          onWebSocketError: (error) => {
            console.error("WebSocket 연결 오류:", error);
          },

          onWebSocketClose: () => {
            console.log("영상통화 WebSocket 연결 종료");
          },
        });

        client.activate();
      } catch (error) {
        console.error("WebSocket 초기화 오류:", error);
      }
    };

    connectWebSocket();

    return () => {
      cancelled = true;
      client?.deactivate();

      console.log("영상통화 WebSocket 연결 해제");
    };
  }, [myUserPk, handleVideoCallEvent]);

  // --------------------------------------------------
  // 사진 선택
  // --------------------------------------------------

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  // --------------------------------------------------
  // 영상통화 요청 생성
  // --------------------------------------------------

  const startVideoCall = async () => {
    if (!roomId || calling) return;

    setCalling(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        Alert.alert("로그인 필요", "로그인 후 이용해주세요.");
        return;
      }

      const requestUrl =
        `${API_BASE_URL}/chat/${roomId}/video-call`;

      console.log("========== 영상통화 요청 시작 ==========");
      console.log("요청 URL:", requestUrl);
      console.log("roomId:", roomId);

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const responseText = await response.text();

      console.log("영상통화 HTTP 상태:", response.status);
      console.log("영상통화 서버 응답:", responseText);

      let result: any = null;

      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch {
        result = responseText;
      }

      if (!response.ok) {
        const errorMessage =
          typeof result === "object" && result !== null
            ? result.message || result.error
            : result;

        throw new Error(
          errorMessage || `통화 요청 실패 (${response.status})`
        );
      }

      console.log("영상통화 생성 성공:", result);

      Alert.alert(
        "통화 요청 성공",
        "상대방에게 영상통화 요청을 보냈습니다. 상대방의 수락을 기다려주세요."
      );
    } catch (error) {
      console.error("========== 영상통화 요청 실패 ==========");
      console.error(error);

      let errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";

      if (
        Platform.OS === "web" &&
        error instanceof TypeError &&
        error.message.toLowerCase().includes("fetch")
      ) {
        errorMessage =
          "서버에 연결할 수 없습니다.\n\n" +
          "백엔드 실행 상태와 CORS 설정을 확인해주세요.\n" +
          "브라우저 개발자 도구의 Network 탭에서 OPTIONS 또는 POST 요청도 확인해주세요.";
      }

      Alert.alert("영상통화 요청 실패", errorMessage);
    } finally {
      setCalling(false);
    }
  };

  // --------------------------------------------------
  // + 버튼 메뉴
  // --------------------------------------------------

  const openAttachmentMenu = () => {
    if (Platform.OS === "web") {
      const choice = window.confirm(
        "사진 첨부를 선택하려면 확인, 영상통화를 선택하려면 취소를 누르세요."
      );

      if (choice) {
        pickImage();
      } else {
        startVideoCall();
      }

      return;
    }

    Alert.alert("첨부하기", "원하는 기능을 선택해 주세요.", [
      {
        text: "사진 첨부",
        onPress: pickImage,
      },
      {
        text: "영상통화",
        onPress: startVideoCall,
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  // --------------------------------------------------
  // 메시지 전송
  // --------------------------------------------------

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

      const response = await fetch(
        `${API_BASE_URL}/chat/${roomId}/message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            msgContent: trimmed,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || `전송 실패 (${response.status})`
        );
      }

      setInput("");
      await fetchMessages();
    } catch (error) {
      console.error("메시지 전송 오류:", error);

      Alert.alert(
        "전송 실패",
        "메시지를 보내지 못했습니다. 다시 시도해주세요."
      );
    } finally {
      setSending(false);
    }
  };

  // --------------------------------------------------
  // 메시지 수정
  // --------------------------------------------------

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
          body: JSON.stringify({
            msgContent: trimmed,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || `수정 실패 (${response.status})`
        );
      }

      setEditingMessagePk(null);
      setActionMessagePk(null);
      setEditText("");

      await fetchMessages();
    } catch (error) {
      console.error("메시지 수정 오류:", error);

      Alert.alert(
        "수정 실패",
        "메시지를 수정하지 못했습니다."
      );
    } finally {
      setProcessingMessage(false);
    }
  };

  // --------------------------------------------------
  // 메시지 삭제
  // --------------------------------------------------

  const deleteMessage = async (msgPk: number) => {
    if (processingMessage || !roomId) return;

    const confirmed =
      Platform.OS === "web"
        ? window.confirm("이 메시지를 삭제할까요?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("메시지 삭제", "이 메시지를 삭제할까요?", [
              {
                text: "취소",
                style: "cancel",
                onPress: () => resolve(false),
              },
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || `삭제 실패 (${response.status})`
        );
      }

      setActionMessagePk(null);

      await fetchMessages();
    } catch (error) {
      console.error("메시지 삭제 오류:", error);

      Alert.alert(
        "삭제 실패",
        "메시지를 삭제하지 못했습니다."
      );
    } finally {
      setProcessingMessage(false);
    }
  };

  // --------------------------------------------------
  // 이미지 전송
  // --------------------------------------------------

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
          new File(
            [blob],
            selectedImage.fileName || "image.jpg",
            {
              type: blob.type || "image/jpeg",
            }
          )
        );
      } else {
        formData.append(
          "images",
          {
            uri: selectedImage.uri,
            name: selectedImage.fileName || "image.jpg",
            type: selectedImage.mimeType || "image/jpeg",
          } as any
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/chat/${roomId}/images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || `이미지 전송 실패 (${response.status})`
        );
      }

      setSelectedImage(null);

      await fetchMessages();
    } catch (error) {
      console.error("이미지 전송 오류:", error);

      Alert.alert(
        "전송 실패",
        "이미지를 보내지 못했습니다. 다시 시도해주세요."
      );
    } finally {
      setSending(false);
    }
  };

  // --------------------------------------------------
  // 화면
  // --------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.headerName}>
          {name || "스타일리스트"}
        </Text>

        {!isReadOnly && closeRequestState === "idle" && (
          <Pressable
            style={styles.headerCloseButton}
            onPress={requestServiceClose}
          >
            <Text style={styles.headerCloseButtonText}>
              서비스 종료
            </Text>
          </Pressable>
        )}

        {!isReadOnly && closeRequestState === "waiting" && (
          <Pressable
            style={styles.headerWaitingButton}
            onPress={cancelServiceClose}
          >
            <Text style={styles.headerWaitingButtonText}>
              요청 취소
            </Text>
          </Pressable>
        )}
      </View>

      {!isReadOnly && closeRequestState === "waiting" && (
        <View style={styles.closeWaitingBanner}>
          <Text style={styles.closeWaitingTitle}>
            상담 종료 요청을 보냈어요
          </Text>

          <Text style={styles.closeWaitingDesc}>
            상대방의 수락을 기다리고 있습니다.
            {"\n"}
            현재는 API 연결 전이라 실제 상대방에게 전달되지는 않습니다.
          </Text>

          <Pressable
            onPress={goToServiceComplete}
            style={{
              marginTop: 10,
              backgroundColor: "#51458C",
              padding: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>
              완료 페이지 미리보기 (테스트)
            </Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={PURPLE}
          />
        </View>
      ) : (
        <FlatList
          style={styles.flatList}
          data={messages}
          keyExtractor={(item) => String(item.msgPk)}
          contentContainerStyle={styles.messageList}
          inverted={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isMine =
              myUserPk !== null &&
              item.senderPk === myUserPk;

            return (
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
                          actionMessagePk === item.msgPk
                            ? null
                            : item.msgPk
                        );
                      }
                    }}
                    onLongPress={() => {
                      if (isMine && !isReadOnly) {
                        setActionMessagePk(item.msgPk);
                      }
                    }}
                    style={[
                      styles.bubble,
                      isMine
                        ? styles.myBubble
                        : styles.otherBubble,
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
                            <Text style={styles.editCancel}>
                              취소
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() =>
                              updateMessage(item.msgPk)
                            }
                            disabled={
                              !editText.trim() ||
                              processingMessage
                            }
                          >
                            <Text style={styles.editSave}>
                              {processingMessage
                                ? "완료 중"
                                : "완료"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : item.imageUrls &&
                      item.imageUrls.length > 0 ? (
                      <View>
                        {item.imageUrls.map(
                          (imageUrl, index) => (
                            <Image
                              key={`${item.msgPk}-${index}`}
                              source={{ uri: imageUrl }}
                              style={styles.sentImage}
                              resizeMode="cover"
                            />
                          )
                        )}

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
                            <Text style={styles.actionText}>
                              수정
                            </Text>
                          </Pressable>
                        )}

                        <Pressable
                          onPress={() =>
                            deleteMessage(item.msgPk)
                          }
                          disabled={processingMessage}
                        >
                          <Text style={styles.deleteActionText}>
                            {processingMessage
                              ? "처리 중"
                              : "삭제"}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                  <Text style={styles.messageTime}>
                    {formatTime(item.sendAt)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              아직 메시지가 없습니다.
            </Text>
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
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: 10 + insets.bottom,
            },
          ]}
        >
          <Pressable
            style={styles.imageButton}
            onPress={openAttachmentMenu}
            disabled={calling}
          >
            <Text style={styles.imageButtonText}>＋</Text>
          </Pressable>

          <TextInput
            style={styles.textInput}
            placeholder="메시지를 입력하세요."
            placeholderTextColor="#AAAAAA"
            value={input}
            onChangeText={setInput}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
          />

          <Pressable
            style={[
              styles.sendButton,
              ((!input.trim() && !selectedImage) || sending) &&
                styles.disabledSendButton,
            ]}
            onPress={
              selectedImage ? sendImage : sendMessage
            }
            disabled={
              (!input.trim() && !selectedImage) || sending
            }
          >
            <Text style={styles.sendButtonText}>
              {sending
                ? "전송 중"
                : selectedImage
                  ? "사진 전송"
                  : "전송"}
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// --------------------------------------------------
// 스타일
// --------------------------------------------------

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
    height: 100,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    flexShrink: 0,
  },
  backButton: {
    marginRight: 16,
    paddingHorizontal: 5,
  },
  backText: {
    fontSize: 36,
    color: "#222222",
    lineHeight: 36,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222222",
  },
  headerCloseButton: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
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
    borderColor: "#8B5CF6",
  },
  headerWaitingButtonText: {
    color: "#8B5CF6",
    fontSize: 11,
    fontWeight: "700",
  },
  flatList: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 18,
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
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  smallProfileText: {
    color: PURPLE,
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
    paddingVertical: 10,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: PURPLE,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#F2F2F2",
    borderBottomLeftRadius: 4,
  },
  sentImage: {
    width: 220,
    height: 220,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: "#EAEAEA",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    minHeight: 42,
    backgroundColor: "#F5F5F5",
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#222222",
  },
  imagePreviewContainer: {
    position: "relative",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  imageButtonText: {
    fontSize: 28,
    color: PURPLE,
    fontWeight: "bold",
    lineHeight: 32,
  },
  sendButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
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
    flexShrink: 0,
  },
  closeIncomingBanner: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    backgroundColor: "#F3F1FA",
    borderRadius: 12,
  },
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
