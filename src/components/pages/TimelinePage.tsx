import React from 'react';
import { motion } from 'motion/react';
import { Timeline } from '../Timeline'; // Assuming Timeline is a separate component or we move it

interface TimelinePageProps {
  events?: any[];
  setActiveTab?: (tab: any) => void;
}

export function TimelinePage({ events, setActiveTab }: TimelinePageProps) {
  return (
    <motion.div 
      key="timeline"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Timeline events={events || []} setActiveTab={setActiveTab || (() => {})} />
    </motion.div>
  );
}
