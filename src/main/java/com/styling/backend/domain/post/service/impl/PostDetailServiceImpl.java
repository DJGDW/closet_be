package com.styling.backend.domain.post.service.impl;

import com.styling.backend.domain.hashtag.repository.PostHashtagRepository;
import com.styling.backend.domain.post.dto.PostDetailResponseDto;
import com.styling.backend.domain.post.entity.Post;
import com.styling.backend.domain.post.repository.PostReactionRepository;
import com.styling.backend.domain.post.repository.PostRepository;
import com.styling.backend.domain.post.service.PostDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostDetailServiceImpl implements PostDetailService {

    private final PostRepository postRepository;
    private final PostReactionRepository postReactionRepository;
    private final PostHashtagRepository postHashtagRepository;

    @Override
    public PostDetailResponseDto getPostDetail(Long postPk) {

        Post post = postRepository.findById(postPk)
                .orElseThrow(() ->
                        new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        List<String> hashtags = postHashtagRepository
                .findByPost_PostPk(postPk)
                .stream()
                .map(postHashtag -> postHashtag.getHashtag().getHashtagContent())
                .toList();

        long likeCount =
                postReactionRepository.countByPost_PostPkAndReactionType(
                        postPk, 0
                );

        return PostDetailResponseDto.builder()
                .profileImage(post.getStylist().getUser().getProfilePic())
                .stylistNickname(post.getStylist().getUser().getNickname())
                .imageUrl(post.getContent())
                .likeCount(likeCount)
                .styleName(post.getStyleType().getStyleName())
                .hashtags(hashtags)
                .ratioType(post.getRatioType().getRatioType())
                .build();
    }
}