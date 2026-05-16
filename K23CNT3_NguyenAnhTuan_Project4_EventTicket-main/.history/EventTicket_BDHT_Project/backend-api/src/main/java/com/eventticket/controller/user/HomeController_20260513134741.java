package com.eventticket.controller.user;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping({ "/", "/home" })
    public String index() {

        return "index";
    }
}
