package com.marketplace.product.service;

import com.marketplace.product.repository.ProductReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProductReviewService {

    private final ProductReviewRepository productReviewRepository;

    public ProductReviewService(ProductReviewRepository productReviewRepository) {
        this.productReviewRepository = productReviewRepository;
    }

    public Map<Integer, ProductReviewSummary> getReviewStatsByProductIds(List<Integer> productIds) {
        if (productIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return productReviewRepository.findStatsByProductIds(productIds).stream()
                .map(this::toSummary)
                .collect(Collectors.toMap(ProductReviewSummary::productId, Function.identity()));
    }

    public ProductReviewSummary getReviewStatsByProductId(Integer productId) {
        return productReviewRepository.findStatsByProductId(productId)
                .map(this::toSummary)
                .orElse(ProductReviewSummary.empty(productId));
    }

    private ProductReviewSummary toSummary(ProductReviewRepository.ProductReviewStatsView stats) {
        return new ProductReviewSummary(
                stats.getProductId(),
                stats.getAverageRating() == null ? 0.0 : stats.getAverageRating(),
                stats.getReviewCount() == null ? 0L : stats.getReviewCount()
        );
    }
}
