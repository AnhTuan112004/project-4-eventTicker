package com.eventticket.service;

import com.eventticket.entity.G8_users;
import com.eventticket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    /**
     * GUEST: Đăng ký tài khoản người dùng mới
     */
    public G8_users registerUser(String email, String password, String fullName, String phoneNumber) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email đã tồn tại trong hệ thống");
        }

        G8_users user = new G8_users();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setPhoneNumber(phoneNumber);
        user.setRole("USER");
        user.setIsVerified(false);
        user.setIsActive(true);

        return userRepository.save(user);
    }

    /**
     * GUEST: Đăng nhập hệ thống
     */
    public G8_users loginUser(String email, String password) {
        Optional<G8_users> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Email không tồn tại");
        }

        G8_users user = userOpt.get();

        if (!user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu không chính xác");
        }

        return user;
    }

    /**
     * GUEST: Quên mật khẩu (Gửi OTP qua email)
     */
    public void requestPasswordReset(String email) {
        Optional<G8_users> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Email không tồn tại trong hệ thống");
        }

        G8_users user = userOpt.get();
        String otp = generateOTP();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10);

        user.setOtpCode(otp);
        user.setOtpExpiry(expiryTime);
        user.setIsOtpVerified(false);
        userRepository.save(user);

        // Gửi email với OTP
        emailService.sendOtpEmail(email, otp);
    }

    /**
     * GUEST: Xác thực OTP
     */
    public void verifyOtp(String email, String otp) {
        Optional<G8_users> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Email không tồn tại trong hệ thống");
        }

        G8_users user = userOpt.get();

        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new RuntimeException("OTP chưa được gửi. Vui lòng yêu cầu OTP trước.");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP đã hết hạn. Vui lòng yêu cầu OTP mới.");
        }

        if (!user.getOtpCode().equals(otp)) {
            throw new RuntimeException("OTP không chính xác");
        }

        user.setIsOtpVerified(true);
        userRepository.save(user);
    }

    /**
     * MEMBER: Đặt lại mật khẩu mới (Reset Password with OTP verification)
     */
    public void resetPassword(String email, String newPassword) {
        Optional<G8_users> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Email không tồn tại trong hệ thống");
        }

        G8_users user = userOpt.get();

        if (!Boolean.TRUE.equals(user.getIsOtpVerified())) {
            throw new RuntimeException("OTP chưa được xác thực. Vui lòng verify OTP trước.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setIsOtpVerified(false);
        userRepository.save(user);

        // Gửi email xác nhận đổi mật khẩu
        emailService.sendPasswordChangeConfirmation(user.getEmail());
    }

    /**
     * MEMBER: Đổi mật khẩu tài khoản (Khi đang đăng nhập)
     */
    public void changePassword(Integer userId, String oldPassword, String newPassword) {
        G8_users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác");
        }

        // Gửi email xác nhận đổi mật khẩu
        emailService.sendPasswordChangeConfirmation(user.getEmail());

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
