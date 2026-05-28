package com.marketplace.auth.service;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AuthCookieService {

    private static final Duration ACCESS_TOKEN_TTL = Duration.ofMinutes(15);
    private static final Duration REFRESH_TOKEN_TTL = Duration.ofDays(7);

    public void addAccessTokenCookie(HttpServletResponse response, String token) {
        addCookie(response, "access_token", token, ACCESS_TOKEN_TTL);
    }

    public void addRefreshTokenCookie(HttpServletResponse response, String token) {
        addCookie(response, "refresh_token", token, REFRESH_TOKEN_TTL);
    }

    public void clearAuthCookies(HttpServletResponse response) {
        clearCookie(response, "access_token");
        clearCookie(response, "refresh_token");
    }

    private void clearCookie(HttpServletResponse response, String name) {
        addCookie(response, name, "", Duration.ZERO);
    }

    private void addCookie(HttpServletResponse response, String name, String value, Duration maxAge) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .sameSite("Lax")
                .maxAge(maxAge)
                .build()
                .toString());
    }
}
