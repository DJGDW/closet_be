package com.styling.backend.domain.post.service.impl;

import com.styling.backend.domain.hashtag.entity.Hashtag;
import com.styling.backend.domain.hashtag.repository.HashtagRepository;
import com.styling.backend.domain.hashtag.repository.PostHashtagRepository;
import com.styling.backend.domain.global.image.ImageService;
import com.styling.backend.domain.post.dto.PostExploreResponseDto;
import com.styling.backend.domain.post.entity.Post;
import com.styling.backend.domain.post.entity.PostHashtag;
import com.styling.backend.domain.post.repository.PostReactionRepository;
import com.styling.backend.domain.post.repository.PostRepository;
import com.styling.backend.domain.post.service.PostService;
import com.styling.backend.domain.ratio.entity.RatioType;
import com.styling.backend.domain.ratio.repository.RatioTypeRepository;
import com.styling.backend.domain.styletype.entity.StyleType;
import com.styling.backend.domain.styletype.repository.StyleTypeRepository;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.repository.StylistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final PostReactionRepository postReactionRepository;
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

    @Override
    @Transactional(readOnly = true)
    public Page<PostExploreResponseDto> getMyPosts(Pageable pageable) {
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

        return getPostsByStylist(stylist.getStylistPk(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PostExploreResponseDto> getStylistPosts(
            Long stylistPk,
            Pageable pageable
    ) {
        if (stylistPk == null) {
            throw new IllegalArgumentException("스타일리스트 번호는 필수입니다.");
        }

        stylistRepository.findById(stylistPk)
                .orElseThrow(() ->
                        new IllegalArgumentException("존재하지 않는 스타일리스트입니다."));

        return getPostsByStylist(stylistPk, pageable);
    }

    private Page<PostExploreResponseDto> getPostsByStylist(
            Long stylistPk,
            Pageable pageable
    ) {
        return postRepository
                .findAllByStylist_StylistPkOrderByCreatedAtDesc(stylistPk, pageable)
                .map(this::toResponseDto);
    }

    private PostExploreResponseDto toResponseDto(Post post) {
        Stylist stylist = post.getStylist();

        long likeCount = postReactionRepository
                .countByPost_PostPkAndReactionType(post.getPostPk(), 0);

        return PostExploreResponseDto.builder()
                .postPk(post.getPostPk())
                .imageUrl(post.getContent())
                .styleName(post.getStyleType().getStyleName())
                .ratioType(post.getRatioType().getRatioType())
                .stylistPk(stylist.getStylistPk())
                .stylistNickname(stylist.getUser().getNickname())
                .stylistRating(stylist.getRating())
                .viewCount(post.getViewCount())
                .likeCount(likeCount)
                .build();
    }
}