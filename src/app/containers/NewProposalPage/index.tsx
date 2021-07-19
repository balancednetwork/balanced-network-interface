import React, { useState } from 'react';

import { Helmet } from 'react-helmet-async';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button } from 'app/components/Button';
import { DefaultLayout } from 'app/components/Layout';
import { Typography } from 'app/theme';

const NewProposalContainer = styled(Box)`
  flex: 1;
  border-radius: 10px;
`;

const ProposalDetailContainer = styled(Box)`
  margin-top: 30px;
  border-radius: 10px;
  padding: 35px 35px;
  margin-bottom: 50px;
  background-color: ${({ theme }) => theme.colors.bg2};
`;

const FieldContainer = styled(Box)`
  display: flex;
  flex-direction: row;
`;

const FieldInput = styled.input`
  margin-top: 10px;
  margin-bottom: 20px;
  border-radius: 10px;
  width: 100%;
  height: 40px;
  border: none;
  caret-color: white;
  color: white;
  padding: 3px 20px;
  background-color: ${({ theme }) => theme.colors.bg5};
  :hover,
  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primaryBright};
    outline: none;
  }
`;

const FieldTextArea = styled.textarea`
  margin-top: 10px;
  margin-bottom: 10px;
  border-radius: 10px;
  width: 100%;
  min-height: 150px;
  border: none;
  caret-color: white;
  color: white;
  padding: 15px 20px;
  font-family: tex-gyre-adventor, Arial, sans-serif;
  font-size: 16px;
  background-color: ${({ theme }) => theme.colors.bg5};
  :hover,
  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primaryBright};
    outline: none;
    transition: border 0.2s ease;
  }
`;

export function NewProposalPage() {
  const [title, setTitle] = useState('');
  const [forumLink, setForumLink] = useState('');
  const [description, setDescription] = useState('');

  const onTitleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setTitle(event.currentTarget.value);
  };

  const onForumInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setForumLink(event.currentTarget.value);
  };

  const onTextAreaInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setDescription(event.currentTarget.value);
  };

  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <NewProposalContainer>
        <Breadcrumb title={'New Proposal'} locationText={'Vote'} locationPath={'/vote'} />
        <ProposalDetailContainer>
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Title
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${title.length}/100`}
            </Typography>
          </FieldContainer>
          <FieldInput type="text" onChange={onTitleInputChange} />
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Forum Link
            </Typography>
          </FieldContainer>
          <FieldInput type="text" onChange={onForumInputChange} />
          <FieldContainer>
            <Typography variant="h3" flex="1" alignSelf="center">
              Description
            </Typography>
            <Typography variant="p" flex="1" textAlign="right" alignSelf="center">
              {`${description.length}/500`}
            </Typography>
          </FieldContainer>
          {/* @ts-ignore */}
          <FieldTextArea onChange={onTextAreaInputChange} />
          <Typography variant="content" mt="25px" mb="25px" textAlign="center">
            It costs 100 bnUSD to submit a proposal.
          </Typography>
          <div style={{ textAlign: 'center' }}>
            <Button>Submit</Button>
          </div>
        </ProposalDetailContainer>
      </NewProposalContainer>
    </DefaultLayout>
  );
}
