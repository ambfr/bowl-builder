package com.asgaj.bowl_builder.bowl;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bowls")
public class BowlController {

    private final PricingService pricingService;

    public BowlController(PricingService pricingService) {
        this.pricingService = pricingService;
    }

    @PostMapping("/price")
    public BowlPriceResponse price(@Valid @RequestBody BowlRequest request) {
        return pricingService.price(request);
    }
}