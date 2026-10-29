package com.marketgrid.tenant.controller;

import com.marketgrid.tenant.dto.CreateDomainRequest;
import com.marketgrid.tenant.dto.DomainResponse;
import com.marketgrid.tenant.service.DomainService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/domains")
public class DomainController {
    private final DomainService domainService;

    public DomainController(DomainService domainService) {
        this.domainService = domainService;
    }

    @GetMapping
    public List<DomainResponse> getAll() { return domainService.getAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DomainResponse create(@Valid @RequestBody CreateDomainRequest request) {
        return domainService.create(request);
    }

    @PatchMapping("/{id}/assign")
    public DomainResponse assign(@PathVariable Long id, @RequestParam Long tenantId) {
        return domainService.assign(id, tenantId);
    }

    @PatchMapping("/{id}/unassign")
    public DomainResponse unassign(@PathVariable Long id) {
        return domainService.unassign(id);
    }
}
