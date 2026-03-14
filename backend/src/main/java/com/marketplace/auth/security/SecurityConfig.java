package com.marketplace.auth.security;

import com.marketplace.auth.handler.OAuthSuccessHandler;
import com.marketplace.auth.service.CustomOAuth2UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    private final CustomOAuth2UserService oauthService;
    private final OAuthSuccessHandler successHandler;

    public SecurityConfig(CustomOAuth2UserService oauthService,
                          OAuthSuccessHandler successHandler) {
        this.oauthService = oauthService;
        this.successHandler = successHandler;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**","/oauth2/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(user -> user
                                .userService(oauthService)
                        )
                        .successHandler(successHandler)
                );

        return http.build();
    }
}