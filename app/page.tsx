import { Hero } from "../components/hero";
import { About } from "../components/about";

export default function HomePage() {
  return (
    <main className="pt-16">
      <Hero />
      <About />
    </main>
  );
}
