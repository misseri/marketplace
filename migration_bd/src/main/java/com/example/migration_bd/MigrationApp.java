package com.example.migration_bd;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class MigrationApp {

    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(MigrationApp.class, args);
        int exitCode = SpringApplication.exit(ctx);
        System.exit(exitCode);
    }
}