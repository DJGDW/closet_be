
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import React, { useState } from "react";
import { File as ExpoFile } from "expo-file-system";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import styles from "../styles/create-post.styles";

const API_BASE_URL = "http://192.168.0.5:8080";

const STYLES = [
  { id: 1, label: "캐주얼" },
  { id: 2, label: "스트릿" },
  { id: 3, label: "미니멀" },
  { id: 4, label: "댄디" },
  { id: 5, label: "포멀" },
  { id: 6, label: "아메카지" },
  { id: 7, label: "빈티지" },
  { id: 8, label: "고프코어" },
  { id: 9, label: "Y2K" },
  { id: 10, label: "페미닌" },
  { id: 11, label: "모던" },
  { id: 12, label: "스포츠/애슬레저" },
];

const BODY_TYPES = [
  { id: 1, label: "어깨가 좁은 체형" },
  { id: 2, label: "허리가 두꺼운 체형" },
  { id: 3, label: "허리가 얇은 체형" },
  { id: 4, label: "허벅지가 두꺼운 체형" },
  { id: 5, label: "허벅지가 얇은 체형" },
  { id: 6, label: "종아리가 두꺼운 체형" },
  { id: 7, label: "종아리가 얇은 체형" },
  { id: 8, label: "다리가 짧은 체형" },
];

type PickedImage = {
  uri: string;
  file?: File;
  name: string;
  mimeType: string;
};

async function getAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token")
      );
    }

    return await SecureStore.getItemAsync("accessToken");
  } catch (error) {
    console.error("토큰 조회 오류:", error);
    return null;
  }
}

function showMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function CreatePostScreen() {
  const [pickedImage, setPickedImage] =
    useState<PickedImage | null>(null);

  const [selectedStyles, setSelectedStyles] =
    useState<number[]>([]);

  const [selectedBodyTypes, setSelectedBodyTypes] =
    useState<number[]>([]);

  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const chooseImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showMessage(
          "사진 접근 권한",
          "게시물에 사용할 사진을 선택하려면 사진 접근 권한이 필요해요."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      setPickedImage({
        uri: asset.uri,
        file: (asset as any).file as File | undefined,
        name: asset.fileName || `stylink-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
      });
    } catch (error) {
      console.error("사진 선택 오류:", error);
      showMessage("오류", "사진을 불러오지 못했어요.");
    }
  };

  const toggleSelection = (
    id: number,
    update: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    update((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const addHashtag = () => {
    const cleaned = hashtagInput
      .trim()
      .replace(/^#+/, "")
      .replace(/\s+/g, "");

    if (!cleaned) {
      return;
    }

    if (hashtags.includes(cleaned)) {
      setHashtagInput("");
      return;
    }

    setHashtags((previous) => [...previous, cleaned]);
    setHashtagInput("");
  };

  const removeHashtag = (tag: string) => {
    setHashtags((previous) =>
      previous.filter((item) => item !== tag)
    );
  };

  const submitPost = async () => {
    if (submitting) {
      return;
    }

    if (!pickedImage) {
      showMessage(
        "사진을 선택해 주세요",
        "게시물 사진이 필요해요."
      );
      return;
    }

    if (selectedStyles.length === 0) {
      showMessage(
        "스타일을 선택해 주세요",
        "게시물의 스타일 태그를 하나 이상 선택해 주세요."
      );
      return;
    }

    // 현재 백엔드의 ratioPk는 필수 Long 파라미터다.
    if (selectedBodyTypes.length === 0) {
      showMessage(
        "체형 보완 태그를 선택해 주세요",
        "현재 서버는 체형 보완 ID(ratioPk)를 필수로 요구해요."
      );
      return;
    }

    setSubmitting(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        showMessage(
          "로그인이 필요해요",
          "로그인 정보가 없어요. 다시 로그인해 주세요."
        );
        router.replace("/");
        return;
      }

      const formData = new FormData();

      if (Platform.OS === "web") {
        let imageFile = pickedImage.file;

        if (!imageFile) {
          const imageResponse = await fetch(pickedImage.uri);

          if (!imageResponse.ok) {
            throw new Error("선택한 이미지를 읽지 못했습니다.");
          }

          const imageBlob = await imageResponse.blob();

          imageFile = new File(
            [imageBlob],
            pickedImage.name,
            { type: pickedImage.mimeType }
          );
        }

        formData.append("image", imageFile, imageFile.name);
      } else {
  const imageFile = new ExpoFile(pickedImage.uri);

  formData.append("image", imageFile);
}

      // 백엔드 PostController의 필드명과 일치시킨다.
      formData.append("typePk", String(selectedStyles[0]));
      formData.append("ratioPk", String(selectedBodyTypes[0]));

      // List<String> hashtags를 받을 수 있도록 같은 이름으로 반복 전송한다.
      hashtags.forEach((tag) => {
        formData.append("hashtags", tag);
      });

      console.log("게시물 등록 요청:", {
        hasImage: true,
        typePk: selectedStyles[0],
        ratioPk: selectedBodyTypes[0],
        hashtagCount: hashtags.length,
      });

      const response = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseText = await response.text().catch(() => "");

      if (!response.ok) {
        console.error("게시물 등록 실패:", {
          status: response.status,
          response: responseText,
        });

        if (response.status === 401) {
          showMessage(
            "인증 오류",
            "서버에서 로그인을 확인하지 못했어요. 다시 로그인해 주세요."
          );
          router.replace("/");
          return;
        }

        if (response.status === 403) {
          showMessage(
            "게시물 등록 거부",
            "서버가 요청을 거부했어요. 로그인 토큰, 보안 필터 및 서버 로그를 확인해 주세요.\n\n" +
              (responseText || "서버에서 상세 오류 메시지를 반환하지 않았어요.")
          );
          return;
        }

        showMessage(
          "게시물 등록 실패",
          `HTTP ${response.status}\n\n` +
            (responseText ||
              "서버에서 상세 오류 메시지를 반환하지 않았어요.")
        );
        return;
      }

      showMessage("등록 완료", "게시물이 등록되었어요!");
      router.replace("/feed");
    } catch (error) {
      console.error("게시물 등록 오류:", error);

      showMessage(
        "네트워크 오류",
        "서버 연결 또는 이미지 전송 중 문제가 발생했어요. 백엔드가 실행 중인지 확인해 주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>게시물 등록</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 사진 등록 */}
        <View style={styles.imageSection}>
          <Pressable
            onPress={chooseImage}
            style={styles.imagePicker}
          >
            {pickedImage ? (
              <Image
                source={{ uri: pickedImage.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imageIcon}>▧</Text>
                <Text style={styles.imageHint}>사진 선택</Text>
              </View>
            )}
          </Pressable>

          {pickedImage && (
            <Pressable onPress={chooseImage}>
              <Text style={styles.changeImageText}>
                사진 변경
              </Text>
            </Pressable>
          )}
        </View>

        {/* 스타일 태그 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>스타일 태그</Text>
          <Text style={styles.description}>
            게시물에 어울리는 스타일을 선택해 주세요.
          </Text>

          <View style={styles.tagContainer}>
            {STYLES.map((item) => {
              const selected = selectedStyles.includes(item.id);

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    toggleSelection(item.id, setSelectedStyles)
                  }
                  style={[
                    styles.tag,
                    selected && styles.selectedTag,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selected && styles.selectedTagText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 체형 보완 태그 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>체형 보완</Text>
          <Text style={styles.description}>
            스타일링에 참고할 체형 보완 태그를 선택해 주세요.
          </Text>

          <View style={styles.tagContainer}>
            {BODY_TYPES.map((item) => {
              const selected = selectedBodyTypes.includes(item.id);

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    toggleSelection(item.id, setSelectedBodyTypes)
                  }
                  style={[
                    styles.tag,
                    selected && styles.selectedTag,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selected && styles.selectedTagText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 해시태그 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>해시태그</Text>
          <Text style={styles.description}>
            게시물을 설명하는 해시태그를 추가해 주세요.
          </Text>

          <View style={styles.hashtagInputRow}>
            <TextInput
              value={hashtagInput}
              onChangeText={setHashtagInput}
              placeholder="예: 데일리룩"
              placeholderTextColor="#A5A5A5"
              style={styles.hashtagInput}
              returnKeyType="done"
              onSubmitEditing={addHashtag}
            />

            <Pressable
              onPress={addHashtag}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>추가</Text>
            </Pressable>
          </View>

          {hashtags.length > 0 && (
            <View style={styles.hashtagList}>
              {hashtags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => removeHashtag(tag)}
                  style={styles.hashtagChip}
                >
                  <Text style={styles.hashtagText}>#{tag} ×</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* 등록 버튼 */}
        <Pressable
          onPress={submitPost}
          disabled={submitting}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && !submitting && styles.submitButtonPressed,
            submitting && styles.submitButtonDisabled,
          ]}
        >
          <LinearGradient
            colors={["#5D4B96", "#514185"]}
            style={styles.submitGradient}
          >
            {submitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  등록 중...
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                게시물 등록
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        <Text style={styles.footerText}>
          등록한 게시물은 피드에서 확인할 수 있어요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
