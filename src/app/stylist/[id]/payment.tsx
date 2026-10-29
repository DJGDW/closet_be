import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MOCK_STYLISTS } from "../../../data/stylists";

const PURPLE = "#51458C";

const PAYMENT_METHODS = [
  { id: "card", label: "신용카드", detail: "카드 결제" },
  { id: "kakao", label: "카카오페이", detail: "" },
  { id: "naver", label: "네이버페이", detail: "" },
  { id: "transfer", label: "무통장입금", detail: "" },
];

export default function PaymentScreen() {
  const router = useRouter();

  const { id, service } = useLocalSearchParams<{
    id: string;
    service: string;
  }>();

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [agreed, setAgreed] = useState(false);

  const stylist = MOCK_STYLISTS.find((item) => item.id === id);

  const selectedService = stylist?.services.find(
    (item) => item.name === service,
  );

  if (!stylist || !selectedService) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        edges={["top"]}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>
        <Text style={{ textAlign: "center", marginTop: 30, color: "#292633" }}>
          결제할 서비스 정보를 찾을 수 없습니다.
        </Text>
      </SafeAreaView>
    );
  }

  const price = selectedService.price;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 상단 헤더 */}
      <View
        style={{
          height: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#EEEEF1",
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#292633" />
        </Pressable>

        <Text style={{ fontSize: 17, fontWeight: "800", color: "#292633" }}>
          결제
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 18,
        }}
      >
        {/* 서비스 정보 */}
        <Text style={sectionTitle}>서비스 정보</Text>

        <View
          style={{
            marginTop: 12,
            padding: 15,
            borderRadius: 12,
            backgroundColor: "#F6F6F7",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri: stylist.image }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#E7E5EC",
              marginRight: 12,
            }}
          />

          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: "#292633",
                }}
              >
                {stylist.name}
              </Text>

              <Text style={{ fontSize: 10, color: "#777481", marginLeft: 4 }}>
                스타일리스트
              </Text>

              <View style={{ flex: 1 }} />

              <Ionicons name="star" size={12} color="#F5B82E" />

              <Text style={{ fontSize: 11, color: "#55515D", marginLeft: 3 }}>
                {stylist.rating.toFixed(1)} ({stylist.reviews})
              </Text>
            </View>

            <Text
              style={{
                fontSize: 12,
                color: "#292633",
                marginTop: 6,
                fontWeight: "500",
              }}
            >
              {selectedService.name} 스타일링 서비스
            </Text>

            <Text
              style={{
                fontSize: 10,
                color: "#777481",
                marginTop: 4,
                lineHeight: 15,
              }}
            >
              {selectedService.description}
            </Text>
          </View>
        </View>

        {/* 결제 금액 */}
        <Text style={[sectionTitle, { marginTop: 22 }]}>결제 금액</Text>

        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: "#F6F6F7",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: "#55515D" }}>서비스 가격</Text>

            <Text style={{ fontSize: 12, color: "#292633" }}>
              ₩{price.toLocaleString("ko-KR")}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#E4E2E8",
              marginVertical: 11,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#292633" }}>
              최종 결제 금액
            </Text>

            <Text style={{ fontSize: 15, fontWeight: "800", color: "#292633" }}>
              ₩{price.toLocaleString("ko-KR")}
            </Text>
          </View>
        </View>

        {/* 결제 수단 */}
        <Text style={[sectionTitle, { marginTop: 22 }]}>결제 수단</Text>

        <View style={{ marginTop: 12, gap: 8 }}>
          {PAYMENT_METHODS.map((method) => {
            const selected = paymentMethod === method.id;

            return (
              <Pressable
                key={method.id}
                onPress={() => setPaymentMethod(method.id)}
                style={{
                  minHeight: 50,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? PURPLE : "#DEDBE3",
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <View
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: 9,
                    borderWidth: selected ? 0 : 1,
                    borderColor: "#B8B5BE",
                    backgroundColor: selected ? PURPLE : "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  {selected && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  )}
                </View>

                <Text
                  style={{
                    fontSize: 12,
                    color: "#292633",
                    fontWeight: selected ? "600" : "400",
                  }}
                >
                  {method.label}
                </Text>

                <View style={{ flex: 1 }} />

                {method.id === "kakao" && (
                  <View
                    style={{
                      backgroundColor: "#FEEA91",
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#66551B" }}>
                      카카오페이
                    </Text>
                  </View>
                )}

                {method.id === "naver" && (
                  <View
                    style={{
                      backgroundColor: "#E4F4E8",
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#477A52" }}>
                      네이버페이
                    </Text>
                  </View>
                )}

                {method.detail !== "" && (
                  <Text style={{ fontSize: 10, color: "#777481" }}>
                    {method.detail}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 약관 동의 */}
        <Pressable
          onPress={() => setAgreed((current) => !current)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 18,
            gap: 7,
          }}
        >
          <Ionicons
            name={agreed ? "checkbox" : "square-outline"}
            size={15}
            color={agreed ? PURPLE : "#B8B5BE"}
          />

          <Text style={{ fontSize: 10, color: "#898692" }}>
            결제 진행 및 서비스 이용약관에 동의합니다.
          </Text>
        </Pressable>
      </ScrollView>

      {/* 하단 결제 영역 */}
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Pressable
          onPress={() => {
            if (!agreed) return;
            // 실제 결제 기능은 추후 연결
          }}
          style={{
            height: 52,
            borderRadius: 9,
            backgroundColor: PURPLE,
            alignItems: "center",
            justifyContent: "center",
            opacity: agreed ? 1 : 0.75,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
            ₩{price.toLocaleString("ko-KR")} 결제하기
          </Text>
        </Pressable>

        <Text
          style={{
            fontSize: 9,
            color: "#96929E",
            textAlign: "center",
            marginTop: 8,
            marginBottom: 2,
          }}
        >
          안전한 결제를 위해 결제 정보는 암호화되어 처리됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const sectionTitle = {
  fontSize: 14,
  fontWeight: "800" as const,
  color: "#292633",
};
