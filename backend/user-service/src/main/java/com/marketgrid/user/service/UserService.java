
package com.marketgrid.user.service;

import com.marketgrid.user.entity.User;
import com.marketgrid.user.repository.UserRepository;
import com.marketgrid.user.security.TenantContext;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
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
        if (user == null) {
            throw badRequest("User details are required");
        }

        String callerRole = currentRole();

        if (!"SUPER_ADMIN".equals(callerRole)
                && !"TENANT_ADMIN".equals(callerRole)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can create accounts"
            );
        }

        String requestedRole =
                user.getRole() == null || user.getRole().isBlank()
                        ? "CUSTOMER"
                        : user.getRole().trim().toUpperCase(Locale.ROOT);

        // Never allow a user-management request to create a SUPER_ADMIN.
        if (!List.of("CUSTOMER", "VENDOR", "TENANT_ADMIN")
                .contains(requestedRole)) {
            throw badRequest(
                    "Allowed account roles are CUSTOMER, VENDOR, and TENANT_ADMIN"
            );
        }

        if ("TENANT_ADMIN".equals(callerRole)
                && "TENANT_ADMIN".equals(requestedRole)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tenant administrators cannot create administrator accounts"
            );
        }

        Long currentTenantId = TenantContext.getTenantId();
        Long tenantId;

        if ("SUPER_ADMIN".equals(callerRole)) {
            tenantId = user.getTenantId();

            if (tenantId == null || tenantId <= 0) {
                throw badRequest("A valid tenant ID is required");
            }
        } else {
            if (currentTenantId == null) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Tenant information is missing"
                );
            }

            tenantId = currentTenantId;
        }

        String fullName = user.getFullName() == null
                ? ""
                : user.getFullName().trim();

        String email = user.getEmail() == null
                ? ""
                : user.getEmail().trim().toLowerCase(Locale.ROOT);

        String rawPassword = user.getPassword();

        if (fullName.length() < 2 || fullName.length() > 120) {
            throw badRequest(
                    "Full name must be between 2 and 120 characters"
            );
        }

        if (!email.matches(
                "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw badRequest("Enter a valid email address");
        }

        if (rawPassword == null
                || rawPassword.length() < 8
                || rawPassword.length() > 72) {
            throw badRequest(
                    "Password must contain 8 to 72 characters"
            );
        }

        if (userRepository.findByEmailAndTenantId(email, tenantId)
                .isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists in this store"
            );
        }

        User created = new User();
        created.setTenantId(tenantId);
        created.setFullName(fullName);
        created.setEmail(email);
        created.setPassword(passwordEncoder.encode(rawPassword));
        created.setRole(requestedRole);
        created.setActive(true);

        return userRepository.save(created);
    }

    public List<User> getAllUsers() {
        String role = currentRole();

        if ("SUPER_ADMIN".equals(role)) {
            return userRepository.findAll();
        }

        if (!"TENANT_ADMIN".equals(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can view users"
            );
        }

        Long tenantId = requireTenant();
        return userRepository.findAllByTenantId(tenantId);
    }

    public Optional<User> getUserById(Long id) {
        if ("SUPER_ADMIN".equals(currentRole())) {
            return userRepository.findById(id);
        }

        if (!"TENANT_ADMIN".equals(currentRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can view users"
            );
        }

        return userRepository.findByIdAndTenantId(
                id,
                requireTenant()
        );
    }

    public Optional<User> getUserByEmailAndTenantId(
            String email,
            Long tenantId) {
        return userRepository.findByEmailAndTenantId(email, tenantId);
    }

    public User updateUser(Long id, User updatedUser) {
        if (updatedUser == null) {
            throw badRequest("Updated user details are required");
        }

        User existing = findManageableUser(id);

        if (updatedUser.getFullName() == null
                || updatedUser.getFullName().trim().length() < 2
                || updatedUser.getFullName().trim().length() > 120) {
            throw badRequest(
                    "Full name must be between 2 and 120 characters"
            );
        }

        if (updatedUser.getEmail() == null
                || !updatedUser.getEmail().trim().matches(
                "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw badRequest("Enter a valid email address");
        }

        String email = updatedUser.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        userRepository.findByEmailAndTenantId(
                        email,
                        existing.getTenantId())
                .filter(other ->
                        !other.getId().equals(existing.getId()))
                .ifPresent(other -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "An account with this email already exists in this store"
                    );
                });

        existing.setFullName(updatedUser.getFullName().trim());
        existing.setEmail(email);

        if (updatedUser.getPassword() != null
                && !updatedUser.getPassword().isBlank()) {

            if (updatedUser.getPassword().length() < 8
                    || updatedUser.getPassword().length() > 72) {
                throw badRequest(
                        "Password must contain 8 to 72 characters"
                );
            }

            existing.setPassword(
                    passwordEncoder.encode(updatedUser.getPassword())
            );
        }

        // Role, tenant ID, and active status cannot be changed here.
        return userRepository.save(existing);
    }

    public User activateVendorByEmail(String email) {
        // Only a tenant administrator can approve vendors.
        if (!"TENANT_ADMIN".equals(currentRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only tenant administrators can activate vendor accounts"
            );
        }

        // Restrict the operation to the authenticated administrator's tenant.
        Long tenantId = requireTenant();

        String normalizedEmail = email == null
                ? ""
                : email.trim().toLowerCase(Locale.ROOT);

        if (normalizedEmail.isBlank()) {
            throw badRequest("Email is required");
        }

        User vendor = userRepository
                .findByEmailAndTenantId(normalizedEmail, tenantId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Vendor account not found for this store"
                ));

        if (!"VENDOR".equals(vendor.getRole())) {
            throw badRequest("The account is not a vendor");
        }

        vendor.setActive(true);
        return userRepository.save(vendor);
    }

    public void deleteUser(Long id) {
        User existing = findManageableUser(id);

        if ("SUPER_ADMIN".equals(existing.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Platform administrator accounts cannot be deleted here"
            );
        }

        if ("TENANT_ADMIN".equals(currentRole())
                && "TENANT_ADMIN".equals(existing.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tenant administrators cannot delete another administrator account"
            );
        }

        userRepository.delete(existing);
    }

    private User findManageableUser(Long id) {
        String role = currentRole();

        if ("SUPER_ADMIN".equals(role)) {
            return userRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "User not found"
                    ));
        }

        if (!"TENANT_ADMIN".equals(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can manage users"
            );
        }

        User user = userRepository.findByIdAndTenantId(
                        id,
                        requireTenant())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if ("TENANT_ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tenant administrators cannot manage another administrator account"
            );
        }

        return user;
    }

    private Long requireTenant() {
        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Tenant information is missing"
            );
        }

        return tenantId;
    }

    private String currentRole() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return "";
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring(5))
                .findFirst()
                .orElse("");
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message
        );
    }
}
