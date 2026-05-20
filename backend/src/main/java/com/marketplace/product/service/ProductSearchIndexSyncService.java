package com.marketplace.product.service;

import com.marketplace.product.model.Product;
import com.marketplace.product.model.ProductAlias;
import com.marketplace.product.repository.ProductAliasRepository;
import com.marketplace.product.repository.ProductRepository;
import com.marketplace.product.search.ProductSearchDocument;
import com.marketplace.product.search.ProductSearchDocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "search.elasticsearch.enabled", havingValue = "true")
@Transactional(readOnly = true)
public class ProductSearchIndexSyncService {

    private static final Logger log = LoggerFactory.getLogger(ProductSearchIndexSyncService.class);
    private static final int INDEX_BATCH_SIZE = 500;

    private final ProductRepository productRepository;
    private final ProductAliasRepository productAliasRepository;
    private final ProductSearchDocumentRepository productSearchDocumentRepository;
    private final ElasticsearchOperations elasticsearchOperations;
    private final boolean syncOnStartup;

    public ProductSearchIndexSyncService(
            ProductRepository productRepository,
            ProductAliasRepository productAliasRepository,
            ProductSearchDocumentRepository productSearchDocumentRepository,
            ElasticsearchOperations elasticsearchOperations,
            @Value("${search.elasticsearch.sync-on-startup:false}") boolean syncOnStartup
    ) {
        this.productRepository = productRepository;
        this.productAliasRepository = productAliasRepository;
        this.productSearchDocumentRepository = productSearchDocumentRepository;
        this.elasticsearchOperations = elasticsearchOperations;
        this.syncOnStartup = syncOnStartup;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        if (!syncOnStartup) {
            return;
        }

        try {
            reindexActiveProducts();
        } catch (RuntimeException exception) {
            log.warn("Failed to sync product aliases into Elasticsearch on startup", exception);
        }
    }

    public void reindexActiveProducts() {
        ensureIndex();
        int indexedDocuments = 0;
        int pageNumber = 0;
        Page<Product> productPage;

        do {
            productPage = productRepository.findAllByActiveTrue(PageRequest.of(pageNumber, INDEX_BATCH_SIZE));
            List<Product> activeProducts = productPage.getContent();

            if (activeProducts.isEmpty()) {
                break;
            }

            List<Integer> productIds = activeProducts.stream()
                    .map(Product::getId)
                    .toList();

            Map<Integer, List<String>> aliasesByProductId = productAliasRepository.findAllByProduct_IdIn(productIds).stream()
                    .collect(Collectors.groupingBy(
                            alias -> alias.getProduct().getId(),
                            Collectors.mapping(ProductAlias::getAlias, Collectors.toList())
                    ));

            List<ProductSearchDocument> documents = activeProducts.stream()
                    .map(product -> new ProductSearchDocument(
                            product.getId(),
                            product.getCategory().getId(),
                            aliasesByProductId.getOrDefault(product.getId(), List.of())
                    ))
                    .toList();

            productSearchDocumentRepository.saveAll(documents);
            indexedDocuments += documents.size();
            pageNumber++;
        } while (productPage.hasNext());

        log.info("Indexed {} products into Elasticsearch alias index", indexedDocuments);
    }

    private void ensureIndex() {
        IndexOperations indexOperations = elasticsearchOperations.indexOps(ProductSearchDocument.class);

        if (!indexOperations.exists()) {
            indexOperations.create();
            indexOperations.putMapping(indexOperations.createMapping(ProductSearchDocument.class));
            return;
        }

        indexOperations.putMapping(indexOperations.createMapping(ProductSearchDocument.class));
    }
}
