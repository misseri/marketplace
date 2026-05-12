package com.marketplace.product.search;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface ProductSearchDocumentRepository extends ElasticsearchRepository<ProductSearchDocument, Integer> {
}
