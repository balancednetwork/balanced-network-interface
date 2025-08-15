import styled from 'styled-components';

export const Title = styled.div`
  font-weight: bold;
  color: #FFFFFF;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
  padding-right: 5px;
  padding-left: 0;
`;

export const Amount = styled.div`
  color: ${({ theme }) => theme.colors.text1};
  font-size: 14px;
  opacity: 0.9;
  transition: all 0.2s ease-in-out;
  padding-right: 5px;
  padding-left: 0;
`;

export const Status = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  text-align: right;
  transition: all 0.2s ease-in-out;
`;

export const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    ${Title} {
      color: ${({ theme }) => theme.colors.primaryBright};
      padding-right: 0;
      padding-left: 5px;
    }
    ${Amount} {
      color: ${({ theme }) => theme.colors.primaryBright};
      padding-right: 0;
      padding-left: 5px;
    }
    ${Status} {
      color: ${({ theme }) => theme.colors.primaryBright};
    }
  }
`;

export const Details = styled.div`
  flex-grow: 1;
  margin-left: 12px;
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
