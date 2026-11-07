import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const PURPLE = "#8B5CF6";
const API_BASE_URL = "http://192.168.219.107:8080";

type ChatRoom = {
  roomPk: number;
  orderPk: number | null;
  opponentNickname: string;
  opponentProfilePic?: string | null;
  lastMessage?: string | null;
  lastMessageType?: number | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  roomType: number;
  roomStatus: number;
};

// 채팅 목록은 "문의하기" / "서비스 진행중" 두 가지만 보여줌
// (종료된 채팅은 구매내역에서 확인)
type ChatTab = "inquiry" | "service";

const ROOM_TYPE_PAYMENT = 0;
const ROOM_TYPE_INQUIRY = 1;

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
  });
}

async function getAccessToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem("accessToken");
  }
  return SecureStore.getItemAsync("accessToken");
}

export default function ChatListScreen() {
  const router = useRouter();

  const [chatList, setChatList] = useState<ChatRoom[]>([]);
  const [tab, setTab] = useState<ChatTab>("inquiry");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchChatRooms = useCallback(async () => {
    setError("");

    try {
      const token = await getAccessToken();

      if (!token) {
        setError("로그인이 필요합니다.");
        setChatList([]);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // 활성 채팅방만 조회 (종료된 채팅은 구매내역에서 연결)
      const activeResponse = await fetch(`${API_BASE_URL}/chat/rooms`, {
        method: "GET",
        headers,
      });

      if (activeResponse.status === 401 || activeResponse.status === 403) {
        setError("로그인 인증이 만료되었습니다. 다시 로그인해주세요.");
        setChatList([]);
        return;
      }

      if (!activeResponse.ok) {
        throw new Error(`채팅 목록 조회 실패 (${activeResponse.status})`);
      }

      const activeData = await activeResponse.json();

      setChatList(Array.isArray(activeData) ? activeData : []);
    } catch (e) {
      console.error("채팅 목록 조회 오류:", e);
      setError(
        e instanceof Error ? e.message : "채팅 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatRooms();
  };

  const inquiryList = chatList.filter(
    (room) => Number(room.roomType) === ROOM_TYPE_INQUIRY,
  );
  const serviceList = chatList.filter(
    (room) => Number(room.roomType) === ROOM_TYPE_PAYMENT,
  );

  const displayedList = tab === "inquiry" ? inquiryList : serviceList;

  // 탭에 읽지 않은 메시지가 있으면 점으로 표시
  const hasUnread = (list: ChatRoom[]) =>
    list.some((room) => Number(room.unreadCount) > 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>채팅</Text>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "inquiry" && styles.selectedTab]}
          onPress={() => setTab("inquiry")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "inquiry" && styles.selectedTabText,
            ]}
          >
            문의하기
          </Text>
          {hasUnread(inquiryList) && <View style={styles.tabDot} />}
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "service" && styles.selectedTab]}
          onPress={() => setTab("service")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "service" && styles.selectedTabText,
            ]}
          >
            서비스 진행중
          </Text>
          {hasUnread(serviceList) && <View style={styles.tabDot} />}
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={displayedList}
        keyExtractor={(item) => String(item.roomPk)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.chatItem}
            onPress={() =>
              router.push({
                pathname: "/chat/[roomPk]",
                params: {
                  roomPk: String(item.roomPk),
                  orderPk: item.orderPk != null ? String(item.orderPk) : "",
                  name: item.opponentNickname,
                  readOnly: "false",
                },
              })
            }
          >
            <View style={styles.profile}>
              <Text style={styles.profileText}>
                {(item.opponentNickname || "스").charAt(0)}
              </Text>
            </View>

            <View style={styles.chatContent}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.opponentNickname}</Text>
                <Text style={styles.time}>
                  {formatTime(item.lastMessageAt)}
                </Text>
              </View>

              <View style={styles.messageRow}>
                <Text style={styles.message} numberOfLines={1}>
                  {item.lastMessage || "상담을 시작해 보세요."}
                </Text>

                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={() =>
          !error ? (
            <Text style={styles.emptyText}>
              {tab === "inquiry"
                ? "진행 중인 문의 채팅이 없습니다."
                : "진행 중인 서비스 채팅이 없습니다.\n종료된 채팅은 구매내역에서 확인할 수 있어요."}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222222",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  selectedTab: {
    borderBottomColor: PURPLE,
  },
  tabText: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "500",
  },
  selectedTabText: {
    color: PURPLE,
    fontWeight: "bold",
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F04438",
  },
  errorText: {
    color: "#D32F2F",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  profile: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  profileText: {
    fontSize: 20,
    fontWeight: "bold",
    color: PURPLE,
  },
  chatContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222222",
  },
  time: {
    fontSize: 12,
    color: "#999999",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  message: {
    fontSize: 13,
    color: "#888888",
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: PURPLE,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#999999",
    lineHeight: 21,
    marginTop: 50,
  },
});
