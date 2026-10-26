package com.marketgrid.product.service;

import com.marketgrid.product.client.VendorClient;
import com.marketgrid.product.entity.Product;
import com.marketgrid.product.repository.ProductRepository;
import com.marketgrid.product.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private VendorClient vendorClient;
    @InjectMocks private ProductService productService;

    @BeforeEach
    void setUpVendor() {
        TenantContext.setTenantId(3L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "vendor@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_VENDOR"))
                )
        );
    }

    @AfterEach
    void clearSecurityContext() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void vendorProductListIsScopedToAuthenticatedVendor() {
        when(vendorClient.getCurrentVendor("Bearer test-token"))
                .thenReturn(new VendorClient.VendorResponse(11L, 3L, "vendor@example.com", "ACTIVE"));
        when(productRepository.findAllByTenantIdAndVendorId(3L, 11L))
                .thenReturn(List.of(new Product()));

        List<Product> result = productService.getAllProducts("Bearer test-token");

        assertEquals(1, result.size());
        verify(productRepository).findAllByTenantIdAndVendorId(3L, 11L);
        verify(productRepository, never()).findAllByTenantId(3L);
    }

    @Test
    void vendorCannotRequestAnotherVendorsProducts() {
        when(vendorClient.getCurrentVendor("Bearer test-token"))
                .thenReturn(new VendorClient.VendorResponse(11L, 3L, "vendor@example.com", "ACTIVE"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> productService.getProductsByVendor(12L, "Bearer test-token")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(productRepository, never()).findAllByTenantIdAndVendorId(anyLong(), anyLong());
    }
}
