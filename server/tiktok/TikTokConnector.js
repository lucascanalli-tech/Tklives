import {
  ControlEvent,
  TikTokLiveConnection,
  WebcastEvent
} from 'tiktok-live-connector';
import { mapTikTokEvent } from './TikTokEventMapper.js';

const EVENT_BINDINGS = [
  [WebcastEvent.MEMBER, 'JOIN'],
  [WebcastEvent.CHAT, 'COMMENT'],
  [WebcastEvent.LIKE, 'LIKE'],
  [WebcastEvent.FOLLOW, 'FOLLOW'],
  [WebcastEvent.GIFT, 'GIFT'],
  [WebcastEvent.SHARE, 'SHARE']
];

function normalizeBroadcasterUsername(username) {
  return String(username ?? '').trim().replace(/^@+/, '');
}

export class TikTokConnector {
  constructor({ username, onEvent }) {
    this.username = normalizeBroadcasterUsername(username);
    this.onEvent = onEvent;
    this.connection = null;
  }

  async connect() {
    if (!this.username) {
      throw new Error('TIKTOK_USERNAME não foi informado.');
    }

    if (this.connection) {
      return;
    }

    const connection = new TikTokLiveConnection(this.username, {
      processInitialData: false,
      fetchRoomInfoOnConnect: true,
      enableExtendedGiftInfo: true
    });
    this.connection = connection;

    EVENT_BINDINGS.forEach(([externalType, internalType]) => {
      connection.on(externalType, (data) => {
        if (internalType === 'GIFT') {
          const giftType = data?.giftDetails?.giftType ?? data?.giftType;

          if (giftType === 1 && !data?.repeatEnd) {
            return;
          }
        }

        const event = mapTikTokEvent(internalType, data);

        if (event) {
          this.onEvent(event);
        }
      });
    });

    connection.on(ControlEvent.CONNECTED, (state) => {
      console.log(`[TIKTOK] Conectado à sala ${state.roomId}.`);
    });

    connection.on(ControlEvent.DISCONNECTED, ({ code, reason }) => {
      console.warn(
        `[TIKTOK] Desconectado (${code ?? 'sem código'})${reason ? `: ${reason}` : ''}`
      );
    });

    connection.on(ControlEvent.ERROR, ({ info, exception }) => {
      console.error('[TIKTOK] Erro:', info ?? exception ?? 'erro desconhecido');
    });

    try {
      await connection.connect();
    } catch (error) {
      this.connection = null;
      throw error;
    }
  }

  disconnect() {
    this.connection?.disconnect();
    this.connection = null;
  }
}
