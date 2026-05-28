package com.marketplace.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProfileResponse {

    private Integer id;

    private String lastName;

    private String firstName;

    private String middleName;

    private String login;

    private String email;
}
