package com.eventticket.controller.user;

import com.eventticket.entity.G8_users;
import com.eventticket.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vtd/public/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public G8_users register(@RequestBody RegisterRequest request) {
        return authService.registerUser(request.getEmail(), request.getPassword(), request.getFullName(),
                request.getPhoneNumber());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            long remainingSeconds = authService.requestPasswordReset(request.getEmail());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "OTP đã được gửi đến email của bạn");
            response.put("otpExpiry", remainingSeconds); // Seconds remaining
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            authService.verifyOtp(request.getEmail(), request.getOtp());
            Map<String, String> response = new HashMap<>();
            response.put("message", "OTP xác thực thành công! Bạn có thể đặt lại mật khẩu.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getEmail(), request.getNewPassword());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Mật khẩu đã được đặt lại thành công!");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi hệ thống: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/forgot-password")
    public void forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.getEmail());
    }

    @PostMapping("/reset-password")
    public void resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getResetToken(), request.getNewPassword());
    }

    public static class RegisterRequest {
        private String email;
        private String password;
        private String fullName;
        private String phoneNumber;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class ForgotPasswordRequest {
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class ResetPasswordRequest {
        private String resetToken;
        private String newPassword;

        public String getResetToken() {
            return resetToken;
        }

        public void setResetToken(String resetToken) {
            this.resetToken = resetToken;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }
}
