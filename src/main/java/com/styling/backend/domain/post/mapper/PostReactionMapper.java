package com.styling.backend.domain.post.mapper;

import com.styling.backend.domain.post.dto.PostReactionRequestDto;
import com.styling.backend.domain.post.entity.Post;
import com.styling.backend.domain.post.entity.PostReaction;
import com.styling.backend.domain.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class PostReactionMapper {

    public PostReaction toEntity(
            User user,
            Post post,
            PostReactionRequestDto requestDto
    ) {
        return new PostReaction(
                user,
                post,
                requestDto.getReactionType()
        );
    }
}