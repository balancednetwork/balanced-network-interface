import React from 'react';

import { Helmet } from 'react-helmet-async';

interface Props {
  title?: string;
  description?: string;
  image?: string;
}

export const Pagemeta: React.FC<Props> = ({ title, description, image }) => (
  <Helmet>
    <title>{title || ''}</title>
    <meta name="description" content={description || 'Balanced Network Interface'} />
    <meta property="og:title" content={`${title} | Balanced`} />
    <meta property="og:description" content={description || 'Balanced Network Interface'} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={window.location.href} />
    {image && <meta property="og:image" content={image} />}
    <meta name="twitter:card" content="summary large_image" />
    <meta name="twitter:site" content="@BalancedDAO" />
    <meta name="twitter:title" content={`${title} | Balanced`} />
    <meta name="twitter:description" content={description || 'Balanced Network Interface'} />
    {image && <meta name="twitter: image:src" content={image} />}
    <meta name="twitter:image:alt" content="Screenshot of the Balanced" />
  </Helmet>
);
