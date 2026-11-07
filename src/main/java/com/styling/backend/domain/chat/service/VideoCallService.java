package com.styling.backend.domain.chat.service;

import com.styling.backend.domain.chat.dto.VideoCallSignalRequestDto;
import com.styling.backend.domain.chat.entity.VideoCall;

public interface VideoCallService {

    VideoCall requestCall(Long roomPk);

    VideoCall acceptCall(Long roomPk, Long callPk);

    VideoCall rejectCall(Long roomPk, Long callPk);

    VideoCall cancelCall(Long roomPk, Long callPk);

    VideoCall endCall(Long roomPk, Long callPk);

    void sendSignal(Long roomPk, VideoCallSignalRequestDto requestDto);
}