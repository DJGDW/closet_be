import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MOCK_STYLISTS } from "../../../data/stylists";

export default function PortfolioScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: screenWidth } = useWindowDimensions();

  const stylist = MOCK_STYLISTS.find((item) => item.id === id);

  if (!stylist) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>
        <Text style={{ textAlign: "center", marginTop: 30 }}>
          포트폴리오를 찾을 수 없습니다.
        </Text>
      </SafeAreaView>
    );
  }

  const images = stylist.portfolios;
  const gap = 6;
  const padding = 8;
  const columnWidth = (screenWidth - padding * 2 - gap) / 2;

  const imageStyle = (height: number) => ({
    width: "100%" as const,
    height,
    borderRadius: 7,
    backgroundColor: "#E7E5EC",
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      {/* 헤더 */}
      <View
        style={{
          height: 52,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#EEEEF1",
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            marginRight: 26,
            fontSize: 15,
            fontWeight: "700",
            color: "#292633",
          }}
        >
          포트폴리오
        </Text>
      </View>

      {/* 포트폴리오 그리드 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: padding,
          paddingBottom: 24,
        }}
      >
        <View style={{ flexDirection: "row", gap }}>
          {/* 왼쪽 열 */}
          <View style={{ width: columnWidth, gap }}>
            {images
              .filter((_, index) => index % 2 === 0)
              .map((uri, index) => (
                <Image
                  key={`${uri}-${index}`}
                  source={{ uri }}
                  resizeMode="cover"
                  style={imageStyle(index % 3 === 0 ? 220 : 160)}
                />
              ))}
          </View>

          {/* 오른쪽 열 */}
          <View style={{ width: columnWidth, gap, paddingTop: 35 }}>
            {images
              .filter((_, index) => index % 2 === 1)
              .map((uri, index) => (
                <Image
                  key={`${uri}-${index}`}
                  source={{ uri }}
                  resizeMode="cover"
                  style={imageStyle(index % 3 === 1 ? 220 : 170)}
                />
              ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
