import React from 'react';

import styled from 'styled-components';

import { environments } from '../../../environments';
import { iNotificationsService } from '../../../services/notification';

const Notifications = styled.div`
  margin: 5px 0px;
  position: absolute;
  left: -240px;
  border: 3px solid #2295aa;
  border-radius: 5px;
  z-index: 100;
  background-color: rgba(90, 90, 90, 0.9);
  min-width: 300px;
`;

const List = styled.ul`
  margin: 0px;
  padding 0;
  list-style-type: none;
  color: #ddd;
  overflow: auto;
  box-shadow: 0px 8px 16px 5px rgba(255, 255, 255, 0.2);
  max-height: 315px;
  overflow: scroll;
`;

const ListItem = styled.li`
  border-bottom: 1px solid #000;
  padding: 20px;

  &:hover {
    background-color: #087083;
    transition: background-color 0.2s ease;
    cursor: pointer;
  }
`;

const MarkAllRead = styled.div`
  box-shadow: 0px 8px 30px 0px rgba(0, 0, 0, 0.1);
  padding 0.5em;
  direction: rtl;
  position: relative;
  cursor: pointer;
`;

const Link = styled.a`
  color: white;
`;

export function NotificationsDropdown(props: {
  notifications: any;
  updateNotification: any;
  updateNotiCount: any;
  notiCount: number;
}) {
  const handleScroll = e => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom) {
      // alert('end');
    }
  };

  const removeNotification = (txHash: string) => {
    iNotificationsService.removeNotification(txHash);
    props.updateNotification(Object.values(iNotificationsService.getNotification()));
    props.updateNotiCount(Math.min(props.notiCount - 1, 0));
  };

  const resetNoti = () => {
    iNotificationsService.resetNoti();
    props.updateNotification(Object.values(iNotificationsService.getNotification()));
    props.updateNotiCount(0);
  };

  return (
    <Notifications>
      <MarkAllRead onClick={resetNoti}>Mark all read</MarkAllRead>
      {/* <Header>
      </Header> */}
      <List onScroll={handleScroll}>
        {props.notifications.map((n: any, i) => {
          return (
            <ListItem key={i} onClick={() => removeNotification(n.block_hash)}>
              <Link
                href={`${environments.local.trackerLink}/transaction/${n.block_hash}`}
                target="blank"
              >{`${environments.local.trackerLink}/transaction/${n.block_hash}`}</Link>
            </ListItem>
          );
        })}
      </List>
    </Notifications>
  );
}
