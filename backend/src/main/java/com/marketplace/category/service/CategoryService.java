package com.marketplace.category.service;

import com.marketplace.category.dto.CategoryResponse;
import com.marketplace.category.model.Category;
import com.marketplace.category.repository.CategoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Page<CategoryResponse> getCategories(Integer parentId, Pageable pageable) {
        if (parentId == 0) {
            return categoryRepository.findAllByParentIsNullOrderByNameAsc(pageable)
                    .map(this::toResponse);
        }

        requireCategory(parentId);
        return categoryRepository.findAllByParentIdOrderByNameAsc(parentId, pageable)
                .map(this::toResponse);
    }

    public List<Integer> getCategoryBranchIds(Integer categoryId) {
        requireCategory(categoryId);

        Map<Integer, List<Integer>> childrenByParentId = buildChildrenIndex(categoryRepository.findAll());
        Set<Integer> branchIds = new LinkedHashSet<>();
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        queue.add(categoryId);

        while (!queue.isEmpty()) {
            Integer currentId = queue.removeFirst();
            if (!branchIds.add(currentId)) {
                continue;
            }

            for (Integer childId : childrenByParentId.getOrDefault(currentId, List.of())) {
                queue.addLast(childId);
            }
        }

        return List.copyOf(branchIds);
    }

    private Category requireCategory(Integer categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Категория не найдена"));
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getParent() == null ? null : category.getParent().getId(),
                categoryRepository.existsByParentId(category.getId())
        );
    }

    private Map<Integer, List<Integer>> buildChildrenIndex(Collection<Category> categories) {
        Map<Integer, List<Integer>> childrenByParentId = new HashMap<>();

        for (Category category : categories) {
            if (category.getParent() == null) {
                continue;
            }

            childrenByParentId
                    .computeIfAbsent(category.getParent().getId(), ignored -> new ArrayList<>())
                    .add(category.getId());
        }

        return childrenByParentId;
    }
}
