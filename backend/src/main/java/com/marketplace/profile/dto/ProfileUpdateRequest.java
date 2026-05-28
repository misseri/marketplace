package com.marketplace.profile.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {

    private String lastName;

    private String firstName;

    private String middleName;
}
