import { describe, expect, it } from "vitest";

import { createPostSchema } from "@/lib/domain/feed";
import { submitQuizSchema } from "@/lib/domain/learning";
import {
  createProfileSchema,
  setInterestsSchema,
  updateUserProfileSchema,
} from "@/lib/domain/profiles";
import { createQuestionSchema } from "@/lib/domain/questions";
import {
  commentSchema,
  contentReportSchema,
  createSocialPostSchema,
  createStorySchema,
  followSchema,
  moderationActionSchema,
  reelWatchCompletionSchema,
  storyReplySchema,
} from "@/lib/domain/social/schemas";
import { redeemProductSchema } from "@/lib/domain/store";
import {
  completeFocusSessionSchema,
  shareStudyMomentSchema,
  startFocusSessionSchema,
} from "@/lib/domain/study-moments";

const ids = {
  user: "00000000-0000-4000-8000-000000000301",
  teacher: "00000000-0000-4000-8000-000000000101",
  post: "00000000-0000-4000-8000-000000000601",
  quiz: "00000000-0000-4000-8000-000000000701",
  session: "00000000-0000-4000-8000-000000000901",
  product: "00000000-0000-4000-8000-000000000801",
};

describe("domain schema snapshots", () => {
  it("matches social post schema snapshot", () => {
    expect(
      createSocialPostSchema.parse({
        caption: "Kesirler dersi",
        areaId: 1,
        mediaType: "video",
        isReel: true,
      }),
    ).toMatchSnapshot();
  });

  it("matches comment schema snapshot", () => {
    expect(
      commentSchema.parse({
        postId: ids.post,
        content: "Çok faydalı oldu",
      }),
    ).toMatchSnapshot();
  });

  it("matches story schema snapshot", () => {
    expect(
      createStorySchema.parse({
        areaId: 2,
        caption: "Spark notu",
      }),
    ).toMatchSnapshot();
  });

  it("matches follow schema snapshot", () => {
    expect(
      followSchema.parse({
        followingId: ids.teacher,
      }),
    ).toMatchSnapshot();
  });

  it("matches report schema snapshot", () => {
    expect(
      contentReportSchema.parse({
        postId: ids.post,
        reason: "bullying",
      }),
    ).toMatchSnapshot();
  });

  it("matches moderation action schema snapshot", () => {
    expect(
      moderationActionSchema.parse({
        itemId: ids.post,
        kind: "story_reply",
        status: "rejected",
      }),
    ).toMatchSnapshot();
  });

  it("matches reel watch schema snapshot", () => {
    expect(
      reelWatchCompletionSchema.parse({
        postId: ids.post,
        secondsWatched: 60,
      }),
    ).toMatchSnapshot();
  });

  it("matches story reply schema snapshot", () => {
    expect(
      storyReplySchema.parse({
        storyId: ids.post,
        content: "Harika spark",
      }),
    ).toMatchSnapshot();
  });

  it("matches feed post schema snapshot", () => {
    expect(
      createPostSchema.parse({
        teacherId: ids.teacher,
        areaId: 1,
        title: "Kesirler",
        content: "Özet notlar",
      }),
    ).toMatchSnapshot();
  });

  it("matches quiz submit schema snapshot", () => {
    expect(
      submitQuizSchema.parse({
        quizId: ids.quiz,
        selectedOption: 1,
      }),
    ).toMatchSnapshot();
  });

  it("matches question schema snapshot", () => {
    expect(
      createQuestionSchema.parse({
        authorId: ids.user,
        areaId: 1,
        title: "Soru başlığı",
        description: "Detaylı açıklama metni",
      }),
    ).toMatchSnapshot();
  });

  it("matches profile schema snapshot", () => {
    expect(
      createProfileSchema.parse({
        fullName: "Zeynep",
        role: "student",
      }),
    ).toMatchSnapshot();
  });

  it("matches interests schema snapshot", () => {
    expect(setInterestsSchema.parse({ areaIds: [1, 2, 3] })).toMatchSnapshot();
  });

  it("matches profile update schema snapshot", () => {
    expect(
      updateUserProfileSchema.parse({
        bio: "Matematik çalışıyorum",
      }),
    ).toMatchSnapshot();
  });

  it("matches store redeem schema snapshot", () => {
    expect(
      redeemProductSchema.parse({
        productId: ids.product,
        note: "Kitap istiyorum",
      }),
    ).toMatchSnapshot();
  });

  it("matches focus session schema snapshot", () => {
    expect(
      startFocusSessionSchema.parse({
        topicLabel: "Paragraf çalışması",
      }),
    ).toMatchSnapshot();
  });

  it("matches focus completion schema snapshot", () => {
    expect(
      completeFocusSessionSchema.parse({
        sessionId: ids.session,
      }),
    ).toMatchSnapshot();
  });

  it("matches study moment share schema snapshot", () => {
    expect(
      shareStudyMomentSchema.parse({
        sessionId: ids.session,
        caption: "Odaklandım",
      }),
    ).toMatchSnapshot();
  });
});
