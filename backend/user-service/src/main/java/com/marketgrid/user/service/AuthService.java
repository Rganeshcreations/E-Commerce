
package com.marketgrid.user.service;

import com.marketgrid.user.dto.LoginRequest;
import com.marketgrid.user.dto.LoginResponse;
import com.marketgrid.user.dto.RegisterRequest;
import com.marketgrid.user.entity.User;
import com.marketgrid.user.repository.UserRepository;
import com.marketgrid.user.security.JwtUtil;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = restTemplate;
    }

    public User register(RegisterRequest request) {
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration details are required"
            );
        }

        // Public self-registration is restricted to customers.
        if (request.getRole() != null
                && !"CUSTOMER".equalsIgnoreCase(request.getRole().trim())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Self-registration is available for customer accounts only"
            );
        }

        String fullName = request.getFullName() == null
                ? ""
                : request.getFullName().trim();

        String email = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase(java.util.Locale.ROOT);

        String password = request.getPassword();

        if (fullName.length() < 2 || fullName.length() > 120) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Full name must be between 2 and 120 characters"
            );
        }

        if (!email.matches(
                "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Enter a valid email address"
            );
        }

        if (password == null || password.length() < 8 || password.length() > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain 8 to 72 characters"
            );
        }

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setActive(true);

        if (request.getTenantSlug() == null
                || request.getTenantSlug().isBlank()) {

            // Store-independent applicants receive no tenant privileges.
            if (userRepository.findByEmail(email).isPresent()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "An account with this email already exists"
                );
            }

            user.setTenantId(null);
            user.setRole("TENANT_APPLICANT");

        } else {
            TenantLookupResponse tenant =
                    lookupActiveTenant(request.getTenantSlug().trim());

            if (userRepository.findByEmailAndTenantId(email, tenant.getId())
                    .isPresent()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "An account with this email already exists in this store"
                );
            }

            user.setTenantId(tenant.getId());
            user.setRole("CUSTOMER");
        }

        return userRepository.save(user);
    }

    public User registerPendingVendor(RegisterRequest request) {
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vendor application details are required"
            );
        }

        String fullName = request.getFullName() == null
                ? ""
                : request.getFullName().trim();

        String email = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase(java.util.Locale.ROOT);

        String password = request.getPassword();

        String slug = request.getTenantSlug() == null
                ? ""
                : request.getTenantSlug().trim();

        if (fullName.length() < 2 || fullName.length() > 120) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Full name must be between 2 and 120 characters"
            );
        }

        if (!email.matches(
                "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Enter a valid email address"
            );
        }

        if (password == null || password.length() < 8 || password.length() > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain 8 to 72 characters"
            );
        }

        if (slug.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A store must be selected for a vendor application"
            );
        }

        TenantLookupResponse tenant = lookupActiveTenant(slug);
        User existingUser = userRepository
                .findByEmailAndTenantId(email, tenant.getId())
                .orElse(null);

        if (existingUser != null) {
            if (!"VENDOR".equals(existingUser.getRole())
                    || existingUser.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "An active account already exists for this email and store"
                );
            }

            // Allow a rejected, inactive vendor to reapply.
            existingUser.setFullName(fullName);
            existingUser.setPassword(passwordEncoder.encode(password));
            existingUser.setActive(false);

            return userRepository.save(existingUser);
        }

        User user = new User();
        user.setTenantId(tenant.getId());
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("VENDOR");
        user.setActive(false);

        return userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null
                || request.getEmail() == null
                || request.getEmail().isBlank()
                || request.getPassword() == null
                || request.getPassword().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email and password are required"
            );
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase(java.util.Locale.ROOT);

        User user;

        if (request.getTenantSlug() != null
                && !request.getTenantSlug().isBlank()) {

            TenantLookupResponse tenant =
                    lookupActiveTenant(request.getTenantSlug().trim());

            user = userRepository.findByEmailAndTenantId(email, tenant.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Invalid email, password or store"
                    ));

        } else if (request.getTenantId() != null) {

            user = userRepository
                    .findByEmailAndTenantId(email, request.getTenantId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Invalid email, password or store"
                    ));

        } else {
            // Store slug is optional for login.
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Invalid email or password"
                    ));
        }

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User account is inactive"
            );
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        String token = jwtUtil.generateToken(
                user.getId(),
                user.getTenantId(),
                user.getEmail(),
                user.getRole()
        );

        return new LoginResponse(
                token,
                user.getId(),
                user.getTenantId(),
                user.getEmail(),
                user.getRole()
        );
    }

    private TenantLookupResponse lookupActiveTenant(String slug) {
        try {
            TenantLookupResponse tenant = restTemplate.getForObject(
                    "http://tenant-service/api/tenants/slug/{slug}",
                    TenantLookupResponse.class,
                    slug
            );

            if (tenant == null || tenant.getId() == null || !tenant.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Store not found or inactive"
                );
            }

            return tenant;

        } catch (ResponseStatusException ex) {
            throw ex;

        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Store not found or inactive"
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to verify store. Please try again later"
            );

        } catch (RestClientException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Tenant Service is unavailable. Please try again later"
            );
        }
    }

    public static class TenantLookupResponse {

        private Long id;
        private String name;
        private String slug;
        private boolean active;

        public TenantLookupResponse() {
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getSlug() {
            return slug;
        }

        public void setSlug(String slug) {
            this.slug = slug;
        }

        public boolean isActive() {
            return active;
        }

        public void setActive(boolean active) {
            this.active = active;
        }
    }
}
