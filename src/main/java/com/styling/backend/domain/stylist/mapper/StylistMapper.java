package com.styling.backend.domain.stylist.mapper;

import com.styling.backend.domain.location.entity.Location;
import com.styling.backend.domain.plan.entity.Plan;
import com.styling.backend.domain.styletype.entity.StyleType;
import com.styling.backend.domain.stylist.dto.StylistRegisterRequestDto;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.entity.StylistPlan;
import com.styling.backend.domain.stylist.entity.StylistStyleType;
import com.styling.backend.domain.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class StylistMapper {

    public Stylist toEntity(
            StylistRegisterRequestDto request,
            User user,
            Location location
    ) {
        return new Stylist(
                request.getIntroduction(),
                user,
                location
        );
    }

    public StylistStyleType toStyleTypeEntity(
            StyleType styleType,
            Stylist stylist
    ) {
        return new StylistStyleType(styleType, stylist);
    }

    public StylistPlan toPlanEntity(
            Plan plan,
            Stylist stylist,
            Integer price
    ) {
        return new StylistPlan(plan, stylist, price);
    }
}