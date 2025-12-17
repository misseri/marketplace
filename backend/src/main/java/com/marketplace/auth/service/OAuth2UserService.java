package com.marketplace.auth.service;
import com.marketplace.auth.model.User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OAuth2UserService extends DefaultOAuth2UserService{
    private final Map<String, User> users = new ConcurrentHashMap<>();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String sub = (String) attributes.get("sub");

        if (sub == null){
            throw new OAuth2AuthenticationException("Sub not found");
        }

        users.compute(email != null ? email : sub, (k, user) -> {
            if (user == null) {
                User u = new User();
                u.setEmail(email);
                u.setName(name);
                u.setCreatedAt(LocalDateTime.now());
                u.setLastLogin(LocalDateTime.now());
                return u;
            }
            user.setLastLogin(LocalDateTime.now());
            return user;
        });

        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                        attributes, "sub"
        );
    }
}
