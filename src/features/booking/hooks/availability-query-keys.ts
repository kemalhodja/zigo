export const availabilityQueryKeys = {
  all: ["availability"] as const,
  teacherOwn: () => [...availabilityQueryKeys.all, "teacher-own"] as const,
  teacherOpen: (teacherId: string) => [...availabilityQueryKeys.all, "teacher-open", teacherId] as const,
};
