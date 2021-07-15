import React from 'react';

import { Helmet } from 'react-helmet-async';

interface Props {
  title?: string;
  description?: string;
}

export const Pagemeta: React.FC<Props> = ({ title, description }) => (
  <Helmet>
    <title>{title || ''}</title>
    <meta name="description" content={description || 'Balanced Network Interface'} />
  </Helmet>
);
