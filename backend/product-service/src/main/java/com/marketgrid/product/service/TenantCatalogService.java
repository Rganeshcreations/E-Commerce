package com.marketgrid.product.service;

import com.marketgrid.product.client.VendorClient;
import com.marketgrid.product.entity.Product;
import com.marketgrid.product.entity.TenantCatalogProduct;
import com.marketgrid.product.repository.ProductRepository;
import com.marketgrid.product.repository.TenantCatalogRepository;
import com.marketgrid.product.security.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TenantCatalogService {
    private final TenantCatalogRepository catalogRepository;
    private final ProductRepository productRepository;
    private final VendorClient vendorClient;

    public TenantCatalogService(
            TenantCatalogRepository catalogRepository,
            ProductRepository productRepository,
            VendorClient vendorClient) {
        this.catalogRepository = catalogRepository;
        this.productRepository = productRepository;
        this.vendorClient = vendorClient;
    }

    public List<TenantCatalogProduct> listCatalog(String authorizationHeader) {
        String role = role();
        Long tenantId;
        if ("VENDOR".equals(role)) {
            VendorClient.VendorResponse vendor = currentVendor(authorizationHeader);
            Long contextTenantId = requiredTenantContext();
            if (!contextTenantId.equals(vendor.tenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Vendor does not belong to the current tenant");
            }
            tenantId = vendor.tenantId();
        } else {
            tenantId = tenantIdForCurrentUser();
        }

        if ("TENANT_ADMIN".equals(role)) {
            return catalogRepository.findAllByTenantIdOrderByIdDesc(tenantId);
        }
        if ("VENDOR".equals(role)) {
            return catalogRepository.findAllByTenantIdAndStatusIgnoreCaseOrderByIdDesc(
                    tenantId, "ACTIVE");
        }
        if ("SUPER_ADMIN".equals(role)) {
            // Super admins must still be scoped to the explicitly selected tenant.
            return catalogRepository.findAllByTenantIdOrderByIdDesc(tenantId);
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Catalog access denied");
    }

    public TenantCatalogProduct createCatalogProduct(TenantCatalogProduct item) {
        requireRole("TENANT_ADMIN");
        if (item == null || item.getProductName() == null
                || item.getProductName().isBlank()) {
            throw badRequest("Product name is required");
        }
        if (item.getWholesalePrice() == null
                || item.getWholesalePrice().compareTo(BigDecimal.ZERO) < 0) {
            throw badRequest("Wholesale price must be zero or greater");
        }
        if (item.getAvailableQuantity() == null || item.getAvailableQuantity() < 0) {
            throw badRequest("Available quantity must be zero or greater");
        }

        item.setTenantId(requiredTenantContext());
        item.setProductName(item.getProductName().trim());
        item.setStatus("ACTIVE");
        return catalogRepository.save(item);
    }

    @Transactional
    public Product allocateToVendor(Long catalogId, AllocationRequest request, String authorizationHeader) {
        requireRole("VENDOR");
        if (request == null || request.quantity() == null || request.quantity() <= 0) {
            throw badRequest("Allocation quantity must be greater than zero");
        }
        if (request.sellingPrice() == null
                || request.sellingPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw badRequest("Selling price must be zero or greater");
        }

        VendorClient.VendorResponse vendor = currentVendor(authorizationHeader);
        Long tenantContextId = requiredTenantContext();
        if (!tenantContextId.equals(vendor.tenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vendor does not belong to the current tenant");
        }
        Long tenantId = vendor.tenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vendor is not linked to a tenant");
        }

        TenantCatalogProduct source = catalogRepository.findForAllocation(catalogId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Catalog product not found for this tenant"));

        if (!"ACTIVE".equalsIgnoreCase(source.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This catalog product is not available");
        }
        if (source.getAvailableQuantity() < request.quantity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Requested quantity exceeds available tenant stock");
        }

        // Reduce tenant availability while holding a database row lock.
        source.setAvailableQuantity(source.getAvailableQuantity() - request.quantity());
        catalogRepository.save(source);

        Product listing = new Product();
        listing.setTenantId(tenantId);
        listing.setVendorId(vendor.id());
        listing.setProductName(source.getProductName());
        listing.setDescription(source.getDescription());
        listing.setPrice(request.sellingPrice());
        listing.setStockQuantity(request.quantity());
        listing.setStatus("ACTIVE");

        return productRepository.save(listing);
    }

    private VendorClient.VendorResponse currentVendor(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Bearer token is required");
        }
        try {
            VendorClient.VendorResponse vendor =
                    vendorClient.getCurrentVendor(authorizationHeader);
            if (vendor == null || vendor.id() == null || vendor.tenantId() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Vendor profile is not linked to a tenant");
            }
            return vendor;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Unable to verify vendor profile");
        }
    }

    private Long tenantIdForCurrentUser() {
        String role = role();
        if ("SUPER_ADMIN".equals(role)) {
            Long tenantId = TenantContext.getTenantId();
            if (tenantId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Select a tenant to view its catalog");
            }
            return tenantId;
        }
        return requiredTenantContext();
    }

    private Long requiredTenantContext() {
        Long id = TenantContext.getTenantId();
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Tenant information not found");
        }
        return id;
    }

    private String role() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return "";
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst().orElse("");
    }

    private void requireRole(String expected) {
        if (!expected.equals(role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This operation requires role " + expected);
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public record AllocationRequest(Integer quantity, BigDecimal sellingPrice) {}
}
