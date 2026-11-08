import { View, Text } from "react-native";

export default function VideoCallFallback() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>Video Call is not supported on this platform.</Text>
    </View>
  );
}