package com.fitness.userservice.controller;

import com.fitness.userservice.dto.RegisterRequest;
import com.fitness.userservice.dto.UserResponse;
import com.fitness.userservice.services.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1")
public class UserController {

    private UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable String userId){

        return new ResponseEntity<>(userService.getUserProfile(userId),HttpStatus.FOUND);

    }
    @PostMapping("/register")
    public ResponseEntity<UserResponse> registeruser(@Valid @RequestBody RegisterRequest request){
    return new ResponseEntity<>(userService.register(request), HttpStatus.CREATED);
    }
    @GetMapping("/{userId}/validate")
    public ResponseEntity<Boolean> validateUser(@PathVariable String userId){
        return new ResponseEntity<>(userService.existsByUserId(userId),HttpStatus.FOUND);

    }
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getCurrentUserProfile(
            @RequestHeader("X-User-ID") String userId) {

        return ResponseEntity.ok(userService.getUserProfileByKeycloakId(userId));
    }
}
