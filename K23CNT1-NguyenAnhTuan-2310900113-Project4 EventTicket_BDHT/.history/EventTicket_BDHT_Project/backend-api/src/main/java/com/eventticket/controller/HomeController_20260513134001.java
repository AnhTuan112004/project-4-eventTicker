package com.eventticket.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Controller
public class HomeController {

    /**
     * Server-side controller chỉ để trỏ tới file frontend-web/index.html.
     *
     * Lưu ý: Vì frontend-web không nằm trong classpath static, controller sẽ đọc
     * trực tiếp
     * file từ project folder (đường dẫn tương đối theo repo).
     */
    @GetMapping({ "/", "/home" })
    @ResponseBody
    public String index() throws IOException {
        // Project root: c:/IT/prj4/K23CNT3_VuTienDuc_Project4_EventTicket
        // File: EventTicket_BDHT_Project/frontend-web/index.html
        Path indexPath = Path.of(
                "EventTicket_BDHT_Project/frontend-web/index.html");

        return Files.readString(indexPath, StandardCharsets.UTF_8);
    }
}
