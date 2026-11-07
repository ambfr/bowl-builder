package com.asgaj.bowl_builder.ingredient;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private Category category;

    private BigDecimal price;
    private int calories;
    private double proteinG;
    private double sugarG;
    private int stock;

    public Ingredient(String name, Category category, BigDecimal price,
                      int calories, double proteinG, double sugarG, int stock) {
        this.name = name;
        this.category = category;
        this.price = price;
        this.calories = calories;
        this.proteinG = proteinG;
        this.sugarG = sugarG;
        this.stock = stock;
    }
}