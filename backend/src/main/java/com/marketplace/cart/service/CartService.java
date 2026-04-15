package com.marketplace.cart.service;

import com.marketplace.auth.model.User;
import com.marketplace.auth.repository.UserRepository;
import com.marketplace.cart.dto.CartItemRequest;
import com.marketplace.cart.dto.CartItemResponse;
import com.marketplace.cart.dto.CartResponse;
import com.marketplace.cart.model.CartItem;
import com.marketplace.cart.repository.CartItemRepository;
import com.marketplace.product.model.Product;
import com.marketplace.product.repository.ProductRepository;
import com.marketplace.product.service.ProductPriceService;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductPriceService productPriceService;

    public CartService(CartItemRepository cartItemRepository,
                       UserRepository userRepository,
                       ProductRepository productRepository,
                       ProductPriceService productPriceService
    ){
        this.cartItemRepository = cartItemRepository;
        this.productPriceService = productPriceService;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(Integer userId){
        List<CartItemResponse> items = cartItemRepository.findByUserId(userId).stream().map(this::toResponse).toList();

        BigDecimal total = items.stream().map(CartItemResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(items, total);
    }

    public CartResponse addItem(Integer userId, CartItemRequest request){
        validateRequest(request);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Product product = productRepository.findByIdAndActiveTrue(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        validateStock(product, request.quantity());

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, request.productId())
                .orElseGet(() ->{
                    CartItem newItem = new CartItem();
                    newItem.setUser(user);
                    newItem.setProduct(product);
                    newItem.setQuantity(0);
                    return newItem;
                });

        int newQuantity = item.getQuantity() + request.quantity();

        validateStock(product, newQuantity);

        item.setQuantity(newQuantity);
        cartItemRepository.save(item);

        return getCart(userId);
    }

    public CartResponse updateQuantity(Integer userId, Integer productId, Integer quantity){
        if (quantity == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quantity is required");
        }

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found in cart"));

        if (quantity <= 0){
            cartItemRepository.delete(item);
            return getCart(userId);
        }

        validateStock(item.getProduct(), quantity);

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        return getCart(userId);
    }
    public void removeItem(Integer userId, Integer productId){
        cartItemRepository.deleteByUserIdAndProductId(userId, productId);
    }

    public void clearCart(Integer userId){
        cartItemRepository.deleteByUserId(userId);
    }
    private CartItemResponse toResponse(CartItem item){
        BigDecimal price = productPriceService.getCurrentPrice(item.getProduct().getId());
        if(price == null){
            price = BigDecimal.ZERO;
        }

        Integer stockQuantity = item.getProduct().getStock() == null ? 0 : item.getProduct().getStock().getQuantity();

        BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));

        return new CartItemResponse(item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                price,
                lineTotal,
                stockQuantity
        );
    }

    private void validateRequest(CartItemRequest request){
        if (request.productId() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId is required");
        }
        if (request.quantity() == null || request.quantity() <= 0){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The number must be greater than 0");
        }
    }
    private void validateStock(Product product, Integer requestQuantity){
        Integer stockQuantity = product.getStock() == null ? 0 : product.getStock().getQuantity();

        if (requestQuantity > stockQuantity){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Available only: " + stockQuantity);
        }
    }
}
