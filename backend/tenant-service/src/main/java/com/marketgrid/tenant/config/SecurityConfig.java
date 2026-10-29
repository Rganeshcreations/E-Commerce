package com.marketgrid.tenant.config;

import com.marketgrid.tenant.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            .logout(logout -> logout.disable())
            .requestCache(cache -> cache.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/tenants/slug/**", "/api/tenants/active").permitAll()

                // Public access only to application submission.
                .requestMatchers(HttpMethod.POST, "/api/tenant-applications").permitAll()

                // All other application endpoints require SUPER_ADMIN.
                .requestMatchers("/api/tenant-applications/**").hasRole("SUPER_ADMIN")

                // Domain and tenant management are restricted to platform administrators.
                .requestMatchers("/api/domains", "/api/domains/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/tenants", "/api/tenants/**").hasRole("SUPER_ADMIN")

                .anyRequest().denyAll()
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException(
                "JWT authentication is required; no local users are configured."
            );
        };
    }
}
