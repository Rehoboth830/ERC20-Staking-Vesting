import Link from "next/link";
import { motion } from "framer-motion";

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-amber-900 to-black text-amber-400 p-4">
      
      {/* Animated glowing 404 */}
      <motion.h1
        className="text-6xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-amber-400"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.05 }}
        transition={{ duration: 0.8, ease: "easeOut", repeat: Infinity, repeatType: "reverse" }}
        style={{ textShadow: "0 0 20px #FFD700, 0 0 40px #FFBF00" }}
      >
        404
      </motion.h1>

      {/* Message */}
      <motion.p
        className="text-2xl mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
      >
        Oops! Page Not Found.
      </motion.p>

      {/* Home Button */}
      <motion.div
        whileHover={{ scale: 1.05, boxShadow: "0 0 15px #FFD700, 0 0 30px #FFBF00" }}
        whileTap={{ scale: 0.95 }}
      >
        <Link
          href="/"
          className="px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg text-black font-bold transition-all duration-300"
        >
          Go Back Home
        </Link>
      </motion.div>

      {/* Optional subtle radial background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none bg-gradient-radial from-amber-400/10 via-transparent to-transparent"
        animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
