package com.marketplace.auth.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "sso_user")
@Getter
@Setter
public class SsoUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "auth_sys")
    private String authSys;

    @Column(name = "external_id")
    private String externalId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}