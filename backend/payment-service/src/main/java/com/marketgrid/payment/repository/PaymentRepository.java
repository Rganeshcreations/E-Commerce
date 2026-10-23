package com.marketgrid.payment.repository;

import com.marketgrid.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByTenantId(Long tenantId);

    Optional<Payment> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Payment> findByOrderIdAndTenantId(Long orderId, Long tenantId);
}
