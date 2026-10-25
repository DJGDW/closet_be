import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MOCK_STYLISTS } from "../../data/stylists";
import { useState } from "react";

export default function StylistProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedService, setSelectedService] = useState("BASIC");

  const stylist = MOCK_STYLISTS.find((item) => item.id === id);

  if (!stylist) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>
        <Text style={{ textAlign: "center", marginTop: 40 }}>
          스타일리스트 정보를 찾을 수 없습니다.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View
        style={{
          height: 48,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#F0EEF4",
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
            fontSize: 16,
            fontWeight: "700",
            color: "#292633",
          }}
        >
          스타일리스트 프로필
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <Image
          source={{ uri: stylist.image }}
          style={{
            width: "100%",
            height: 190,
            backgroundColor: "#E7E5EC",
          }}
          resizeMode="cover"
        />

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#292633" }}>
              {stylist.name}
            </Text>
            <Ionicons name="checkmark-circle" size={17} color="#4A9AC8" />
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 8,
            }}
          >
            {stylist.categories.map((category) => (
              <View
                key={category}
                style={{
                  backgroundColor: "#F1EEFC",
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontSize: 11, color: "#51458C" }}>
                  #{category}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 10,
            }}
          >
            <Ionicons name="star" size={15} color="#F5A623" />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#292633" }}>
              {stylist.rating.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 12, color: "#898692" }}>
              ({stylist.reviews}개 리뷰)
            </Text>
          </View>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#292633",
              marginTop: 18,
              marginBottom: 7,
            }}
          >
            자기소개
          </Text>

          <Text style={{ fontSize: 12, lineHeight: 19, color: "#66636E" }}>
            {stylist.introduction}
          </Text>

          <View
            style={{
              height: 1,
              backgroundColor: "#E7E5EC",
              marginVertical: 16,
            }}
          />

          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#292633",
              marginBottom: 10,
            }}
          >
            제공 서비스
          </Text>

          {stylist.services.map((service) => {
            const isSelected = selectedService === service.name;

            return (
              <Pressable
                key={service.name}
                onPress={() => setSelectedService(service.name)}
                style={{
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected
                    ? service.color
                    : service.color + "66",
                  borderRadius: 13,
                  paddingHorizontal: 15,
                  paddingVertical: 11,
                  marginBottom: 8,
                  backgroundColor: isSelected
                    ? service.color + "12"
                    : service.color + "08",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: service.color,
                      }}
                    >
                      {service.name}
                    </Text>

                    <Text
                      style={{
                        fontSize: 11,
                        color: "#85818D",
                        marginTop: 5,
                      }}
                    >
                      {service.description}
                    </Text>

                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "800",
                        color: "#292633",
                        marginTop: 5,
                      }}
                    >
                      ₩{service.price.toLocaleString("ko-KR")}
                    </Text>
                  </View>

                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: service.color,
                      borderRadius: 9,
                      paddingHorizontal: 13,
                      paddingVertical: 8,
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: service.color,
                      }}
                    >
                      {isSelected ? "선택됨" : "선택하기"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#292633" }}>
              포트폴리오
            </Text>

            <Pressable
              onPress={() => router.push(`/stylist/${stylist.id}/portfolio`)}
              hitSlop={8}
            >
              <Text style={{ fontSize: 12, color: "#777481" }}>더보기 ›</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 7 }}>
            {stylist.portfolios.slice(0, 3).map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                resizeMode="cover"
                style={{
                  flex: 1,
                  height: 100,
                  borderRadius: 7,
                  backgroundColor: "#E7E5EC",
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: "#F0EEF4",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            flex: 1,
            height: 46,
            borderRadius: 8,
            backgroundColor: "#F1EEFC",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#51458C" }}>
            문의하기
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            router.push({
              pathname: "/stylist/[id]/payment",
              params: {
                id: stylist.id,
                service: selectedService,
              },
            });
          }}
          style={{
            flex: 1.6,
            height: 46,
            borderRadius: 8,
            backgroundColor: "#51458C",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
            서비스 신청하기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
