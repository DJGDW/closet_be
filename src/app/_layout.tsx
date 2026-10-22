
import { Stack, usePathname } from "expo-router";
import { View } from "react-native";

import { SignupProvider } from "../signup-context";
import BottomNavigation from "../components/BottomNavigation";
import { styles } from "../styles/feed.styles";

export default function RootLayout() {
  const pathname = usePathname();

  const showBottomNavigation =
    pathname === "/feed" ||
    pathname === "/search" ||
    pathname === "/chat" ||
    pathname === "/mypage";

  return (
    <SignupProvider>
      <View style={styles.safeArea}>
        <View style={styles.appFrame}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#FFFFFF" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="feed" />
            <Stack.Screen name="search" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="mypage" />
          </Stack>

          {showBottomNavigation && <BottomNavigation />}
        </View>
      </View>
    </SignupProvider>
  );
}
