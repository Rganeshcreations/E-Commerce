package com.marketgrid.payment.controller;

import com.marketgrid.payment.exception.PaymentNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PaymentNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handlePaymentNotFound(
            PaymentNotFoundException ex) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("error", "Not Found");
        response.put("status", 404);
        response.put("timestamp", LocalDateTime.now());
        response.put("message", ex.getMessage());

        return response;
    }

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleRuntimeException(
            RuntimeException ex) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("error", "Bad Request");
        response.put("status", 400);
        response.put("timestamp", LocalDateTime.now());
        response.put("message", ex.getMessage());

        return response;
    }
}
