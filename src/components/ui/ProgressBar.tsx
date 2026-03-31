import { m } from 'framer-motion';

export function ProgressBar() {
  return (
    <div className="w-full h-1 bg-slate-200/50 rounded-full overflow-hidden mb-5">
      <m.div
        className="h-full bg-blue-500 rounded-full"
        initial={{ width: '0%' }}
        animate={{ width: ['0%', '70%', '85%', '90%'] }}
        transition={{
          duration: 3,
          ease: 'easeOut',
          times: [0, 0.4, 0.7, 1],
        }}
      />
    </div>
  );
}
