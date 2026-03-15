package com.marketplace.auth.handler;

import com.marketplace.auth.model.SsoUser;
import com.marketplace.auth.repository.SsoUserRepository;
import com.marketplace.auth.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuthSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final SsoUserRepository ssoRepo;

    public OAuthSuccessHandler(JwtService jwtService,
                               SsoUserRepository ssoRepo) {
        this.jwtService = jwtService;
        this.ssoRepo = ssoRepo;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String googleId = oauthUser.getAttribute("sub");

        SsoUser sso = ssoRepo
                .findByAuthSysAndExternalId("google", googleId)
                .orElseThrow(() -> new RuntimeException("SSO user not found"));

        Integer userId = sso.getUser().getId();

        String accessToken = jwtService.generateAccessToken(userId);
        String refreshToken = jwtService.generateRefreshToken(userId);

        Cookie access = new Cookie("access_token", accessToken);
        access.setHttpOnly(true);
        access.setPath("/");
        access.setMaxAge(900);
        access.setSecure(false); // для локальной разработки
        access.setDomain("localhost");

        Cookie refresh = new Cookie("refresh_token", refreshToken);
        refresh.setHttpOnly(true);
        refresh.setPath("/");
        refresh.setMaxAge(604800);
        refresh.setSecure(false); // для локальной разработки
        refresh.setDomain("localhost");

        response.addCookie(access);
        response.addCookie(refresh);

        // редирект на фронтенд
        response.sendRedirect("http://localhost:3000");
    }
}