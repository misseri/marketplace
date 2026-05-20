package com.marketplace.wishlist.service;

import com.marketplace.product.model.Product;
import com.marketplace.product.service.ProductPriceService;
import com.marketplace.product.service.ProductReviewService;
import com.marketplace.product.service.ProductReviewSummary;
import com.marketplace.wishlist.dto.WishlistProductResponse;
import com.marketplace.wishlist.model.WishlistItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
public class WishlistProductResponseAssembler {

    private final ProductPriceService productPriceService;
    private final ProductReviewService productReviewService;

    public WishlistProductResponseAssembler(ProductPriceService productPriceService,
                                            ProductReviewService productReviewService) {
        this.productPriceService = productPriceService;
        this.productReviewService = productReviewService;
    }

    public List<WishlistProductResponse> toResponses(List<WishlistItem> wishlistItems) {
        List<Integer> productIds = wishlistItems.stream()
                .map(item -> item.getProduct().getId())
                .toList();

        Map<Integer, BigDecimal> currentPrices = productPriceService.getCurrentPrices(productIds);
        Map<Integer, ProductReviewSummary> reviewStats = productReviewService.getReviewStatsByProductIds(productIds);

        return wishlistItems.stream()
                .map(item -> toResponse(item, currentPrices, reviewStats))
                .toList();
    }

    private WishlistProductResponse toResponse(
            WishlistItem item,
            Map<Integer, BigDecimal> currentPrices,
            Map<Integer, ProductReviewSummary> reviewStats
    ) {
        Product product = item.getProduct();
        ProductReviewSummary stats = reviewStats.get(product.getId());

        return new WishlistProductResponse(
                item.getId(),
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getSeller().getId(),
                product.getSeller().getStoreName(),
                product.getSeller().getRating(),
                currentPrices.get(product.getId()),
                product.getStock() == null ? 0 : product.getStock().getQuantity(),
                stats == null ? 0.0 : stats.averageRating(),
                stats == null ? 0L : stats.reviewCount()
        );
    }
}
