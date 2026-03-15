package com.marketplace.auth.service;


import com.marketplace.auth.model.Role;
import com.marketplace.auth.model.SsoUser;
import com.marketplace.auth.model.User;
import com.marketplace.auth.repository.RoleRepository;
import com.marketplace.auth.repository.SsoUserRepository;
import com.marketplace.auth.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final SsoUserRepository ssoRepo;
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;

    public CustomOAuth2UserService(SsoUserRepository ssoRepo,
                                   UserRepository userRepo,
                                   RoleRepository roleRepo) {
        this.ssoRepo = ssoRepo;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {

        OAuth2User oauthUser = super.loadUser(request);

        String googleId = oauthUser.getAttribute("sub");
        String email = oauthUser.getAttribute("email");

        Optional<SsoUser> sso = ssoRepo.findByAuthSysAndExternalId("google", googleId);

        if (sso.isEmpty()) {

            User user = new User();
            user.setLogin(email);

            Role userRole = roleRepo.findById(2)
                    .orElseThrow(() -> new RuntimeException("Role USER not found"));

            user.setRoles(Set.of(userRole));

            user = userRepo.save(user);

            SsoUser s = new SsoUser();
            s.setAuthSys("google");
            s.setExternalId(googleId);
            s.setUser(user);

            ssoRepo.save(s);
        }

        return oauthUser;
    }
}