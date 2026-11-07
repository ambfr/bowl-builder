package com.asgaj.bowl_builder.favorite;

import com.asgaj.bowl_builder.bowl.BowlPriceResponse;
import com.asgaj.bowl_builder.bowl.BowlRequest;
import com.asgaj.bowl_builder.bowl.PricingService;
import com.asgaj.bowl_builder.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteBowlRepository favorites;
    private final UserRepository users;
    private final PricingService pricingService;

    public FavoriteService(FavoriteBowlRepository favorites, UserRepository users,
                           PricingService pricingService) {
        this.favorites = favorites;
        this.users = users;
        this.pricingService = pricingService;
    }

    @Transactional
    public FavoriteResponse save(String email, FavoriteRequest req) {
        Long userId = userId(email);

        // Reuses the pricing validation: throws 400 for unknown ids or wrong categories.
        pricingService.price(new BowlRequest(
                req.baseId(), req.toppingIds(), req.drizzleIds(), req.size(), null));

        FavoriteBowl f = new FavoriteBowl();
        f.setUserId(userId);
        f.setName(req.name().trim());
        f.setBaseId(req.baseId());
        f.setToppingIds(req.toppingIds() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(req.toppingIds()));
        f.setDrizzleIds(req.drizzleIds() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(req.drizzleIds()));
        f.setSize(req.size());
        return toResponse(favorites.save(f));
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> list(String email) {
        return favorites.findByUserIdOrderByIdDesc(userId(email)).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(String email, Long id) {
        // Looks up by id AND owner, so someone else's bowl looks like it does not exist.
        FavoriteBowl f = favorites.findByIdAndUserId(id, userId(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorite not found"));
        favorites.delete(f);
    }

    private Long userId(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"))
                .getId();
    }

    private FavoriteResponse toResponse(FavoriteBowl f) {
        List<Long> toppings = new ArrayList<>(f.getToppingIds());
        List<Long> drizzles = new ArrayList<>(f.getDrizzleIds());
        BowlPriceResponse pricing;
        try {
            pricing = pricingService.price(new BowlRequest(
                    f.getBaseId(), toppings, drizzles, f.getSize(), null));
        } catch (ResponseStatusException e) {
            pricing = null;
        }
        return new FavoriteResponse(f.getId(), f.getName(), f.getBaseId(),
                toppings, drizzles, f.getSize(), pricing);
    }
}