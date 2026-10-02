import { css } from 'lit';
import { t } from '@faltstudio/ui';

export const statusBarStyles = css`
  .status-bar {
    display: flex;
    justify-content: space-between;
    block-size: 32px;
    font-size: ${t('text-micro')};
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${t('text-disabled')};
    background-color: ${t('table')};
  }

  .items {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .items li,
  .stamp {
    display: flex;
    align-items: center;
    margin: 0;
    padding-inline: ${t('space-6')} 0;
  }

  .items li:first-child {
    color: ${t('text-label')};
  }

  .stamp {
    padding-inline-end: ${t('space-6')};
  }
`;
