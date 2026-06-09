const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode-terminal')

const SESSION_FOLDER = './auth_info_baileys'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER)

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: require('pino')({ level: 'silent' }),
        browser: ['BayronBot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if(qr) {
            console.log('\n=== ESCANEA ESTE QR CON WHATSAPP ===\n')
            qrcode.generate(qr, {small: true})
            console.log('\n=== Ajustes > Dispositivos vinculados ===\n')
        }

        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Conexión cerrada. Reconectando:', shouldReconnect)
            if(shouldReconnect) {
                startBot()
            }
        } else if(connection === 'open') {
            console.log('✅ Bot conectado exitosamente a WhatsApp')
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if(!msg.message || msg.key.fromMe) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const from = msg.key.remoteJid

        console.log('Mensaje de:', from, 'Texto:', text)

        if(text.toLowerCase() === '.ping') {
            await sock.sendMessage(from, { text: 'Pong 🏓 Bot activo w' })
        }

        if(text.toLowerCase() === '.menu') {
            await sock.sendMessage(from, {
                text: `*🤖 BayronBot Menu*\n\n.ping - Ver si el bot responde\n.menu - Ver comandos\n.hola - Saludo`
            })
        }

        if(text.toLowerCase() === '.hola') {
            await sock.sendMessage(from, { text: 'Hola w 👋 ¿Cómo estás?' })
        }
    })
}

startBot()
