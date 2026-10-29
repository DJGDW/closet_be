
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
              />
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
