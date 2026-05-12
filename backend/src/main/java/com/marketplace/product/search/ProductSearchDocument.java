package com.marketplace.product.search;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.IndexPrefixes;

import java.util.ArrayList;
import java.util.List;

@Document(indexName = "product-search", createIndex = false)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchDocument {

    @Id
    private Integer productId;

    @Field(type = FieldType.Integer)
    private Integer categoryId;

    @Field(type = FieldType.Text, indexPrefixes = @IndexPrefixes(minChars = 1, maxChars = 10))
    private List<String> aliases = new ArrayList<>();
}
