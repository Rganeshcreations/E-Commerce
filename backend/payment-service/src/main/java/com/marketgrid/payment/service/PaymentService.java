package com.marketgrid.payment.service;

import com.marketgrid.payment.dto.PaymentRequest;
import com.marketgrid.payment.entity.Payment;
import com.marketgrid.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Payment createPayment(PaymentRequest request, Long tenantId) {

        if (tenantId == null) {
            throw new RuntimeException("Tenant information not found");
        }

        if (request.getOrderId() == null) {
            throw new RuntimeException("Order ID is required");
        }

        if (request.getCustomerId() == null) {
            throw new RuntimeException("Customer ID is required");
        }

        if (request.getAmount() == null ||
                request.getAmount().signum() <= 0) {
            throw new RuntimeException("Amount must be greater than zero");
        }

        if (request.getPaymentMethod() == null ||
                request.getPaymentMethod().isBlank()) {
            throw new RuntimeException("Payment method is required");
        }

        if (paymentRepository
                .findByOrderIdAndTenantId(request.getOrderId(), tenantId)
                .isPresent()) {
            throw new RuntimeException(
                    "Payment already exists for this order");
        }

        Payment payment = new Payment();

        payment.setOrderId(request.getOrderId());
        payment.setCustomerId(request.getCustomerId());
        payment.setTenantId(tenantId);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());

        // Academic-project mock payment processing
        payment.setPaymentStatus("SUCCESS");
        payment.setTransactionId(
                "TXN-" + UUID.randomUUID()
        );

        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments(Long tenantId) {

        if (tenantId == null) {
            throw new RuntimeException("Tenant information not found");
        }

        return paymentRepository.findAllByTenantId(tenantId);
    }

    public Payment getPayment(Long id, Long tenantId) {

        return paymentRepository
                .findByIdAndTenantId(id, tenantId)
                .orElseThrow(() ->
                        new RuntimeException("Payment not found"));
    }

    public Payment getPaymentByOrder(Long orderId, Long tenantId) {

        return paymentRepository
                .findByOrderIdAndTenantId(orderId, tenantId)
                .orElseThrow(() ->
                        new RuntimeException("Payment not found"));
    }
}
