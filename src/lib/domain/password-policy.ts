const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyui",
  "11111111",
  "00000000",
  "zigo1234",
  "zigo12345",
  "zigo123456",
  "student123",
  "teacher123",
]);

export function isCommonPassword(password: string) {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}

export function validateRegistrationPassword(password: string) {
  if (password.length < 8) {
    return {
      ok: false as const,
      message: "En az 8 karakterli bir şifre kullan.",
    };
  }

  if (isCommonPassword(password)) {
    return {
      ok: false as const,
      message: "Bu şifre çok yaygın. Daha güçlü ve benzersiz bir şifre seç.",
    };
  }

  return { ok: true as const };
}
