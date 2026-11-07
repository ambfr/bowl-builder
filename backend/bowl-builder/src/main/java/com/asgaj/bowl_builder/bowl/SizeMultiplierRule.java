package com.asgaj.bowl_builder.bowl;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Order(1)
public class SizeMultiplierRule implements PricingRule {

    @Override
    public BigDecimal apply(BigDecimal price, BowlRequest request) {
        return price.multiply(request.size().getMultiplier());
    }
}