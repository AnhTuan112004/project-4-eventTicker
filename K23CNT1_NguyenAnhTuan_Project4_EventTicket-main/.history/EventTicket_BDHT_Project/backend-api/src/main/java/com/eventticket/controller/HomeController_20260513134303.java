package com.eventticket.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class HomeController {
    @GetMapping({ "/", "/home" })
    @ResponseBody
    public String index() {

        return "index";
    }
}
