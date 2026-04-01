package com.marketplace.auth.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Entity
@Table(name = "пользователь")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String login;

    @Column(name = "hash_pass")
    private String hashPass;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "роли_пользователи",
            joinColumns = @JoinColumn(name = "пользователь_id"),
            inverseJoinColumns = @JoinColumn(name = "роль_id")
    )
    private Set<Role> roles;
}