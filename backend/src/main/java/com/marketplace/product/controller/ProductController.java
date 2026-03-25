package com.marketplace.product.controller;

import com.marketplace.product.dto.ProductCardResponse;
import com.marketplace.product.dto.ProductDetailsResponse;
import com.marketplace.product.dto.ProductSearchRequest;
import com.marketplace.product.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public Page<ProductCardResponse> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer sellerId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return productService.search(
                new ProductSearchRequest(query, categoryId, sellerId, minPrice, maxPrice, inStock),
                pageable
        );
    }

    @GetMapping("/{id}")
    public ProductDetailsResponse getById(@PathVariable Integer id) {
        return productService.getById(id);
    }
}
