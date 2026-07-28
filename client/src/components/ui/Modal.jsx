import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineXMark } from 'react-icons/hi2';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${sizes[size]} rounded-2xl border border-white/8 shadow-2xl max-h-[85vh] overflow-y-auto`}
            style={{ background: 'rgba(20, 22, 38, 0.98)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-surface-100">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-surface-200/50 hover:bg-white/5 hover:text-surface-100 transition-colors"
              >
                <HiOutlineXMark className="text-xl" />
              </button>
            </div>
            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
