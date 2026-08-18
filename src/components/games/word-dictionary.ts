export type WordEntry = {
  word: string;
  meaning: string;
};

export const WORD_DICTIONARY: Record<"TR" | "EN", Record<number, WordEntry[]>> = {
  TR: {
    4: [
      { word: "AKIL", meaning: "Düşünme, anlama ve kavrama gücü." },
      { word: "ZEKA", meaning: "İnsanın düşünme, akıl yürütme, algılama yeteneklerinin bütünü." },
      { word: "DOĞA", meaning: "Kendiliğinden var olan, insan yapısı olmayan her şeyin bütünü." },
      { word: "UZAY", meaning: "Bütün gök cisimlerini barındıran sonsuz boşluk." },
      { word: "OKUL", meaning: "Eğitim ve öğretim verilen kurum." },
      { word: "SORU", meaning: "Bir şeyi öğrenmek için birine yöneltilen söz." },
      { word: "HARF", meaning: "Dildeki sesleri gösteren işaretlerden her biri." },
      { word: "SAYI", meaning: "Miktarı belirten sembol." }
    ],
    5: [
      { word: "BİLGİ", meaning: "Öğrenme, araştırma veya gözlem yoluyla elde edilen gerçek." },
      { word: "BİLİM", meaning: "Evrenin veya olayların bir bölümünü konu olarak seçen yöntemler bütünü." },
      { word: "KİTAP", meaning: "Ciltli veya ciltsiz olarak bir araya getirilmiş basılı yapraklar." },
      { word: "KALEM", meaning: "Yazı yazmaya, resim yapmaya yarayan araç." },
      { word: "ZİHİN", meaning: "Canlıların algılama ve anlama süreçlerinin gerçekleştiği yapı." },
      { word: "EVREN", meaning: "Bütün gök cisimlerini barındıran sonsuz uzay boşluğu." },
      { word: "DÜNYA", meaning: "Üzerinde yaşadığımız gezegen, yerküre." },
      { word: "SEVGİ", meaning: "İnsanı bir şeye veya bir kimseye karşı yakın ilgi göstermeye yönelten duygu." },
      { word: "SAYGI", meaning: "Değeri, üstünlüğü, yaşlılığı nedeniyle bir kimseye gösterilen özen." },
      { word: "DOĞRU", meaning: "Gerçeğe, kurala, mantığa uygun olan." },
      { word: "ERDEM", meaning: "Ahlakın övdüğü iyilik, doğruluk, alçakgönüllülük gibi niteliklerin genel adı." },
      { word: "HEDEF", meaning: "Varılacak yer, ulaşılmak istenen amaç." },
      { word: "MERAK", meaning: "Bir şeyi anlama veya öğrenme isteği." },
      { word: "KEŞİF", meaning: "Var olan ancak bilinmeyen bir şeyi bulma." }
    ],
    6: [
      { word: "GÖZLEM", meaning: "Bir nesneyi, bir olayı, bir gerçeği iyi anlamak için inceleme." },
      { word: "SÖZLÜK", meaning: "Kelimelerin anlamlarını veya çevirilerini veren kitap." },
      { word: "EĞİTİM", meaning: "Çocukların ve gençlerin toplum yaşayışında yerlerini almaları için verilen bilgi." },
      { word: "SİSTEM", meaning: "Bir sonucu elde etmeye yarayan yöntemler düzeni." },
      { word: "MANTIK", meaning: "Doğru düşünme sanatı ve bilimi." },
      { word: "BELLEK", meaning: "Yaşananları, öğrenilenleri geçmişle ilişkili olarak bilinçte tutma gücü." },
      { word: "SÖZCÜK", meaning: "Anlamı olan ses veya sesler birliği, kelime." },
      { word: "ANLAMA", meaning: "Bir şeyin ne demek olduğunu, neye işaret ettiğini kavrama." }
    ]
  },
  EN: {
    4: [
      { word: "MIND", meaning: "The element of a person that enables them to be aware of the world." },
      { word: "IDEA", meaning: "A thought or suggestion as to a possible course of action." },
      { word: "BOOK", meaning: "A written or printed work consisting of pages glued or sewn together." },
      { word: "STAR", meaning: "A fixed luminous point in the night sky." },
      { word: "DATA", meaning: "Facts and statistics collected together for reference or analysis." },
      { word: "HOPE", meaning: "A feeling of expectation and desire for a certain thing to happen." }
    ],
    5: [
      { word: "BRAIN", meaning: "An organ of soft nervous tissue contained in the skull." },
      { word: "LOGIC", meaning: "Reasoning conducted or assessed according to strict principles of validity." },
      { word: "LEARN", meaning: "Gain or acquire knowledge of or skill in something." },
      { word: "SPACE", meaning: "A continuous area or expanse which is free, available, or unoccupied." },
      { word: "EARTH", meaning: "The planet on which we live; the world." },
      { word: "PEACE", meaning: "Freedom from disturbance; tranquility." },
      { word: "SMART", meaning: "Having or showing a quick-witted intelligence." },
      { word: "SKILL", meaning: "The ability to do something well; expertise." },
      { word: "TRUTH", meaning: "The quality or state of being true." }
    ],
    6: [
      { word: "REASON", meaning: "A cause, explanation, or justification for an action or event." },
      { word: "WISDOM", meaning: "The quality of having experience, knowledge, and good judgment." },
      { word: "NATURE", meaning: "The phenomena of the physical world collectively." },
      { word: "PLANET", meaning: "A celestial body moving in an elliptical orbit around a star." },
      { word: "FUTURE", meaning: "The time or a period of time following the moment of speaking." },
      { word: "THEORY", meaning: "A supposition or a system of ideas intended to explain something." },
      { word: "SYSTEM", meaning: "A set of connected things or parts forming a complex whole." }
    ]
  }
};
