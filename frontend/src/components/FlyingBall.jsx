import { motion, AnimatePresence } from 'framer-motion';

export default function FlyingBall({ show, onComplete }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed z-[9999] pointer-events-none"
                    initial={{
                        bottom: '20%',
                        left: '50%',
                        scale: 1,
                        opacity: 1,
                    }}
                    animate={{
                        bottom: '85%',
                        left: '75%',
                        scale: 0.3,
                        opacity: 0,
                        rotate: 720,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 0.9,
                        ease: [0.32, 0, 0.67, 0],
                    }}
                    onAnimationComplete={onComplete}
                >
                    <div className="w-14 h-14 rounded-full overflow-hidden drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 12px rgba(11,110,79,0.6))' }}>
                        <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
