package com.marketgrid.user.service;

import com.marketgrid.user.entity.User;
import com.marketgrid.user.repository.UserRepository;
import com.marketgrid.user.security.TenantContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(User user) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException(
                    "Tenant information not found"
            );
        }

        // Always use tenant ID from the authenticated JWT.
        // Do not trust the tenant ID sent by the client.
        user.setTenantId(tenantId);

        user.setPassword(
                passwordEncoder.encode(
                        user.getPassword()
                )
        );

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException(
                    "Tenant information not found"
            );
        }

        return userRepository.findAllByTenantId(tenantId);
    }

    public Optional<User> getUserById(Long id) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException(
                    "Tenant information not found"
            );
        }

        return userRepository.findById(id)
                .filter(user ->
                        user.getTenantId().equals(tenantId)
                );
    }

    public Optional<User> getUserByEmailAndTenantId(
            String email,
            Long tenantId) {

        return userRepository.findByEmailAndTenantId(
                email,
                tenantId
        );
    }

    public User updateUser(
            Long id,
            User updatedUser) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException(
                    "Tenant information not found"
            );
        }

        User existingUser = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        // Prevent updating a user belonging
        // to another tenant.
        if (!existingUser.getTenantId().equals(tenantId)) {
            throw new RuntimeException(
                    "Access denied for this tenant"
            );
        }

        existingUser.setFullName(
                updatedUser.getFullName()
        );

        existingUser.setEmail(
                updatedUser.getEmail()
        );

        if (updatedUser.getPassword() != null &&
                !updatedUser.getPassword().isBlank()) {

            existingUser.setPassword(
                    passwordEncoder.encode(
                            updatedUser.getPassword()
                    )
            );
        }

        return userRepository.save(existingUser);
    }

    public void deleteUser(Long id) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException(
                    "Tenant information not found"
            );
        }

        User existingUser = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        // Prevent deleting a user belonging
        // to another tenant.
        if (!existingUser.getTenantId().equals(tenantId)) {
            throw new RuntimeException(
                    "Access denied for this tenant"
            );
        }

        userRepository.delete(existingUser);
    }
}