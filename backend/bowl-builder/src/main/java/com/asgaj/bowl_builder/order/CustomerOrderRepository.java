package com.asgaj.bowl_builder.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByUserIdOrderByIdDesc(Long userId);
    Optional<CustomerOrder> findByIdAndUserId(Long id, Long userId);
    List<CustomerOrder> findAllByOrderByIdDesc();
    List<CustomerOrder> findByStatusOrderByIdAsc(OrderStatus status);
}