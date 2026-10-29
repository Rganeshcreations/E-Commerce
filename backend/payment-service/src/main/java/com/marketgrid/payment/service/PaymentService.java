package com.marketgrid.payment.service;

import com.marketgrid.payment.client.OrderClient;
import com.marketgrid.payment.dto.PaymentRequest;
import com.marketgrid.payment.entity.Payment;
import com.marketgrid.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderClient orderClient;

    public PaymentService(
            PaymentRepository paymentRepository,
            OrderClient orderClient) {
        this.paymentRepository = paymentRepository;
        this.orderClient = orderClient;
    }

    @Transactional
    public Payment createPayment(
            PaymentRequest request,
            Long tenantId,
            Long authenticatedUserId,
            String role,
            String authorizationHeader) {

        if (authenticatedUserId == null) {
            throw new IllegalArgumentException("Authentication or tenant information is missing");
        }
        if (!"CUSTOMER".equals(role)) {
            throw new IllegalArgumentException("Only customers can make payments");
        }
        if (request == null || request.getOrderId() == null) {
            throw new IllegalArgumentException("Order ID is required");
        }

        String method = request.getPaymentMethod() == null
                ? ""
                : request.getPaymentMethod().trim().toUpperCase(Locale.ROOT);
        if (!List.of("UPI", "CARD", "COD").contains(method)) {
            throw new IllegalArgumentException("Payment method must be UPI, CARD, or COD");
        }

        OrderClient.OrderResponse order;
        try {
            order = orderClient.getOrder(request.getOrderId(), authorizationHeader);
        } catch (RestClientResponseException ex) {
            throw new IllegalArgumentException(
                    "Order could not be verified. Check that the order belongs to your account and tenant.");
        } catch (Exception ex) {
            throw new IllegalStateException("Order service is unavailable; payment was not recorded");
        }

        if (order == null || order.id() == null) {
            throw new IllegalArgumentException("Order not found");
        }
        if (tenantId != null && !tenantId.equals(order.tenantId())) {
            throw new IllegalArgumentException("Order belongs to a different tenant");
        }
        if (!authenticatedUserId.equals(order.customerId())) {
            throw new IllegalArgumentException("You can only pay for your own orders");
        }
        if (order.totalAmount() == null || order.totalAmount().signum() <= 0) {
            throw new IllegalArgumentException("Order total is invalid");
        }
        if ("CANCELLED".equalsIgnoreCase(order.status())) {
            throw new IllegalArgumentException("Cancelled orders cannot be paid");
        }

        // A retry returns the existing payment instead of charging/recording it twice.
        var existing = paymentRepository.findByOrderIdAndTenantId(order.id(), tenantId);
        if (existing.isPresent()) {
            Payment payment = existing.get();
            if (!authenticatedUserId.equals(payment.getCustomerId())) {
                throw new IllegalArgumentException("Payment belongs to a different customer");
            }
            return payment;
        }

        Payment payment = new Payment();
        payment.setOrderId(order.id());
        payment.setCustomerId(authenticatedUserId);
        payment.setTenantId(tenantId);
        // Never trust a price or customer ID submitted by the browser.
        payment.setAmount(order.totalAmount());
        payment.setPaymentMethod(method);

        if ("COD".equals(method)) {
            payment.setPaymentStatus("PENDING");
        } else {
            // Academic-project mock processor only; this does not charge real money.
            payment.setPaymentStatus("SUCCESS");
            payment.setTransactionId("TXN-" + UUID.randomUUID());
        }

        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments(Long tenantId, Long userId, String role) {
        requireTenant(tenantId);
        if ("CUSTOMER".equals(role)) {
            requireUser(userId);
            return paymentRepository.findAllByTenantIdAndCustomerId(tenantId, userId);
        }
        requireAdmin(role);
        return paymentRepository.findAllByTenantId(tenantId);
    }

    public Payment getPayment(Long id, Long tenantId, Long userId, String role) {
        requireTenant(tenantId);
        Payment payment = paymentRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        assertCanView(payment, userId, role);
        return payment;
    }

    public Payment getPaymentByOrder(Long orderId, Long tenantId, Long userId, String role) {
        requireTenant(tenantId);
        Payment payment = paymentRepository.findByOrderIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        assertCanView(payment, userId, role);
        return payment;
    }

    private void requireTenant(Long tenantId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant information not found");
        }
    }

    private void requireUser(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Authenticated user ID is missing");
        }
    }

    private void requireAdmin(String role) {
        if (!"TENANT_ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
            throw new IllegalArgumentException("You are not allowed to view tenant payments");
        }
    }

    private void assertCanView(Payment payment, Long userId, String role) {
        if ("CUSTOMER".equals(role)) {
            requireUser(userId);
            if (!userId.equals(payment.getCustomerId())) {
                throw new IllegalArgumentException("You can only view your own payments");
            }
            return;
        }
        requireAdmin(role);
    }

}
