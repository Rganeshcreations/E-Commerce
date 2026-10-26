package com.marketgrid.user.service;

import com.marketgrid.user.entity.User;
import com.marketgrid.user.repository.UserRepository;
import com.marketgrid.user.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private UserService userService;

    @BeforeEach
    void setUpTenantAdmin() {
        TenantContext.setTenantId(3L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "tenant-admin@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN"))
                )
        );
    }

    @AfterEach
    void clearSecurityContext() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void tenantAdminCannotCreateSuperAdmin() {
        User request = request("SUPER_ADMIN", 3L);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userService.createUser(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    void tenantAdminCannotCreateAnotherTenantAdmin() {
        User request = request("TENANT_ADMIN", 3L);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userService.createUser(request)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    void tenantAdminCannotChooseAnotherTenantId() {
        User request = request("CUSTOMER", 999L);
        when(userRepository.findByEmailAndTenantId("customer@example.com", 3L))
                .thenReturn(Optional.empty());
        when(passwordEncoder.encode("LongPassword123")).thenReturn("hashed");
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        User created = userService.createUser(request);

        assertEquals(3L, created.getTenantId());
        assertEquals("CUSTOMER", created.getRole());
        assertEquals("hashed", created.getPassword());
        verify(userRepository).save(created);
    }

    private User request(String role, Long tenantId) {
        User user = new User();
        user.setTenantId(tenantId);
        user.setFullName("Customer One");
        user.setEmail("customer@example.com");
        user.setPassword("LongPassword123");
        user.setRole(role);
        return user;
    }
}
