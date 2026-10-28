package com.marketgrid.vendor.config;

import com.marketgrid.vendor.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth
                        // Vendor can access their own profile.
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/vendors/me")
                        .hasRole("VENDOR")

                        // A prospective vendor may submit an application without an account token.
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/vendors/applications")
                        .permitAll()

                        // Only tenant administrators can review vendor applications.
                        .requestMatchers("/api/vendors/applications/**")
                        .hasRole("TENANT_ADMIN")

                        // Read vendor data.
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/vendors/**")
                        .hasAnyRole("SUPER_ADMIN", "TENANT_ADMIN", "VENDOR", "CUSTOMER")

                        // Vendor profile mutations remain administrator-only.
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/vendors/**")
                        .hasAnyRole("SUPER_ADMIN", "TENANT_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/vendors/**")
                        .hasAnyRole("SUPER_ADMIN", "TENANT_ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/vendors/**")
                        .hasAnyRole("SUPER_ADMIN", "TENANT_ADMIN")

                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
