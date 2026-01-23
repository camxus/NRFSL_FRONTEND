// app/page.tsx
"use client"; // this makes it a client component

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"); // redirect to /login
  }, [router]);

  return null; // nothing renders since we redirect immediately
};

export default HomePage;
