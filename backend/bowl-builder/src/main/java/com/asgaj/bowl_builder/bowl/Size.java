package com.asgaj.bowl_builder.bowl;

import java.math.BigDecimal;

public enum Size {
    SMALL("0.80"), MEDIUM("1.00"), LARGE("1.30");

    private final BigDecimal multiplier;

    Size(String multiplier) {
        this.multiplier = new BigDecimal(multiplier);
    }

    public BigDecimal getMultiplier() {
        return multiplier;
    }
}