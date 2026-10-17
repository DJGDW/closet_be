import { router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import common from "../styles/signup-common.styles";
import styles from "../styles/signup-step5.styles";

export default function SignupStep5() {
  return (
    <View style={common.webBackground}>
      <View style={common.screen}>
        <View style={styles.content}>
          <Image
            source={require("../../assets/images/check-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>회원가입이 완료되었습니다.</Text>
          <Text style={styles.description}>
            이제 나에게 맞는 스타일리스트를 찾아보세요.
          </Text>
        </View>

        <View style={common.footerBase}>
          <Pressable
            style={common.nextButton}
            onPress={() => router.replace("/")}
          >
            <Text style={common.nextButtonText}>로그인</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
