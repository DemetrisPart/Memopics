import { MobileNetworkBootstrap } from "@/components/guest/mobile-network-bootstrap";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileNetworkBootstrap>{children}</MobileNetworkBootstrap>;
}
