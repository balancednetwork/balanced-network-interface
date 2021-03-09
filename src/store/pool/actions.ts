import { createAction } from '@reduxjs/toolkit';

import { Pair } from 'constants/currency';

export const setPair = createAction<Pair>('pool/setPair');
