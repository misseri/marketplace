package com.marketplace.category.controller;

import com.marketplace.category.dto.CategoryResponse;
import com.marketplace.category.service.CategoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/root")
    public List<CategoryResponse> getRootCategories() {
        return categoryService.getRootCategories();
    }

    @GetMapping("/{id}/children")
    public List<CategoryResponse> getChildren(@PathVariable Integer id) {
        return categoryService.getChildren(id);
    }
}
