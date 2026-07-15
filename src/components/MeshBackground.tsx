import { motion } from 'framer-motion';

export function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden mesh-bg">
      <motion.div
        className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-30"
        style={{ background: 'var(--accent-from)' }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[15%] w-[350px] h-[350px] rounded-full blur-[100px] opacity-20"
        style={{ background: 'var(--accent-to)' }}
        animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full blur-[100px] opacity-15"
        style={{ background: '#6366f1' }}
        animate={{ x: [0, 40, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
