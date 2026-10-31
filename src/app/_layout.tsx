import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SignupProvider } from "../signup-context";
import BottomNavigation from "../components/BottomNavigation";
import { styles } from "../styles/feed.styles";

export default function RootLayout() {
  const pathname = usePathname();

  const showBottomNavigation = [
    "/feed",
    "/search",
    "/chat",
    "/mypage",
  ].includes(pathname);

  return (
    <SafeAreaProvider>
      <SignupProvider>
        <View style={styles.safeArea}>
          <View style={styles.appFrame}>
            <View style={{ flex: 1, minHeight: 0 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: "#FFFFFF",
                  },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="feed" />
                <Stack.Screen name="search" />
                <Stack.Screen name="chat" />
                <Stack.Screen name="mypage" />
                <Stack.Screen name="stylist/[id]" />
                <Stack.Screen name="stylist/[id]/portfolio" />
                <Stack.Screen name="stylist/[id]/payment" />
              </Stack>
            </View>

            {showBottomNavigation && (
              <View
                style={{
                  flexShrink: 0,
                  zIndex: 10,
                  elevation: 10,
                }}
              >
                <BottomNavigation />
              </View>
            )}
          </View>
        </View>
      </SignupProvider>
    </SafeAreaProvider>
  );
}
