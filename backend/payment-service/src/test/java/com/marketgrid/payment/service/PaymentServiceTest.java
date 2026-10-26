package com.marketgrid.payment.service;

import com.marketgrid.payment.client.OrderClient;
import com.marketgrid.payment.dto.PaymentRequest;
import com.marketgrid.payment.entity.Payment;
import com.marketgrid.payment.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderClient orderClient;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void paymentUsesServerOrderTotalAndAuthenticatedCustomer() {
        when(orderClient.getOrder(55L, "Bearer test-token")).thenReturn(
                new OrderClient.OrderResponse(
                        55L, 4L, 12L, new BigDecimal("125.50"), "PLACED"
                )
        );
        when(paymentRepository.findByOrderIdAndTenantId(55L, 4L))
                .thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequest request = request(55L, "UPI");
        Payment payment = paymentService.createPayment(
                request, 4L, 12L, "CUSTOMER", "Bearer test-token"
        );

        assertEquals(55L, payment.getOrderId());
        assertEquals(12L, payment.getCustomerId());
        assertEquals(4L, payment.getTenantId());
        assertEquals(new BigDecimal("125.50"), payment.getAmount());
        assertEquals("UPI", payment.getPaymentMethod());
        assertEquals("SUCCESS", payment.getPaymentStatus());
        assertNotNull(payment.getTransactionId());
        verify(paymentRepository).save(payment);
    }

    @Test
    void rejectsPaymentForAnotherCustomerOrder() {
        when(orderClient.getOrder(55L, "Bearer test-token")).thenReturn(
                new OrderClient.OrderResponse(
                        55L, 4L, 99L, new BigDecimal("125.50"), "PLACED"
                )
        );

        assertThrows(IllegalArgumentException.class, () ->
                paymentService.createPayment(
                        request(55L, "UPI"), 4L, 12L,
                        "CUSTOMER", "Bearer test-token"
                )
        );
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void cashOnDeliveryIsPendingAndDoesNotClaimPaymentSuccess() {
        when(orderClient.getOrder(55L, "Bearer test-token")).thenReturn(
                new OrderClient.OrderResponse(
                        55L, 4L, 12L, new BigDecimal("125.50"), "PLACED"
                )
        );
        when(paymentRepository.findByOrderIdAndTenantId(55L, 4L))
                .thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.createPayment(
                request(55L, "COD"), 4L, 12L,
                "CUSTOMER", "Bearer test-token"
        );

        assertEquals("PENDING", payment.getPaymentStatus());
        assertNull(payment.getTransactionId());
    }

    private PaymentRequest request(Long orderId, String method) {
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(orderId);
        request.setPaymentMethod(method);
        return request;
    }
}
