const MAX_FILTERS = 5;
const VALID_LOGIC = new Set(["AND", "OR"]);

function validateFilterPlan(plan, metricRegistry, segmentRegistry = []) {
  const errors = [];
  const registryByField = buildRegistryMap(metricRegistry);
  const segmentNames = new Set(segmentRegistry.map((s) => s.segment_name));

  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return { isValid: false, errors: ["Filter plan must be a JSON object"] };
  }

  // Check for Segment Fallback first
  if (plan.segment_name) {
    if (!segmentNames.has(plan.segment_name)) {
      errors.push(`segment_name is not in segment_registry: ${plan.segment_name}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      plan: {
        logic: "SEGMENT",
        segment_name: plan.segment_name,
        reasoning:
          typeof plan.reasoning === "string" ? plan.reasoning.slice(0, 1000) : "",
      },
    };
  }

  // Standard Filter Plan Validation
  const logic = normalizeLogic(plan.logic);
  if (!VALID_LOGIC.has(logic)) {
    errors.push("logic must be AND or OR");
  }

  if (!Array.isArray(plan.filters)) {
    errors.push("filters must be an array");
  } else if (plan.filters.length === 0) {
    errors.push("filters must include at least one filter");
  } else if (plan.filters.length > MAX_FILTERS) {
    errors.push(`filters must include no more than ${MAX_FILTERS} filters`);
  }

  const filters = Array.isArray(plan.filters)
    ? plan.filters.map((filter, index) =>
        normalizeFilter(filter, index, registryByField, errors)
      )
    : [];

  return {
    isValid: errors.length === 0,
    errors,
    plan: {
      logic,
      filters: filters.filter(Boolean),
      reasoning:
        typeof plan.reasoning === "string" ? plan.reasoning.slice(0, 1000) : "",
    },
  };
}

function buildRegistryMap(metricRegistry) {
  return new Map(metricRegistry.map((metric) => [metric.metric_name, metric]));
}

function normalizeLogic(logic) {
  if (typeof logic !== "string") {
    return "AND";
  }

  return logic.trim().toUpperCase();
}

function normalizeFilter(filter, index, registryByField, errors) {
  if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
    errors.push(`filters[${index}] must be an object`);
    return null;
  }

  const field = typeof filter.field === "string" ? filter.field.trim() : "";
  const operator =
    typeof filter.operator === "string" ? filter.operator.trim().toUpperCase() : "";
  const registryEntry = registryByField.get(field);

  if (!registryEntry) {
    errors.push(`filters[${index}].field is not in metric_registry: ${field}`);
    return null;
  }

  if (!registryEntry.allowed_operators.includes(operator)) {
    errors.push(
      `filters[${index}].operator ${operator} is not allowed for ${field}`
    );
  }

  const value = normalizeValue(filter.value, registryEntry, operator, index, errors);

  return {
    field,
    operator,
    value,
  };
}

function normalizeValue(value, registryEntry, operator, index, errors) {
  if (operator === "IN") {
    if (!Array.isArray(value) || value.length === 0) {
      errors.push(`filters[${index}].value must be a non-empty array for IN`);
      return value;
    }

    return value.map((item) => normalizeSingleValue(item, registryEntry, index, errors));
  }

  return normalizeSingleValue(value, registryEntry, index, errors);
}

function normalizeSingleValue(value, registryEntry, index, errors) {
  if (registryEntry.field_type === "number") {
    const numberValue =
      typeof value === "number" ? value : Number(String(value).trim());

    if (!Number.isFinite(numberValue)) {
      errors.push(`filters[${index}].value must be a number`);
      return value;
    }

    return numberValue;
  }

  if (registryEntry.field_type === "string") {
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`filters[${index}].value must be a non-empty string`);
      return value;
    }

    return value.trim();
  }

  errors.push(
    `filters[${index}] uses unsupported field_type ${registryEntry.field_type}`
  );
  return value;
}

module.exports = { validateFilterPlan };
