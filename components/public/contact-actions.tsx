import { MessageCircle, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ContactActions({
  phone,
  whatsapp,
  message,
  className,
}: {
  phone: string;
  whatsapp: string;
  message?: string;
  className?: string;
}) {
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;
  const whatsappHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message ?? "Hello Tanhwe Guest House, I would like to enquire about a stay.")}`;
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ variant: "secondary", size: "default" })}
      >
        <MessageCircle className="size-4" /> WhatsApp
      </a>
      <a href={phoneHref} className={buttonVariants({ variant: "outline", size: "default" })}>
        <Phone className="size-4" /> Call {phone}
      </a>
    </div>
  );
}
