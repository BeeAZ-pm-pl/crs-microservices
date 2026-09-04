package vn.edu.crs.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApiKeyCreateRequestDTO {

    @NotBlank(message = "Tên đối tác không được để trống")
    private String ownerName;

    @NotBlank(message = "Danh sách scope không được để trống")
    private String scopes;

    private Integer validDays;
}
