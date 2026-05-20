package com.marketplace.auth.service;

import com.marketplace.auth.model.SsoUser;
import com.marketplace.auth.repository.SsoUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CurrentUserService {

    private final SsoUserRepository ssoUserRepository;

    public CurrentUserService(SsoUserRepository ssoUserRepository) {
        this.ssoUserRepository = ssoUserRepository;
    }

    public Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Integer userId) {
            return userId;
        }

        if (principal instanceof OAuth2User oauth2User) {
            String googleId = oauth2User.getAttribute("sub");

            if (googleId == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
            }

            SsoUser ssoUser = ssoUserRepository
                    .findByAuthSysAndExternalId("google", googleId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));

            return ssoUser.getUser().getId();
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
}
