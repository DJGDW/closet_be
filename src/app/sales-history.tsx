import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.219.107:8080";
const PURPLE = "#51458C";

// order.purchaseStatus: 0 결제 대기 / 1 결제 완료 / 2 결제 취소
// order.processStatus : 0 대기 / 1 진행 중 / 2 완료 요청됨 / 3 완료
type Order = {
  orderPk: number;
  buyerNickname: string;
  buyerProfilePic?: string | null;
  orderName: string; // 플랜 등급 (예: BASIC)
  price: number;
  purchaseStatus: number;
  processStatus?: number | null;
  orderStarted?: string | null;
  orderFinished?: string | null;
};

type ChatRoomInfo = {
  roomPk: number;
  orderPk: number | null;
  roomStatus: number;
};

type Filter = "all" | "progress" | "done";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "progress", label: "진행 중" },
  { key: "done", label: "완료" },
];

async function getAccessToken() {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    }
    return await SecureStore.getItemAsync("accessToken");
  } catch {
    return null;
  }
}

function won(value: number | undefined | null) {
  return `₩${Number(value || 0).toLocaleString("ko-KR")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${month}.${day}`;
}

type StatusInfo = { label: string; bg: string; color: string };

function getStatus(order: Order): StatusInfo {
  if (Number(order.purchaseStatus) === 2) {
    return { label: "결제 취소", bg: "#F2F2F2", color: "#888888" };
  }
  if (Number(order.processStatus) === 3) {
    return { label: "서비스 완료", bg: "#E4E1EA", color: PURPLE };
  }
  if (Number(order.processStatus) === 2) {
    return { label: "종료 요청 중", bg: "#FFF1D6", color: "#B7791F" };
  }
  return { label: "진행 중", bg: PURPLE, color: "#FFFFFF" };
}

export default function SalesHistoryScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [rooms, setRooms] = useState<Record<number, ChatRoomInfo>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage("");

    try {
      const token = await getAccessToken();
      if (!token) {
        setErrorMessage("로그인이 필요합니다. 다시 로그인해주세요.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // 판매내역 + 진행 중 채팅방 + 종료된 채팅방(주문번호로 연결하기 위해)
      const [orderRes, activeRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/order/sales`, { headers }),
        fetch(`${API_BASE_URL}/chat/rooms`, { headers }),
        fetch(`${API_BASE_URL}/chat/rooms/history`, { headers }),
      ]);

      if (orderRes.status === 401 || orderRes.status === 403) {
        setErrorMessage("로그인 인증이 만료되었어요. 다시 로그인해주세요.");
        return;
      }

      if (!orderRes.ok) {
        throw new Error(`판매내역 조회 실패 (${orderRes.status})`);
      }

      const orderData = await orderRes.json();
      const orderList: Order[] = Array.isArray(orderData)
        ? orderData
        : Array.isArray(orderData?.data)
          ? orderData.data
          : [];

      // 결제 대기(미결제) 주문은 판매내역에 보여주지 않음
      setOrders(orderList.filter((o) => Number(o.purchaseStatus) !== 0));

      const roomMap: Record<number, ChatRoomInfo> = {};
      for (const res of [activeRes, historyRes]) {
        if (!res.ok) continue;
        const list = await res.json().catch(() => []);
        if (!Array.isArray(list)) continue;
        for (const room of list as ChatRoomInfo[]) {
          if (room.orderPk != null) roomMap[Number(room.orderPk)] = room;
        }
      }
      setRooms(roomMap);
    } catch (error) {
      console.error("판매내역 조회 오류:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "판매내역을 불러오지 못했어요.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;

    return orders.filter((order) => {
      const cancelled = Number(order.purchaseStatus) === 2;
      const done = Number(order.processStatus) === 3;

      if (filter === "done") return done || cancelled;
      return !done && !cancelled;
    });
  }, [orders, filter]);

  const openChat = (order: Order) => {
    const room = rooms[Number(order.orderPk)];
    if (!room) return;

    router.push({
      pathname: "/chat/[roomPk]",
      params: {
        roomPk: String(room.roomPk),
        orderPk: String(order.orderPk),
        name: order.buyerNickname || "고객",
        // 종료된 채팅(roomStatus 1)은 읽기 전용으로 열기
        readOnly: Number(room.roomStatus) === 0 ? "false" : "true",
      },
    } as any);
  };

  // 매출 요약: 결제 완료된 주문 기준
  const summary = useMemo(() => {
    const paid = orders.filter((o) => Number(o.purchaseStatus) === 1);
    const done = paid.filter((o) => Number(o.processStatus) === 3);

    return {
      revenue: paid.reduce((sum, o) => sum + Number(o.price || 0), 0),
      total: paid.length,
      progress: paid.length - done.length,
      done: done.length,
    };
  }, [orders]);

  const renderItem = ({ item }: { item: Order }) => {
    const status = getStatus(item);
    const cancelled = Number(item.purchaseStatus) === 2;
    const done = Number(item.processStatus) === 3;
    const room = rooms[Number(item.orderPk)];
    const roomClosed = room ? Number(room.roomStatus) !== 0 : false;
    const nickname = item.buyerNickname || "고객";

    const dateText = done
      ? `${formatDate(item.orderFinished)} 완료`
      : `${formatDate(item.orderStarted)} 시작`;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.dateText}>{dateText}</Text>

          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {item.buyerProfilePic ? (
            <Image
              source={{ uri: item.buyerProfilePic }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#AAAAAA" />
            </View>
          )}

          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nickname}>{nickname}</Text>
              <Text style={styles.role}>고객</Text>
            </View>

            <Text style={styles.planName}>
              {item.orderName || "스타일링 서비스"}
            </Text>
          </View>

          <Text style={styles.price}>{won(item.price)}</Text>
        </View>

        {!cancelled && (
          <View style={styles.actions}>
            {room ? (
              <Pressable
                style={[
                  styles.actionButton,
                  done ? styles.outlineButton : styles.solidButton,
                ]}
                onPress={() => openChat(item)}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={16}
                  color={done ? "#222222" : "#FFFFFF"}
                />
                <Text
                  style={[
                    styles.actionText,
                    done ? styles.outlineText : styles.solidText,
                  ]}
                >
                  {roomClosed ? "종료된 채팅 보기" : "채팅방 가기"}
                </Text>
              </Pressable>
            ) : (
              done && (
                <View style={[styles.actionButton, styles.disabledButton]}>
                  <Text style={styles.disabledText}>
                    채팅 보관 기간이 지났어요
                  </Text>
                </View>
              )
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="chevron-back" size={24} color="#222222" />
        </Pressable>

        <Text style={styles.headerTitle}>판매내역</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => {
          const active = filter === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider} />

      {!loading && !errorMessage && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>총 판매 금액</Text>
          <Text style={styles.summaryAmount}>{won(summary.revenue)}</Text>

          <View style={styles.summaryLine} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>{summary.total}</Text>
              <Text style={styles.summaryCaption}>전체</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>{summary.progress}</Text>
              <Text style={styles.summaryCaption}>진행 중</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>{summary.done}</Text>
              <Text style={styles.summaryCaption}>완료</Text>
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={42} color="#999999" />
          <Text style={styles.emptyTitle}>불러오지 못했어요</Text>
          <Text style={styles.emptyDesc}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.orderPk)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={PURPLE}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyCircle}>
                <Ionicons name="receipt-outline" size={30} color="#9A9A9A" />
              </View>
              <Text style={styles.emptyTitle}>판매내역이 없습니다.</Text>
              <Text style={styles.emptyDesc}>
                고객이 서비스를 구매하면 여기에 표시돼요.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },

  back: { width: 24 },

  headerTitle: { fontSize: 16, fontWeight: "700", color: "#222222" },

  filterRow: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  filterChip: {
    height: 34,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E4E4E4",
    backgroundColor: "#F3F3F3",
  },

  filterChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },

  filterText: { fontSize: 12, fontWeight: "500", color: "#333333" },

  filterTextActive: { color: "#FFFFFF" },

  divider: { height: 1, backgroundColor: "#E6E6E6" },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 30,
    flexGrow: 1,
  },

  summaryCard: {
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F3FA",
    borderWidth: 1,
    borderColor: "#A9A2C9",
  },

  summaryLabel: { fontSize: 11, color: "#777777" },

  summaryAmount: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "800",
    color: PURPLE,
  },

  summaryLine: { height: 1, backgroundColor: "#D7D3E1", marginVertical: 14 },

  summaryRow: { flexDirection: "row" },

  summaryItem: { flex: 1, alignItems: "center" },

  summaryCount: { fontSize: 17, fontWeight: "800", color: "#222222" },

  summaryCaption: { marginTop: 3, fontSize: 11, color: "#777777" },

  card: {
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateText: { fontSize: 12, color: "#888888" },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
  },

  statusText: { fontSize: 11, fontWeight: "700" },

  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  cardInfo: { flex: 1 },

  nameRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },

  nickname: { fontSize: 15, fontWeight: "700", color: "#222222" },

  role: { fontSize: 10, color: "#666666" },

  planName: { marginTop: 5, fontSize: 12, color: "#777777" },

  price: { fontSize: 15, fontWeight: "800", color: "#222222" },

  actions: { flexDirection: "row", gap: 8, marginTop: 14 },

  actionButton: {
    flex: 1,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 9,
  },

  solidButton: { backgroundColor: PURPLE },

  outlineButton: {
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#FFFFFF",
  },

  disabledButton: { backgroundColor: "#F2F2F2" },

  actionText: { fontSize: 13, fontWeight: "700" },

  solidText: { color: "#FFFFFF" },

  outlineText: { color: "#222222" },

  disabledText: { fontSize: 12, color: "#999999" },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 90,
  },

  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
  },

  emptyDesc: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 19,
    color: "#888888",
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: PURPLE,
  },

  retryText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});
