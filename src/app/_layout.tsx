import { Stack } from "expo-router";
import { SignupProvider } from "../signup-context";

export default function RootLayout() {
  return (
    <SignupProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
      </Stack>
    </SignupProvider>
  );
}
