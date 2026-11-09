import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default function PaymentFailScreen() {
  const router = useRouter();
  const { code, message, id } = useLocalSearchParams<{
    code?: string;
    message?: string;
    id?: string;
  }>();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>!</Text>
      <Text style={styles.title}>결제가 완료되지 않았습니다.</Text>
      <Text style={styles.message}>
        {message || "결제가 취소되었거나 승인 과정에서 문제가 발생했습니다."}
      </Text>
      {code ? <Text style={styles.code}>오류 코드: {code}</Text> : null}
      <Pressable
        style={styles.button}
        onPress={() => router.replace(id ? (`/stylist/${id}` as any) : "/")}
      >
        <Text style={styles.buttonText}>이전 화면으로</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FCE8E8",
    color: "#D14343",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 38,
    fontWeight: "700",
    overflow: "hidden",
    marginBottom: 22,
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    lineHeight: 22,
  },
  code: { fontSize: 12, color: "#999999", marginTop: 10 },
  button: {
    marginTop: 28,
    height: 50,
    paddingHorizontal: 28,
    borderRadius: 9,
    backgroundColor: "#6246A1",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
