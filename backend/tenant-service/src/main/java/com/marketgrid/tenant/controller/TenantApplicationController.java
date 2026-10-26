package com.marketgrid.tenant.controller;

import com.marketgrid.tenant.dto.SubmitTenantApplicationRequest;
import com.marketgrid.tenant.dto.TenantApplicationResponse;
import com.marketgrid.tenant.entity.Tenant;
import com.marketgrid.tenant.entity.TenantApplication;
import com.marketgrid.tenant.service.TenantApplicationService;
import com.marketgrid.tenant.security.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tenant-applications")
public class TenantApplicationController {
    private final TenantApplicationService applicationService;
    private final JwtUtil jwtUtil;
    public TenantApplicationController(TenantApplicationService applicationService, JwtUtil jwtUtil) {
        this.applicationService = applicationService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TenantApplicationResponse submit(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody SubmitTenantApplicationRequest request) {
        Claims claims = claimsFrom(authorization);
        Object rawUserId = claims.get("userId");
        if (!(rawUserId instanceof Number userId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "The login token does not contain a valid user ID");
        }
        String email = claims.getSubject();
        return new TenantApplicationResponse(applicationService.submit(
            userId.longValue(), request.getApplicantName(), email, request.getStoreName(),
            request.getRequestedSlug(), request.getRequestedDomainSlug()));
    }

    @GetMapping("/mine")
    public List<TenantApplicationResponse> getMine(@RequestHeader("Authorization") String authorization) {
        Claims claims = claimsFrom(authorization);
        Object rawUserId = claims.get("userId");
        if (!(rawUserId instanceof Number userId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "The login token does not contain a valid user ID");
        }
        return applicationService.getMine(userId.longValue()).stream()
                .map(TenantApplicationResponse::new).toList();
    }

    private Claims claimsFrom(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Sign in before submitting or viewing an application");
        }
        try {
            return jwtUtil.extractAllClaims(authorization.substring(7));
        } catch (RuntimeException ex) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid login token");
        }
    }

    @GetMapping
    public List<TenantApplicationResponse> getAll() {
        return applicationService.getAll().stream().map(TenantApplicationResponse::new).toList();
    }

    @GetMapping("/pending")
    public List<TenantApplicationResponse> getPending() {
        return applicationService.getPending().stream().map(TenantApplicationResponse::new).toList();
    }

    @PostMapping("/{id}/approve")
    public TenantResponseWrapper approve(@PathVariable Long id) {
        return new TenantResponseWrapper(applicationService.approve(id));
    }

    @PostMapping("/{id}/reject")
    public TenantApplicationResponse reject(@PathVariable Long id,
            @Valid @RequestBody RejectApplicationRequest request) {
        return new TenantApplicationResponse(applicationService.reject(id, request.getReason()));
    }

    public static class RejectApplicationRequest {
        @NotBlank @Size(max = 1000)
        private String reason;
        public RejectApplicationRequest() {}
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class TenantResponseWrapper {
        private final Long id;
        private final String name;
        private final String slug;
        private final boolean active;
        public TenantResponseWrapper(Tenant tenant) {
            id = tenant.getId(); name = tenant.getName(); slug = tenant.getSlug(); active = tenant.isActive();
        }
        public Long getId() { return id; }
        public String getName() { return name; }
        public String getSlug() { return slug; }
        public boolean isActive() { return active; }
    }
}
