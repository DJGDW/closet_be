
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { router, useFocusEffect } from "expo-router";

const API_BASE_URL = "http://192.168.0.5:8080";

type NotificationItem = {
  notificationPk: number;
  actorUserPk: number | null;
  actorNickname: string | null;
  actorProfileImage: string | null;
  notificationType: number;
  notificationContent: string;
  targetType: number;
  targetPk: number;
  isRead: boolean;
  important: boolean;
  createdAt: string;
};

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const getAccessToken = async () => {
    if (Platform.OS === "web") {
      return localStorage.getItem("accessToken");
    }

    return await SecureStore.getItemAsync("accessToken");
  };

  // 알림 목록 조회
  const fetchNotifications = useCallback(async () => {
    setErrorMessage("");

    try {
      const token = await getAccessToken();

      if (!token) {
        setErrorMessage("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notification`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`알림 조회 실패: HTTP ${response.status}`);
      }

      const result = await response.json();

      const list: NotificationItem[] = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [];

      setNotifications(list);
    } catch (error) {
      console.error("알림 조회 오류:", error);
      setErrorMessage("알림을 불러오지 못했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  // 알림 읽음 처리
  const markNotificationAsRead = async (
    item: NotificationItem,
    token: string,
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/notification/${item.notificationPk}/read`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`읽음 처리 실패: HTTP ${response.status}`);
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.notificationPk === item.notificationPk
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  // 알림 클릭 시 읽음 처리 후 해당 페이지로 이동
  const handleNotificationPress = async (item: NotificationItem) => {
    if (readingId === item.notificationPk) {
      return;
    }

    try {
      setReadingId(item.notificationPk);

      const token = await getAccessToken();

      if (!token) {
        Alert.alert("안내", "로그인이 필요합니다.");
        return;
      }

      // 읽지 않은 알림이면 먼저 읽음 처리
      if (!item.isRead) {
        await markNotificationAsRead(item, token);
      }

      // 1. 채팅 알림 → 해당 채팅방
      if (item.targetType === 2 && item.targetPk != null) {
        router.push({
          pathname: "/chat/[roomPk]",
          params: {
            roomPk: String(item.targetPk),
            name: item.actorNickname || "채팅",
          },
        });
        return;
      }

      // 2. 좋아요 알림 → 해당 게시글
      if (item.targetType === 0 && item.targetPk != null) {
        router.push({
          pathname: "/post/[postPk]",
          params: {
            postPk: String(item.targetPk),
          },
        });
        return;
      }

      // 3. 팔로우 알림 → 마이페이지
      if (item.targetType === 1) {
        router.push("/mypage");
        return;
      }

      Alert.alert("안내", "이 알림과 연결된 화면이 없습니다.");
    } catch (error) {
      console.error("알림 클릭 처리 오류:", error);
      Alert.alert("오류", "알림을 처리하지 못했어요.");
    } finally {
      setReadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const importantNotifications = notifications.filter(
    (item) => item.important,
  );

  const normalNotifications = notifications.filter(
    (item) => !item.important,
  );

  // 알림 한 개 렌더링
  const renderNotification = (item: NotificationItem) => (
    <Pressable
      key={item.notificationPk}
      onPress={() => handleNotificationPress(item)}
      disabled={readingId === item.notificationPk}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: item.isRead ? "#FFFFFF" : "#F4F2FC",
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
        opacity: readingId === item.notificationPk ? 0.6 : 1,
      }}
    >
      {item.actorProfileImage ? (
        <Image
          source={{ uri: item.actorProfileImage }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#EEEEEE",
          }}
        />
      ) : (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#E8E5F5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#4D458B",
              fontSize: 17,
              fontWeight: "700",
            }}
          >
            {(item.actorNickname || "?").slice(0, 1)}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            color: "#222222",
            fontSize: 14,
            fontWeight: item.isRead ? "400" : "600",
            lineHeight: 21,
          }}
        >
          {item.notificationContent}
        </Text>

        <Text
          style={{
            color: "#999999",
            fontSize: 11,
            marginTop: 5,
          }}
        >
          {formatDate(item.createdAt)}
        </Text>
      </View>

      {readingId === item.notificationPk ? (
        <ActivityIndicator size="small" color="#4D458B" />
      ) : (
        !item.isRead && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#E53935",
              marginLeft: 8,
            }}
          />
        )
      )}
    </Pressable>
  );

  // 알림 섹션 렌더링
  const renderSection = (
    title: string,
    items: NotificationItem[],
    emptyMessage: string,
  ) => (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "700",
          color: "#222222",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        {title}
      </Text>

      {items.length === 0 ? (
        <Text
          style={{
            color: "#999999",
            fontSize: 13,
            textAlign: "center",
            paddingVertical: 24,
          }}
        >
          {emptyMessage}
        </Text>
      ) : (
        items.map(renderNotification)
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      {/* 상단 헤더 */}
      <View
        style={{
          height: 54,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#EEEEEE",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ paddingVertical: 8, paddingRight: 16 }}
        >
          <Text style={{ fontSize: 23, color: "#222222" }}>‹</Text>
        </Pressable>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#222222",
          }}
        >
          알림
        </Text>
      </View>

      {/* 로딩 화면 */}
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#4D458B" />
          <Text style={{ marginTop: 12, color: "#888888" }}>
            알림을 불러오는 중...
          </Text>
        </View>
      ) : errorMessage ? (
        // 오류 화면
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ color: "#777777", marginBottom: 16 }}>
            {errorMessage}
          </Text>

          <Pressable
            onPress={() => {
              setLoading(true);
              fetchNotifications();
            }}
            style={{
              backgroundColor: "#4D458B",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : (
        // 알림 목록
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderSection(
            "중요 알림",
            importantNotifications,
            "중요 알림이 없습니다.",
          )}

          {renderSection(
            "일반 알림",
            normalNotifications,
            "일반 알림이 없습니다.",
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
