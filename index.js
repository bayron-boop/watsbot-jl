import { Boom } from '@hapi/boom';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import crypto from 'crypto'; // <- Esta era la que faltaba
import fs from 'fs';
import path from 'path';

const sessionPath = path.resolve('./session');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Bot WhatsApp', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('Escanea este QR en WhatsApp');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut;
            console.log('Conexión cerrada. Reconectando:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Bot conectado exitoso!');

            // Generar código de 8 dígitos para vincular
            sock.requestPairingCode(process.env.PHONE_NUMBER).then(code => {
                console.log('====================================');
                console.log('CODIGO DE 8 DIGITOS:', code.match(/.{1,4}/g).join(' '));
                console.log('====================================');
                console.log('Pégalo en WhatsApp > Dispositivos vinculados > Vincular con número');
            }).catch(err => console.log('Error generando código:', err));
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message) {
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            if (text.toLowerCase() === 'ping') {
                await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! Bot online 24/7 🔥' });
            }
        }
    });
}

connectToWhatsApp().catch(err => console.log('Error:', err));
