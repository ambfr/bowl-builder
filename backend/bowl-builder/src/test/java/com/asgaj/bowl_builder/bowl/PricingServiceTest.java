package com.asgaj.bowl_builder.bowl;

import com.asgaj.bowl_builder.ingredient.Category;
import com.asgaj.bowl_builder.ingredient.Ingredient;
import com.asgaj.bowl_builder.ingredient.IngredientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock
    private IngredientRepository repo;

    private PricingService service;
    private Ingredient acai;
    private Ingredient banana;
    private Ingredient strawberry;
    private Ingredient honey;

    private static Ingredient ingredient(long id, String name, Category category, String price,
                                         int calories, double protein, double sugar) {
        Ingredient i = new Ingredient(name, category, new BigDecimal(price), calories, protein, sugar, 100);
        i.setId(id);
        return i;
    }

    @BeforeEach
    void setUp() {
        acai = ingredient(1L, "Acai", Category.BASE, "250.00", 140, 2.0, 8.0);
        banana = ingredient(3L, "Banana", Category.TOPPING, "30.00", 105, 1.3, 14.0);
        strawberry = ingredient(4L, "Strawberry", Category.TOPPING, "50.00", 30, 0.6, 5.0);
        honey = ingredient(6L, "Honey", Category.DRIZZLE, "25.00", 60, 0.0, 17.0);

        lenient().when(repo.findById(1L)).thenReturn(java.util.Optional.of(acai));
        lenient().when(repo.findById(3L)).thenReturn(java.util.Optional.of(banana));
        lenient().when(repo.findAllById(List.of(3L, 4L))).thenReturn(List.of(banana, strawberry));
        lenient().when(repo.findAllById(List.of(3L))).thenReturn(List.of(banana));
        lenient().when(repo.findAllById(List.of(3L, 99L))).thenReturn(List.of(banana));
        lenient().when(repo.findAllById(List.of(1L))).thenReturn(List.of(acai));
        lenient().when(repo.findAllById(List.of(6L))).thenReturn(List.of(honey));

        service = new PricingService(repo, List.of(new SizeMultiplierRule(), new PromoCodeRule()));
    }

    private static void assertBadRequest(Throwable thrown, String message) {
        assertThat(thrown)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode().value()).isEqualTo(400))
                .hasMessageContaining(message);
    }

    @Test
    void largeBowlMatchesTheHandCalculation() {
        BowlPriceResponse r = service.price(
                new BowlRequest(1L, List.of(3L, 4L), List.of(6L), Size.LARGE, null));

        assertThat(r.subtotal()).isEqualByComparingTo("355.00");
        assertThat(r.total()).isEqualByComparingTo("461.50");
        assertThat(r.nutrition().calories()).isEqualTo(436);
        assertThat(r.nutrition().proteinG()).isEqualTo(5.1);
        assertThat(r.nutrition().sugarG()).isEqualTo(57.2);
    }

    @Test
    void smallBowlIsEightyPercentOfTheSubtotal() {
        BowlPriceResponse r = service.price(new BowlRequest(1L, List.of(3L), null, Size.SMALL, null));

        assertThat(r.subtotal()).isEqualByComparingTo("280.00");
        assertThat(r.total()).isEqualByComparingTo("224.00");
    }

    @Test
    void mediumBowlHasNoSizeChange() {
        BowlPriceResponse r = service.price(new BowlRequest(1L, List.of(3L), null, Size.MEDIUM, null));

        assertThat(r.total()).isEqualByComparingTo("280.00");
    }

    @Test
    void promoCodeIsAppliedAfterTheSizeMultiplier() {
        BowlPriceResponse r = service.price(
                new BowlRequest(1L, List.of(3L, 4L), List.of(6L), Size.LARGE, "ACAI10"));

        assertThat(r.subtotal()).isEqualByComparingTo("355.00");
        assertThat(r.total()).isEqualByComparingTo("415.35");
    }

    @Test
    void flatPromoIsAppliedAfterTheSizeMultiplier() {
        BowlPriceResponse r = service.price(
                new BowlRequest(1L, List.of(3L, 4L), List.of(6L), Size.LARGE, "FIRST50"));

        assertThat(r.total()).isEqualByComparingTo("411.50");
    }

    @Test
    void badPromoCodeIsRejected() {
        assertThatThrownBy(() -> service.price(new BowlRequest(1L, null, null, Size.LARGE, "FAKE")))
                .satisfies(e -> assertBadRequest(e, "Invalid promo code"));
    }

    @Test
    void aToppingCannotBeUsedAsABase() {
        assertThatThrownBy(() -> service.price(new BowlRequest(3L, null, null, Size.SMALL, null)))
                .satisfies(e -> assertBadRequest(e, "Banana is not a base"));
    }

    @Test
    void unknownBaseIsRejected() {
        assertThatThrownBy(() -> service.price(new BowlRequest(99L, null, null, Size.SMALL, null)))
                .satisfies(e -> assertBadRequest(e, "Base not found"));
    }

    @Test
    void aBaseCannotBeUsedAsATopping() {
        assertThatThrownBy(() -> service.price(new BowlRequest(1L, List.of(1L), null, Size.SMALL, null)))
                .satisfies(e -> assertBadRequest(e, "is not a TOPPING"));
    }

    @Test
    void aMissingToppingIsRejected() {
        assertThatThrownBy(() -> service.price(new BowlRequest(1L, List.of(3L, 99L), null, Size.SMALL, null)))
                .satisfies(e -> assertBadRequest(e, "not found"));
    }
}