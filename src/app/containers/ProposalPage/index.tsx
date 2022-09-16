import React, { useState } from 'react';

import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact } from 'packages/icon-react';
import { useParams } from 'react-router-dom';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button, AlertButton } from 'app/components/Button';
import Column from 'app/components/Column';
import { Link } from 'app/components/Link';
import { BoxPanel } from 'app/components/Panel';
import { StyledSkeleton } from 'app/components/ProposalInfo';
import { VoterNumberLabel, VoterPercentLabel, VoteStatusLabel } from 'app/components/ProposalInfo/components';
import { ProposalModal, ModalStatus } from 'app/components/ProposalModal';
import QuestionHelper from 'app/components/QuestionHelper';
import { ExternalLink } from 'app/components/SearchModal/components';
import { PROPOSAL_TYPE, PROPOSAL_TYPE_LABELS } from 'app/containers/NewProposalPage/constant';
import { Typography } from 'app/theme';
import { ReactComponent as CancelIcon } from 'assets/icons/cancel.svg';
import { ReactComponent as CheckCircleIcon } from 'assets/icons/check_circle.svg';
import { ReactComponent as ExternalIcon } from 'assets/icons/external.svg';
import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useAdditionalInfoById, useProposalInfoQuery, useUserVoteStatusQuery, useUserWeightQuery } from 'queries/vote';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { TransactionStatus, useTransactionAdder, useTransactionStatus } from 'store/transactions/hooks';
import { formatPercent, formatUnits, getTrackerLink } from 'utils';
import { formatTimeStr } from 'utils/timeformat';

import { CopyableSCORE } from '../NewProposalPage/CollateralProposalFields';
import { ACTIONS_MAPPING, RATIO_VALUE_FORMATTER } from '../NewProposalPage/constant';
import Funding from './Funding';
import Ratio from './Ratio';

dayjs.extend(duration);

const ProposalContainer = styled(Box)`
  flex: 1;
  border-radius: 10px;
`;

const Progress = styled(Flex)`
  position: relative;
  height: 15px;
  width: 100%;
  background-color: #123955;
  border-radius: 5px;
`;

const ProgressBar = styled(Flex)<{ percentage: string; type: string }>`
  background: ${props =>
    (props.type === 'Approve' && props.theme.colors.primary) || (props.type === 'Reject' && props.theme.colors.alert)};
  height: 100%;
  border-radius: ${props => (props.percentage === '100' ? '5px' : '5px 0 0 5px')};
  transition: width 0.2s ease-in;
  justify-content: center;
  width: ${({ percentage }) => `${percentage}%`};
`;

const ResultPanel = styled(Flex)`
  border-radius: 10px;
  width: 100%;
  align-items: center;
  gap: 20px;
  padding: 15px 25px;
  min-height: 90px;
  max-width: 'initial';

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 15px 30px;
  `}

  ${({ theme }) => theme.mediaWidth.upSmall`
    padding: 15px 30px;
    max-width: 360px;
  `}
`;
const ChangeVoteButton = styled(Typography)`
  color: ${({ theme }) => theme.colors.primaryBright};
  cursor: pointer;
  transition: color ease 0.2s;
  font-size: 14px;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CollateralProposalInfoItem = styled(Box)`
  width: 180px;
  padding: 0 30px 0 0;
  margin-bottom: 15px;

  ${({ theme }) => theme.mediaWidth.upSmall`
    width: auto;
    text-align: center;
    padding: 0;
    margin-bottom: 0;
    flex: 1
  `};
`;

export function ProposalPage() {
  const [modalStatus, setModalStatus] = useState(ModalStatus.None);
  const { id: pId } = useParams<{ id: string }>();
  const proposalQuery = useProposalInfoQuery(parseInt(pId));
  const { data: proposal } = proposalQuery;
  const { data: votingWeight } = useUserWeightQuery(proposal?.snapshotDay);
  const voteStatusQuery = useUserVoteStatusQuery(proposal?.id);
  const { data: userStatus } = voteStatusQuery;
  const isSmallScreen = useMedia('(max-width: 600px)');

  const actions = JSON.parse(proposal?.actions || '{}');
  const oldActionKeyList = Object.keys(actions);

  const getKeyByValue = value => {
    return Object.keys(ACTIONS_MAPPING).find(key => ACTIONS_MAPPING[key].includes(value));
  };

  const actionKey = oldActionKeyList.find(actionKey => getKeyByValue(actionKey));

  const oldProposalType = oldActionKeyList.map(actionKey => getKeyByValue(actionKey)).filter(item => item)[0];

  const isNewCollateralProposal =
    proposal &&
    proposal.actions !== '[]' &&
    !proposal.actions.startsWith('{') &&
    ACTIONS_MAPPING[PROPOSAL_TYPE.NEW_COLLATERAL_TYPE].indexOf(JSON.parse(proposal.actions || '[[]]')[0][0]) >= 0;
  const collateralInfo = proposal && isNewCollateralProposal && JSON.parse(proposal.actions)[0][1];

  const isActive =
    proposal && proposal.status === 'Active' && !formatTimeStr(proposal.startDay) && !!formatTimeStr(proposal.endDay);

  const hasUserVoted = userStatus?.hasVoted;

  const { account } = useIconReact();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const [txHash, setTxHash] = useState('');
  const handleSubmit = () => {
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const hasApproved = modalStatus === ModalStatus.Approve || modalStatus === ModalStatus.ChangeToApprove;

    bnJs
      .inject({ account })
      .Governance.castVote(proposal?.id!, hasApproved)
      .then((res: any) => {
        addTransaction(
          { hash: res.result },
          {
            pending: t`Casting your vote...`,
            summary: t`Vote cast.`,
          },
        );

        setTxHash(res.result);
        setModalStatus(ModalStatus.None);
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
      });
  };

  const txStatus = useTransactionStatus(txHash);

  React.useEffect(() => {
    if (txStatus === TransactionStatus.success) {
      proposalQuery.refetch();
      voteStatusQuery.refetch();
    }
  }, [proposalQuery, voteStatusQuery, txStatus]);

  const theme = useTheme();

  const { networkId } = useIconReact();
  const additionalInfo = useAdditionalInfoById(proposal?.id);

  const handleChangeVote = () => {
    if (!userStatus?.reject.isZero()) {
      setModalStatus(ModalStatus.ChangeToApprove);
    } else if (!userStatus?.approval.isZero()) {
      setModalStatus(ModalStatus.ChangeToReject);
    }
  };

  return (
    <>
      <ProposalContainer>
        {proposal ? (
          <Breadcrumb locationText={t`Vote`} locationPath="/vote" title={proposal?.name || ''} />
        ) : (
          <StyledSkeleton animation="wave" width={280} height={28} />
        )}

        <BoxPanel bg="bg2" my={10}>
          <Typography variant="h2" mb={4}>
            {proposal ? proposal.name : <StyledSkeleton animation="wave" height={35} />}
          </Typography>

          <Flex alignItems="center" mb={3} flexWrap="wrap" sx={{ columnGap: '15px' }} my={1}>
            <VoteStatusLabel proposal={proposal} />
            <VoterPercentLabel value={proposal?.sum} />
            <VoterNumberLabel value={proposal?.voters} />
          </Flex>

          {hasUserVoted ? (
            <Flex
              sx={{ gap: 20 }}
              alignItems={['stretch', 'stretch', 'flex-end']}
              flexDirection={['column', 'column', 'row']}
            >
              <Flex flex={1} flexDirection="column" width="100%" sx={{ rowGap: '15px' }}>
                <Flex alignItems="center">
                  <Typography fontWeight="bold" variant="p" mr="5px">
                    <Trans>Approve</Trans>
                  </Typography>
                  <Typography opacity="0.85" mr="5px" fontWeight="bold">
                    {proposal?.for}%
                  </Typography>
                  <Typography opacity="0.85" fontWeight="bold">
                    <Trans>({proposal?.majority}% required)</Trans>
                  </Typography>
                </Flex>

                <Progress>
                  <ProgressBar percentage={`${proposal?.for}`} type={'Approve'} />
                </Progress>

                <Flex alignItems="center">
                  <Typography fontWeight="bold" variant="p" mr="5px">
                    <Trans>Reject</Trans>
                  </Typography>
                  <Typography opacity="0.85" mr="5px" fontWeight="bold">
                    {proposal?.against}%
                  </Typography>
                </Flex>

                <Progress>
                  <ProgressBar percentage={`${proposal?.against}`} type={'Reject'} />
                </Progress>
              </Flex>

              {!userStatus?.approval.isZero() && (
                <ResultPanel bg="bg3">
                  <CheckCircleIcon width="30px" height="30px" color={theme.colors.primary} />
                  <Flex flexDirection="column">
                    <Flex alignItems="flex-end" flexWrap="wrap" mb={1}>
                      <Typography variant="h3" marginRight={2}>
                        <Trans>You approved</Trans>
                      </Typography>
                      {isActive && account && (
                        <ChangeVoteButton onClick={handleChangeVote}>
                          <Trans>Change vote</Trans>
                        </ChangeVoteButton>
                      )}
                    </Flex>
                    <Typography>
                      <Trans>{`Voting weight: ${userStatus?.approval.dp(2).toFormat()} BALN`}</Trans>
                    </Typography>
                  </Flex>
                </ResultPanel>
              )}

              {!userStatus?.reject.isZero() && (
                <ResultPanel bg="bg3">
                  <CancelIcon width="30px" height="30px" color={theme.colors.alert} />
                  <Flex flexDirection="column">
                    <Flex alignItems="flex-end" flexWrap="wrap" mb={1}>
                      <Typography variant="h3" marginRight={2}>
                        <Trans>You rejected</Trans>
                      </Typography>
                      {isActive && account && (
                        <ChangeVoteButton onClick={handleChangeVote}>
                          <Trans>Change vote</Trans>
                        </ChangeVoteButton>
                      )}
                    </Flex>

                    <Typography>
                      <Trans>{`Voting weight: ${userStatus?.reject.dp(2).toFormat()} BALN`}</Trans>
                    </Typography>
                  </Flex>
                </ResultPanel>
              )}
            </Flex>
          ) : (
            <Flex flexDirection="column">
              <Flex alignItems="center">
                <Typography fontWeight="bold" variant="p" mr="5px">
                  <Trans>Approve</Trans>
                </Typography>
                <Typography opacity="0.85" mr="5px" fontWeight="bold">
                  {proposal?.for}%
                </Typography>
                <Typography opacity="0.85" fontWeight="bold">
                  <Trans>({proposal?.majority}% required)</Trans>
                </Typography>
              </Flex>
              <Flex>
                <Column flexGrow={1}>
                  <Progress my={3}>
                    <ProgressBar percentage={`${proposal?.for}`} type={'Approve'} />
                  </Progress>
                </Column>
                {isActive && account && !isSmallScreen && (
                  <Column>
                    <Button ml="20px" width="150px" onClick={() => setModalStatus(ModalStatus.Approve)}>
                      <Trans>Approve</Trans>
                    </Button>
                  </Column>
                )}
              </Flex>
              <Flex alignItems="center">
                <Typography fontWeight="bold" variant="p" mr="5px">
                  <Trans>Reject</Trans>
                </Typography>
                <Typography opacity="0.85" mr="5px" fontWeight="bold">
                  {proposal?.against}%
                </Typography>
              </Flex>
              <Flex>
                <Column flexGrow={1}>
                  <Progress my={3}>
                    <ProgressBar percentage={`${proposal?.against}`} type={'Reject'} />
                  </Progress>
                </Column>
                {isActive && account && !isSmallScreen && (
                  <Column>
                    <AlertButton ml="20px" width="150px" color="red" onClick={() => setModalStatus(ModalStatus.Reject)}>
                      <Trans>Reject</Trans>
                    </AlertButton>
                  </Column>
                )}
              </Flex>
            </Flex>
          )}

          {isActive && account && isSmallScreen && !hasUserVoted ? (
            <Flex marginTop={2}>
              <Button width="50%" marginRight={2} onClick={() => setModalStatus(ModalStatus.Approve)}>
                <Trans>Approve</Trans>
              </Button>
              <AlertButton width="50%" marginLeft={2} color="red" onClick={() => setModalStatus(ModalStatus.Reject)}>
                <Trans>Reject</Trans>
              </AlertButton>
            </Flex>
          ) : null}

          <ProposalModal
            status={modalStatus}
            onCancel={() => setModalStatus(ModalStatus.None)}
            onSubmit={handleSubmit}
            weight={votingWeight}
          />
        </BoxPanel>

        {oldProposalType && actionKey && (
          <BoxPanel bg="bg2" my={10}>
            <Typography variant="h2" mb="20px">
              <Trans id={PROPOSAL_TYPE_LABELS[oldProposalType].id} />
            </Typography>
            {actionKey === ACTIONS_MAPPING.Funding[0] ? (
              <Funding recipient={actions[actionKey]._recipient} amounts={actions[actionKey]._amounts} />
            ) : (
              <Ratio
                proposalStatus={proposal?.status}
                proposalType={oldProposalType}
                proposedList={RATIO_VALUE_FORMATTER[oldProposalType](Object.values(actions[actionKey])[0])}
              />
            )}
          </BoxPanel>
        )}

        <AnimatePresence>
          {isNewCollateralProposal && collateralInfo && (
            <motion.div initial={{ opacity: 0, height: 0, y: -30 }} animate={{ opacity: 1, height: 'auto', y: 0 }}>
              <BoxPanel bg="bg2" my={10}>
                <Typography variant="h2" mb="20px">
                  <Trans>New collateral type</Trans>
                </Typography>
                <Flex flexWrap={['wrap', 'wrap', 'nowrap']} justifyContent={['space-between', 'start']}>
                  <CollateralProposalInfoItem>
                    <Typography opacity={0.75} fontSize={16}>
                      Token address
                      <ExternalLink href={getTrackerLink(NETWORK_ID, collateralInfo['_token_address'], 'token')}>
                        <ExternalIcon
                          width="15"
                          height="15"
                          style={{ marginLeft: 7, marginRight: -22, marginTop: -3 }}
                        />
                      </ExternalLink>
                    </Typography>
                    <Typography color="text" fontSize={16} style={{ wordBreak: 'keep-all' }}>
                      <CopyableSCORE score={collateralInfo['_token_address']} />
                    </Typography>
                  </CollateralProposalInfoItem>
                  <CollateralProposalInfoItem>
                    <CollateralProposalInfoItem>
                      <Typography opacity={0.75} marginRight="-20px" fontSize={16}>
                        <Trans>Oracle type</Trans>{' '}
                        <QuestionHelper
                          text={
                            <>
                              <Typography mb={4}>
                                <Trans>Where Balanced will get the price data for this collateral type.</Trans>
                              </Typography>
                              <Typography mb={4}>
                                <strong>
                                  <Trans>DEX</Trans>:
                                </strong>{' '}
                                <Trans>Uses the price from the bnUSD liquidity pool for this collateral type.</Trans>
                              </Typography>
                              <Typography>
                                <strong>
                                  <Trans>Band</Trans>:
                                </strong>{' '}
                                <Trans>Uses the price of an asset tracked via the Band oracle.</Trans>
                              </Typography>
                            </>
                          }
                        ></QuestionHelper>
                      </Typography>
                      <Typography color="text" fontSize={16}>
                        {collateralInfo['_peg']
                          ? `Band: ${collateralInfo['_peg']}`
                          : `DEX: ${SUPPORTED_TOKENS_MAP_BY_ADDRESS[collateralInfo['_token_address']].symbol!}/bnUSD`}
                      </Typography>
                    </CollateralProposalInfoItem>
                  </CollateralProposalInfoItem>
                  <CollateralProposalInfoItem>
                    <CollateralProposalInfoItem>
                      <Typography opacity={0.75} marginRight="-20px" fontSize={16}>
                        <Trans>Debt ceiling</Trans>{' '}
                        <QuestionHelper
                          text={t`The maximum amount of bnUSD that can be minted with this collateral type.`}
                        ></QuestionHelper>
                      </Typography>
                      <Typography color="text" fontSize={16} sx={{ whiteSpace: 'nowrap' }}>
                        {`${new BigNumber(formatUnits(collateralInfo['_debtCeiling'])).toFormat(0)} bnUSD`}
                      </Typography>
                    </CollateralProposalInfoItem>
                  </CollateralProposalInfoItem>
                  <CollateralProposalInfoItem>
                    <CollateralProposalInfoItem>
                      <Typography opacity={0.75} marginRight="-20px" fontSize={16}>
                        <Trans>Borrow LTV</Trans>{' '}
                        <QuestionHelper
                          text={t`The maximum percentage that people can borrow against the value of this collateral type.`}
                        ></QuestionHelper>
                      </Typography>
                      <Typography color="text" fontSize={16}>
                        {`${formatPercent(new BigNumber(1000000 / Number(collateralInfo['_lockingRatio'])))}`}
                      </Typography>
                    </CollateralProposalInfoItem>
                  </CollateralProposalInfoItem>
                  <CollateralProposalInfoItem>
                    <CollateralProposalInfoItem>
                      <Typography opacity={0.75} marginRight="-20px" fontSize={16}>
                        <Trans>Liquidation LTV</Trans>{' '}
                        <QuestionHelper
                          text={t`The percentage of debt required to trigger liquidation for this collateral type.`}
                        ></QuestionHelper>
                      </Typography>
                      <Typography color="text" fontSize={16}>
                        {`${formatPercent(new BigNumber(1000000 / Number(collateralInfo['_liquidationRatio'])))}`}
                      </Typography>
                    </CollateralProposalInfoItem>
                  </CollateralProposalInfoItem>
                </Flex>
              </BoxPanel>
            </motion.div>
          )}
        </AnimatePresence>

        <BoxPanel bg="bg2" my={10}>
          <Typography variant="h2" mb="20px">
            <Trans>Description</Trans>
          </Typography>
          <Typography variant="p" mb="20px">
            {proposal ? (
              proposal?.description
            ) : (
              <>
                <StyledSkeleton height={22} />
                <StyledSkeleton height={22} />
                <StyledSkeleton height={22} width={220} />
              </>
            )}
          </Typography>
          <Flex alignItems="center">
            {additionalInfo?.discussionURL && (
              <>
                <InfoLink href={additionalInfo?.discussionURL} target="_blank">
                  <Trans>Discussion</Trans>
                </InfoLink>
                <ExternalIcon width="15" height="15" style={{ marginLeft: 5, marginRight: 15 }} />
              </>
            )}
            {additionalInfo?.hash && (
              <>
                <InfoLink
                  href={additionalInfo?.hash && getTrackerLink(networkId, additionalInfo?.hash, 'transaction')}
                  target="_blank"
                >
                  <Trans>Transaction</Trans>
                </InfoLink>
                <ExternalIcon width="15" height="15" style={{ marginLeft: 5 }} />
              </>
            )}
          </Flex>
        </BoxPanel>
      </ProposalContainer>
    </>
  );
}

const InfoLink = styled(Link)`
  font-size: 16px;
`;
