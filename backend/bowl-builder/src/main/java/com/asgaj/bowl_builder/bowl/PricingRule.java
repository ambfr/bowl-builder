package com.asgaj.bowl_builder.bowl;

import java.math.BigDecimal;

public interface PricingRule {
    BigDecimal apply(BigDecimal price, BowlRequest request);
}