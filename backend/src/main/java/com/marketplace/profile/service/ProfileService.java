package com.marketplace.profile.service;

import com.marketplace.auth.model.User;
import com.marketplace.auth.repository.SsoUserRepository;
import com.marketplace.auth.repository.UserRepository;
import com.marketplace.cart.repository.CartItemRepository;
import com.marketplace.profile.dto.ProfileResponse;
import com.marketplace.profile.dto.ProfileUpdateRequest;
import com.marketplace.profile.model.Profile;
import com.marketplace.profile.repository.ProfileRepository;
import com.marketplace.product.repository.ProductReviewRepository;
import com.marketplace.wishlist.repository.WishlistRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final SsoUserRepository ssoUserRepository;
    private final WishlistRepository wishlistRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductReviewRepository productReviewRepository;

    public ProfileService(ProfileRepository profileRepository,
                          UserRepository userRepository,
                          SsoUserRepository ssoUserRepository,
                          WishlistRepository wishlistRepository,
                          CartItemRepository cartItemRepository,
                          ProductReviewRepository productReviewRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.ssoUserRepository = ssoUserRepository;
        this.wishlistRepository = wishlistRepository;
        this.cartItemRepository = cartItemRepository;
        this.productReviewRepository = productReviewRepository;
    }

    @Transactional
    public ProfileResponse getOrCreateProfile(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Profile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(user));

        return toResponse(profile, user);
    }

    @Transactional
    public ProfileResponse updateProfile(Integer userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Profile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyProfile(user));

        if (request.getLastName() != null) {
            profile.setLastName(request.getLastName().trim());
        }
        if (request.getFirstName() != null) {
            profile.setFirstName(request.getFirstName().trim());
        }
        profile.setMiddleName(request.getMiddleName() == null ? null : request.getMiddleName().trim());

        Profile saved = profileRepository.save(profile);
        return toResponse(saved, user);
    }

    @Transactional
    public void deleteAccount(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        wishlistRepository.deleteByUserId(userId);
        cartItemRepository.deleteByUserId(userId);
        productReviewRepository.deleteByUserId(userId);
        profileRepository.findByUserId(userId).ifPresent(profileRepository::delete);
        ssoUserRepository.deleteAllByUserId(userId);
        userRepository.delete(user);
    }

    private Profile createEmptyProfile(User user) {
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setLastName("");
        profile.setFirstName("");
        profile.setMiddleName(null);
        return profileRepository.save(profile);
    }

    private ProfileResponse toResponse(Profile profile, User user) {
        return new ProfileResponse(
                profile.getId(),
                profile.getLastName(),
                profile.getFirstName(),
                profile.getMiddleName(),
                user.getLogin(),
                user.getLogin()
        );
    }
}
