package com.eventticket.controller.user;

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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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
            @RequestParam String ten,
            @RequestParam String email,
            @RequestParam String matKhau,
            @RequestParam(required = false) String sdt,
            @RequestParam(required = false) String diaChi,
            Model model,
            HttpSession session
    ) {
        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(email)) {
            model.addAttribute("error", "Email đã tồn tại!");
            return "register";
        }

        // Tạo user mới
        G8_users user = new G8_users();
        user.setTen(ten);
        user.setEmail(email);
        user.setMatKhau(passwordEncoder.encode(matKhau));
        user.setSdt(sdt);
        user.setDiaChi(diaChi);

        // Lưu user
        userRepository.save(user);

        model.addAttribute("success", "Đăng ký thành công! Vui lòng đăng nhập.");
        return "redirect:/login?success";
    }
}
