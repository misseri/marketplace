package com.marketplace.product.service;

import com.marketplace.product.dto.ProductCardResponse;
import com.marketplace.product.dto.ProductCharacteristicResponse;
import com.marketplace.product.dto.ProductDetailsResponse;
import com.marketplace.product.dto.ProductSearchRequest;
import com.marketplace.product.model.Product;
import com.marketplace.product.model.ProductCharacteristic;
import com.marketplace.product.repository.ProductCharacteristicRepository;
import com.marketplace.product.repository.ProductPriceRepository;
import com.marketplace.product.repository.ProductRepository;
import com.marketplace.product.repository.ProductReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductPriceRepository productPriceRepository;
    private final ProductReviewRepository productReviewRepository;
    private final ProductCharacteristicRepository productCharacteristicRepository;

    public ProductService(ProductRepository productRepository,
                          ProductPriceRepository productPriceRepository,
                          ProductReviewRepository productReviewRepository,
                          ProductCharacteristicRepository productCharacteristicRepository) {
        this.productRepository = productRepository;
        this.productPriceRepository = productPriceRepository;
        this.productReviewRepository = productReviewRepository;
        this.productCharacteristicRepository = productCharacteristicRepository;
    }

    public Page<ProductCardResponse> search(ProductSearchRequest request, Pageable pageable) {
        Page<Product> page = productRepository.search(
                normalize(request.query()),
                request.categoryId(),
                request.sellerId(),
                request.minPrice(),
                request.maxPrice(),
                request.inStock(),
                pageable
        );

        List<Integer> productIds = page.getContent().stream()
                .map(Product::getId)
                .toList();

        Map<Integer, BigDecimal> currentPrices = productIds.isEmpty()
                ? Collections.emptyMap()
                : productPriceRepository.findCurrentPrices(productIds).stream()
                .collect(Collectors.toMap(
                        ProductPriceRepository.ProductCurrentPriceView::getProductId,
                        ProductPriceRepository.ProductCurrentPriceView::getPrice,
                        (left, right) -> left
                ));

        Map<Integer, ProductReviewRepository.ProductReviewStatsView> reviewStats = productIds.isEmpty()
                ? Collections.emptyMap()
                : productReviewRepository.findStatsByProductIds(productIds).stream()
                .collect(Collectors.toMap(
                        ProductReviewRepository.ProductReviewStatsView::getProductId,
                        Function.identity()
                ));

        return page.map(product -> toCardResponse(product, currentPrices, reviewStats));
    }

    public ProductDetailsResponse getById(Integer id) {
        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Товар не найден"));

        BigDecimal currentPrice = productPriceRepository.findCurrentPrice(id).orElse(null);
        ReviewStats reviewStats = extractReviewStats(productReviewRepository.findStatsByProductId(id).orElse(null));
        List<ProductCharacteristicResponse> characteristics = productCharacteristicRepository
                .findByProductIdOrderByCharacteristicIdAsc(id)
                .stream()
                .map(this::toCharacteristicResponse)
                .toList();

        return new ProductDetailsResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.isActive(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getSeller().getId(),
                product.getSeller().getStoreName(),
                product.getSeller().getRating(),
                currentPrice,
                extractStockQuantity(product),
                reviewStats.averageRating(),
                reviewStats.reviewCount(),
                characteristics
        );
    }

    private ProductCardResponse toCardResponse(
            Product product,
            Map<Integer, BigDecimal> currentPrices,
            Map<Integer, ProductReviewRepository.ProductReviewStatsView> reviewStats
    ) {
        ProductReviewRepository.ProductReviewStatsView stats = reviewStats.get(product.getId());

        return new ProductCardResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getSeller().getId(),
                product.getSeller().getStoreName(),
                product.getSeller().getRating(),
                currentPrices.get(product.getId()),
                extractStockQuantity(product),
                stats == null || stats.getAverageRating() == null ? 0.0 : stats.getAverageRating(),
                stats == null ? 0L : stats.getReviewCount()
        );
    }

    private ProductCharacteristicResponse toCharacteristicResponse(ProductCharacteristic characteristic) {
        return new ProductCharacteristicResponse(
                characteristic.getCharacteristic().getId(),
                characteristic.getCharacteristic().getName(),
                characteristic.getValue()
        );
    }

    private ReviewStats extractReviewStats(ProductReviewRepository.ProductReviewStatsView rawStats) {
        if (rawStats == null) {
            return new ReviewStats(0.0, 0L);
        }

        return new ReviewStats(
                rawStats.getAverageRating() == null ? 0.0 : rawStats.getAverageRating(),
                rawStats.getReviewCount() == null ? 0L : rawStats.getReviewCount()
        );
    }

    private Integer extractStockQuantity(Product product) {
        return product.getStock() == null ? 0 : product.getStock().getQuantity();
    }

    private String normalize(String query) {
        if (query == null) {
            return "";
        }

        String normalized = query.trim();
        return normalized;
    }

    private record ReviewStats(Double averageRating, Long reviewCount) {
    }
}
