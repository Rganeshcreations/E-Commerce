package com.marketgrid.user.service;

import com.marketgrid.user.dto.RegisterRequest;
import com.marketgrid.user.entity.User;
import com.marketgrid.user.repository.UserRepository;
import com.marketgrid.user.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtUtil jwtUtil;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private RestTemplate restTemplate;
    @InjectMocks private AuthService authService;

    @Test
    void publicRegistrationRejectsPrivilegedRoles() {
        RegisterRequest request = validRequest();
        request.setRole("SUPER_ADMIN");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.register(request)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verifyNoInteractions(userRepository, restTemplate);
    }

    @Test
    void registrationRejectsShortPasswords() {
        RegisterRequest request = validRequest();
        request.setPassword("short");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.register(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verifyNoInteractions(userRepository, restTemplate);
    }

    @Test
    void registrationNormalizesEmailAndHashesPassword() {
        RegisterRequest request = validRequest();
        request.setEmail("  CUSTOMER@Example.COM ");

        AuthService.TenantLookupResponse tenant = new AuthService.TenantLookupResponse();
        tenant.setId(5L);
        tenant.setSlug("demo-store");
        tenant.setActive(true);

        when(restTemplate.getForObject(
                eq("http://tenant-service/api/tenants/slug/{slug}"),
                eq(AuthService.TenantLookupResponse.class),
                eq("demo-store")
        )).thenReturn(tenant);
        when(userRepository.findByEmailAndTenantId("customer@example.com", 5L))
                .thenReturn(Optional.empty());
        when(passwordEncoder.encode("LongPassword123"))
                .thenReturn("bcrypt-hash");
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        User created = authService.register(request);

        assertEquals(5L, created.getTenantId());
        assertEquals("customer@example.com", created.getEmail());
        assertEquals("bcrypt-hash", created.getPassword());
        assertEquals("CUSTOMER", created.getRole());
        assertTrue(created.isActive());
        verify(userRepository).save(created);
    }

    @Test
    void registrationRejectsDuplicateAccountInSameTenant() {
        RegisterRequest request = validRequest();
        AuthService.TenantLookupResponse tenant = new AuthService.TenantLookupResponse();
        tenant.setId(5L);
        tenant.setActive(true);

        when(restTemplate.getForObject(
                eq("http://tenant-service/api/tenants/slug/{slug}"),
                eq(AuthService.TenantLookupResponse.class),
                eq("demo-store")
        )).thenReturn(tenant);
        when(userRepository.findByEmailAndTenantId("customer@example.com", 5L))
                .thenReturn(Optional.of(new User()));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.register(request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(userRepository, never()).save(any(User.class));
    }

    private RegisterRequest validRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Customer One");
        request.setEmail("customer@example.com");
        request.setPassword("LongPassword123");
        request.setTenantSlug("demo-store");
        return request;
    }
}
