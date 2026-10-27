// Keep this policy aligned with backend src/utils/validation.js.
export const fieldRules: Record<string, readonly [number, number]> = {
  full_name: [2, 100],
  state: [2, 100],
  city: [2, 100],
  full_address: [10, 500],
  land_location: [3, 500],
  nationality: [2, 80],
  taluka: [2, 100],
};
export const validMobile = (value: string) => /^[0-9]{10}$/.test(value.trim());
export const validText = (
  value: string,
  min: number,
  max: number,
  multiline = false,
) =>
  value.trim().length >= min &&
  value.trim().length <= max &&
  !(
    multiline
      ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
      : /[\u0000-\u001f\u007f]/
  ).test(value);
export const validEmail = (value: string) =>
  value.length <= 254 &&
  /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
    value,
  ) &&
  value.split("@")[0].length <= 64 &&
  !value.startsWith(".") &&
  !value.includes("..") &&
  !value.includes(".@");
export function registrationError(
  fields: Record<string, string>,
  role: "farmer" | "buyer",
  step: number,
): string {
  if (!validEmail(fields.email.trim()))
    return "Enter a valid email address, such as name@example.com.";
  if (!validMobile(fields.mobile_number))
    return "Enter exactly 10 mobile digits, without spaces or a country code.";
  if (!validText(fields.full_name, 2, 100))
    return "Full name must contain 2–100 characters.";
  if (
    fields.age &&
    (!/^\d+$/.test(fields.age) ||
      Number(fields.age) < 18 ||
      Number(fields.age) > 120)
  )
    return "Age must be a whole number from 18 to 120.";
  if (!["en", "hi", "mr", "gu"].includes(fields.preferred_language))
    return "Choose a supported language.";
  if (step === 2) {
    for (const key of [
      "state",
      "city",
      "full_address",
      ...(role === "farmer" ? ["land_location"] : []),
      "taluka",
      "nationality",
    ]) {
      if (["taluka", "nationality"].includes(key) && !fields[key].trim())
        continue;
      const [min, max] = fieldRules[key];
      if (
        !validText(
          fields[key],
          min,
          max,
          key === "full_address" || key === "land_location",
        )
      )
        return `${key.replaceAll("_", " ")} must contain ${min}–${max} characters.`;
    }
  }
  return "";
}

export function decimal(value: string, min = 0, places = 2): number | null {
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${places}})?$`).test(value.trim()))
    return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= 1000000000
    ? number
    : null;
}
