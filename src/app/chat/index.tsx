import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { palette } from "../../styles/theme";

const PURPLE = palette.primary;
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
            {item.opponentProfilePic ? (
              <Image
                source={{ uri: item.opponentProfilePic }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profile}>
                <Text style={styles.profileText}>
                  {(item.opponentNickname || "스").charAt(0)}
                </Text>
              </View>
            )}

            <View style={styles.chatContent}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.opponentNickname}
                </Text>
                <Text style={styles.time}>
                  {formatTime(item.lastMessageAt)}
                </Text>
              </View>

              <View style={styles.messageRow}>
                <Text
                  style={[
                    styles.message,
                    item.unreadCount > 0 && styles.messageUnread,
                  ]}
                  numberOfLines={1}
                >
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
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCircle}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={28}
                  color={PURPLE}
                />
              </View>
              <Text style={styles.emptyText}>
                {tab === "inquiry"
                  ? "진행 중인 문의 채팅이 없습니다."
                  : "진행 중인 서비스 채팅이 없습니다.\n종료된 채팅은 구매내역에서 확인할 수 있어요."}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingTop: 56,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: palette.text,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 4,
    borderRadius: 14,
    backgroundColor: palette.surface,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  selectedTab: {
    backgroundColor: palette.background,
    shadowColor: "#1A1A1F",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: palette.textMute,
    fontWeight: "600",
  },
  selectedTabText: {
    color: PURPLE,
    fontWeight: "700",
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F04438",
  },
  errorText: {
    color: palette.danger,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  profile: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.primaryLine,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  profileImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.surface,
    marginRight: 14,
  },
  profileText: {
    fontSize: 20,
    fontWeight: "700",
    color: PURPLE,
  },
  chatContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  name: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
    marginRight: 8,
  },
  time: {
    fontSize: 11.5,
    color: palette.textMute,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  message: {
    fontSize: 13.5,
    color: palette.textSub,
    flex: 1,
  },
  messageUnread: {
    color: palette.text,
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: PURPLE,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: palette.textSub,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 96,
    paddingHorizontal: 24,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
});
