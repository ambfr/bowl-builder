package com.asgaj.bowl_builder.favorite;

import com.asgaj.bowl_builder.bowl.Size;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "favorite_bowl")
@Getter
@Setter
@NoArgsConstructor
public class FavoriteBowl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Long baseId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "favorite_bowl_toppings",
            joinColumns = @JoinColumn(name = "favorite_bowl_id"))
    @Column(name = "ingredient_id")
    private Set<Long> toppingIds = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "favorite_bowl_drizzles",
            joinColumns = @JoinColumn(name = "favorite_bowl_id"))
    @Column(name = "ingredient_id")
    private Set<Long> drizzleIds = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "bowl_size", nullable = false)
    private Size size;
}