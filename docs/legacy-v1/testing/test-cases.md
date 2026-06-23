# File: testing/test-cases.md

# Test Cases

## Availability

1. Select available dates and one room.
   Expected: room available.

2. Select dates overlapping confirmed booking where all units are booked.
   Expected: room unavailable.

3. Select dates overlapping booking but units remain.
   Expected: room available.

4. Select blocked dates.
   Expected: room unavailable.

## Calculation

1. N$650 × 1 room × 3 nights.
   Expected total: N$1,950.

2. N$500 × 2 rooms × 2 nights.
   Expected total: N$2,000.

3. Add N$200 extra.
   Expected total increases by N$200.

4. Add N$300 deposit.
   Expected balance due reduces by N$300.
