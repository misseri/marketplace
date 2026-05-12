package com.marketplace.product.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@ConditionalOnProperty(name = "search.elasticsearch.enabled", havingValue = "false", matchIfMissing = true)
public class DefaultProductSearchQueryService implements ProductSearchQueryService {

    private final PostgresProductSearchQueryService postgresProductSearchQueryService;

    public DefaultProductSearchQueryService(PostgresProductSearchQueryService postgresProductSearchQueryService) {
        this.postgresProductSearchQueryService = postgresProductSearchQueryService;
    }

    @Override
    public List<Integer> searchProductIds(String query, int limit) {
        return postgresProductSearchQueryService.searchProductIds(query, limit);
    }
}
