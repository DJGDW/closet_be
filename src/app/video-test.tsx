import { useEffect, useRef, useState } from "react";
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  mediaDevices,
  RTCView,
  type MediaStream,
} from "react-native-webrtc";

export default function VideoTestScreen() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      if (Platform.OS === "android") {
        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const cameraGranted =
          permissions[PermissionsAndroid.PERMISSIONS.CAMERA] ===
          PermissionsAndroid.RESULTS.GRANTED;

        const micGranted =
          permissions[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
          PermissionsAndroid.RESULTS.GRANTED;

        if (!cameraGranted || !micGranted) {
          Alert.alert("권한 필요", "카메라와 마이크 권한을 허용해 주세요.");
          return;
        }
      }

      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: "user",
          width: 640,
          height: 480,
          frameRate: 30,
        },
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraEnabled(true);
      setMicEnabled(true);
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("카메라 실행 실패", String(error));
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  };

  const toggleCamera = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
  };

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stylink 영상통화 테스트</Text>

      <View style={styles.videoContainer}>
        {stream ? (
          <RTCView
            streamURL={stream.toURL()}
            style={styles.video}
            objectFit="cover"
            mirror
          />
        ) : (
          <Text style={styles.placeholder}>
            카메라를 실행해 주세요.
          </Text>
        )}
      </View>

      <Text style={styles.status}>
        {stream ? "카메라 연결 성공!" : "카메라 대기 중"}
      </Text>

      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={startCamera}>
          <Text style={styles.buttonText}>카메라 시작</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={toggleCamera}>
          <Text style={styles.buttonText}>
            {cameraEnabled ? "카메라 끄기" : "카메라 켜기"}
          </Text>
        </Pressable>

        <Pressable style={styles.button} onPress={toggleMic}>
          <Text style={styles.buttonText}>
            {micEnabled ? "마이크 끄기" : "마이크 켜기"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.stopButton]}
          onPress={stopCamera}
        >
          <Text style={styles.buttonText}>통화 종료</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#222222",
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  status: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
    fontWeight: "600",
  },
  buttons: {
    gap: 10,
  },
  button: {
    backgroundColor: "#208AEF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#E5484D",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});