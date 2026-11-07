"use client";

import { Button } from "@/components/ui/button";
import { useAction } from "@/lib/use-action";
import { disableBookingAddon, enableBookingAddon } from "./actions";

export function BookingAddonButton({ active, launched }: { active: boolean; launched: boolean }) {
  const { pending, run } = useAction();

  if (active) {
    return (
      <Button
        variant="outline"
        size="sm"
        loading={pending}
        onClick={() => run(() => disableBookingAddon(), "Booking add-on removed")}
      >
        Remove add-on
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      loading={pending}
      disabled={!launched}
      onClick={() => run(() => enableBookingAddon(), "Booking add-on is on")}
    >
      Add booking
    </Button>
  );
}
