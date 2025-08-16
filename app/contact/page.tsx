"use client";

import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    // In real implementation, submit to API route
    setStatus("sent");
    form.reset();
  }

  return (
    <main className="pt-16 container mx-auto py-20">
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="text"
          name="name"
          required
          placeholder="Name"
          className="w-full p-2 border rounded bg-background text-foreground"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Email"
          className="w-full p-2 border rounded bg-background text-foreground"
        />
        <textarea
          name="message"
          required
          placeholder="Message"
          className="w-full p-2 border rounded bg-background text-foreground"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-accent text-background rounded hover:opacity-90"
        >
          Send
        </button>
        {status === "sent" && (
          <p className="text-sm text-green-600">Message sent!</p>
        )}
      </form>
    </main>
  );
}
