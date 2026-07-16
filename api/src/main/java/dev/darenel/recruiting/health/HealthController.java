package dev.darenel.recruiting.health;

import dev.darenel.recruiting.web.ApiPaths;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.V1 + "/health")
public class HealthController {

    @GetMapping
    public Map<String, String> show() {
        return Map.of("status", "ok");
    }
}
