package com.asgaj.bowl_builder.favorite;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteBowlRepository extends JpaRepository<FavoriteBowl, Long> {
    List<FavoriteBowl> findByUserIdOrderByIdDesc(Long userId);
    Optional<FavoriteBowl> findByIdAndUserId(Long id, Long userId);
}