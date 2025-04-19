import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Details = styled.div`
  flex-grow: 1;
  margin-left: 12px;
`;

export const Title = styled.div`
  font-weight: bold;
  color: #FFFFFF;
  font-size: 14px;
`;

export const Amount = styled.div`
  color: ${({ theme }) => theme.colors.text1};
  font-size: 14px;
  opacity: 0.9;
`;

export const Status = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  text-align: right;
`;

export const ElapsedTime = styled.div`
  color: ${({ theme }) => theme.colors.text1};  
  font-size: 14px;
  text-align: right;
  opacity: 0.9;
`;

export const Meta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;
