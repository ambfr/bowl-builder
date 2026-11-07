package com.asgaj.bowl_builder.bowl;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BowlRequest(
        @NotNull Long baseId,
        List<Long> toppingIds,
        List<Long> drizzleIds,
        @NotNull Size size
) {
}