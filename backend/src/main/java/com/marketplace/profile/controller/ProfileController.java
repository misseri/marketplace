package com.marketplace.profile.controller;

import com.marketplace.auth.service.CurrentUserService;
import com.marketplace.profile.dto.ProfileResponse;
import com.marketplace.profile.dto.ProfileUpdateRequest;
import com.marketplace.profile.service.ProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final CurrentUserService currentUserService;

    public ProfileController(ProfileService profileService,
                             CurrentUserService currentUserService) {
        this.profileService = profileService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/me")
    public ProfileResponse getMyProfile() {
        return profileService.getOrCreateProfile(currentUserService.getCurrentUserId());
    }

    @PutMapping("/me")
    public ProfileResponse updateMyProfile(@RequestBody ProfileUpdateRequest body) {
        return profileService.updateProfile(currentUserService.getCurrentUserId(), body);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMyProfile() {
        profileService.deleteAccount(currentUserService.getCurrentUserId());
    }
}
