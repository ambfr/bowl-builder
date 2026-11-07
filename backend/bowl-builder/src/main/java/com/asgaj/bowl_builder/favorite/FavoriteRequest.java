package com.asgaj.bowl_builder.favorite;

import com.asgaj.bowl_builder.bowl.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record FavoriteRequest(
        @NotBlank @jakarta.validation.constraints.Size(max = 50, message = "must be at most 50 characters") String name,
        @NotNull Long baseId,
        List<Long> toppingIds,
        List<Long> drizzleIds,
        @NotNull Size size
) {
}