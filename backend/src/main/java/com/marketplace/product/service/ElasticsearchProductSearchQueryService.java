package com.marketplace.product.service;

import com.marketplace.product.search.ProductSearchDocument;
import co.elastic.clients.elasticsearch._types.query_dsl.Operator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@ConditionalOnProperty(name = "search.elasticsearch.enabled", havingValue = "true")
public class ElasticsearchProductSearchQueryService implements ProductSearchQueryService {

    private static final Logger log = LoggerFactory.getLogger(ElasticsearchProductSearchQueryService.class);

    private final ElasticsearchOperations elasticsearchOperations;
    private final PostgresProductSearchQueryService postgresProductSearchQueryService;

    public ElasticsearchProductSearchQueryService(
            ElasticsearchOperations elasticsearchOperations,
            PostgresProductSearchQueryService postgresProductSearchQueryService
    ) {
        this.elasticsearchOperations = elasticsearchOperations;
        this.postgresProductSearchQueryService = postgresProductSearchQueryService;
    }

    @Override
    public List<Integer> searchProductIds(String query, int limit) {
        String normalizedQuery = normalize(query);

        try {
            NativeQuery nativeQuery = NativeQuery.builder()
                    .withQuery(q -> q.bool(b -> b
                            .should(s -> s.match(m -> m
                                    .field("aliases")
                                    .query(normalizedQuery)
                                    .operator(Operator.And)
                                    .boost(6.0f)
                            ))
                            .should(s -> s.matchBoolPrefix(m -> m
                                    .field("aliases")
                                    .query(normalizedQuery)
                                    .operator(Operator.And)
                                    .boost(4.0f)
                            ))
                            .should(s -> s.match(m -> m
                                    .field("aliases")
                                    .query(normalizedQuery)
                                    .fuzziness("AUTO")
                                    .prefixLength(0)
                                    .maxExpansions(50)
                                    .boost(3.0f)
                            ))
                            .minimumShouldMatch("1")
                    ))
                    .withPageable(PageRequest.of(0, limit))
                    .build();

            return elasticsearchOperations.search(nativeQuery, ProductSearchDocument.class)
                    .stream()
                    .map(SearchHit::getContent)
                    .map(ProductSearchDocument::getProductId)
                    .distinct()
                    .toList();
        } catch (RuntimeException exception) {
            log.warn("Elasticsearch alias search failed, falling back to PostgreSQL", exception);
            return postgresProductSearchQueryService.searchProductIds(query, limit);
        }
    }

    private String normalize(String query) {
        return query == null
                ? ""
                : query.trim()
                .toLowerCase(Locale.ROOT)
                .replace('ё', 'е')
                .replaceAll("\\s+", " ");
    }
}
