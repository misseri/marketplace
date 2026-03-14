package com.marketplace.auth.controller;


import com.marketplace.auth.dto.UserResponse;
import com.marketplace.auth.model.Role;
import com.marketplace.auth.model.User;
import com.marketplace.auth.repository.UserRepository;
import com.marketplace.auth.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/whoami")
    public UserResponse whoami(HttpServletRequest request) {

        String token = getCookie(request, "access_token");

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