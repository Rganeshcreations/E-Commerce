package com.marketgrid.vendor.service;

import com.marketgrid.vendor.entity.Vendor;
import com.marketgrid.vendor.repository.VendorRepository;
import com.marketgrid.vendor.security.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class VendorService {

    private final VendorRepository vendorRepository;

    public VendorService(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    public Vendor createVendor(Vendor vendor) {
        String role = currentRole();
        if (!"SUPER_ADMIN".equals(role) && !"TENANT_ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can create vendor profiles");
        }

        Long tenantId;
        if ("SUPER_ADMIN".equals(role)) {
            tenantId = vendor.getTenantId();
            if (tenantId == null || tenantId <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid tenant ID is required");
            }
        } else {
            tenantId = requireTenant();
        }

        if (vendor.getEmail() == null || !vendor.getEmail().trim().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid vendor email");
        }
        if (vendor.getVendorName() == null || vendor.getVendorName().trim().isEmpty()
                || vendor.getBusinessName() == null || vendor.getBusinessName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor name and business name are required");
        }

        String email = vendor.getEmail().trim().toLowerCase(Locale.ROOT);
        if (vendorRepository.findByEmailAndTenantId(email, tenantId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor already exists for this tenant");
        }

        vendor.setTenantId(tenantId);
        vendor.setEmail(email);
        vendor.setVendorName(vendor.getVendorName().trim());
        vendor.setBusinessName(vendor.getBusinessName().trim());
        if (vendor.getStatus() == null || vendor.getStatus().isBlank()) {
            vendor.setStatus("ACTIVE");
        }
        return vendorRepository.save(vendor);
    }

    public List<Vendor> getAllVendors() {
        if ("SUPER_ADMIN".equals(currentRole())) {
            return vendorRepository.findAll();
        }
        return vendorRepository.findAllByTenantId(requireTenant());
    }

    public Vendor getVendorById(Long id) {
        if ("SUPER_ADMIN".equals(currentRole())) {
            return vendorRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
        }
        return vendorRepository.findByIdAndTenantId(id, requireTenant())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
    }

    public Vendor getByEmailAndTenant(String email) {
        return vendorRepository.findByEmailAndTenantId(
                        email.trim().toLowerCase(Locale.ROOT), requireTenant())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Vendor profile not found for this account"));
    }

    public Vendor updateVendor(Long id, Vendor updatedVendor) {
        Vendor vendor = getVendorById(id);
        if (!"SUPER_ADMIN".equals(currentRole())
                && !vendor.getTenantId().equals(requireTenant())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found");
        }
        vendor.setVendorName(updatedVendor.getVendorName());
        vendor.setEmail(updatedVendor.getEmail() == null ? vendor.getEmail() : updatedVendor.getEmail().trim().toLowerCase(Locale.ROOT));
        vendor.setPhone(updatedVendor.getPhone());
        vendor.setBusinessName(updatedVendor.getBusinessName());
        vendor.setStatus(updatedVendor.getStatus());
        return vendorRepository.save(vendor);
    }

    public void deleteVendor(Long id) {
        Vendor vendor = getVendorById(id);
        vendorRepository.delete(vendor);
    }

    private Long requireTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant information not found");
        }
        return tenantId;
    }

    private String currentRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return "";
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring(5))
                .findFirst()
                .orElse("");
    }
}
