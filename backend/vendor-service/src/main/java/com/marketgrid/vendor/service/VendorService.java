package com.marketgrid.vendor.service;

import com.marketgrid.vendor.entity.Vendor;
import com.marketgrid.vendor.repository.VendorRepository;
import com.marketgrid.vendor.security.TenantContext;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VendorService {

    private final VendorRepository vendorRepository;

    public VendorService(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    public Vendor createVendor(Vendor vendor) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException("Tenant information not found");
        }

        if (vendorRepository.findByEmailAndTenantId(
                vendor.getEmail(), tenantId).isPresent()) {

            throw new RuntimeException(
                    "Vendor already exists for this tenant"
            );
        }

        vendor.setTenantId(tenantId);

        return vendorRepository.save(vendor);
    }

    public List<Vendor> getAllVendors() {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException("Tenant information not found");
        }

        return vendorRepository.findAllByTenantId(tenantId);
    }

    public Vendor getVendorById(Long id) {

        Long tenantId = TenantContext.getTenantId();

        return vendorRepository
                .findByIdAndTenantId(id, tenantId)
                .orElseThrow(() ->
                        new RuntimeException("Vendor not found"));
    }

    public Vendor updateVendor(Long id, Vendor updatedVendor) {

        Long tenantId = TenantContext.getTenantId();

        Vendor vendor = vendorRepository
                .findByIdAndTenantId(id, tenantId)
                .orElseThrow(() ->
                        new RuntimeException("Vendor not found"));

        vendor.setVendorName(updatedVendor.getVendorName());
        vendor.setEmail(updatedVendor.getEmail());
        vendor.setPhone(updatedVendor.getPhone());
        vendor.setBusinessName(updatedVendor.getBusinessName());
        vendor.setStatus(updatedVendor.getStatus());

        return vendorRepository.save(vendor);
    }

    public void deleteVendor(Long id) {

        Long tenantId = TenantContext.getTenantId();

        Vendor vendor = vendorRepository
                .findByIdAndTenantId(id, tenantId)
                .orElseThrow(() ->
                        new RuntimeException("Vendor not found"));

        vendorRepository.delete(vendor);
    }
}
