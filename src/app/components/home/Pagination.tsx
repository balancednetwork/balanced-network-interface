import '@reach/tabs/styles.css';
import React from 'react';

import { useTranslation } from 'react-i18next';
import { Flex, SxStyleProp } from 'rebass';

import { Button } from 'app/components/Button';
import { Typography } from 'app/theme';

const Pagination: React.FC<{
  sx?: SxStyleProp;
  next: () => void;
  prev: () => void;
  limit: number;
  skip: number;
  loading: boolean;
}> = ({ sx = {}, next, prev, limit, skip, loading }) => {
  const { t } = useTranslation();
  return (
    <Flex
      sx={{
        flexDirection: ['column', 'row'],
        justifyContent: ['center', 'flex-end'],
        alignItems: 'center',
        mb: [3, 0],
        ...sx,
      }}
    >
      <Typography mr={3} my={[3, 0]}>
        {skip}
        {' - '} {skip + limit}
      </Typography>
      <Flex>
        <Button mr="8px" disabled={loading || skip - limit <= 0} onClick={prev} sx={{ color: '#000' }}>
          {t`Prev`}
        </Button>
        <Button disabled={loading} onClick={next}>
          {t`Next`}
        </Button>
      </Flex>
    </Flex>
  );
};

export default Pagination;
