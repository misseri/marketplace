package com.marketplace.auth.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class AuthController {

    @GetMapping("/")
    @ResponseBody
    public String home() {
        return "home";
    }

    @GetMapping("/login")
    public String login(){ return "redirect:/oauth2/authorization/google"; }
}
