package com.eventticket.controller.user;

import com.eventticket.entity.G8_users;
import com.eventticket.service.AuthService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.security.Principal;

@Controller
public class HomeController {

    private final AuthService authService;

    public HomeController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * GUEST: Trang chủ - Trả về trang index.html từ frontend
     */
    @GetMapping({ "/", "/home", "/index" })
    @ResponseBody
    public String index() throws java.io.IOException {
        String projectRoot = System.getProperty("user.dir");
        String filePath = projectRoot + "\\..\\frontend-web\\pages\\index.html";
        return new String(Files.readAllBytes(Paths.get(filePath)), StandardCharsets.UTF_8);
    }

    /**
     * GUEST: Hiển thị trang login
     */
    @GetMapping("/login")
    public String login(Model model, Principal principal) {
        if (principal != null) {
            return "redirect:/";
        }
        return "login";
    }

    /**
     * GUEST: Hiển thị trang register
     */
    @GetMapping("/register")
    public String register(Model model, Principal principal) {
        if (principal != null) {
            return "redirect:/";
        }
        return "register";
    }

    /**
     * GUEST: Đăng ký tài khoản mới qua form
     */
    @PostMapping("/register/save")
    public String saveRegister(
            @RequestParam String fullName,
            @RequestParam String email,
            @RequestParam String passwordHash,
            @RequestParam(required = false) String phoneNumber,
            Model model) {
        try {
            // Gọi AuthService để xử lý đăng ký
            G8_users user = authService.registerUser(email, passwordHash, fullName, phoneNumber);

            model.addAttribute("success", "Đăng ký thành công! Vui lòng đăng nhập.");
            return "redirect:/login?success";
        } catch (RuntimeException e) {
            model.addAttribute("error", e.getMessage());
            return "register";
        }
    }
}
