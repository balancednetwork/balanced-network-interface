import { DashGrid, DataText } from '@/app/components/List';
import Skeleton from '@/app/components/Skeleton';
import { Typography } from '@/app/theme';
import React from 'react';
import { Box, Flex } from 'rebass';

const SkeletonTokenPlaceholder = () => {
  return (
    <DashGrid my={4}>
      <DataText>
        <Flex alignItems="center">
          <Box sx={{ minWidth: '50px' }}>
            <Skeleton variant="circle" width={40} height={40} />
          </Box>
          <Box ml={2} sx={{ minWidth: '160px' }}>
            <Skeleton width={130} />
            <Skeleton width={70} />
          </Box>
        </Flex>
      </DataText>
      <DataText>
        <Flex alignItems="flex-end" flexDirection="column">
          <Typography variant="p">
            <Skeleton width={80} />
          </Typography>
          <Typography variant="p">
            <Skeleton width={80} />
          </Typography>
        </Flex>
      </DataText>
      <DataText>
        <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
          <Typography variant="p">
            <Skeleton width={120} />
          </Typography>
          <Typography variant="p">
            <Skeleton width={160} />
          </Typography>
        </Flex>
      </DataText>
      <DataText>
        <Skeleton width={110} />
      </DataText>
      <DataText>
        <Skeleton width={90} />
      </DataText>
    </DashGrid>
  );
};

export default SkeletonTokenPlaceholder;
