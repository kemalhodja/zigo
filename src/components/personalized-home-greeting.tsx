type PersonalizedHomeGreetingProps = {
  fullName: string;
  struggleAreaName?: string | null;
  role: "student" | "parent" | "teacher";
};

export function PersonalizedHomeGreeting({ fullName, struggleAreaName, role }: PersonalizedHomeGreetingProps) {
  const firstName = fullName.split(" ")[0] ?? fullName;
  const focusLine =
    struggleAreaName && role !== "teacher"
      ? `${struggleAreaName} alanında senin için eşleşen öğretmen içerikleri öne çıkarıldı.`
      : role === "parent"
        ? "Çocuğunuzun gelişim raporları ve öğretmen yanıtları burada."
        : "Doğrulanmış eğitim akışın hazır.";

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">Hoş geldin</p>
      <h1 className="mt-1 text-2xl font-black text-night">Merhaba {firstName}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{focusLine}</p>
    </section>
  );
}
