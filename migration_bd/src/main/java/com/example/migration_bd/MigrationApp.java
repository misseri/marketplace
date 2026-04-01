package com.example.migration_bd;

import java.sql.SQLException;
import java.time.Duration;
import java.util.Arrays;
import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class MigrationApp implements CommandLineRunner {

    private static final String POSTGRES_JDBC_PREFIX = "jdbc:postgresql://";
    private static final Logger log = LoggerFactory.getLogger(MigrationApp.class);

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${spring.flyway.baseline-on-migrate:true}")
    private boolean baselineOnMigrate;

    @Value("${spring.flyway.locations:classpath:db/migration}")
    private String flywayLocations;

    @Value("${migrator.retry-delay-seconds:10}")
    private long retryDelaySeconds;

    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(MigrationApp.class, args);
        int exitCode = SpringApplication.exit(ctx);
        System.exit(exitCode);
    }

    @Override
    public void run(String... args) {
        validateConfiguration();
        warnIfPasswordIsBlank();

        while (true) {
            try {
                String[] migrationLocations = parseMigrationLocations(flywayLocations);

                log.info(
                        "Starting migrations for url='{}', user='{}', locations=[{}].",
                        dbUrl,
                        dbUser,
                        String.join(", ", migrationLocations)
                );

                Flyway.configure()
                        .dataSource(dbUrl, dbUser, dbPassword)
                        .baselineOnMigrate(baselineOnMigrate)
                        .locations(migrationLocations)
                        .load()
                        .migrate();
                log.info("Migrations finished successfully.");
                return;
            } catch (Exception e) {
                String reason = extractShortReason(e);

                if (!isRetryable(e)) {
                    log.error(
                            "Migration failed with a non-retryable error for url='{}', user='{}'. Reason: {}",
                            dbUrl,
                            dbUser,
                            reason
                    );
                    System.exit(1);
                }

                log.warn(
                        "DB is temporarily unavailable for url='{}', user='{}'. Reason: {}. Retrying in {} seconds...",
                        dbUrl,
                        dbUser,
                        reason,
                        retryDelaySeconds
                );

                sleepBeforeRetry();
            }
        }
    }

    private void validateConfiguration() {
        if (dbUrl == null || dbUrl.isBlank()) {
            throw new IllegalStateException("DB URL is empty. Set spring.datasource.url or DB_URL.");
        }
        if (!dbUrl.startsWith(POSTGRES_JDBC_PREFIX)) {
            throw new IllegalStateException(
                    "DB URL must start with '" + POSTGRES_JDBC_PREFIX + "'. Current value: " + dbUrl
            );
        }
        if (dbUser == null || dbUser.isBlank()) {
            throw new IllegalStateException("DB user is empty. Set spring.datasource.username or DB_USER.");
        }
        if (retryDelaySeconds <= 0) {
            throw new IllegalStateException("migrator.retry-delay-seconds must be greater than 0.");
        }
        parseMigrationLocations(flywayLocations);
    }

    private void warnIfPasswordIsBlank() {
        if (dbPassword == null || dbPassword.isBlank()) {
            log.warn("DB_PASSWORD is empty. If PostgreSQL requires a password, connection will fail until DB_PASSWORD is set.");
        }
    }

    private String[] parseMigrationLocations(String rawLocations) {
        if (rawLocations == null || rawLocations.isBlank()) {
            throw new IllegalStateException("Migration locations are empty. Set spring.flyway.locations or FLYWAY_LOCATIONS.");
        }

        String[] locations = Arrays.stream(rawLocations.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toArray(String[]::new);

        if (locations.length == 0) {
            throw new IllegalStateException("Migration locations are empty after parsing: " + rawLocations);
        }

        for (String location : locations) {
            if (!location.startsWith("classpath:") && !location.startsWith("filesystem:")) {
                throw new IllegalStateException(
                        "Unsupported migration location '" + location
                                + "'. Use classpath:... or filesystem:..."
                );
            }
        }

        return locations;
    }

    private boolean isRetryable(Exception exception) {
        Throwable root = getRootCause(exception);
        String message = safeLower(root.getMessage());

        if (root instanceof SQLException sqlException) {
            String sqlState = sqlException.getSQLState();

            if ((sqlState != null && sqlState.startsWith("28"))
                    || message.contains("authentication failed")
                    || message.contains("invalid password")
                    || message.contains("password is an empty string")
                    || (message.contains("role") && message.contains("does not exist"))
                    || message.contains("no suitable driver")) {
                return false;
            }

            if ((sqlState != null && sqlState.startsWith("08"))
                    || "57P03".equals(sqlState)
                    || message.contains("connection refused")
                    || message.contains("connect timed out")
                    || message.contains("timeout expired")
                    || message.contains("database system is starting up")
                    || message.contains("starting up")) {
                return true;
            }
        }

        return message.contains("connection refused")
                || message.contains("connect timed out")
                || message.contains("timeout expired")
                || message.contains("database system is starting up")
                || message.contains("starting up");
    }

    private Throwable getRootCause(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current;
    }

    private String extractShortReason(Exception exception) {
        Throwable root = getRootCause(exception);

        if (root instanceof SQLException sqlException) {
            String message = sqlException.getMessage();
            if (message == null || message.isBlank()) {
                return "SQLState=" + sqlException.getSQLState();
            }
            return message;
        }

        String message = root.getMessage();
        if (message == null || message.isBlank()) {
            return root.getClass().getSimpleName();
        }
        return message;
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase();
    }

    private void sleepBeforeRetry() {
        try {
            Thread.sleep(Duration.ofSeconds(retryDelaySeconds).toMillis());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Retry loop interrupted", ex);
        }
    }
}
