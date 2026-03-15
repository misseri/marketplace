package com.marketplace.auth.controller;


import com.marketplace.auth.dto.UserResponse;
import com.marketplace.auth.model.Role;
import com.marketplace.auth.model.User;
import com.marketplace.auth.repository.UserRepository;
import com.marketplace.auth.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthController(JwtService jwtService,
                          UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @PostMapping("/refresh")
    public void refresh(HttpServletRequest request,
                        HttpServletResponse response) {


        String refreshToken = getCookie(request, "refresh_token");

        if (refreshToken == null) {
            throw new RuntimeException("Refresh token missing");
        }

        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        Integer userId = jwtService.extractUserId(refreshToken);

        String newAccessToken = jwtService.generateAccessToken(userId);

        Cookie access = new Cookie("access_token", newAccessToken);
        access.setHttpOnly(true);
        access.setPath("/");
        access.setMaxAge(900);

        response.addCookie(access);
    }


    @GetMapping("/whoami")
    public UserResponse whoami(HttpServletRequest request) {

        Cookie[] cookies = request.getCookies();
        System.out.println("Cookies from request: " + (cookies == null ? "null" : Arrays.toString(cookies)));

        String token = getCookie(request, "access_token");

        if (token == null) {
            throw new RuntimeException("Access token missing");
        }

        Integer userId = jwtService.extractUserId(token);

        User user = userRepository.findById(userId).orElseThrow();

        Set<String> roles = user.getRoles()
                .stream()
                .map(Role::getНазвание)
                .collect(Collectors.toSet());

        return new UserResponse(
                user.getId(),
                user.getLogin(),
                roles
        );
    }

    @PostMapping("/logout")
    public void logout(HttpServletResponse response) {

        Cookie access = new Cookie("access_token", "");
        access.setHttpOnly(true);
        access.setPath("/");
        access.setMaxAge(0);

        Cookie refresh = new Cookie("refresh_token", "");
        refresh.setHttpOnly(true);
        refresh.setPath("/");
        refresh.setMaxAge(0);

        response.addCookie(access);
        response.addCookie(refresh);
    }

    private String getCookie(HttpServletRequest request, String name) {

        if (request.getCookies() == null) return null;

        for (Cookie cookie : request.getCookies()) {

            if (cookie.getName().equals(name)) {
                return cookie.getValue();
            }

        }

        return null;
    }
}