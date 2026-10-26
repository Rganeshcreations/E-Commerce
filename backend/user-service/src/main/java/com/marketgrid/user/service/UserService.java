
package com.marketgrid.user.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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

        // Always use the tenant ID from the authenticated JWT.
        // Never trust the tenant ID sent by the client.
        user.setTenantId(tenantId);

        user.setPassword(
                passwordEncoder.encode(user.getPassword())
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

        // Retrieve the user only if it belongs to this tenant.
        return userRepository.findByIdAndTenantId(id, tenantId);
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

        // Find the user by both ID and tenant ID.
        User existingUser = userRepository
                .findByIdAndTenantId(id, tenantId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
                );

        existingUser.setFullName(updatedUser.getFullName());
        existingUser.setEmail(updatedUser.getEmail());

        // Hash the new password before saving it.
        if (updatedUser.getPassword() != null
                && !updatedUser.getPassword().isBlank()) {

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

        // A user from another tenant will not be found.
        User existingUser = userRepository
                .findByIdAndTenantId(id, tenantId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
                );

        userRepository.delete(existingUser);
    }
}
