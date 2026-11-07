package com.asgaj.bowl_builder.favorite;

import com.asgaj.bowl_builder.bowl.BowlPriceResponse;
import com.asgaj.bowl_builder.bowl.Size;

import java.util.List;

/** pricing is null if an ingredient in this bowl no longer exists. */
public record FavoriteResponse(
        Long id,
        String name,
        Long baseId,
        List<Long> toppingIds,
        List<Long> drizzleIds,
        Size size,
        BowlPriceResponse pricing
) {
}