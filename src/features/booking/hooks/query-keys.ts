export const bookingQueryKeys = {
  all: ["bookings"] as const,
  list: () => [...bookingQueryKeys.all, "list"] as const,
};
