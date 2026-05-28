package com.marketplace.auth.controller;

import com.marketplace.auth.dto.UserResponse;
import com.marketplace.auth.model.Role;
import com.marketplace.auth.model.User;
import com.marketplace.auth.repository.SsoUserRepository;
import com.marketplace.auth.repository.UserRepository;
import com.marketplace.auth.service.AuthCookieService;
import com.marketplace.auth.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final SsoUserRepository ssoUserRepository;
    private final AuthCookieService authCookieService;

    public AuthController(JwtService jwtService,
                          UserRepository userRepository,
                          SsoUserRepository ssoUserRepository,
                          AuthCookieService authCookieService) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.ssoUserRepository = ssoUserRepository;
        this.authCookieService = authCookieService;
    }

    @PostMapping("/refresh")
    public void refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookie(request, "refresh_token");

        if (refreshToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token missing");
        }

        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        Integer userId = jwtService.extractUserId(refreshToken);
        String newAccessToken = jwtService.generateAccessToken(userId);

        authCookieService.addAccessTokenCookie(response, newAccessToken);
    }

    @GetMapping("/whoami")
    public UserResponse whoami(Authentication authentication) {
        Integer userId = requireUserId(authentication);
        User user = userRepository.findById(userId).orElseThrow();

        Set<String> roles = user.getRoles()
                .stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return new UserResponse(user.getId(), user.getLogin(), roles);
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        authCookieService.clearAuthCookies(response);

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        SecurityContextHolder.clearContext();
    }

    private String getCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }

        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals(name)) {
                return cookie.getValue();
            }
        }

        return null;
    }

    private Integer requireUserId(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Access token missing");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Integer userId) {
            return userId;
        }

        if (principal instanceof OAuth2User oauth2User) {
            String googleId = oauth2User.getAttribute("sub");

            if (googleId != null) {
                return ssoUserRepository.findByAuthSysAndExternalId("google", googleId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "SSO user not found"))
                        .getUser()
                        .getId();
            }
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Access token missing");
    }
}
