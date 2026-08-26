export type Category = "Fen Bilimleri" | "Sosyal Bilgiler" | "Matematik" | "Türkçe" | "Genel Kültür";

export interface TabooCard {
  id: string;
  category: Category;
  word: string;
  forbidden: string[];
  aiDescriptions: string[];
}

export const TABOO_LIBRARY: TabooCard[] = [
  // Fen Bilimleri
  { id: "f1", category: "Fen Bilimleri", word: "FOTOSENTEZ", forbidden: ["Bitki", "Güneş", "Oksijen", "Yeşil", "Su"], aiDescriptions: ["Canlıların kendi besinlerini üretmek için ışık kullandıkları süreçtir.", "Soluduğumuz havayı temizleyen üretim işlemidir."] },
  { id: "f2", category: "Fen Bilimleri", word: "YERÇEKIMI", forbidden: ["Newton", "Elma", "Düşmek", "Dünya", "Kütle"], aiDescriptions: ["Gezegenlerin bizi merkezine doğru çektiği görünmez güçtür.", "Zıpladığımızda yere geri inmemizi sağlayan kuvvettir."] },
  { id: "f3", category: "Fen Bilimleri", word: "DNA", forbidden: ["Gen", "Sarmal", "Kalıtım", "Hücre", "Kromozom"], aiDescriptions: ["Tüm canlıların genetik şifresini taşıyan moleküldür.", "Anne ve babamızdan bize geçen özelliklerin yazılı olduğu biyolojik koddur."] },
  { id: "f4", category: "Fen Bilimleri", word: "ENERJI", forbidden: ["Güç", "Elektrik", "Hareket", "Isı", "Işık"], aiDescriptions: ["İş yapabilme yeteneğidir, evrendeki hiçbir şey varken yok, yokken var olamaz.", "Makinelerin çalışmasını veya bizim koşmamızı sağlayan temel kaynaktır."] },
  { id: "f5", category: "Fen Bilimleri", word: "EVRIM", forbidden: ["Darwin", "Maymun", "Değişim", "Zaman", "Canlı"], aiDescriptions: ["Canlı türlerinin nesiller boyunca geçirdiği biyolojik değişim sürecidir.", "Doğal seçilim yoluyla hayatta kalma ve uyum sağlama mekanizmasıdır."] },
  // Tarih / Sosyal Bilgiler
  { id: "s1", category: "Sosyal Bilgiler", word: "CUMHURIYET", forbidden: ["Atatürk", "Halk", "Yönetim", "Egemenlik", "Seçim"], aiDescriptions: ["Vatandaşların kendi liderlerini belirleme hakkına sahip olduğu devlet biçimidir.", "Krallık veya padişahlığın zıttı olan, özgür iradeye dayalı yönetim şeklidir."] },
  { id: "s2", category: "Sosyal Bilgiler", word: "PIRI REIS", forbidden: ["Harita", "Denizci", "Osmanlı", "Pusula", "Kaptan"], aiDescriptions: ["Kitab-ı Bahriye eserini yazan ve tüm dünyayı çizen ünlü Türk bilginidir.", "Amerika kıtasını oldukça isabetli şekilde kağıda döken tarihi şahsiyettir."] },
  { id: "s3", category: "Sosyal Bilgiler", word: "PIRAMIT", forbidden: ["Mısır", "Firavun", "Mezar", "Üçgen", "Çöl"], aiDescriptions: ["Antik çağda krallar için inşa edilmiş devasa taş anıtlardır.", "Dünyanın yedi harikasından biri olan, çöldeki devasa geometrik yapılardır."] },
  { id: "s4", category: "Sosyal Bilgiler", word: "DEMOKRASI", forbidden: ["Oy", "Halk", "Meclis", "Seçim", "Parti"], aiDescriptions: ["Herkesin eşit haklara sahip olduğu ve kararlara katıldığı yönetim sistemidir.", "Çoğunluğun kararının geçerli olduğu, insan haklarına saygılı rejim türüdür."] },
  // Matematik
  { id: "m1", category: "Matematik", word: "UCGEN", forbidden: ["Köşe", "Kenar", "Açı", "Geometri", "Pisagor"], aiDescriptions: ["İç açılarının toplamı her zaman 180 derece olan kapalı geometrik şekildir.", "Sadece üç noktanın birleştirilmesiyle oluşan en basit çokgendir."] },
  { id: "m2", category: "Matematik", word: "PI SAYISI", forbidden: ["Çember", "Daire", "Çevre", "Matematik", "3.14"], aiDescriptions: ["Sonsuza kadar tekrar etmeden uzayıp giden o meşhur irrasyonel sabittir.", "Yuvarlak bir şeklin çevresinin, çapına bölünmesiyle elde edilen değerdir."] },
  { id: "m3", category: "Matematik", word: "KAREKOK", forbidden: ["Sayı", "Çarpma", "Karesi", "Matematik", "İşlem"], aiDescriptions: ["Hangi sayının kendisiyle çarpıldığında bu sonucu verdiğini bulma işlemidir.", "Dokuz için üç, on altı için dört sonucunu veren matematiksel araçtır."] },
  { id: "m4", category: "Matematik", word: "ALGORITMA", forbidden: ["Kod", "Adım", "Bilgisayar", "Program", "Çözüm"], aiDescriptions: ["Bir problemi çözmek için izlenmesi gereken mantıksal adımlar dizisidir.", "Yazılımların temelini oluşturan, sırasıyla uygulanan komutlar bütünüdür."] },
  // Türkçe / Edebiyat
  { id: "t1", category: "Türkçe", word: "SIFAT", forbidden: ["İsim", "Ön ad", "Nitelemek", "Kelime", "Renk"], aiDescriptions: ["Varlıkların nasıl olduğunu, durumlarını veya sayılarını belirten sözcük türüdür.", "Bir ismin önüne gelerek ona özellik katan dilbilgisi terimidir."] },
  { id: "t2", category: "Türkçe", word: "MASAL", forbidden: ["Keloğlan", "Peri", "Uyku", "Kitap", "Çocuk"], aiDescriptions: ["Bir varmış bir yokmuş diye başlayan, genellikle olağanüstü olayların anlatıldığı türdür.", "Kahramanları devler, cinler veya cadılar olan hayali edebiyat türüdür."] },
  { id: "t3", category: "Türkçe", word: "KAFIYE", forbidden: ["Şiir", "Uyak", "Mısra", "Ses", "Uyum"], aiDescriptions: ["Dizelerin sonlarındaki ses benzerliklerine verilen isimdir.", "Aruz veya hece ölçüsüyle yazılan eserlerdeki ritmik bitişlerdir."] },
  { id: "t4", category: "Türkçe", word: "DEYIM", forbidden: ["Atasözü", "Mecaz", "Anlam", "Söz", "Kalıplaşmış"], aiDescriptions: ["Gerçek anlamından uzaklaşarak yeni bir kavramı karşılayan kalıplaşmış söz gruplarıdır.", "Etekleri zil çalmak veya göze girmek gibi, kültürümüze özgü ifadelerdir."] },
  // Genel Kültür
  { id: "g1", category: "Genel Kültür", word: "SATRANÇ", forbidden: ["Şah", "Piyon", "Siyah", "Beyaz", "Mat"], aiDescriptions: ["64 karelik bir tahta üzerinde iki kişinin strateji kurarak oynadığı zeka oyunudur.", "Kralların oyunu olarak bilinen, zihinsel bir spordur."] },
  { id: "g2", category: "Genel Kültür", word: "INTERNET", forbidden: ["Bilgisayar", "Ağ", "Wifi", "Web", "Girmek"], aiDescriptions: ["Tüm dünyanın birbirine bağlanmasını sağlayan devasa dijital iletişim ağıdır.", "Şu an benimle konuşmanı sağlayan sanal evrendir."] },
  { id: "g3", category: "Genel Kültür", word: "OSCAR", forbidden: ["Sinema", "Ödül", "Film", "Tören", "Aktör"], aiDescriptions: ["Her yıl Amerika'da sinema sektörünün en iyilerine verilen prestijli heykelciktir.", "Kırmızı halıda yürüyen ünlülerin kazanmak için yarıştığı büyük altın ödüldür."] },
  { id: "g4", category: "Genel Kültür", word: "MARATON", forbidden: ["Koşu", "Yarış", "Spor", "Atlet", "Mesafe"], aiDescriptions: ["Kırk iki kilometreden uzun süren dayanıklılık odaklı spor müsabakasıdır.", "Olimpiyatların en yorucu ve en uzun pist etkinliğidir."] }
];

// Helper: Normalize strings for tolerant matching
function normalizeString(str: string): string {
  return str
    .toLocaleLowerCase("tr-TR")
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, ""); // Remove everything except alphanumeric
}

// Levenshtein distance for typo tolerance
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
                   matrix[i - 1][j] + 1) // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/** Check if the guess matches the word, allowing minor character differences (up to 2 typos). */
export function checkTabooGuess(guess: string, word: string): boolean {
  const normalizedGuess = normalizeString(guess);
  const normalizedWord = normalizeString(word);
  
  if (normalizedGuess === normalizedWord) return true;
  
  // Allow 1 typo for short words (< 6 chars), 2 typos for longer words
  const maxTypos = normalizedWord.length < 6 ? 1 : 2;
  const distance = levenshteinDistance(normalizedGuess, normalizedWord);
  
  return distance <= maxTypos;
}

export function getRandomTabooCard(excludeIds: string[] = []): TabooCard {
  let available = TABOO_LIBRARY.filter(c => !excludeIds.includes(c.id));
  // Eğer tüm kartlar oynandıysa (veya exclude çok fazlaysa), desteyi sıfırla
  if (available.length === 0) {
    available = TABOO_LIBRARY;
  }
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

export function getRandomDescription(card: TabooCard): string {
  const randomIndex = Math.floor(Math.random() * card.aiDescriptions.length);
  return card.aiDescriptions[randomIndex];
}

export function pointsForTaboo(combo: number): number {
  return Math.round(50 * Math.pow(1.2, Math.min(combo, 10)));
}
