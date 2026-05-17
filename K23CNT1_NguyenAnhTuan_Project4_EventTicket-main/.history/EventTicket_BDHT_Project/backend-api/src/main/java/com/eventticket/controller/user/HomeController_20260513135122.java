package com.eventticket.controller.user;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping({ "/", "/home" })
    public String index() throws java.io.IOException {
        // Trả thẳng file index.html từ frontend-web/pages/index.html
        // thay vì render view templates/index.html.
        String filePath = "frontend-web/pages/index.html";
        return new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(filePath)),
                java.nio.charset.StandardCharsets.UTF_8);
    }
}
