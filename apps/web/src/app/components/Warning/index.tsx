import { Typography } from 'app/theme';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

type WarningProps = {
  message: string;
  show: boolean;
  mt?: number;
  mb?: number;
};

const Warning = ({ message, show, mt, mb }: WarningProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="address-warning"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Typography mt={mt} mb={mb} textAlign="center" color="alert">
            {message}
          </Typography>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Warning;
