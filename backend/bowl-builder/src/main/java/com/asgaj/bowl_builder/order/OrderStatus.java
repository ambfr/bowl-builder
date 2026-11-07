package com.asgaj.bowl_builder.order;

public enum OrderStatus {
    PLACED, PREPARING, READY, PICKED_UP, CANCELLED;

    /** The single source of truth for which status changes are allowed. */
    public boolean canMoveTo(OrderStatus next) {
        return switch (this) {
            case PLACED -> next == PREPARING || next == CANCELLED;
            case PREPARING -> next == READY || next == CANCELLED;
            case READY -> next == PICKED_UP;
            case PICKED_UP, CANCELLED -> false;
        };
    }
}