package dev.darenel.recruiting.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(int status, String error, String message, List<FieldErrorItem> fieldErrors) {

    public ApiError(int status, String error, String message) {
        this(status, error, message, null);
    }
}
