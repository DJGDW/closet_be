
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BellIcon from "../../assets/icons/bell.svg";
import PlusIcon from "../../assets/icons/plusicon.svg";

import { styles } from "../styles/feed.styles";

type FeedPost = {
  id: string;
  image: string;
  stylistName: string;
  profileImage: string;
  style: string;
};

const FEED_POSTS: FeedPost[] = [
  {
    id: "1",
    image:
      "https://image.msscdn.net/thumbnails/snap/images/2026/10/11/3b119306b3894e519f3d5149b2262d41.jpg?w=1000",
    stylistName: "gar_dxx",
    profileImage:
      "https://image.msscdn.net/thumbnails/mfile_s01/_simbols/p/5d3990ce38577ed747725af0a2cacab7_20260624001607.?w=192",
    style: "미니멀·캐주얼",
  },
  {
    id: "2",
    image:
      "https://image.msscdn.net/thumbnails/snap/images/2026/10/11/dff8e5e937dc492c95254db2dc5149c6.jpg?w=1000",
    stylistName: "jaewon",
    profileImage:
      "https://image.msscdn.net/thumbnails/mfile_s01/_simbols/d/29db4858eaca159eb6d9f661940b214f_20240913200400.?w=192",
    style: "미니멀·캐주얼",
  },
  {
    id: "3",
    image:
      "https://image.msscdn.net/thumbnails/snap/images/2026/10/11/01b0a629615c48e696b8cc78053d8c99.jpg?w=1000",
    stylistName: "seoyeon_96",
    profileImage:
      "https://image.msscdn.net/thumbnails/mfile_s01/_simbols/d/9a74242177d1c5b5df352a1ba817f659_20260803122803.?w=96",
    style: "미니멀·페미닌",
  },
  {
    id: "4",
    image:
      "https://image.msscdn.net/thumbnails/snap/images/2026/10/12/c9e73b0241a64c87aa7b966c4d24f7ea.jpg?w=1000",
    stylistName: "jun50_park",
    profileImage:
      "https://image.msscdn.net/thumbnails/mfile_s01/_simbols/c/a4ec8da45451a426e6cc6c6ef73b7dfd_20260402112635.?w=96",
    style: "미니멀·캐주얼",
  },
  {
    id: "5",
    image:
      "https://image.msscdn.net/thumbnails/snap/images/2026/10/12/a1d95bd9ec79491ba8835ec323eb31c2.jpg?w=1000",
    stylistName: "yujinchoi",
    profileImage:
      "https://image.msscdn.net/thumbnails/mfile_s01/_simbols/b/bf86abeecc64c5fea0150e867a617b6f_20250907201502.?w=96",
    style: "미니멀·스트릿",
  },
  {
    id: "6",
    image:
      "https://image.msscdn.net/thumbnails/snap/images/2026/10/12/d43528b758fa497a99416e219ccef529.jpg?w=1000",
    stylistName: "정현우",
    profileImage:
      "https://image.msscdn.net/thumbnails/mfile_s01/_simbols/n/564d162834378e28d1a7563de14db3ba_20260422113427.?w=96",
    style: "스트릿·캐주얼",
  },
  {
    id: "7",
    image:
      "https://image.msscdn.net/thumbnails/snap/images/2026/10/09/40f04422a2874dedb7dcd53476ed7640.jpg?w=1000",
    stylistName: "jis00choo",
    profileImage:
      "https://image.msscdn.net/thumbnails/mfile_s01/_simbols/g/f69b8b1983aed1cf667b6eb053df893f_20251107210551.?w=96",
    style: "캐주얼·페미닌",
  },
  {
    id: "8",
    image:
      "https://image.msscdn.net/thumbnails/snap/images/2026/10/10/c227b872f75142cb83bbda361157cbaa.jpg?w=1000",
    stylistName: "doyun_00",
    profileImage:
      "https://image.msscdn.net/thumbnails/mfile_s01/_simbols/w/7bd328deff066e63b2db225ac2a62343_20240605085722.jpg?w=96",
    style: "스트릿·캐주얼",
  },
];

export default function FeedScreen() {
  const [refreshKey] = useState(0);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.appFrame}>
        <View style={styles.header}>
          <View style={styles.logoArea}>
            <Image
              source={require("../../assets/images/stylink-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerIconButton}
              onPress={() =>
                Alert.alert("게시물 작성", "게시물 작성 화면은 준비 중이에요.")
              }
              accessibilityRole="button"
              accessibilityLabel="게시물 작성"
            >
              <PlusIcon width={25} height={25} />
            </Pressable>

            <Pressable
              style={styles.headerIconButton}
              onPress={() => Alert.alert("알림", "알림 화면은 준비 중이에요.")}
              accessibilityRole="button"
              accessibilityLabel="알림"
            >
              <BellIcon width={23} height={23} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          key={refreshKey}
          style={styles.feedScroll}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.feedGrid}>
            {FEED_POSTS.map((post) => (
              <Pressable
                key={post.id}
                style={styles.postCard}
                onPress={() => Alert.alert("스타일리스트", post.stylistName)}
              >
                <Image
                  source={{ uri: post.image }}
                  style={styles.postImage}
                  resizeMode="cover"
                />

                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.2)", "rgba(0,0,0,1)"]}
                  locations={[0, 0.4, 1]}
                  style={styles.imageGradient}
                  pointerEvents="none"
                />

                <View style={styles.stylistInfo} pointerEvents="none">
                  <Image
                    source={{ uri: post.profileImage }}
                    style={styles.stylistProfileImage}
                    resizeMode="cover"
                  />

                  <View style={styles.stylistTextArea}>
                    <Text style={styles.stylistName} numberOfLines={1}>
                      {post.stylistName}
                    </Text>

                    <Text style={styles.stylistStyle} numberOfLines={1}>
                      {post.style}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
