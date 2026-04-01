package com.marketplace;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.security.oauth2.client.registration.google.client-id=test-client",
		"spring.security.oauth2.client.registration.google.client-secret=test-secret",
		"spring.datasource.hikari.initializationFailTimeout=0",
		"spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false",
		"spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
})
class ProductApplicationTests {

	@Test
	void contextLoads() {
	}

}
