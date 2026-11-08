import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Client } from "@stomp/stompjs";

const API_BASE_URL = "http://192.168.0.5:8080";
const WS_URL = "ws://192.168.0.5:8080/ws";

// 백엔드 VideoCall.STATUS_* 값
const STATUS_REJECTED = 2;
const STATUS_ENDED = 3;
const STATUS_MISSED = 4;
const STATUS_CANCELED = 5;
const FINISHED_STATUSES = [
  STATUS_REJECTED,
  STATUS_ENDED,
  STATUS_MISSED,
  STATUS_CANCELED,
];

// 발신자가 ANSWER를 받을 때까지 OFFER를 재전송하는 간격 / 최대 횟수
const OFFER_RETRY_INTERVAL_MS = 1000;
const OFFER_RETRY_MAX = 40;

export default function VideoCallScreen() {
  const router = useRouter();

  const { roomPk, callPk, isCaller } = useLocalSearchParams<{
    roomPk: string;
    callPk: string;
    isCaller: string;
  }>();

  const caller = isCaller === "true";

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const clientRef = useRef<Client | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 상대 ICE 후보 (remoteDescription 설정 전에 도착한 것 보관)
  const remoteCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  // 이미 처리한 상대 ICE 후보 (재전송 중복 제거)
  const seenRemoteCandidatesRef = useRef<Set<string>>(new Set());

  // 내가 만든 ICE 후보 (발신자가 재전송할 때 사용)
  const localCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  // 발신자의 OFFER (재전송용)
  const offerRef = useRef<{ type: string; sdp: string } | null>(null);
  const offerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offerRetryCountRef = useRef(0);
  const offerStartedRef = useRef(false);

  const answerReceivedRef = useRef(false); // 발신자: ANSWER 수신 여부
  const offerHandledRef = useRef(false); // 수신자: OFFER 처리 여부

  const startedRef = useRef(false);
  const endingRef = useRef(false);

  const [status, setStatus] = useState("통화 준비 중...");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  // OFFER 재전송 중지
  const stopOfferRetry = () => {
    if (offerTimerRef.current) {
      clearInterval(offerTimerRef.current);
      offerTimerRef.current = null;
    }
  };

  // 리소스 정리
  const cleanupCall = () => {
    stopOfferRetry();

    clientRef.current?.deactivate();
    clientRef.current = null;

    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    localStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    remoteCandidatesRef.current = [];
    seenRemoteCandidatesRef.current.clear();
    localCandidatesRef.current = [];
  };

  // 화면 종료
  const finishCallScreen = () => {
    if (endingRef.current) return;

    endingRef.current = true;
    cleanupCall();
    router.back();
  };

  // 시그널 전송 (백엔드는 OFFER / ANSWER / ICE_CANDIDATE만 허용)
  const sendSignal = (signalType: string, signalData: any) => {
    const client = clientRef.current;

    if (!client?.connected) {
      console.log("WebSocket 연결 전이라 시그널을 보낼 수 없습니다.");
      return;
    }

    client.publish({
      destination: `/app/chat/${roomPk}/video-call`,
      body: JSON.stringify({
        callPk: Number(callPk),
        signalType,
        signalData: JSON.stringify(signalData),
      }),
    });

    console.log("📤 시그널 전송:", signalType);
  };

  // [발신자] OFFER 생성 후, ANSWER를 받을 때까지 OFFER + ICE 후보를 반복 전송
  //  - 백엔드(simple broker)는 메시지를 쌓아두지 않으므로
  //    수신자가 아직 구독 전이면 신호가 유실된다. 그래서 재전송한다.
  //  - 수락 전에 보낸 신호는 서버가 거절하지만 무해하며,
  //    수락 후에는 다음 재전송에서 정상 전달된다.
  const startOfferRetry = async () => {
    const peer = peerRef.current;

    if (!peer || offerStartedRef.current) return;

    offerStartedRef.current = true;

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const local = peer.localDescription;

      if (!local) {
        throw new Error("localDescription이 없습니다.");
      }

      offerRef.current = { type: local.type, sdp: local.sdp };

      console.log("📤 OFFER 생성 완료");
    } catch (error) {
      offerStartedRef.current = false;

      console.error("OFFER 생성 오류:", error);

      setStatus("통화 연결 준비에 실패했습니다.");
      return;
    }

    offerRetryCountRef.current = 0;

    const tick = () => {
      if (answerReceivedRef.current) {
        stopOfferRetry();
        return;
      }

      if (offerRetryCountRef.current >= OFFER_RETRY_MAX) {
        stopOfferRetry();
        setStatus("상대방이 응답하지 않습니다.");
        return;
      }

      offerRetryCountRef.current += 1;

      sendSignal("OFFER", offerRef.current);

      localCandidatesRef.current.forEach((candidate) => {
        sendSignal("ICE_CANDIDATE", candidate);
      });
    };

    tick();
    offerTimerRef.current = setInterval(tick, OFFER_RETRY_INTERVAL_MS);

    setStatus("상대방에게 연결 요청을 보내는 중...");
  };

  // 상대방 ICE 후보 처리
  const flushRemoteCandidates = async (peer: RTCPeerConnection) => {
    if (!peer.remoteDescription) return;

    const candidates = [...remoteCandidatesRef.current];
    remoteCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("ICE 후보 추가 오류:", error);
      }
    }
  };

  // 상대방 시그널 처리
  const handleSignal = async (event: any) => {
    console.log("📩 상대방 신호 수신:", {
      callPk: event.callPk,
      signalType: event.signalType,
      senderUserPk: event.senderUserPk,
    });

    const peer = peerRef.current;

    if (!peer || !event.signalType) return;
    if (Number(event.callPk) !== Number(callPk)) return;

    try {
      const data = JSON.parse(event.signalData || "{}");

      // [수신자] OFFER 수신 → ANSWER 전송
      if (event.signalType === "OFFER") {
        if (caller) return; // 발신자는 OFFER를 처리하지 않음
        if (offerHandledRef.current) return; // 재전송된 중복 OFFER 무시

        offerHandledRef.current = true;

        console.log("📥 OFFER 수신");

        await peer.setRemoteDescription(new RTCSessionDescription(data));

        console.log("✅ OFFER 원격 설명 설정 완료");

        await flushRemoteCandidates(peer);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        const local = peer.localDescription;

        console.log("📤 ANSWER 생성 완료");

        sendSignal(
          "ANSWER",
          local ? { type: local.type, sdp: local.sdp } : answer
        );

        setStatus("상대방과 연결 중...");
        return;
      }

      // [발신자] ANSWER 수신
      if (event.signalType === "ANSWER") {
        if (!caller) return;
        if (answerReceivedRef.current) return;

        answerReceivedRef.current = true;
        stopOfferRetry();

        console.log("📥 ANSWER 수신");

        await peer.setRemoteDescription(new RTCSessionDescription(data));

        console.log("✅ ANSWER 원격 설명 설정 완료");

        await flushRemoteCandidates(peer);

        // 마지막 재전송 이후에 만들어진 후보까지 확실히 전달
        localCandidatesRef.current.forEach((candidate) => {
          sendSignal("ICE_CANDIDATE", candidate);
        });

        setStatus("상대방과 연결 중...");
        return;
      }

      // ICE 후보 수신
      if (event.signalType === "ICE_CANDIDATE") {
        if (!data?.candidate) return;

        const key = JSON.stringify(data);

        if (seenRemoteCandidatesRef.current.has(key)) return;
        seenRemoteCandidatesRef.current.add(key);

        console.log("🧊 ICE 후보 수신");

        if (peer.remoteDescription) {
          await peer.addIceCandidate(new RTCIceCandidate(data));
        } else {
          remoteCandidatesRef.current.push(data);
        }
      }
    } catch (error) {
      console.error("시그널 처리 오류:", error);
    }
  };

  // 영상통화 시작
  const startCall = async () => {
    if (startedRef.current) return;

    startedRef.current = true;

    try {
      setStatus("카메라와 마이크를 준비하고 있습니다.");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: "user",
          width: 640,
          height: 480,
          frameRate: 30,
        },
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerRef.current = peer;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      // 상대방 영상 수신
      peer.ontrack = (event) => {
        console.log("🎥 상대방 영상 트랙 수신!", event);

        const incomingStream = event.streams[0];

        if (incomingStream && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = incomingStream;

          console.log("✅ 상대방 영상 스트림 연결 완료");

          setStatus("상대방과 영상이 연결되었습니다.");
        } else {
          console.log("⚠️ 수신된 스트림이 없습니다.");
        }
      };

      // ICE 후보 생성
      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          console.log("🧊 ICE 후보 수집 완료");
          return;
        }

        console.log("🧊 ICE 후보 생성:", event.candidate.candidate);

        const candidate = event.candidate.toJSON();

        localCandidatesRef.current.push(candidate);

        // 발신자는 ANSWER를 받기 전까지 재전송 루프가 대신 보낸다
        if (caller && !answerReceivedRef.current) return;

        sendSignal("ICE_CANDIDATE", candidate);
      };

      // 연결 상태 확인
      peer.onconnectionstatechange = () => {
        console.log("🔌 WebRTC 연결 상태:", peer.connectionState);
        console.log("📡 ICE 연결 상태:", peer.iceConnectionState);
        console.log("📝 Signaling 상태:", peer.signalingState);

        if (peer.connectionState === "connected") {
          setStatus("영상통화 연결 완료");
        }

        if (
          peer.connectionState === "failed" ||
          peer.connectionState === "disconnected"
        ) {
          setStatus("연결이 불안정합니다.");
        }
      };

      peer.oniceconnectionstatechange = () => {
        console.log("ICE 상태 변경:", peer.iceConnectionState);
      };

      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("로그인 토큰을 찾을 수 없습니다.");
      }

      const client = new Client({
        brokerURL: WS_URL,

        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },

        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: () => {
          console.log("영상통화 STOMP 연결 성공");

          client.subscribe("/user/queue/video-call", (message) => {
            try {
              const event = JSON.parse(message.body);

              // 다른 통화의 이벤트 무시
              if (Number(event.callPk) !== Number(callPk)) {
                return;
              }

              // 통화 상태 이벤트 (거절/종료/부재중/취소)
              if (FINISHED_STATUSES.includes(Number(event.callStatus))) {
                console.log("통화가 종료되었습니다. status:", event.callStatus);
                setStatus("통화가 종료되었습니다.");

                finishCallScreen();
                return;
              }

              // WebRTC 시그널 처리
              if (event.signalType) {
                handleSignal(event);
              }
            } catch (error) {
              console.error("시그널 파싱 오류:", error);
            }
          });

          if (caller) {
            // 발신자: 구독을 마쳤으니 OFFER 전송 시작
            startOfferRetry();
          } else {
            // 수신자: 발신자의 OFFER를 기다린다 (발신자가 재전송하므로 유실되지 않음)
            setStatus("상대방 연결을 기다리고 있습니다.");
          }
        },

        onStompError: (frame) => {
          console.error("STOMP 오류:", frame.headers, frame.body);
          setStatus("서버 연결 오류");
        },

        onWebSocketError: (error) => {
          console.error("WebSocket 오류:", error);
        },
      });

      clientRef.current = client;
      client.activate();
    } catch (error) {
      console.error("영상통화 시작 오류:", error);

      setStatus(
        error instanceof Error ? error.message : "통화를 시작하지 못했습니다."
      );

      startedRef.current = false;
    }
  };

  // 마이크 켜기 / 끄기
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = muted;
    });

    setMuted(!muted);
  };

  // 카메라 켜기 / 끄기
  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = cameraOff;
    });

    setCameraOff(!cameraOff);
  };

  // 통화 종료 API 호출
  const endCall = async () => {
    if (endingRef.current) return;

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("로그인 토큰을 찾을 수 없습니다.");
      }

      console.log("통화 종료 요청:", roomPk, callPk);

      const response = await fetch(
        `${API_BASE_URL}/chat/${roomPk}/video-call/${callPk}/end`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error("통화 종료 API 실패:", errorText);

        throw new Error(`통화 종료에 실패했습니다. (${response.status})`);
      }

      console.log("✅ 백엔드 통화 종료 처리 성공");

      finishCallScreen();
    } catch (error) {
      console.error("통화 종료 오류:", error);

      Alert.alert(
        "통화 종료 오류",
        error instanceof Error ? error.message : "통화를 종료하지 못했습니다."
      );
    }
  };

  useEffect(() => {
    startCall();

    return () => {
      cleanupCall();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{status}</Text>

      {React.createElement("video", {
        ref: remoteVideoRef,
        autoPlay: true,
        playsInline: true,
        style: {
          width: "100%",
          flex: 1,
          backgroundColor: "#292929",
          borderRadius: 16,
          objectFit: "cover",
        },
      })}

      {React.createElement("video", {
        ref: localVideoRef,
        autoPlay: true,
        playsInline: true,
        muted: true,
        style: {
          position: "absolute",
          top: 60,
          right: 28,
          width: 140,
          height: 180,
          backgroundColor: "#444444",
          borderRadius: 12,
          objectFit: "cover",
        },
      })}

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={toggleMute}>
          <Text style={styles.controlText}>
            {muted ? "마이크 켜기" : "마이크 끄기"}
          </Text>
        </Pressable>

        <Pressable style={styles.controlButton} onPress={toggleCamera}>
          <Text style={styles.controlText}>
            {cameraOff ? "카메라 켜기" : "카메라 끄기"}
          </Text>
        </Pressable>

        <Pressable style={styles.endButton} onPress={endCall}>
          <Text style={styles.controlText}>통화 나가기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
    padding: 16,
  },
  status: {
    color: "#FFFFFF",
    textAlign: "center",
    marginVertical: 12,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 24,
  },
  controlButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#555555",
  },
  endButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#E54848",
  },
  controlText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
});