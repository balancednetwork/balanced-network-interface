// [IMPORT NEW CONTAINERSTATE ABOVE] < Needed for generating containers seamlessly

/* 
  Because the redux-injectors injects your reducers asynchronously somewhere in your code
  You have to declare them here manually
*/
import { ApplicationState } from 'store/application/reducer';
import { CollateralState } from 'store/collateral/reducer';
import { FeesState } from 'store/fees/reducer';
import { LoanState } from 'store/loan/reducer';
import { MintState } from 'store/mint/reducer';
import { OracleState } from 'store/oracle/reducer';
import { RatioState } from 'store/ratio/reducer';
import { RewardState } from 'store/reward/reducer';
import { StabilityFundState } from 'store/stabilityFund/reducer';
import { StakedLPState } from 'store/stakedLP/reducer';
import { SwapState } from 'store/swap/reducer';
import { TransactionState } from 'store/transactions/reducer';
import { UserState } from 'store/user/reducer';
import { WalletState } from 'store/wallet/reducer';

// #redux-step-3: define interface for RootState (the root tree view on Redux Devtool chrome extension)
export interface RootState {
  // [INSERT NEW REDUCER KEY ABOVE] < Needed for generating containers seamlessly
  application: ApplicationState;
  collateral: CollateralState;
  loan: LoanState;
  reward: RewardState;
  ratio: RatioState;
  wallet: WalletState;
  transactions: TransactionState;
  mint: MintState;
  swap: SwapState;
  stabilityFund: StabilityFundState;
  stakedLP: StakedLPState;
  user: UserState;
  fees: FeesState;
  oracle: OracleState;
}
