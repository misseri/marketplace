package com.marketplace.product.service;

import com.marketplace.category.service.CategoryService;
import com.marketplace.product.dto.ProductCardResponse;
import com.marketplace.product.dto.ProductDetailsResponse;
import com.marketplace.product.dto.ProductSearchRequest;
import com.marketplace.product.model.Product;
import com.marketplace.product.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final ProductPriceService productPriceService;
    private final ProductReviewService productReviewService;
    private final ProductCharacteristicService productCharacteristicService;

    public ProductService(ProductRepository productRepository,
                          CategoryService categoryService,
                          ProductPriceService productPriceService,
                          ProductReviewService productReviewService,
                          ProductCharacteristicService productCharacteristicService) {
        this.productRepository = productRepository;
        this.categoryService = categoryService;
        this.productPriceService = productPriceService;
        this.productReviewService = productReviewService;
        this.productCharacteristicService = productCharacteristicService;
    }

    public Page<ProductCardResponse> search(ProductSearchRequest request, Pageable pageable) {
        List<Integer> categoryIds = resolveCategoryIds(request.categoryId());
        Page<Product> page = productRepository.search(
                normalize(request.query()),
                request.categoryId() != null,
                categoryIds,
                request.sellerId(),
                request.minPrice(),
                request.maxPrice(),
                request.inStock(),
                pageable
        );

        List<Integer> productIds = page.getContent().stream()
                .map(Product::getId)
                .toList();

        Map<Integer, BigDecimal> currentPrices = productPriceService.getCurrentPrices(productIds);
        Map<Integer, ProductReviewSummary> reviewStats = productReviewService.getReviewStatsByProductIds(productIds);

        return page.map(product -> toCardResponse(product, currentPrices, reviewStats));
    }

    public ProductDetailsResponse getById(Integer id) {
        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Товар не найден"));

        ProductReviewSummary reviewStats = productReviewService.getReviewStatsByProductId(id);

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
                productPriceService.getCurrentPrice(id),
                extractStockQuantity(product),
                reviewStats.averageRating(),
                reviewStats.reviewCount(),
                productCharacteristicService.getCharacteristicsByProductId(id)
        );
    }

    private ProductCardResponse toCardResponse(
            Product product,
            Map<Integer, BigDecimal> currentPrices,
            Map<Integer, ProductReviewSummary> reviewStats
    ) {
        ProductReviewSummary stats = reviewStats.get(product.getId());

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
                stats == null ? 0.0 : stats.averageRating(),
                stats == null ? 0L : stats.reviewCount()
        );
    }

    private Integer extractStockQuantity(Product product) {
        return product.getStock() == null ? 0 : product.getStock().getQuantity();
    }

    private String normalize(String query) {
        if (query == null) {
            return "";
        }

        return query.trim();
    }

    private List<Integer> resolveCategoryIds(Integer categoryId) {
        if (categoryId == null) {
            return List.of(-1);
        }

        return categoryService.getCategoryBranchIds(categoryId);
    }
}
