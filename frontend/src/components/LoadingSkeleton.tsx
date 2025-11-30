import { motion } from 'framer-motion';

export const LoadingSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <motion.div
      animate={{
        opacity: [0.4, 0.8, 0.4],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`bg-gray-700/30 rounded-lg ${className}`}
    />
  );
};

export const BalanceSkeleton = () => {
  return (
    <div className="card-cyber space-y-4">
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-5 w-32" />
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
      </div>
      <LoadingSkeleton className="h-12 w-48" />
      <LoadingSkeleton className="h-4 w-24" />
    </div>
  );
};

export const TransactionSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-800/30 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-4 w-20" />
          </div>
          <LoadingSkeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
};

