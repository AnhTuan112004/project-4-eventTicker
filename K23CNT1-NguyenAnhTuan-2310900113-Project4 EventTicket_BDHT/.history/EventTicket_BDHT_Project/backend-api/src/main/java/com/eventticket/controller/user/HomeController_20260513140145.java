package com.eventticket.controller.user;

import com.eventticket.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.eventticket.entity.G8_users;
import com.eventticket.repository.UserRepository;

import jakarta.servlet.http.HttpSession;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.security.Principal;

@Controller
public class HomeController {

    private final EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    HomeController(EmailService emailService) {
        this.emailService = emailService;
    }

    // ================= HOME =================
    @GetMapping({ "/", "/home" })
    @ResponseBody
    public String index() throws java.io.IOException {
        // Trả thẳng file index.html từ frontend-web/pages/index.html
        String projectRoot = System.getProperty("user.dir");
        String filePath = projectRoot + "\\..\\frontend-web\\pages\\index.html";
        return new String(Files.readAllBytes(Paths.get(filePath)), StandardCharsets.UTF_8);
    }

    // ================= LOGIN =================
    @GetMapping("/login")
    public String login(Model model, Principal principal, HttpSession session) {
        // Nếu đã đăng nhập thì redirect về home
        if (principal != null) {
            return "redirect:/";
        }
        return "login";
    }

    // ================= REGISTER =================
    @GetMapping("/register")
    public String register(Model model, Principal principal, HttpSession session) {
        // Nếu đã đăng nhập thì redirect về home
        if (principal != null) {
            return "redirect:/";
        }
        return "register";
    }

    @PostMapping("/register/save")
    public String saveRegister(
            @RequestParam String fullName,
            @RequestParam String email,
            @RequestParam String passwordHash,
            @RequestParam(required = false) String phoneNumber,
            Model model) {

        // Kiểm tra email đã tồn tại
        if (userRepository.findByEmail(email).isPresent()) {
            model.addAttribute("error", "Email đã tồn tại!");
            return "register";
        }

        // Tạo user mới
        G8_users user = new G8_users();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(passwordHash));
        user.setPhoneNumber(phoneNumber);
        user.setRole("USER"); // Mặc định là USER
        user.setIsVerified(false);
        user.setIsActive(true);

        // Lưu user
        userRepository.save(user);

        model.addAttribute("success", "Đăng ký thành công! Vui lòng đăng nhập.");
        return "redirect:/login?success";
    }
}
