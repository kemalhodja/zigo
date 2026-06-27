"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { availabilityQueryKeys } from "@/features/booking/hooks/availability-query-keys";
import { bookingQueryKeys } from "@/features/booking/hooks/query-keys";
import {
  cancelBookingClient,
  createAvailabilitySlotClient,
  createBookingClient,
  deleteAvailabilitySlotClient,
  fetchBookingsClient,
  fetchTeacherOpenSlotsClient,
  fetchTeacherOwnSlotsClient,
  updateBookingStatusClient,
} from "@/features/booking/services/booking.client";
import type { LessonBookingListItem, TeacherAvailabilitySlot } from "@/features/booking/types";

export function useBookings() {
  const query = useQuery({
    queryKey: bookingQueryKeys.list(),
    queryFn: fetchBookingsClient,
  });

  return {
    bookings: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: query.refetch,
  };
}

export function useCancelBooking(options?: { onSuccess?: () => void | Promise<void> }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBookingClient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.all });
      await options?.onSuccess?.();
    },
  });
}

export function useCreateBooking(options?: { onSuccess?: () => void | Promise<void> }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBookingClient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.all });
      await options?.onSuccess?.();
    },
  });
}

export function useUpdateBookingStatus(options?: { onSuccess?: () => void | Promise<void> }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBookingStatusClient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.all });
      await options?.onSuccess?.();
    },
  });
}

export function useTeacherAvailability(options?: { initialSlots?: TeacherAvailabilitySlot[] }) {
  const query = useQuery({
    queryKey: availabilityQueryKeys.teacherOwn(),
    queryFn: fetchTeacherOwnSlotsClient,
    initialData: options?.initialSlots,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAvailabilitySlotClient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.teacherOwn() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailabilitySlotClient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.teacherOwn() });
    },
  });

  return {
    slots: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    createSlot: createMutation.mutateAsync,
    deleteSlot: deleteMutation.mutateAsync,
    isMutating: createMutation.isPending || deleteMutation.isPending,
  };
}

export function useTeacherOpenSlots(teacherId: string | null) {
  const query = useQuery({
    queryKey: availabilityQueryKeys.teacherOpen(teacherId ?? "none"),
    queryFn: () => fetchTeacherOpenSlotsClient(teacherId!),
    enabled: Boolean(teacherId),
  });

  return {
    slots: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: query.refetch,
  };
}

export type { LessonBookingListItem, TeacherAvailabilitySlot };
