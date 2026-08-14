import type { SupabaseClient } from "@supabase/supabase-js";

import { DomainForbiddenError } from "@/lib/domain/domain-errors";
import { getUserInterestAreaIds } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import type { Database } from "@/lib/supabase/database.types";

import type {
  CreatePrivateLessonBidInput,
  CreatePrivateLessonPostInput,
  PrivateLessonBidWithTeacher,
  PrivateLessonPostWithDetails,
} from "./schemas";
import { createPrivateLessonBidSchema, createPrivateLessonPostSchema } from "./schemas";

/**
 * Veli için özel ders ilanı oluşturur.
 * Kural: Sadece parent rolündeki ve Zigo Plus / 30 günlük Trial sahibi veliler ilan verebilir.
 */
export async function createPrivateLessonPost(
  supabase: SupabaseClient<Database>,
  parentId: string,
  rawInput: CreatePrivateLessonPostInput,
): Promise<PrivateLessonPostWithDetails> {
  const input = createPrivateLessonPostSchema.parse(rawInput);

  // 1. Rol kontrolü
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", parentId)
    .single();

  if (userError || !user || user.role !== "parent") {
    throw new DomainForbiddenError("Özel ders ilanı yalnızca veli hesapları tarafından oluşturulabilir.");
  }

  // 2. Abonelik kontrolü (Zigo Plus / 30 Günlük Deneme)
  const subscription = await getUserSubscription(supabase, parentId);
  if (!subscription.isPremium) {
    throw new DomainForbiddenError(
      "Özel ders ilanı oluşturmak için Zigo Plus Veli Aboneliği gereklidir. İlk 30 gün ücretsiz deneyebilirsiniz.",
    );
  }

  // 3. Çocuk profili kontrolü (varsa)
  if (input.childProfileId) {
    const { data: child, error: childError } = await supabase
      .from("child_profiles")
      .select("id")
      .eq("id", input.childProfileId)
      .eq("parent_id", parentId)
      .maybeSingle();

    if (childError || !child) {
      throw new DomainForbiddenError("Lütfen hesabınıza bağlı geçerli bir çocuk profili seçin.");
    }
  }

  // 4. Veritabanına kayıt
  const { data: inserted, error: insertError } = await (supabase as any)
    .from("private_lesson_posts")
    .insert({
      parent_id: parentId,
      child_profile_id: input.childProfileId || null,
      area_id: input.areaId,
      grade_level: input.gradeLevel,
      mode: input.mode,
      city: input.city || null,
      district: input.district || null,
      description: input.description,
      budget_try: input.budgetTry || null,
      status: "open",
    })
    .select(
      `
      *,
      area:education_areas!area_id (id, area_name),
      parent:users!parent_id (id, full_name, avatar_url),
      child_profile:child_profiles!child_profile_id (id, name)
    `,
    )
    .single();

  if (insertError) throw insertError;
  return inserted as PrivateLessonPostWithDetails;
}

/**
 * Velinin oluşturduğu tüm özel ders ilanlarını getirir.
 */
export async function getParentPrivateLessonPosts(
  supabase: SupabaseClient<Database>,
  parentId: string,
): Promise<PrivateLessonPostWithDetails[]> {
  const { data, error } = await (supabase as any)
    .from("private_lesson_posts")
    .select(
      `
      *,
      area:education_areas!area_id (id, area_name),
      parent:users!parent_id (id, full_name, avatar_url),
      child_profile:child_profiles!child_profile_id (id, name)
    `,
    )
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as PrivateLessonPostWithDetails[];
}

/**
 * Bir ilana gelen teklifleri getirir (yalnızca ilan sahibi veli veya teklif veren öğretmen görebilir).
 */
export async function getBidsForLessonPost(
  supabase: SupabaseClient<Database>,
  postId: string,
  viewerId: string,
): Promise<PrivateLessonBidWithTeacher[]> {
  const { data, error } = await (supabase as any)
    .from("private_lesson_bids")
    .select(
      `
      *,
      teacher:users!teacher_id (
        id,
        full_name,
        avatar_url,
        is_verified,
        role
      )
    `,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as PrivateLessonBidWithTeacher[];
}

/**
 * Öğretmen için branşına uygun açık özel ders ilanlarını getirir.
 * Kural:
 * 1. Öğretmenin en az 1 branşı olmalıdır.
 * 2. Öğretmen Zigo Plus / 30 günlük trial sahibi olmalıdır.
 * 3. İlanlar öğretmenin branş alanlarıyla eşleşenler olarak listelenir.
 */
export async function getMatchedLessonPostsForTeacher(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<PrivateLessonPostWithDetails[]> {
  // 1. Rol kontrolü
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", teacherId)
    .single();

  if (userError || !user || user.role !== "teacher") {
    throw new DomainForbiddenError("İlanlar yalnızca öğretmen hesapları tarafından görüntülenebilir.");
  }

  // 2. Branş kontrolü
  const teacherAreaIds = await getUserInterestAreaIds(supabase, teacherId);
  if (!teacherAreaIds || teacherAreaIds.length === 0) {
    return []; // Branşı yoksa ilan göremez
  }

  // 3. Abonelik kontrolü
  const subscription = await getUserSubscription(supabase, teacherId);
  if (!subscription.isPremium) {
    throw new DomainForbiddenError(
      "Özel ders ilanlarını görüntülemek ve teklif vermek için Zigo Plus Öğretmen Aboneliği gereklidir. İlk 30 gün ücretsiz deneyebilirsiniz.",
    );
  }

  // 4. Eşleşen ilanları getir
  const { data: posts, error: postsError } = await (supabase as any)
    .from("private_lesson_posts")
    .select(
      `
      *,
      area:education_areas!area_id (id, area_name),
      parent:users!parent_id (id, full_name, avatar_url),
      child_profile:child_profiles!child_profile_id (id, name)
    `,
    )
    .in("area_id", teacherAreaIds)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  if (postsError) throw postsError;

  // 5. Öğretmenin bu ilanlara daha önce verdiği teklifleri bağla
  const postIds = (posts || []).map((p: any) => p.id);
  let myBids: any[] = [];
  if (postIds.length > 0) {
    const { data: bids } = await (supabase as any)
      .from("private_lesson_bids")
      .select("*")
      .eq("teacher_id", teacherId)
      .in("post_id", postIds);
    myBids = bids || [];
  }

  const myBidsMap = new Map(myBids.map((b) => [b.post_id, b]));

  return (posts || []).map((p: any) => ({
    ...p,
    my_bid: myBidsMap.get(p.id) || null,
  })) as PrivateLessonPostWithDetails[];
}

/**
 * Öğretmenin ilana teklif vermesi.
 * Kural:
 * - Öğretmen ilanın branşına sahip olmalı.
 * - İlan açık olmalı ve toplam teklif 5'ten az olmalı.
 * - Öğretmen Zigo Plus sahibi olmalı.
 * - Tek öğretmen ilana yalnızca 1 teklif verebilir.
 */
export async function createPrivateLessonBid(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  rawInput: CreatePrivateLessonBidInput,
): Promise<PrivateLessonBidWithTeacher> {
  const input = createPrivateLessonBidSchema.parse(rawInput);

  // 1. Öğretmen rol & abonelik kontrolü
  const { data: teacher, error: teacherError } = await supabase
    .from("users")
    .select("role, is_verified")
    .eq("id", teacherId)
    .single();

  if (teacherError || !teacher || teacher.role !== "teacher") {
    throw new DomainForbiddenError("Yalnızca öğretmenler özel ders teklifi verebilir.");
  }

  const subscription = await getUserSubscription(supabase, teacherId);
  if (!subscription.isPremium) {
    throw new DomainForbiddenError(
      "Özel ders teklifi gönderebilmek için Zigo Plus Öğretmen Aboneliği gereklidir.",
    );
  }

  // 2. İlan durumu kontrolü
  const { data: post, error: postError } = await (supabase as any)
    .from("private_lesson_posts")
    .select("id, area_id, status, bids_count, parent_id")
    .eq("id", input.postId)
    .single();

  if (postError || !post) {
    throw new DomainForbiddenError("İlan bulunamadı.", "NOT_FOUND");
  }

  if (post.status !== "open" || post.bids_count >= 5) {
    throw new DomainForbiddenError("Bu ilan maksimum teklif sayısına (5 teklif) ulaştığı için kapanmıştır.");
  }

  // 3. Branş uygunluğu kontrolü
  const teacherAreaIds = await getUserInterestAreaIds(supabase, teacherId);
  if (!teacherAreaIds.includes(post.area_id)) {
    throw new DomainForbiddenError("Bu ilan için uygun branşa sahip değilsiniz.");
  }

  // 4. Teklif ekle
  const { data: bid, error: insertError } = await (supabase as any)
    .from("private_lesson_bids")
    .insert({
      post_id: input.postId,
      teacher_id: teacherId,
      price_per_hour_try: input.pricePerHourTry,
      message: input.message,
      status: "pending",
    })
    .select(
      `
      *,
      teacher:users!teacher_id (
        id,
        full_name,
        avatar_url,
        is_verified,
        role
      )
    `,
    )
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      throw new DomainForbiddenError("Bu ilana zaten bir teklif vermişsiniz.");
    }
    throw insertError;
  }

  return bid as PrivateLessonBidWithTeacher;
}
