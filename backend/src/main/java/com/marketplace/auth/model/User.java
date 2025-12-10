package com.marketplace.auth.model;

import java.time.LocalDateTime;

public class User {

    private String email;
    private String name;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;


    public User(String email, String name){
        this.email = email;
        this.name = name;
        this.createdAt = LocalDateTime.now();
        this.lastLogin = LocalDateTime.now();
    }

    public User() {}

    public String getEmail(){
        return email;
    }
    public String getName(){
        return name;
    }
    public LocalDateTime getCreateAt(){
        return createdAt;
    }
    public LocalDateTime getLastLogin(){
        return lastLogin;
    }

    public void setEmail(String email){
        this.email = email;
    }
    public void setName(String name){
        this.name = name;
    }
    public void setCreatedAt(LocalDateTime createdAt){
        this.createdAt = createdAt;
    }
    public void setLastLogin(LocalDateTime lastLogin){
        this.lastLogin = lastLogin;
    }

    @Override
    public String toString(){
        return "User{email='"+ email +"', name='"+ name +"'}";
    }
}
