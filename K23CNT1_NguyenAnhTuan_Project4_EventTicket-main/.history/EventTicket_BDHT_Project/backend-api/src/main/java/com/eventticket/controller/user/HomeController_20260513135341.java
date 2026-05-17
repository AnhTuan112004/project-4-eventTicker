package com.eventticket.controller.user;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;

@Controller
public class HomeController {
    @GetMapping({ "/", "/home" })
    @ResponseBody
    public String index() throws java.io.IOException {
        // Trả thẳng file index.html từ frontend-web/pages/index.html
        String projectRoot = System.getProperty("user.dir");
        String filePath = projectRoot + "\\..\\frontend-web\\pages\\index.html";
        return new String(Files.readAllBytes(Paths.get(filePath)), StandardCharsets.UTF_8);
    }
}
