import { Calendar } from "@/components/ui/calendar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-md items-center justify-end">
        <ThemeToggle />
      </div>
      <Calendar mode="single" className="rounded-md border shadow" />
    </main>
  );
}
