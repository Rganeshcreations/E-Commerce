package com.marketgrid.order.service;

import com.marketgrid.order.client.ProductClient;
import com.marketgrid.order.client.ProductClient.ProductResponse;
import com.marketgrid.order.client.VendorClient;
import com.marketgrid.order.client.VendorClient.VendorResponse;
import com.marketgrid.order.entity.Order;
import com.marketgrid.order.entity.OrderItem;
import com.marketgrid.order.repository.OrderRepository;
import com.marketgrid.order.security.TenantContext;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;
    private final VendorClient vendorClient;

    public OrderService(
            OrderRepository orderRepository,
            ProductClient productClient,
            VendorClient vendorClient) {

        this.orderRepository = orderRepository;
        this.productClient = productClient;
        this.vendorClient = vendorClient;
    }

    public Order createOrder(
            Order order,
            String token) {

        Long tenantId = requireTenant();

        order.setTenantId(tenantId);
        order.setStatus("PLACED");

        BigDecimal total = BigDecimal.ZERO;

        if (order.getItems() == null
                || order.getItems().isEmpty()) {

            throw new RuntimeException(
                    "Order must contain at least one item"
            );
        }

        for (OrderItem item : order.getItems()) {

            if (item.getQuantity() == null
                    || item.getQuantity() <= 0) {

                throw new RuntimeException(
                        "Quantity must be greater than zero"
                );
            }

            ProductResponse product =
                    productClient.getProduct(
                            item.getProductId(),
                            token
                    );

            if (product == null) {
                throw new RuntimeException(
                        "Product not found: "
                                + item.getProductId()
                );
            }

            if (!tenantId.equals(product.tenantId())) {
                throw new RuntimeException(
                        "Product does not belong to current tenant"
                );
            }

            if (!product.vendorId().equals(item.getVendorId())) {
                throw new RuntimeException(
                        "Product does not belong to specified vendor"
                );
            }

            if (product.stockQuantity()
                    < item.getQuantity()) {

                throw new RuntimeException(
                        "Insufficient stock for product: "
                                + product.productName()
                );
            }

            item.setPrice(product.price());

            total = total.add(
                    product.price().multiply(
                            BigDecimal.valueOf(
                                    item.getQuantity()
                            )
                    )
            );
        }

        for (OrderItem item : order.getItems()) {

            productClient.reduceStock(
                    item.getProductId(),
                    item.getQuantity(),
                    token
            );
        }

        order.setTotalAmount(total);

        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {

        Long tenantId = requireTenant();

        Authentication authentication = currentAuthentication();

        String role = currentRole();

        if ("VENDOR".equals(role)) {

            VendorResponse vendor = currentVendor();

            if (!tenantId.equals(vendor.tenantId())) {
                throw new RuntimeException(
                        "Vendor does not belong to current tenant"
                );
            }

            List<Order> orders =
                    orderRepository
                            .findAllByTenantIdAndVendorId(
                                    tenantId,
                                    vendor.id()
                            );

            orders.forEach(order ->
                    order.setItems(
                            order.getItems()
                                    .stream()
                                    .filter(item ->
                                            vendor.id().equals(
                                                    item.getVendorId()
                                            )
                                    )
                                    .toList()
                    )
            );

            return orders;
        }

        if ("CUSTOMER".equals(role)) {

            Long customerId = extractUserId(authentication);

            return orderRepository
                    .findAllByTenantIdAndCustomerId(
                            tenantId,
                            customerId
                    );
        }

        return orderRepository.findAllByTenantId(tenantId);
    }

    public Order getOrder(Long id) {

        Long tenantId = requireTenant();

        Authentication authentication = currentAuthentication();

        String role = currentRole();

        Order order = orderRepository
                .findByIdAndTenantId(id, tenantId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Order not found"
                        ));

        if ("CUSTOMER".equals(role)) {

            Long customerId = extractUserId(authentication);

            if (!customerId.equals(order.getCustomerId())) {
                throw new RuntimeException(
                        "You can only view your own orders"
                );
            }
        }

        if ("VENDOR".equals(role)) {

            VendorResponse vendor = currentVendor();

            boolean containsVendor =
                    order.getItems()
                            .stream()
                            .anyMatch(item ->
                                    vendor.id().equals(
                                            item.getVendorId()
                                    )
                            );

            if (!containsVendor) {
                throw new RuntimeException(
                        "Order does not contain products from your store"
                );
            }

            order.setItems(
                    order.getItems()
                            .stream()
                            .filter(item ->
                                    vendor.id().equals(
                                            item.getVendorId()
                                    )
                            )
                            .toList()
            );
        }

        return order;
    }

    public Order updateStatus(
            Long id,
            String status) {

        if (status == null || status.isBlank()) {
            throw new RuntimeException(
                    "Order status is required"
            );
        }

        Order order = getOrder(id);

        if ("CUSTOMER".equals(currentRole())) {
            throw new RuntimeException(
                    "Customers cannot update order status"
            );
        }

        order.setStatus(status.toUpperCase());

        return orderRepository.save(order);
    }

    private Long requireTenant() {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException(
                    "Tenant information not found"
            );
        }

        return tenantId;
    }

    private Authentication currentAuthentication() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "Authentication information not found"
            );
        }

        return authentication;
    }

    private String currentRole() {

        return currentAuthentication()
                .getAuthorities()
                .stream()
                .findFirst()
                .map(a ->
                        a.getAuthority()
                                .replace("ROLE_", "")
                )
                .orElse("");
    }

    private Long extractUserId(
            Authentication authentication) {

        Object credentials =
                authentication.getCredentials();

        if (!(credentials instanceof String token)
                || token.isBlank()) {

            throw new RuntimeException(
                    "JWT token not available"
            );
        }

        io.jsonwebtoken.Claims claims =
                io.jsonwebtoken.Jwts.parser()
                        .verifyWith(
                                io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                                        "MarketGridSuperSecretKeyForJWT2026SecureKey123456"
                                                .getBytes(
                                                        java.nio.charset.StandardCharsets.UTF_8
                                                )
                                )
                        )
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

        Number userId =
                claims.get("userId", Number.class);

        if (userId == null) {
            throw new RuntimeException(
                    "User ID not available in JWT"
            );
        }

        return userId.longValue();
    }

    private VendorResponse currentVendor() {

        Authentication authentication =
                currentAuthentication();

        Object credentials =
                authentication.getCredentials();

        if (!(credentials instanceof String token)
                || token.isBlank()) {

            throw new RuntimeException(
                    "JWT token not available"
            );
        }

        return vendorClient.getVendorByEmail(
                authentication.getName(),
                "Bearer " + token
        );
    }
}