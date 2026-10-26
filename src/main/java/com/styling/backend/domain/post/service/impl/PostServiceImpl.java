package com.styling.backend.domain.post.service.impl;

import com.styling.backend.domain.post.entity.Hashtag;
import com.styling.backend.domain.post.entity.Post;
import com.styling.backend.domain.post.entity.PostHashtag;
import com.styling.backend.domain.hashtag.repository.HashtagRepository;
import com.styling.backend.domain.hashtag.repository.PostHashtagRepository;
import com.styling.backend.domain.post.repository.PostRepository;
import com.styling.backend.domain.post.service.PostService;
import com.styling.backend.domain.ratio.entity.RatioType;
import com.styling.backend.domain.ratio.repository.RatioTypeRepository;
import com.styling.backend.domain.styletype.entity.StyleType;
import com.styling.backend.domain.styletype.repository.StyleTypeRepository;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.repository.StylistRepository;
import com.styling.backend.global.image.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final HashtagRepository hashtagRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final StylistRepository stylistRepository;
    private final StyleTypeRepository styleTypeRepository;
    private final RatioTypeRepository ratioTypeRepository;
    private final ImageService imageService;

    @Override
    @Transactional
    public void createPost(
            MultipartFile image,
            Long typePk,
            Long ratioPk,
            List<String> hashtags
    ) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        Stylist stylist = stylistRepository.findByUser_UserId(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("스타일리스트 등록이 필요합니다."));

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("게시글 이미지는 필수입니다.");
        }

        if (typePk == null) {
            throw new IllegalArgumentException("스타일 태그는 필수입니다.");
        }

        if (ratioPk == null) {
            throw new IllegalArgumentException("체형 보완 태그는 필수입니다.");
        }

        StyleType styleType = styleTypeRepository.findById(typePk)
                .orElseThrow(() ->
                        new IllegalArgumentException("존재하지 않는 스타일 태그입니다."));

        RatioType ratioType = ratioTypeRepository.findById(ratioPk)
                .orElseThrow(() ->
                        new IllegalArgumentException("존재하지 않는 체형 보완 태그입니다."));

        String imageUrl = imageService.uploadImage(image, "stylist/post");

        Post post = postRepository.save(
                new Post(stylist, imageUrl, styleType, ratioType)
        );

        // 자유 해시태그는 선택 사항이며 여러 개 등록 가능
        if (hashtags == null || hashtags.isEmpty()) {
            return;
        }

        for (String value : hashtags) {
            if (value == null || value.isBlank()) {
                continue;
            }

            String hashtagContent = value.trim();

            if (hashtagContent.startsWith("#")) {
                hashtagContent = hashtagContent.substring(1).trim();
            }

            if (hashtagContent.isBlank()) {
                continue;
            }

            String finalHashtagContent = hashtagContent;

            Hashtag hashtag = hashtagRepository
                    .findByHashtagContent(finalHashtagContent)
                    .map(existingHashtag -> {
                        existingHashtag.increaseUsed();
                        return existingHashtag;
                    })
                    .orElseGet(() ->
                            hashtagRepository.save(
                                    new Hashtag(finalHashtagContent)
                            ));

            postHashtagRepository.save(new PostHashtag(post, hashtag));
        }
    }
}