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
const API_BASE_URL = "http://192.168.0.5:8080";

type ChatRoom = {
  roomPk: number;
  opponentNickname: string;
  opponentProfilePic?: string | null;
  lastMessage?: string | null;
  lastMessageType?: number | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  roomType: number;
  roomStatus: number;
};

type ChatTab = "active" | "history";

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
  const [historyList, setHistoryList] = useState<ChatRoom[]>([]);
  const [tab, setTab] = useState<ChatTab>("active");
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
        setHistoryList([]);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [activeResponse, historyResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/chat/rooms`, { method: "GET", headers }),
        fetch(`${API_BASE_URL}/chat/rooms/history`, { method: "GET", headers }),
      ]);

      if (
        activeResponse.status === 401 ||
        activeResponse.status === 403 ||
        historyResponse.status === 401 ||
        historyResponse.status === 403
      ) {
        setError("로그인 인증이 만료되었습니다. 다시 로그인해주세요.");
        setChatList([]);
        setHistoryList([]);
        return;
      }

      if (!activeResponse.ok) {
        throw new Error(`진행 중 채팅 조회 실패 (${activeResponse.status})`);
      }
      if (!historyResponse.ok) {
        throw new Error(`종료된 채팅 조회 실패 (${historyResponse.status})`);
      }

      const [activeData, historyData] = await Promise.all([
        activeResponse.json(),
        historyResponse.json(),
      ]);

      setChatList(Array.isArray(activeData) ? activeData : []);
      setHistoryList(Array.isArray(historyData) ? historyData : []);
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

  const displayedList = tab === "active" ? chatList : historyList;

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
          style={[styles.tab, tab === "active" && styles.selectedTab]}
          onPress={() => setTab("active")}
        >
          <Text
            style={[styles.tabText, tab === "active" && styles.selectedTabText]}
          >
            진행 중
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "history" && styles.selectedTab]}
          onPress={() => setTab("history")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "history" && styles.selectedTabText,
            ]}
          >
            종료된 상담
          </Text>
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
                  name: item.opponentNickname,
                  readOnly: tab === "history" ? "true" : "false",
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

                {tab === "active" && item.unreadCount > 0 && (
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
              {tab === "active"
                ? "아직 진행 중인 상담이 없습니다."
                : "종료된 상담 내역이 없습니다."}
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
    marginTop: 50,
  },
});
