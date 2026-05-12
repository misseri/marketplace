package com.marketplace.product.service;

import java.util.List;

public interface ProductSearchQueryService {

    List<Integer> searchProductIds(String query, int limit);
}
