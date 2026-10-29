package com.marketgrid.product.service;

import com.marketgrid.product.client.VendorClient;
import com.marketgrid.product.entity.Product;
import com.marketgrid.product.repository.ProductRepository;
import com.marketgrid.product.security.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final VendorClient vendorClient;

    public ProductService(ProductRepository productRepository, VendorClient vendorClient) {
        this.productRepository = productRepository;
        this.vendorClient = vendorClient;
    }

    public Product createProduct(Product product, String authorizationHeader) {
        String role = currentRole();
        if (!List.of("SUPER_ADMIN", "TENANT_ADMIN", "VENDOR").contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot create products");
        }
        validateProduct(product);

        VendorClient.VendorResponse vendor;
        if ("VENDOR".equals(role)) {
            vendor = currentVendor(authorizationHeader);
        } else {
            if (product.getVendorId() == null) {
                throw badRequest("Vendor ID is required");
            }
            vendor = getVendor(product.getVendorId(), authorizationHeader);
        }

        Long tenantId = "SUPER_ADMIN".equals(role) ? vendor.tenantId() : requireTenant();
        if (tenantId == null || !tenantId.equals(vendor.tenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vendor does not belong to the selected tenant");
        }

        product.setTenantId(tenantId);
        product.setVendorId(vendor.id());
        product.setProductName(product.getProductName().trim());
        if (product.getStatus() == null || product.getStatus().isBlank()) {
            product.setStatus("ACTIVE");
        }
        return productRepository.save(product);
    }

    public List<Product> getAllProducts(String authorizationHeader) {
        String role = currentRole();

        // Customers can browse active products across all tenants.
        if ("CUSTOMER".equals(role)) {
            return productRepository.findAllByStatusIgnoreCase("ACTIVE");
        }

        if ("SUPER_ADMIN".equals(role)) {
            return productRepository.findAll();
        }

        // Keep tenant isolation for tenant administrators and vendors.
        Long tenantId = requireTenant();

        if ("VENDOR".equals(role)) {
            VendorClient.VendorResponse vendor = currentVendor(authorizationHeader);
            return productRepository.findAllByTenantIdAndVendorId(tenantId, vendor.id());
        }

        return productRepository.findAllByTenantId(tenantId);
    }

    public List<Product> getProductsByVendor(Long vendorId, String authorizationHeader) {
        if (vendorId == null) throw badRequest("Vendor ID is required");
        String role = currentRole();
        VendorClient.VendorResponse vendor;
        if ("VENDOR".equals(role)) {
            vendor = currentVendor(authorizationHeader);
            if (!vendor.id().equals(vendorId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own products");
            }
        } else {
            vendor = getVendor(vendorId, authorizationHeader);
        }

        Long tenantId = "SUPER_ADMIN".equals(role) ? vendor.tenantId() : requireTenant();
        if (!tenantId.equals(vendor.tenantId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found in this tenant");
        }
        return productRepository.findAllByTenantIdAndVendorId(tenantId, vendor.id());
    }

    public Product getProductById(Long id, String authorizationHeader) {
        Product product = findProduct(id);
        if ("VENDOR".equals(currentRole())) {
            assertOwnProduct(product, authorizationHeader);
        }
        return product;
    }

    public Product updateProduct(Long id, Product updatedProduct, String authorizationHeader) {
        String role = currentRole();
        if (!List.of("SUPER_ADMIN", "TENANT_ADMIN", "VENDOR").contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot update products");
        }
        Product existing = findProduct(id);
        if ("VENDOR".equals(role)) {
            assertOwnProduct(existing, authorizationHeader);
        }
        validateProduct(updatedProduct);

        existing.setProductName(updatedProduct.getProductName().trim());
        existing.setDescription(updatedProduct.getDescription());
        existing.setPrice(updatedProduct.getPrice());
        existing.setStockQuantity(updatedProduct.getStockQuantity());
        if (updatedProduct.getStatus() != null && !updatedProduct.getStatus().isBlank()) {
            existing.setStatus(updatedProduct.getStatus());
        }
        // tenantId and vendorId are immutable through product update requests.
        return productRepository.save(existing);
    }

    public void deleteProduct(Long id, String authorizationHeader) {
        String role = currentRole();
        if (!List.of("SUPER_ADMIN", "TENANT_ADMIN", "VENDOR").contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete products");
        }
        Product product = findProduct(id);
        if ("VENDOR".equals(role)) {
            assertOwnProduct(product, authorizationHeader);
        }
        productRepository.delete(product);
    }

    public Product reduceStock(Long id, Integer quantity) {
        if (quantity == null || quantity <= 0) throw badRequest("Quantity must be greater than zero");
        Product product = findProduct(id);
        if (product.getStockQuantity() == null || product.getStockQuantity() < quantity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock for product: " + product.getProductName());
        }
        product.setStockQuantity(product.getStockQuantity() - quantity);
        return productRepository.save(product);
    }

    private Product findProduct(Long id) {
        String role = currentRole();

        if ("SUPER_ADMIN".equals(role)) {
            return productRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        }

        // Customers can view active products without a tenant ID.
        if ("CUSTOMER".equals(role)) {
            return productRepository.findByIdAndStatusIgnoreCase(id, "ACTIVE")
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        }

        // Keep tenant-level restrictions for other roles.
        return productRepository.findByIdAndTenantId(id, requireTenant())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private void assertOwnProduct(Product product, String authorizationHeader) {
        VendorClient.VendorResponse vendor = currentVendor(authorizationHeader);
        if (!vendor.id().equals(product.getVendorId())
                || !vendor.tenantId().equals(product.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own products");
        }
    }

    private VendorClient.VendorResponse currentVendor(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bearer token is required");
        }
        try {
            VendorClient.VendorResponse vendor = vendorClient.getCurrentVendor(authorizationHeader);
            if (vendor == null || vendor.id() == null || !requireTenant().equals(vendor.tenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vendor profile is not linked to this tenant");
            }
            return vendor;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify vendor profile");
        }
    }

    private VendorClient.VendorResponse getVendor(Long vendorId, String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bearer token is required");
        }
        try {
            VendorClient.VendorResponse vendor = vendorClient.getVendor(vendorId, authorizationHeader);
            if (vendor == null || vendor.id() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found");
            }
            if (!"SUPER_ADMIN".equals(currentRole()) && !requireTenant().equals(vendor.tenantId())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found in this tenant");
            }
            if (vendor.status() != null && !"ACTIVE".equalsIgnoreCase(vendor.status())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Products cannot be managed for an inactive vendor");
            }
            return vendor;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify vendor profile");
        }
    }

    private void validateProduct(Product product) {
        if (product == null || product.getProductName() == null || product.getProductName().trim().isEmpty()) {
            throw badRequest("Product name is required");
        }
        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw badRequest("Product price cannot be negative");
        }
        if (product.getStockQuantity() == null || product.getStockQuantity() < 0) {
            throw badRequest("Stock quantity cannot be negative");
        }
    }

    private Long requireTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant information not found");
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

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
