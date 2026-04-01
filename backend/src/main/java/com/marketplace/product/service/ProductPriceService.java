package com.marketplace.product.service;

import com.marketplace.product.repository.ProductPriceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProductPriceService {

    private final ProductPriceRepository productPriceRepository;

    public ProductPriceService(ProductPriceRepository productPriceRepository) {
        this.productPriceRepository = productPriceRepository;
    }

    public Map<Integer, BigDecimal> getCurrentPrices(List<Integer> productIds) {
        if (productIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return productPriceRepository.findCurrentPrices(productIds).stream()
                .collect(Collectors.toMap(
                        ProductPriceRepository.ProductCurrentPriceView::getProductId,
                        ProductPriceRepository.ProductCurrentPriceView::getPrice,
                        (left, right) -> left
                ));
    }

    public BigDecimal getCurrentPrice(Integer productId) {
        return productPriceRepository.findCurrentPrice(productId).orElse(null);
    }
}
