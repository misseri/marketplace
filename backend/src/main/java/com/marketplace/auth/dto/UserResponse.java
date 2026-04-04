package com.marketplace.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class UserResponse {

    private Integer id;

    private String login;

    private Set<String> roles;

}