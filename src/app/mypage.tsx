import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, useCallback } from "react";
import { router } from "expo-router";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../styles/mypage.styles";
import { palette } from "../styles/theme";

const API_BASE_URL = "http://192.168.219.107:8080";

type LoginUser = {
  userPk?: number;
  userId?: string;
  nickname?: string;
  tokenType?: string;
};

type Following = {
  stylistPk: number;
  userName?: string;
  nickname?: string;
  profilePic?: string | null;
};

type Follower = {
  userPk: number;
  userName?: string;
  nickname?: string;
  profilePic?: string | null;
};

type Order = {
  orderPk: number;
  purchaseStatus: number;
};

export default function MyPageScreen() {
  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);

  const [isStylist, setIsStylist] = useState(false);
  const [checkingStylist, setCheckingStylist] = useState(true);

  const [followingList, setFollowingList] = useState<Following[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);

  const [followerList, setFollowerList] = useState<Follower[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);

  const [likedCount, setLikedCount] = useState(0);
  const [purchaseCount, setPurchaseCount] = useState(0);

  // 판매내역 개수 (스타일리스트일 때만 조회)
  const [saleCount, setSaleCount] = useState<number | null>(null);

  const getAccessToken = async () => {
    if (Platform.OS === "web") {
      return localStorage.getItem("accessToken");
    }

    return await SecureStore.getItemAsync("accessToken");
  };

  // 로그인 사용자 정보
  useEffect(() => {
    async function loadLoginUser() {
      try {
        const savedUser =
          Platform.OS === "web"
            ? localStorage.getItem("loginUser")
            : await SecureStore.getItemAsync("loginUser");

        if (savedUser) {
          setLoginUser(JSON.parse(savedUser) as LoginUser);
        }
      } catch (error) {
        console.error("로그인 사용자 정보 조회 오류:", error);
      }
    }

    loadLoginUser();
  }, []);

  // 스타일리스트 등록 여부 확인
  useEffect(() => {
    const checkStylist = async () => {
      try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          setIsStylist(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/stylist/check`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setIsStylist(data.isStylist ?? data.stylist ?? false);
      } catch (error) {
        console.error("스타일리스트 등록 여부 확인 실패:", error);
      } finally {
        setCheckingStylist(false);
      }
    };

    checkStylist();
  }, []);

  // 스타일리스트라면 판매내역(결제 완료 건수) 조회
  useEffect(() => {
    if (!isStylist) return;

    const fetchSaleCount = async () => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) return;

        const response = await fetch(`${API_BASE_URL}/order/sales`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return;

        const data = await response.json();
        const sales = Array.isArray(data) ? data : [];
        setSaleCount(
          sales.filter((sale: any) => Number(sale.purchaseStatus) === 1).length,
        );
      } catch (error) {
        console.error("판매내역 개수 조회 오류:", error);
      }
    };

    fetchSaleCount();
  }, [isStylist]);

  // 좋아요 게시물 및 구매내역 개수 조회
  const fetchMenuCounts = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        setLikedCount(0);
        setPurchaseCount(0);
        return;
      }

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      };

      // 내가 좋아요 누른 게시물 전체 개수
      const likedResponse = await fetch(
        `${API_BASE_URL}/post/liked?page=0&size=1`,
        {
          method: "GET",
          headers,
        },
      );

      if (likedResponse.ok) {
        const likedData = await likedResponse.json();

        if (typeof likedData.totalElements === "number") {
          setLikedCount(likedData.totalElements);
        } else if (Array.isArray(likedData.content)) {
          setLikedCount(likedData.content.length);
        } else if (Array.isArray(likedData.data?.content)) {
          setLikedCount(likedData.data.content.length);
        } else if (Array.isArray(likedData.data)) {
          setLikedCount(likedData.data.length);
        } else if (Array.isArray(likedData)) {
          setLikedCount(likedData.length);
        }
      }

      // 내가 구매한 주문 중 결제 완료 건수
      const orderResponse = await fetch(`${API_BASE_URL}/order`, {
        method: "GET",
        headers,
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();

        const orders: Order[] = Array.isArray(orderData)
          ? orderData
          : Array.isArray(orderData.data)
            ? orderData.data
            : [];

        setPurchaseCount(
          orders.filter((order) => Number(order.purchaseStatus) === 1).length,
        );
      }
    } catch (error) {
      console.error("MyPage 메뉴 개수 조회 오류:", error);
    }
  }, []);

  // 팔로잉 목록 조회
  const fetchFollowing = useCallback(async () => {
    try {
      setLoadingFollowing(true);

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setFollowingList([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/follow`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`팔로잉 조회 실패 (HTTP ${response.status})`);
      }

      const result = await response.json();
      const list = result.data ?? result;

      setFollowingList(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("팔로잉 목록 조회 오류:", error);
      Alert.alert("조회 실패", "팔로잉 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingFollowing(false);
    }
  }, []);

  // 팔로워 목록 조회
  const fetchFollowers = useCallback(async () => {
    try {
      setLoadingFollowers(true);

      const accessToken = await getAccessToken();

      if (!accessToken || !isStylist) {
        setFollowerList([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/follow/followers`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`팔로워 조회 실패 (HTTP ${response.status})`);
      }

      const result = await response.json();
      const list = result.data ?? result;

      setFollowerList(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("팔로워 목록 조회 오류:", error);
      Alert.alert("조회 실패", "팔로워 수를 불러오지 못했습니다.");
    } finally {
      setLoadingFollowers(false);
    }
  }, [isStylist]);

  // 메뉴 개수 조회
  useEffect(() => {
    fetchMenuCounts();
  }, [fetchMenuCounts]);

  // 팔로잉 조회
  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  // 스타일리스트 확인 후 팔로워 조회
  useEffect(() => {
    if (!checkingStylist) {
      fetchFollowers();
    }
  }, [checkingStylist, fetchFollowers]);

  const nickname = loginUser?.nickname || "닉네임";
  const userId = loginUser?.userId || "";

  const showNotReady = (feature: string) => {
    Alert.alert(feature, `${feature} 화면은 준비 중이에요.`);
  };

  const handleFollowingPress = () => {
    router.push("/following");
  };

  const handleFollowersPress = () => {
    if (!isStylist) {
      showNotReady("팔로워");
      return;
    }

    router.push("/followers");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이페이지</Text>

          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="설정"
          >
            <Ionicons name="settings-outline" size={22} color={palette.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={38} color={palette.primaryLine} />
            </View>

            <View style={styles.profileInfo}>
              {!checkingStylist && (
                <View
                  style={[
                    styles.roleBadge,
                    isStylist && styles.roleBadgeStylist,
                  ]}
                >
                  <Ionicons
                    name={isStylist ? "sparkles" : "person-outline"}
                    size={11}
                    color={isStylist ? "#FFFFFF" : palette.textSub}
                  />
                  <Text
                    style={[
                      styles.roleBadgeText,
                      isStylist && styles.roleBadgeTextStylist,
                    ]}
                  >
                    {isStylist ? "스타일리스트" : "일반 회원"}
                  </Text>
                </View>
              )}

              <Text style={styles.profileName} numberOfLines={1}>
                {nickname}
              </Text>

              <Text style={styles.profileId} numberOfLines={1}>
                {userId ? `@${userId}` : ""}
              </Text>
            </View>

            <Pressable style={styles.followStat} onPress={handleFollowersPress}>
              <Text style={styles.statNumber}>
                {loadingFollowers ? "..." : followerList.length}
              </Text>

              <Text style={styles.statLabel}>팔로워</Text>
            </Pressable>

            <Pressable style={styles.followStat} onPress={handleFollowingPress}>
              <Text style={styles.statNumber}>
                {loadingFollowing ? "..." : followingList.length}
              </Text>

              <Text style={styles.statLabel}>팔로잉</Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.stylistButton,
              isStylist && styles.stylistEditButton,
            ]}
            onPress={() => {
              if (checkingStylist) return;

              if (isStylist) {
                router.push("/stylist-edit");
              } else {
                router.push("/stylist-register");
              }
            }}
          >
            {!isStylist && (
              <LinearGradient
                colors={["#6A5BB5", "#51458C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stylistGradient}
                pointerEvents="none"
              />
            )}

            <View
              style={[
                styles.stylistIconTile,
                isStylist && styles.stylistIconTileEdit,
              ]}
            >
              <Ionicons
                name={isStylist ? "create-outline" : "sparkles"}
                size={20}
                color={isStylist ? palette.primary : "#FFFFFF"}
              />
            </View>

            <View style={styles.stylistTextArea}>
              <Text
                style={[
                  styles.stylistButtonText,
                  isStylist && styles.stylistEditButtonText,
                ]}
              >
                {checkingStylist
                  ? "확인 중..."
                  : isStylist
                    ? "스타일리스트 프로필 수정"
                    : "스타일리스트 등록하기"}
              </Text>
              <Text
                style={[
                  styles.stylistSubText,
                  isStylist && styles.stylistEditSubText,
                ]}
              >
                {isStylist
                  ? "소개, 지역, 서비스 가격을 관리해요"
                  : "나만의 스타일링 서비스를 시작해 보세요"}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={isStylist ? palette.textMute : "rgba(255,255,255,0.8)"}
            />
          </Pressable>

          <Text style={styles.sectionLabel}>나의 활동</Text>

          <View style={styles.menuList}>
            {/* 좋아요 게시물 */}
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push("/liked-posts")}
            >
              <View style={styles.menuLabelArea}>
                <View style={[styles.menuIconTile, styles.tileLike]}>
                  <Ionicons name="heart" size={18} color="#E5566D" />
                </View>
                <Text style={styles.menuLabel}>좋아요 게시물</Text>
              </View>

              <View style={styles.menuRight}>
                <Text style={styles.menuCount}>{likedCount}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={palette.textMute}
                />
              </View>
            </Pressable>

            {/* 구매내역 */}
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push("/purchase-history" as any)}
            >
              <View style={styles.menuLabelArea}>
                <View style={[styles.menuIconTile, styles.tileBuy]}>
                  <Ionicons
                    name="bag-handle"
                    size={18}
                    color={palette.primary}
                  />
                </View>
                <Text style={styles.menuLabel}>구매내역</Text>
              </View>

              <View style={styles.menuRight}>
                <Text style={styles.menuCount}>{purchaseCount}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={palette.textMute}
                />
              </View>
            </Pressable>

            {/* 판매내역: 스타일리스트에게만 표시 */}
            {!checkingStylist && isStylist && (
              <Pressable
                style={styles.menuRow}
                onPress={() => router.push("/sales-history" as any)}
              >
                <View style={styles.menuLabelArea}>
                  <View style={[styles.menuIconTile, styles.tileSale]}>
                    <Ionicons name="stats-chart" size={18} color="#2E9E75" />
                  </View>
                  <Text style={styles.menuLabel}>판매내역</Text>
                </View>

                <View style={styles.menuRight}>
                  <Text style={styles.menuCount}>{saleCount ?? "—"}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={palette.textMute}
                  />
                </View>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
