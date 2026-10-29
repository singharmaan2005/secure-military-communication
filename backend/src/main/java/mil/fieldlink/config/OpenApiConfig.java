package mil.fieldlink.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI fieldlinkOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("FIELDLINK C2 Engine API (RESTRICTED // SIMULATION)")
                        .version("v1.0.0")
                        .description("FIELDLINK: Secure Military Communication Using Blockchain and Encryption.\n\n" +
                                "**NOTE:** The ledger implementation is an authentic local hash-linked cryptographic chain simulation, " +
                                "not a distributed consensus network. Real AES-256-GCM authenticated encryption is utilized with fresh 96-bit nonces " +
                                "and SHA-256 payload immutability verification.\n\n" +
                                "**Project Classification:** B.Tech Major Project Operational Prototype (Target: 29 Oct 2026).")
                        .contact(new Contact().name("Tactical Systems Team").email("fieldlink-ops@mil.internal"))
                        .license(new License().name("Operational Prototype License")));
    }
}
