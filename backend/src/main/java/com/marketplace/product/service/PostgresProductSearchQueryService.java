package com.marketplace.product.service;

import com.marketplace.product.repository.ProductAliasRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostgresProductSearchQueryService {

    private final ProductAliasRepository productAliasRepository;

    public PostgresProductSearchQueryService(ProductAliasRepository productAliasRepository) {
        this.productAliasRepository = productAliasRepository;
    }

    public List<Integer> searchProductIds(String query, int limit) {
        return productAliasRepository.searchActiveProductIdsByAlias(query, PageRequest.of(0, limit));
    }
}
