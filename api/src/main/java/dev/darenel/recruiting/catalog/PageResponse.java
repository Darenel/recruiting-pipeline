package dev.darenel.recruiting.catalog;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(name = "PageResponse")
public record PageResponse<T>(
        List<T> data,
        long total,
        int page,
        int limit) {
}
