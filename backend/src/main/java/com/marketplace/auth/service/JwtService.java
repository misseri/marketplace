package com.marketplace.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    private final String SECRET = "very-secret-key-very-secret-key-very-secret-key";

    public String generateAccessToken(Integer userId) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("type", "access")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 900000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes()))
                .compact();
    }

    public String generateRefreshToken(Integer userId) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("type", "refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 604800000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes()))
                .compact();
    }

    public Integer extractUserId(String token) {
        return Integer.parseInt(parseToken(token).getBody().getSubject());
    }

    public boolean isAccessToken(String token) {
        return "access".equals(parseToken(token).getBody().get("type"));
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(parseToken(token).getBody().get("type"));
    }

    private Jws<Claims> parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(SECRET.getBytes()))
                .build()
                .parseClaimsJws(token);
    }
}
