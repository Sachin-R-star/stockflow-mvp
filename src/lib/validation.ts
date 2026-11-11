export interface ValidationError {
  field: string;
  message: string;
}

export function validateProductInput(data: {
  name: string;
  sku: string;
  quantity?: string | number;
  costPrice?: string | number | null;
  sellingPrice?: string | number | null;
  lowStockThreshold?: string | number | null;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: "name", message: "Product name is required" });
  } else if (data.name.trim().length > 100) {
    errors.push({ field: "name", message: "Product name cannot exceed 100 characters" });
  }

  if (!data.sku || data.sku.trim().length === 0) {
    errors.push({ field: "sku", message: "SKU is required" });
  } else if (!/^[A-Za-z0-9-_.]+$/.test(data.sku.trim())) {
    errors.push({
      field: "sku",
      message: "SKU can only contain letters, numbers, hyphens, underscores, and dots",
    });
  }

  if (data.quantity !== undefined && data.quantity !== "") {
    const q = Number(data.quantity);
    if (isNaN(q) || !Number.isInteger(q) || q < 0) {
      errors.push({ field: "quantity", message: "Quantity must be a non-negative integer" });
    }
  }

  if (data.costPrice !== undefined && data.costPrice !== null && data.costPrice !== "") {
    const cp = Number(data.costPrice);
    if (isNaN(cp) || cp < 0) {
      errors.push({ field: "costPrice", message: "Cost price must be a non-negative number" });
    }
  }

  if (data.sellingPrice !== undefined && data.sellingPrice !== null && data.sellingPrice !== "") {
    const sp = Number(data.sellingPrice);
    if (isNaN(sp) || sp < 0) {
      errors.push({ field: "sellingPrice", message: "Selling price must be a non-negative number" });
    }
  }

  if (
    data.lowStockThreshold !== undefined &&
    data.lowStockThreshold !== null &&
    data.lowStockThreshold !== ""
  ) {
    const lst = Number(data.lowStockThreshold);
    if (isNaN(lst) || !Number.isInteger(lst) || lst < 0) {
      errors.push({
        field: "lowStockThreshold",
        message: "Low stock threshold must be a non-negative integer",
      });
    }
  }

  return errors;
}

export function validateSettingsInput(data: {
  name?: string;
  defaultLowStockThreshold?: string | number;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.name !== undefined && data.name.trim().length === 0) {
    errors.push({ field: "name", message: "Organization name cannot be empty" });
  }

  if (data.defaultLowStockThreshold !== undefined && data.defaultLowStockThreshold !== "") {
    const thresh = Number(data.defaultLowStockThreshold);
    if (isNaN(thresh) || !Number.isInteger(thresh) || thresh < 0) {
      errors.push({
        field: "defaultLowStockThreshold",
        message: "Default threshold must be a non-negative integer (e.g. 5)",
      });
    }
  }

  return errors;
}
