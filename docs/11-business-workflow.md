# File: 11-business-workflow.md

# Tanhwe Guest House — Business Workflow

## Main Booking Workflow

```mermaid
flowchart TD
    A[Customer visits website] --> B[Searches rooms]
    B --> C[Selects check-in and check-out dates]
    C --> D[System checks availability]
    D --> E{Room available?}
    E -- No --> F[Show unavailable message and WhatsApp/contact option]
    E -- Yes --> G[Customer submits booking request]
    G --> H[Admin receives booking]
    H --> I[Admin follows up]
    I --> J{Customer confirms?}
    J -- No --> K[Booking remains pending or cancelled]
    J -- Yes --> L[Quote or invoice generated]
    L --> M[Deposit or payment recorded]
    M --> N[Booking confirmed]
    N --> O[Arrival reminder sent]
    O --> P[Guest checks in]
    P --> Q[Guest checks out]
    Q --> R[Receipt generated]
    R --> S[Post-stay follow-up]
```

## Manual Booking Workflow

```mermaid
flowchart TD
    A[Customer calls or WhatsApps] --> B[Admin checks availability]
    B --> C[Admin creates booking manually]
    C --> D[Admin generates quote]
    D --> E[Customer confirms]
    E --> F[Admin records payment or deposit]
    F --> G[Booking confirmed]
```

## Quote to Receipt Workflow

```mermaid
flowchart TD
    A[Booking request] --> B[Quote generated]
    B --> C[Quote sent by WhatsApp or email]
    C --> D{Customer accepts?}
    D -- No --> E[Quote expired/cancelled]
    D -- Yes --> F[Payment recorded]
    F --> G[Receipt generated]
    G --> H[Booking confirmed or paid]
```

## Follow-up Workflow

```mermaid
flowchart TD
    A[New booking request] --> B[Create follow-up task]
    B --> C[Admin contacts customer]
    C --> D{Resolved?}
    D -- No --> E[Schedule next follow-up]
    D -- Yes --> F[Mark follow-up complete]
```

## Automation Opportunities

- New booking notification to admin
- Booking confirmation email
- Pre-arrival reminder
- Payment reminder
- Post-checkout thank-you message
- Quote expiry reminder
- Owner daily/weekly booking summary

## Booking Sources to Track

- Website
- WhatsApp
- Phone call
- Walk-in
- Referral
- Facebook
- Other
