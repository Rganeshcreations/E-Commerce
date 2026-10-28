
package com.marketgrid.user.controller;

import com.marketgrid.user.dto.LoginRequest;
import com.marketgrid.user.dto.LoginResponse;
import com.marketgrid.user.dto.RegisterRequest;
import com.marketgrid.user.dto.UserResponse;
import com.marketgrid.user.entity.User;
import com.marketgrid.user.service.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @RequestBody RegisterRequest request) {

        User createdUser = authService.register(request);

        return ResponseEntity.ok(
                new UserResponse(createdUser)
        );
    }

    @PostMapping("/vendor-application")
    public ResponseEntity<UserResponse> registerPendingVendor(@RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(new UserResponse(authService.registerPendingVendor(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request) {

        return ResponseEntity.ok(
                authService.login(request)
        );
    }
}
