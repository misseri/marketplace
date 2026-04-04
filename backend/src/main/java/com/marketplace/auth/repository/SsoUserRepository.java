package com.marketplace.auth.repository;

import com.marketplace.auth.model.SsoUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SsoUserRepository extends JpaRepository<SsoUser, Integer> {
    Optional<SsoUser> findByAuthSysAndExternalId(String authSys, String externalId);
}
