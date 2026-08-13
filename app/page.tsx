import { DeskScene } from "@/components/DeskScene";
import { MobileHome } from "@/components/MobileHome";

export default function Home() {
  return (
    <main className="home-shell">
      <DeskScene />
      <MobileHome />
    </main>
  );
}
