package com.marketgrid.tenant.controller;

import com.marketgrid.tenant.dto.SubmitTenantApplicationRequest;
import com.marketgrid.tenant.dto.TenantApplicationResponse;
import com.marketgrid.tenant.entity.Tenant;
import com.marketgrid.tenant.entity.TenantApplication;
import com.marketgrid.tenant.service.TenantApplicationService;
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

    public TenantApplicationController(
            TenantApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TenantApplicationResponse submit(
            @Valid @RequestBody SubmitTenantApplicationRequest request) {

        TenantApplication application = applicationService.submit(
                request.getApplicantName(),
                request.getApplicantEmail(),
                request.getStoreName(),
                request.getRequestedSlug());

        return new TenantApplicationResponse(application);
    }

    @GetMapping
    public List<TenantApplicationResponse> getAll() {
        return applicationService.getAll().stream()
                .map(TenantApplicationResponse::new)
                .toList();
    }

    @GetMapping("/pending")
    public List<TenantApplicationResponse> getPending() {
        return applicationService.getPending().stream()
                .map(TenantApplicationResponse::new)
                .toList();
    }

    @PostMapping("/{id}/approve")
    public TenantResponseWrapper approve(@PathVariable Long id) {
        Tenant tenant = applicationService.approve(id);
        return new TenantResponseWrapper(tenant);
    }

    @PostMapping("/{id}/reject")
    public TenantApplicationResponse reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectApplicationRequest request) {

        return new TenantApplicationResponse(
                applicationService.reject(id, request.getReason()));
    }

    public static class RejectApplicationRequest {

        @NotBlank
        @Size(max = 1000)
        private String reason;

        public RejectApplicationRequest() {}

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class TenantResponseWrapper {
        private Long id;
        private String name;
        private String slug;
        private boolean active;

        public TenantResponseWrapper(Tenant tenant) {
            this.id = tenant.getId();
            this.name = tenant.getName();
            this.slug = tenant.getSlug();
            this.active = tenant.isActive();
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getSlug() { return slug; }
        public boolean isActive() { return active; }
    }
}
