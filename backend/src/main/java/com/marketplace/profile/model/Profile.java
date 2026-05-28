package com.marketplace.profile.model;

import com.marketplace.auth.model.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "профиль")
@Getter
@Setter
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "фамилия")
    private String lastName;

    @Column(name = "имя")
    private String firstName;

    @Column(name = "отчество")
    private String middleName;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "пользователь_id", nullable = false, unique = true)
    private User user;
}
