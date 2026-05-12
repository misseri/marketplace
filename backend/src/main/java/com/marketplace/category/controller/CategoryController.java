package com.marketplace.category.controller;

import com.marketplace.category.dto.CategoryResponse;
import com.marketplace.category.service.CategoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/{id}")
    public Page<CategoryResponse> getCategories(
            @PathVariable Integer id,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return categoryService.getCategories(id, pageable);
    }
}
