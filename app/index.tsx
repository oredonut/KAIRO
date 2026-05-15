import { motion } from "framer-motion";
import { useEffect } from "react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 4200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center">

        {/* Logo Animation */}
        <motion.img
          src="/kairo-logo.svg"
          alt="Kairo Logo"
          className="w-36 h-36 object-contain"
          initial={{
            opacity: 0,
            scale: 0.7,
            y: 30,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        {/* KAIRO Text */}
        <motion.h1
          initial={{
            opacity: 0,
            y: 20,
            letterSpacing: "0.8em",
          }}
          animate={{
            opacity: 1,
            y: 0,
            letterSpacing: "0.35em",
          }}
          transition={{
            delay: 0.7,
            duration: 1,
          }}
          className="mt-6 text-4xl font-light uppercase text-[#C9A54D]"
        >
          kairo
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1.5,
            duration: 1,
          }}
          className="mt-4 text-sm md:text-base text-gray-500 tracking-wide text-center px-6"
        >
          The moment possibilities become opportunities
        </motion.p>

      </div>
    </div>
  );
}