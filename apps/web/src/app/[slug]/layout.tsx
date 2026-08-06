import { MobileNetworkBootstrap } from "@/components/guest/mobile-network-bootstrap";
import { GuestThemeProvider } from "@/lib/themes/theme-provider";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestThemeProvider>
      <MobileNetworkBootstrap>{children}</MobileNetworkBootstrap>
    </GuestThemeProvider>
  );
}
